/**
 * BummptEducation — Phase 10C Controlled Organization, School & Administrator Provisioning Service
 *
 * Provides a secure, provider-neutral, transactional mechanism for provisioning:
 * 1. Authoritative Organizations / Tenants (organizations table)
 * 2. Authoritative Schools under an Organization (schools table)
 * 3. Authorized Platform & School Administrators (users + staff tables)
 * 4. Controlled First-Deployment Bootstrap (fail-closed once initialized)
 *
 * CRITICAL SECURITY & DATA BOUNDARY GUARANTEES:
 * - Reuses existing PostgreSQL transaction, repository, Argon2id, RBAC, and audit infrastructure.
 * - Never creates demo students, parents, fees, assessments, attendance, or marks.
 * - Never stores or logs plaintext passwords.
 * - Prevents client-controlled privilege escalation or cross-tenant writes.
 */

import type { PoolClient } from 'pg';
import { withTransaction, query } from '../db';
import { organizationRepository } from '../db/repositories/organization.repository';
import { schoolRepository } from '../db/repositories/school.repository';
import { userRepository } from '../db/repositories/user.repository';
import { StaffRepository } from '../db/repositories/staff.repository';
import type { OrganizationDbEntity, SchoolDbEntity, StaffDbEntity } from '../db/types';
import { hashPassword, validatePasswordPolicy } from './password';
import { buildSafeUser } from './token';
import { logAuthEvent } from './audit';
import {
  isValidRole,
  validateRoleTenantScope,
  roleRequiresStaffIdentity,
  getDefaultStaffProfileForRole,
  getRoleProvisioningTier,
} from './roles';
import type { AuthRole, SafeUser } from './types';

const staffRepository = new StaffRepository();

export class ProvisioningError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'ProvisioningError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function runProvisioningTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  let capturedProvisioningError: ProvisioningError | null = null;
  try {
    return await withTransaction(async (client) => {
      try {
        return await callback(client);
      } catch (err: any) {
        if (err instanceof ProvisioningError) {
          capturedProvisioningError = err;
        }
        throw err;
      }
    });
  } catch (err: any) {
    if (capturedProvisioningError) {
      throw capturedProvisioningError;
    }
    if (err instanceof ProvisioningError) {
      throw err;
    }
    throw err;
  }
}

export interface ProvisioningActorContext {
  user?: SafeUser | null;
  isBootstrap?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ProvisionOrganizationInput {
  name: string;
  code: string;
}

export interface ProvisionSchoolInput {
  organizationId: string;
  name: string;
  code: string;
  lga: string;
  senatorialZone: string;
  category: string;
  principalName?: string | null;
  bursarName?: string | null;
  vicePrincipalAcademic?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  establishedYear?: number | null;
  isActive?: boolean;
}

export interface ProvisionAdministratorInput {
  email: string;
  password: string;
  fullName?: string;
  firstName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  phone?: string | null;
  role: AuthRole | string;
  organizationId?: string | null;
  schoolId?: string | null;
  staffIdNumber?: string | null;
  designation?: string | null;
  qualifications?: string | null;
  trcnNumber?: string | null;
}

export interface ProvisionAdministratorResult {
  user: SafeUser;
  staff: StaffDbEntity | null;
  organizationId: string | null;
  roleTier: string;
}

export interface FirstBootstrapInput {
  organization: ProvisionOrganizationInput;
  school?: Omit<ProvisionSchoolInput, 'organizationId'> | null;
  admin: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
    role?: 'super_admin' | 'state_officer' | 'principal';
    staffIdNumber?: string | null;
  };
  schoolPrincipal?: {
    email: string;
    password: string;
    fullName: string;
    phone?: string | null;
    staffIdNumber?: string | null;
    qualifications?: string | null;
    trcnNumber?: string | null;
  } | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface FirstBootstrapResult {
  organization: OrganizationDbEntity;
  school: SchoolDbEntity | null;
  admin: ProvisionAdministratorResult;
  schoolPrincipal: ProvisionAdministratorResult | null;
}

export interface ProvisioningVerificationReport {
  ready: boolean;
  organizationsCount: number;
  schoolsCount: number;
  activeSuperAdminsCount: number;
  activeAdminsCount: number;
  staffLinkedUsersCount: number;
  invalidScopeUsersCount: number;
  unlinkedSchoolStaffAdminsCount: number;
  organizations: Array<{ id: string; code: string; name: string; schoolCount: number }>;
  issues: string[];
}

const CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{2,49}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeCode(raw: string, fieldLabel: string): string {
  if (!raw || typeof raw !== 'string') {
    throw new ProvisioningError('INVALID_CODE', `${fieldLabel} is required.`, 400);
  }
  const cleaned = raw.trim().toUpperCase();
  if (!CODE_REGEX.test(cleaned)) {
    throw new ProvisioningError(
      'INVALID_CODE_FORMAT',
      `${fieldLabel} must be 3-50 characters and contain only uppercase letters, numbers, hyphens, or underscores.`,
      400
    );
  }
  return cleaned;
}

function decomposeFullName(fullName: string): {
  firstName: string;
  middleName: string | null;
  surname: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: null, surname: parts[0] };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: null, surname: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    surname: parts[parts.length - 1],
  };
}

