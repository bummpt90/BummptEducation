/**
 * BummptEducation — Ministry Directives Repository
 * 
 * Server-authoritative data layer for statutory circulars, policy directives,
 * and compliance tracking across Benue State schools.
 * 
 * Strict Multi-School Privacy:
 * A directive targeted to a specific school is NEVER visible to other schools.
 */

import { query, withTransaction } from '../client';
import { SafeUser, AuthRole } from '../../auth/types';

export interface MinistryDirectiveRecord {
  id: string;
  reference_number: string;
  title: string;
  category: string;
  priority: string;
  target_audience: string;
  audience_type: 'ALL_SCHOOLS' | 'SPECIFIC_SCHOOL' | 'ZONE' | 'LGA';
  target_lga?: string | null;
  target_zone?: string | null;
  target_school_id?: string | null;
  target_school_name?: string | null;
  issued_by: string;
  issuing_office: string;
  issued_date: string;
  effective_date: string;
  content: string;
  action_required: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_acknowledged?: boolean;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
}

export interface CreateDirectiveDto {
  title: string;
  category: string;
  priority: string;
  targetAudience?: string;
  audienceType?: 'ALL_SCHOOLS' | 'SPECIFIC_SCHOOL' | 'ZONE' | 'LGA';
  targetLga?: string;
  targetZone?: string;
  targetSchoolId?: string;
  targetSchoolName?: string;
  content: string;
  actionRequired?: string;
  effectiveDate?: string;
  status?: string;
}

export class MinistryDirectiveRepository {
  /**
   * Checks if user is an authorized state or HQ administrative officer
   */
  isHqOfficer(role: AuthRole): boolean {
    return role === 'super_admin' || role === 'state_officer';
  }

  /**
   * Checks if user is an authenticated Head of School
   */
  isHeadOfSchool(role: AuthRole): boolean {
    return ['principal', 'headmistress', 'head_kindergarten'].includes(role);
  }

  /**
   * Generates a deterministic, sequential official reference number for a directive
   */
  async generateOfficialRef(year: number = new Date().getFullYear()): Promise<string> {
    const res = await query<{ count: string }>(`
      SELECT COUNT(*)::text AS count FROM ministry_directives;
    `);
    const nextSeq = (parseInt(res.rows[0]?.count || '0', 10) + 1).toString().padStart(3, '0');
    return `MOE/BN/DIR/${year}/${nextSeq}`;
  }