/**
 * Generates a deterministic unique staff_id_number within a school when not explicitly supplied
 */
async function resolveStaffIdNumber(
  client: PoolClient,
  schoolCode: string,
  role: AuthRole,
  explicitStaffId?: string | null
): Promise<string> {
  if (explicitStaffId && explicitStaffId.trim().length > 0) {
    return explicitStaffId.trim().toUpperCase();
  }
  const profile = getDefaultStaffProfileForRole(role);
  const countRes = await client.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM staff WHERE school_id = (SELECT id FROM schools WHERE UPPER(code) = $1 LIMIT 1);',
    [schoolCode.toUpperCase()]
  );
  const seq = parseInt(countRes.rows[0]?.count || '0', 10) + 1;
  return `${schoolCode.toUpperCase()}-${profile.staffCodePrefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * 1. Provision an Organization (Platform Super Admin or Controlled Bootstrap only)
 */
export async function provisionOrganization(
  input: ProvisionOrganizationInput,
  actor: ProvisioningActorContext,
  externalClient?: PoolClient
): Promise<OrganizationDbEntity> {
  // Authorization check: only Super Admin or explicit controlled bootstrap
  if (!actor.isBootstrap && (!actor.user || !actor.user.isSuperAdmin)) {
    await logAuthEvent(
      {
        action: 'PROVISIONING_BLOCKED',
        status: 'BLOCKED',
        userId: actor.user?.id || null,
        email: actor.user?.email || null,
        ipAddress: actor.ipAddress || null,
        userAgent: actor.userAgent || null,
        details: {
          operation: 'PROVISION_ORGANIZATION',
          reason: 'INSUFFICIENT_CLEARANCE',
          attemptedCode: input?.code,
        },
      },
      externalClient
    );
    throw new ProvisioningError(
      'FORBIDDEN_CLEARANCE',
      'Only an authenticated Super Administrator or controlled bootstrap process may provision an organization.',
      403
    );
  }

  const cleanName = typeof input?.name === 'string' ? input.name.trim() : '';
  if (cleanName.length < 3 || cleanName.length > 255) {
    throw new ProvisioningError(
      'INVALID_ORGANIZATION_NAME',
      'Organization name is required and must be between 3 and 255 characters.',
      400
    );
  }

  const cleanCode = normalizeCode(input?.code, 'Organization code');

  const execute = async (client: PoolClient): Promise<OrganizationDbEntity> => {
    const existingByCode = await organizationRepository.findByCode(cleanCode, client);
    if (existingByCode) {
      throw new ProvisioningError(
        'ORGANIZATION_CODE_EXISTS',
        `An organization with code '${cleanCode}' already exists.`,
        409
      );
    }

    const existingByName = await organizationRepository.findByName(cleanName, client);
    if (existingByName) {
      throw new ProvisioningError(
        'ORGANIZATION_NAME_EXISTS',
        `An organization with name '${cleanName}' already exists.`,
        409
      );
    }

    const createdOrg = await organizationRepository.createOrganization(
      { name: cleanName, code: cleanCode },
      client
    );

    await logAuthEvent(
      {
        action: 'ORGANIZATION_PROVISIONED',
        status: 'SUCCESS',
        userId: actor.user?.id || null,
        email: actor.user?.email || null,
        ipAddress: actor.ipAddress || null,
        userAgent: actor.userAgent || null,
        details: {
          organizationId: createdOrg.id,
          code: createdOrg.code,
          name: createdOrg.name,
          isBootstrap: Boolean(actor.isBootstrap),
        },
      },
      client
    );

    return createdOrg;
  };

  return externalClient ? execute(externalClient) : runProvisioningTransaction(execute);
}

/**
 * 2. Provision a School under an Organization
 * Never creates students, parents, fees, assessments, attendance, or marks.
 */
export async function provisionSchool(
  input: ProvisionSchoolInput,
  actor: ProvisioningActorContext,
  externalClient?: PoolClient
): Promise<SchoolDbEntity> {
  // Authorization check: only Super Admin or controlled bootstrap can create new schools
  if (!actor.isBootstrap && (!actor.user || !actor.user.isSuperAdmin)) {
    await logAuthEvent(
      {
        action: 'PROVISIONING_BLOCKED',
        status: 'BLOCKED',
        userId: actor.user?.id || null,
        email: actor.user?.email || null,
        ipAddress: actor.ipAddress || null,
        userAgent: actor.userAgent || null,
        details: {
          operation: 'PROVISION_SCHOOL',
          reason: 'INSUFFICIENT_CLEARANCE',
          attemptedCode: input?.code,
        },
      },
      externalClient
    );
    throw new ProvisioningError(
      'FORBIDDEN_CLEARANCE',
      'Only an authenticated Super Administrator or controlled bootstrap process may provision a new school.',
      403
    );
  }

  const organizationId = typeof input?.organizationId === 'string' ? input.organizationId.trim() : '';
  if (!organizationId) {
    throw new ProvisioningError(
      'MISSING_ORGANIZATION_ID',
      'A valid parent organizationId is required to provision a school.',
      400
    );
  }

  const cleanName = typeof input?.name === 'string' ? input.name.trim() : '';
  if (cleanName.length < 3 || cleanName.length > 255) {
    throw new ProvisioningError(
      'INVALID_SCHOOL_NAME',
      'School name is required and must be between 3 and 255 characters.',
      400
    );
  }

  const cleanCode = normalizeCode(input?.code, 'School code');
  const cleanLga = typeof input?.lga === 'string' ? input.lga.trim() : '';
  const cleanZone = typeof input?.senatorialZone === 'string' ? input.senatorialZone.trim() : '';
  const cleanCategory = typeof input?.category === 'string' ? input.category.trim() : '';

  if (!cleanLga || !cleanZone || !cleanCategory) {
    throw new ProvisioningError(
      'MISSING_SCHOOL_FIELDS',
      'School LGA, senatorialZone, and category are required fields.',
      400
    );
  }

  if (input.email && !EMAIL_REGEX.test(input.email.trim())) {
    throw new ProvisioningError('INVALID_SCHOOL_EMAIL', 'School email address is malformed.', 400);
  }

  const execute = async (client: PoolClient): Promise<SchoolDbEntity> => {
    const parentOrg = await organizationRepository.findById(organizationId, { client });
    if (!parentOrg) {
      throw new ProvisioningError(
        'ORGANIZATION_NOT_FOUND',
        `Organization '${organizationId}' does not exist.`,
        404
      );
    }

    const existingSchool = await schoolRepository.findByCode(cleanCode, client);
    if (existingSchool) {
      throw new ProvisioningError(
        'SCHOOL_CODE_EXISTS',
        `A school with institutional code '${cleanCode}' already exists.`,
        409
      );
    }

    const createdSchool = await schoolRepository.createSchool(
      {
        organizationId: parentOrg.id,
        code: cleanCode,
        name: cleanName,
        lga: cleanLga,
        senatorialZone: cleanZone,
        category: cleanCategory,
        principalName: input.principalName || null,
        bursarName: input.bursarName || null,
        vicePrincipalAcademic: input.vicePrincipalAcademic || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        establishedYear: input.establishedYear ?? null,
        isActive: input.isActive ?? true,
      },
      client
    );

    await logAuthEvent(
      {
        action: 'SCHOOL_PROVISIONED',
        status: 'SUCCESS',
        userId: actor.user?.id || null,
        email: actor.user?.email || null,
        ipAddress: actor.ipAddress || null,
        userAgent: actor.userAgent || null,
        details: {
          schoolId: createdSchool.id,
          organizationId: createdSchool.organization_id,
          code: createdSchool.code,
          name: createdSchool.name,
          lga: createdSchool.lga,
          senatorialZone: createdSchool.senatorial_zone,
          category: createdSchool.category,
          isBootstrap: Boolean(actor.isBootstrap),
        },
      },
      client
    );

    return createdSchool;
  };

  return externalClient ? execute(externalClient) : runProvisioningTransaction(execute);
}

/**
 * 3. Provision an Administrator or Authorized User with Full RBAC, Tenant & Staff Linkage
 */
export async function provisionAdministrator(
  input: ProvisionAdministratorInput,
  actor: ProvisioningActorContext,
  externalClient?: PoolClient
): Promise<ProvisionAdministratorResult> {
  const rawRole = typeof input?.role === 'string' ? input.role.trim().toLowerCase() : '';
  if (!isValidRole(rawRole)) {
    throw new ProvisioningError(
      'INVALID_ROLE',
      `Role '${input?.role}' is not a valid BummptEducation system role.`,
      400
    );
  }
  const targetRole: AuthRole = rawRole;

  // Caller authorization & privilege escalation guard
  if (!actor.isBootstrap) {
    if (!actor.user) {
      throw new ProvisioningError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    const callerIsSuperAdmin = actor.user.isSuperAdmin;
    const callerIsPrincipal = actor.user.role === 'principal';

    if (!callerIsSuperAdmin && !callerIsPrincipal) {
      await logAuthEvent(
        {
          action: 'PROVISIONING_BLOCKED',
          status: 'BLOCKED',
          userId: actor.user.id,
          email: actor.user.email,
          ipAddress: actor.ipAddress || null,
          userAgent: actor.userAgent || null,
          details: {
            operation: 'PROVISION_ADMINISTRATOR',
            reason: 'INSUFFICIENT_ROLE',
            callerRole: actor.user.role,
            targetRole,
          },
        },
        externalClient
      );
      throw new ProvisioningError(
        'FORBIDDEN_CLEARANCE',
        'Only Super Administrators or School Principals (within their own school scope) may provision user accounts.',
        403
      );
    }

    // Principals cannot provision platform admins or another principal, nor provision outside their school
    if (callerIsPrincipal && !callerIsSuperAdmin) {
      if (targetRole === 'super_admin' || targetRole === 'state_officer' || targetRole === 'principal') {
        await logAuthEvent(
          {
            action: 'PROVISIONING_BLOCKED',
            status: 'BLOCKED',
            userId: actor.user.id,
            email: actor.user.email,
            ipAddress: actor.ipAddress || null,
            userAgent: actor.userAgent || null,
            details: {
              operation: 'PROVISION_ADMINISTRATOR',
              reason: 'PRINCIPAL_PRIVILEGE_ESCALATION_BLOCKED',
              targetRole,
            },
          },
          externalClient
        );
        throw new ProvisioningError(
          'FORBIDDEN_ROLE_ESCALATION',
          'Principals cannot provision Super Administrators, State Officers, or School Principals.',
          403
        );
      }

      const requestedSchoolId = input.schoolId?.trim() || null;
      if (!actor.user.schoolId || requestedSchoolId !== actor.user.schoolId) {
        await logAuthEvent(
          {
            action: 'TENANT_VIOLATION_ATTEMPT',
            status: 'BLOCKED',
            userId: actor.user.id,
            email: actor.user.email,
            ipAddress: actor.ipAddress || null,
            userAgent: actor.userAgent || null,
            details: {
              operation: 'PROVISION_ADMINISTRATOR',
              trustedSchoolId: actor.user.schoolId,
              attemptedSchoolId: requestedSchoolId,
            },
          },
          externalClient
        );
        throw new ProvisioningError(
          'TENANT_ISOLATION_VIOLATION',
          'Principals may only provision accounts within their own assigned school.',
          403
        );
      }
    }
  }

  // Validate role vs schoolId scope requirement
  const normalizedSchoolId =
    input.schoolId && typeof input.schoolId === 'string' && input.schoolId.trim().length > 0
      ? input.schoolId.trim()
      : null;

  const scopeCheck = validateRoleTenantScope(targetRole, normalizedSchoolId);
  if (!scopeCheck.valid) {
    throw new ProvisioningError(
      scopeCheck.error || 'INVALID_ROLE_SCOPE',
      scopeCheck.reason || 'Invalid role/school scope combination.',
      400
    );
  }

  // Validate email
  const cleanEmail = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    throw new ProvisioningError('INVALID_EMAIL', 'A valid email address is required.', 400);
  }

  // Validate password policy
  const passwordPolicy = validatePasswordPolicy(input?.password || '');
  if (!passwordPolicy.valid) {
    throw new ProvisioningError(
      'PASSWORD_TOO_WEAK',
      passwordPolicy.reason || 'Password must be at least 8 characters long.',
      400
    );
  }

  // Construct full name and granular name components
  const constructedFullName =
    (input.fullName && input.fullName.trim()) ||
    [input.firstName, input.middleName, input.surname].filter(Boolean).join(' ').trim();

  if (!constructedFullName || constructedFullName.length < 2) {
    throw new ProvisioningError('INVALID_NAME', 'Administrator full name is required.', 400);
  }

  const decomposed = decomposeFullName(constructedFullName);
  const firstName = input.firstName?.trim() || decomposed.firstName;
  const middleName = input.middleName?.trim() || decomposed.middleName;
  const surname = input.surname?.trim() || decomposed.surname;

  const execute = async (client: PoolClient): Promise<ProvisionAdministratorResult> => {
    // 1. Check duplicate email
    const existingUser = await userRepository.findByEmail(cleanEmail, client);
    if (existingUser) {
      throw new ProvisioningError(
        'EMAIL_ALREADY_EXISTS',
        `A user account with email '${cleanEmail}' already exists.`,
        409
      );
    }

    // 2. Verify organization & school relationship
    let resolvedOrganizationId: string | null = input.organizationId?.trim() || null;
    let resolvedSchool: SchoolDbEntity | null = null;

    if (normalizedSchoolId) {
      resolvedSchool = await schoolRepository.findById(normalizedSchoolId, { client });
      if (!resolvedSchool) {
        throw new ProvisioningError(
          'SCHOOL_NOT_FOUND',
          `School '${normalizedSchoolId}' does not exist.`,
          404
        );
      }
      if (!resolvedSchool.is_active) {
        throw new ProvisioningError(
          'SCHOOL_INACTIVE',
          `Cannot provision user under inactive school '${resolvedSchool.code}'.`,
          400
        );
      }
      if (resolvedOrganizationId && resolvedSchool.organization_id !== resolvedOrganizationId) {
        throw new ProvisioningError(
          'ORGANIZATION_SCHOOL_MISMATCH',
          `School '${resolvedSchool.code}' does not belong to organization '${resolvedOrganizationId}'.`,
          400
        );
      }
      resolvedOrganizationId = resolvedSchool.organization_id;
    } else if (resolvedOrganizationId) {
      const org = await organizationRepository.findById(resolvedOrganizationId, { client });
      if (!org) {
        throw new ProvisioningError(
          'ORGANIZATION_NOT_FOUND',
          `Organization '${resolvedOrganizationId}' does not exist.`,
          404
        );
      }
    } else {
      // Platform-level role without explicit organizationId: resolve first organization if present
      const orgs = await organizationRepository.listAll(client);
      resolvedOrganizationId = orgs[0]?.id || null;
    }

    // 3. Hash password using Argon2id
    const passwordHash = await hashPassword(input.password);

    // 4. Create authoritative user record
    const createdUser = await userRepository.createUser(
      {
        email: cleanEmail,
        passwordHash,
        fullName: constructedFullName,
        role: targetRole,
        schoolId: normalizedSchoolId,
        phone: input.phone?.trim() || null,
        isActive: true,
        emailVerified: true,
      },
      client
    );

    // 5. If role requires a school staff record and belongs to a school, atomically create staff record
    let createdStaff: StaffDbEntity | null = null;
    if (resolvedSchool && roleRequiresStaffIdentity(targetRole)) {
      const profile = getDefaultStaffProfileForRole(targetRole);
      const staffIdNumber = await resolveStaffIdNumber(
        client,
        resolvedSchool.code,
        targetRole,
        input.staffIdNumber
      );

      // Check for duplicate staff number in the same school
      const existingStaffByNumber = await staffRepository.findByStaffNumber(
        resolvedSchool.id,
        staffIdNumber,
        client
      );
      if (existingStaffByNumber) {
        throw new ProvisioningError(
          'STAFF_ID_ALREADY_EXISTS',
          `Staff ID '${staffIdNumber}' already exists in school '${resolvedSchool.code}'.`,
          409
        );
      }

      createdStaff = await staffRepository.createStaff(
        {
          schoolId: resolvedSchool.id,
          organizationId: resolvedSchool.organization_id,
          staffIdNumber,
          firstName,
          middleName,
          surname,
          fullName: constructedFullName,
          staffType: profile.staffType,
          arm: profile.arm,
          designation: input.designation?.trim() || profile.designation,
          role: profile.roleLabel,
          userId: createdUser.id,
          qualifications: input.qualifications?.trim() || null,
          trcnNumber: input.trcnNumber?.trim() || null,
          status: 'Active',
          isActive: true,
          phone: input.phone?.trim() || null,
          email: cleanEmail,
        },
        client
      );

      // Keep school leadership metadata aligned if provisioning Principal, VP, or Bursar
      if (targetRole === 'principal' && !resolvedSchool.principal_name) {
        await client.query(
          'UPDATE schools SET principal_name = $1, updated_at = NOW() WHERE id = $2;',
          [constructedFullName, resolvedSchool.id]
        );
      } else if (targetRole === 'vice_principal' && !resolvedSchool.vice_principal_academic) {
        await client.query(
          'UPDATE schools SET vice_principal_academic = $1, updated_at = NOW() WHERE id = $2;',
          [constructedFullName, resolvedSchool.id]
        );
      } else if (targetRole === 'bursar' && !resolvedSchool.bursar_name) {
        await client.query(
          'UPDATE schools SET bursar_name = $1, updated_at = NOW() WHERE id = $2;',
          [constructedFullName, resolvedSchool.id]
        );
      }
    }

    const safeUser = buildSafeUser(createdUser, resolvedSchool?.name || null);
    const roleTier = getRoleProvisioningTier(targetRole);

    // 6. Persist audit log entry
    await logAuthEvent(
      {
        action: 'ADMIN_PROVISIONED',
        status: 'SUCCESS',
        userId: actor.user?.id || createdUser.id,
        email: cleanEmail,
        ipAddress: actor.ipAddress || null,
        userAgent: actor.userAgent || null,
        details: {
          provisionedUserId: createdUser.id,
          provisionedRole: targetRole,
          roleTier,
          organizationId: resolvedOrganizationId,
          schoolId: normalizedSchoolId,
          staffId: createdStaff?.id || null,
          staffIdNumber: createdStaff?.staff_id_number || null,
          provisionedBy: actor.isBootstrap ? 'BOOTSTRAP' : actor.user?.email || 'SYSTEM',
        },
      },
      client
    );

    return {
      user: safeUser,
      staff: createdStaff,
      organizationId: resolvedOrganizationId,
      roleTier,
    };
  };

  return externalClient ? execute(externalClient) : runProvisioningTransaction(execute);
}

/**
 * 4. Controlled First-Deployment Bootstrap (Organization + Optional First School + First Admin)
 *
 * FAIL-CLOSED GUARANTEE:
 * - Refuses to execute if any super_admin user already exists in PostgreSQL.
 * - Executes inside a single atomic PostgreSQL transaction.
 */
export async function bootstrapFirstTenantAndAdmin(
  input: FirstBootstrapInput
): Promise<FirstBootstrapResult> {
  if (!input?.organization || !input?.admin) {
    throw new ProvisioningError(
      'INVALID_BOOTSTRAP_PAYLOAD',
      'Bootstrap requires both organization and admin configuration.',
      400
    );
  }

  // Pre-check before opening transaction so PROVISIONING_BLOCKED audit log is durably committed
  const preCheckRes = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'super_admin';"
  );
  const preCheckCount = parseInt(preCheckRes.rows[0]?.count || '0', 10);
  if (preCheckCount > 0) {
    await logAuthEvent({
      action: 'PROVISIONING_BLOCKED',
      status: 'BLOCKED',
      email: input.admin.email || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      details: {
        operation: 'BOOTSTRAP_FIRST_TENANT_AND_ADMIN',
        reason: 'BOOTSTRAP_ALREADY_COMPLETED',
        existingSuperAdminCount: preCheckCount,
      },
    });
    throw new ProvisioningError(
      'BOOTSTRAP_ALREADY_COMPLETED',
      'First-deployment bootstrap has already been completed. Use an authenticated Super Administrator session for subsequent provisioning.',
      409
    );
  }

  return runProvisioningTransaction(async (client) => {
    // Fail closed if bootstrap was already performed (any super_admin user exists)
    const existingSuperAdminRes = await client.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE role = 'super_admin';"
    );
    const existingSuperAdminCount = parseInt(existingSuperAdminRes.rows[0]?.count || '0', 10);
    if (existingSuperAdminCount > 0) {
      await logAuthEvent(
        {
          action: 'PROVISIONING_BLOCKED',
          status: 'BLOCKED',
          email: input.admin.email || null,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
          details: {
            operation: 'BOOTSTRAP_FIRST_TENANT_AND_ADMIN',
            reason: 'BOOTSTRAP_ALREADY_COMPLETED',
            existingSuperAdminCount,
          },
        },
        client
      );
      throw new ProvisioningError(
        'BOOTSTRAP_ALREADY_COMPLETED',
        'First-deployment bootstrap has already been completed. Use an authenticated Super Administrator session for subsequent provisioning.',
        409
      );
    }

    const bootstrapActor: ProvisioningActorContext = {
      isBootstrap: true,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    };

    // 1. Provision first organization
    const organization = await provisionOrganization(input.organization, bootstrapActor, client);

    // 2. Provision first school if provided
    let school: SchoolDbEntity | null = null;
    if (input.school) {
      school = await provisionSchool(
        {
          ...input.school,
          organizationId: organization.id,
        },
        bootstrapActor,
        client
      );
    }

    // 3. Provision first administrator
    const primaryAdminRole = input.admin.role || 'super_admin';
    if (
      primaryAdminRole !== 'super_admin' &&
      primaryAdminRole !== 'state_officer' &&
      primaryAdminRole !== 'principal'
    ) {
      throw new ProvisioningError(
        'INVALID_BOOTSTRAP_ADMIN_ROLE',
        'Bootstrap administrator role must be super_admin, state_officer, or principal.',
        400
      );
    }

    const adminSchoolId = primaryAdminRole === 'principal' ? school?.id || null : null;
    const admin = await provisionAdministrator(
      {
        email: input.admin.email,
        password: input.admin.password,
        fullName: input.admin.fullName,
        phone: input.admin.phone || null,
        role: primaryAdminRole,
        organizationId: organization.id,
        schoolId: adminSchoolId,
        staffIdNumber: input.admin.staffIdNumber || null,
      },
      bootstrapActor,
      client
    );

    // 4. Optional: provision dedicated first School Principal if school was created and admin is platform-level
    let schoolPrincipal: ProvisionAdministratorResult | null = null;
    if (input.schoolPrincipal && school) {
      schoolPrincipal = await provisionAdministrator(
        {
          email: input.schoolPrincipal.email,
          password: input.schoolPrincipal.password,
          fullName: input.schoolPrincipal.fullName,
          phone: input.schoolPrincipal.phone || null,
          role: 'principal',
          organizationId: organization.id,
          schoolId: school.id,
          staffIdNumber: input.schoolPrincipal.staffIdNumber || null,
          qualifications: input.schoolPrincipal.qualifications || null,
          trcnNumber: input.schoolPrincipal.trcnNumber || null,
        },
        bootstrapActor,
        client
      );
    }

    await logAuthEvent(
      {
        action: 'BOOTSTRAP_PROVISIONED',
        status: 'SUCCESS',
        userId: admin.user.id,
        email: admin.user.email,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        details: {
          organizationId: organization.id,
          organizationCode: organization.code,
          schoolId: school?.id || null,
          schoolCode: school?.code || null,
          adminUserId: admin.user.id,
          adminRole: admin.user.role,
          schoolPrincipalUserId: schoolPrincipal?.user.id || null,
        },
      },
      client
    );

    return {
      organization,
      school,
      admin,
      schoolPrincipal,
    };
  });
}

/**
 * 5. Read-Only Provisioning Integrity Verification
 */
export async function verifyProvisioningState(): Promise<ProvisioningVerificationReport> {
  const issues: string[] = [];

  const orgsRes = await query<{ id: string; code: string; name: string; school_count: number }>(
    `SELECT o.id, o.code, o.name,
            (SELECT COUNT(*)::int FROM schools s WHERE s.organization_id = o.id) AS school_count
     FROM organizations o
     ORDER BY o.created_at ASC;`
  );

  const schoolsCountRes = await query<{ count: string }>('SELECT COUNT(*) as count FROM schools;');
  const superAdminsRes = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND is_active = TRUE;"
  );
  const activeAdminsRes = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users WHERE role IN ('super_admin', 'state_officer', 'principal', 'vice_principal', 'headmistress', 'head_kindergarten') AND is_active = TRUE;"
  );
  const staffLinkedRes = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM staff WHERE user_id IS NOT NULL AND is_active = TRUE;'
  );

  // Check for school-scoped roles missing school_id
  const invalidScopeRes = await query<{ count: string }>(
    "SELECT COUNT(*) as count FROM users WHERE role NOT IN ('super_admin', 'state_officer') AND school_id IS NULL;"
  );

  // Check for active school principals missing a linked staff record or organization_id on staff
  const unlinkedPrincipalsRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM users u
     LEFT JOIN staff st ON st.user_id = u.id
     WHERE u.role = 'principal' AND u.is_active = TRUE AND (st.id IS NULL OR st.organization_id IS NULL);`
  );

  const organizationsCount = orgsRes.rows.length;
  const schoolsCount = parseInt(schoolsCountRes.rows[0]?.count || '0', 10);
  const activeSuperAdminsCount = parseInt(superAdminsRes.rows[0]?.count || '0', 10);
  const activeAdminsCount = parseInt(activeAdminsRes.rows[0]?.count || '0', 10);
  const staffLinkedUsersCount = parseInt(staffLinkedRes.rows[0]?.count || '0', 10);
  const invalidScopeUsersCount = parseInt(invalidScopeRes.rows[0]?.count || '0', 10);
  const unlinkedSchoolStaffAdminsCount = parseInt(unlinkedPrincipalsRes.rows[0]?.count || '0', 10);

  if (organizationsCount === 0) {
    issues.push('No organization has been provisioned in the organizations table.');
  }
  if (activeAdminsCount === 0) {
    issues.push('No active administrator account has been provisioned in the users table.');
  }
  if (invalidScopeUsersCount > 0) {
    issues.push(`Found ${invalidScopeUsersCount} school-scoped user(s) missing a required school_id.`);
  }
  if (unlinkedSchoolStaffAdminsCount > 0) {
    issues.push(`Found ${unlinkedSchoolStaffAdminsCount} active school principal(s) without a linked staff identity record.`);
  }

  return {
    ready:
      organizationsCount > 0 &&
      activeAdminsCount > 0 &&
      invalidScopeUsersCount === 0 &&
      unlinkedSchoolStaffAdminsCount === 0,
    organizationsCount,
    schoolsCount,
    activeSuperAdminsCount,
    activeAdminsCount,
    staffLinkedUsersCount,
    invalidScopeUsersCount,
    unlinkedSchoolStaffAdminsCount,
    organizations: orgsRes.rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      schoolCount: Number(r.school_count || 0),
    })),
    issues,
  };
}