  /**
   * Lists all directives visible to the user under strict scoping rules
   */
  async getDirectivesForUser(
    user: SafeUser,
    filters?: { category?: string; priority?: string; search?: string }
  ): Promise<MinistryDirectiveRecord[]> {
    const isHq = this.isHqOfficer(user.role);

    let userSchoolLga: string | null = null;
    let userSchoolZone: string | null = null;
    let userSchoolName: string | null = null;

    if (!isHq && user.schoolId) {
      const schoolRes = await query<{ name: string; lga: string; senatorial_zone: string }>(`
        SELECT name, lga, senatorial_zone FROM schools WHERE id = $1 LIMIT 1;
      `, [user.schoolId]);
      if (schoolRes.rows.length > 0) {
        userSchoolName = schoolRes.rows[0].name;
        userSchoolLga = schoolRes.rows[0].lga;
        userSchoolZone = schoolRes.rows[0].senatorial_zone;
      }
    }

    let sql = `
      SELECT 
        d.*,
        (da.id IS NOT NULL) AS is_acknowledged,
        da.acknowledged_at,
        da.head_name AS acknowledged_by
      FROM ministry_directives d
      LEFT JOIN directive_acknowledgements da 
        ON da.directive_id = d.id 
        AND da.school_id = $1
      WHERE 1=1
    `;
    const params: any[] = [user.schoolId || null];

    // Privacy & Audience Scoping
    if (!isHq) {
      if (!user.schoolId) {
        // If not affiliated with any school and not HQ, only show statewide broadcasts
        sql += ` AND d.audience_type = 'ALL_SCHOOLS'`;
      } else {
        sql += ` AND (
          d.audience_type = 'ALL_SCHOOLS'
          OR (d.audience_type = 'SPECIFIC_SCHOOL' AND (d.target_school_id = $${params.length + 1} OR LOWER(d.target_school_name) = LOWER($${params.length + 2})))
          OR (d.audience_type = 'LGA' AND LOWER(d.target_lga) = LOWER($${params.length + 3}))
          OR (d.audience_type = 'ZONE' AND LOWER(d.target_zone) = LOWER($${params.length + 4}))
        )`;
        params.push(user.schoolId, userSchoolName || '', userSchoolLga || '', userSchoolZone || '');
      }
    }

    if (filters?.category && filters.category !== 'All') {
      params.push(filters.category);
      sql += ` AND d.category = $${params.length}`;
    }

    if (filters?.priority && filters.priority !== 'All') {
      params.push(filters.priority);
      sql += ` AND d.priority = $${params.length}`;
    }

    if (filters?.search && filters.search.trim()) {
      params.push(`%${filters.search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(d.title) LIKE $${params.length} 
        OR LOWER(d.content) LIKE $${params.length} 
        OR LOWER(d.reference_number) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY d.created_at DESC;`;

    const res = await query<MinistryDirectiveRecord>(sql, params);
    return res.rows;
  }

  /**
   * Retrieves a single directive by ID, enforcing privacy scoping
   */
  async getDirectiveById(id: string, user: SafeUser): Promise<MinistryDirectiveRecord | null> {
    const isHq = this.isHqOfficer(user.role);

    const res = await query<MinistryDirectiveRecord>(`
      SELECT 
        d.*,
        (da.id IS NOT NULL) AS is_acknowledged,
        da.acknowledged_at,
        da.head_name AS acknowledged_by
      FROM ministry_directives d
      LEFT JOIN directive_acknowledgements da 
        ON da.directive_id = d.id 
        AND da.school_id = $2
      WHERE d.id = $1
      LIMIT 1;
    `, [id, user.schoolId || null]);

    if (res.rows.length === 0) {
      return null;
    }

    const directive = res.rows[0];

    // Privacy & Audience Scoping: Logically identical to getDirectivesForUser
    if (!isHq) {
      if (directive.audience_type === 'ALL_SCHOOLS') {
        return directive;
      }

      if (!user.schoolId) {
        return null;
      }

      // Fetch Head of School's assigned school LGA and Senatorial Zone
      let userSchoolLga = '';
      let userSchoolZone = '';
      const schoolRes = await query<{ lga: string; senatorial_zone: string }>(`
        SELECT lga, senatorial_zone FROM schools WHERE id = $1 LIMIT 1;
      `, [user.schoolId]);

      if (schoolRes.rows.length > 0) {
        userSchoolLga = schoolRes.rows[0].lga || '';
        userSchoolZone = schoolRes.rows[0].senatorial_zone || '';
      }

      if (directive.audience_type === 'SPECIFIC_SCHOOL') {
        if (directive.target_school_id !== user.schoolId) {
          return null; // Block foreign school inspection
        }
      } else if (directive.audience_type === 'LGA') {
        if (!userSchoolLga || !directive.target_lga || userSchoolLga.toLowerCase() !== directive.target_lga.toLowerCase()) {
          return null; // Foreign LGA inspection denied
        }
      } else if (directive.audience_type === 'ZONE') {
        if (!userSchoolZone || !directive.target_zone || userSchoolZone.toLowerCase() !== directive.target_zone.toLowerCase()) {
          return null; // Foreign Zone inspection denied
        }
      } else {
        return null;
      }
    }

    return directive;
  }

  /**
   * Creates and broadcasts an official Ministry Directive
   */
  async createDirective(
    dto: CreateDirectiveDto,
    user: SafeUser,
    ipAddress?: string
  ): Promise<MinistryDirectiveRecord> {
    if (!this.isHqOfficer(user.role)) {
      throw new Error('Only State Officers and Super Administrators can issue official Ministry Directives.');
    }

    return withTransaction(async (client) => {
      const refNum = await this.generateOfficialRef();
      const audienceType = dto.audienceType || (dto.targetSchoolId ? 'SPECIFIC_SCHOOL' : 'ALL_SCHOOLS');

      const targetAudienceLabel = dto.targetAudience || (
        audienceType === 'ALL_SCHOOLS' ? 'Statewide (All 23 LGAs)' :
        audienceType === 'SPECIFIC_SCHOOL' ? (dto.targetSchoolName || 'Specific School') :
        audienceType === 'ZONE' ? (dto.targetZone || 'Specific Zone') :
        (dto.targetLga || 'Specific LGA')
      );

      const res = await client.query<MinistryDirectiveRecord>(`
        INSERT INTO ministry_directives (
          reference_number, title, category, priority,
          target_audience, audience_type, target_lga, target_zone,
          target_school_id, target_school_name, issued_by,
          issuing_office, issued_by_user_id, issued_date, effective_date,
          content, action_required, status
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, CURRENT_DATE, $14,
          $15, $16, $17
        )
        RETURNING *;
      `, [
        refNum,
        dto.title.trim(),
        dto.category,
        dto.priority,
        targetAudienceLabel,
        audienceType,
        dto.targetLga || null,
        dto.targetZone || null,
        dto.targetSchoolId || null,
        dto.targetSchoolName || null,
        user.fullName,
        'Headquarters Command & Executive Secretariat, Makurdi',
        user.id,
        dto.effectiveDate || new Date().toISOString().split('T')[0],
        dto.content.trim(),
        dto.actionRequired?.trim() || 'All school administrators must comply immediately.',
        dto.status || 'Broadcasted & Active',
      ]);

      const directive = res.rows[0];

      // Audit Log
      await client.query(`
        INSERT INTO hq_audit_logs (
          school_id, user_id, user_name, user_role,
          action, resource_id, resource_type, details, ip_address
        ) VALUES (
          $1, $2, $3, $4,
          'DIRECTIVE_CREATED', $5, 'DIRECTIVE', $6, $7
        );
      `, [
        directive.target_school_id || null,
        user.id,
        user.fullName,
        user.role,
        directive.id,
        JSON.stringify({
          referenceNumber: directive.reference_number,
          title: directive.title,
          category: directive.category,
          audienceType: directive.audience_type,
          targetSchoolId: directive.target_school_id,
        }),
        ipAddress || null,
      ]);

      return directive;
    });
  }

  /**
   * Head of School acknowledges a directive for their school
   */
  async acknowledgeDirective(
    directiveId: string,
    user: SafeUser,
    notes?: string,
    ipAddress?: string
  ): Promise<{ success: boolean; acknowledgedAt: string }> {
    if (!this.isHeadOfSchool(user.role) && !this.isHqOfficer(user.role)) {
      throw new Error('Only authenticated Heads of School can acknowledge official Ministry Directives.');
    }

    if (!user.schoolId) {
      throw new Error('User must be officially assigned to a school to acknowledge directives.');
    }

    return withTransaction(async (client) => {
      // 1. Verify directive exists and is applicable to this school
      const dirRes = await client.query<{ id: string; reference_number: string; audience_type: string; target_school_id: string }>(`
        SELECT id, reference_number, audience_type, target_school_id
        FROM ministry_directives
        WHERE id = $1
        LIMIT 1;
      `, [directiveId]);

      if (dirRes.rows.length === 0) {
        throw new Error('Directive not found.');
      }

      const dir = dirRes.rows[0];
      if (dir.audience_type === 'SPECIFIC_SCHOOL' && dir.target_school_id && dir.target_school_id !== user.schoolId) {
        throw new Error('This directive is targeted to another school and cannot be acknowledged.');
      }

      // 2. Persist acknowledgement
      const ackRes = await client.query<{ acknowledged_at: string }>(`
        INSERT INTO directive_acknowledgements (
          directive_id, school_id, user_id, head_name, head_role, notes, acknowledged_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW()
        )
        ON CONFLICT (directive_id, school_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          head_name = EXCLUDED.head_name,
          head_role = EXCLUDED.head_role,
          notes = EXCLUDED.notes,
          acknowledged_at = NOW()
        RETURNING acknowledged_at;
      `, [
        directiveId,
        user.schoolId,
        user.id,
        user.fullName,
        user.role,
        notes?.trim() || 'Formally received and acknowledged by school executive head.',
      ]);

      // 3. Record in HQ Audit Log
      await client.query(`
        INSERT INTO hq_audit_logs (
          school_id, user_id, user_name, user_role,
          action, resource_id, resource_type, details, ip_address
        ) VALUES (
          $1, $2, $3, $4,
          'DIRECTIVE_ACKNOWLEDGED', $5, 'DIRECTIVE', $6, $7
        );
      `, [
        user.schoolId,
        user.id,
        user.fullName,
        user.role,
        directiveId,
        JSON.stringify({
          directiveReference: dir.reference_number,
          headName: user.fullName,
          headRole: user.role,
        }),
        ipAddress || null,
      ]);

      return {
        success: true,
        acknowledgedAt: ackRes.rows[0].acknowledged_at,
      };
    });
  }

  /**
   * Retrieves list of school acknowledgements for a given directive
   */
  async getDirectiveAcknowledgements(directiveId: string, user: SafeUser): Promise<any[]> {
    const isHq = this.isHqOfficer(user.role);

    let sql = `
      SELECT 
        da.id,
        da.directive_id,
        da.school_id,
        s.name AS school_name,
        s.lga,
        da.head_name,
        da.head_role,
        da.notes,
        da.acknowledged_at
      FROM directive_acknowledgements da
      JOIN schools s ON s.id = da.school_id
      WHERE da.directive_id = $1
    `;
    const params: any[] = [directiveId];

    if (!isHq && user.schoolId) {
      sql += ` AND da.school_id = $2`;
      params.push(user.schoolId);
    }

    sql += ` ORDER BY da.acknowledged_at DESC;`;

    const res = await query(sql, params);
    return res.rows;
  }
}

export const ministryDirectiveRepository = new MinistryDirectiveRepository();
