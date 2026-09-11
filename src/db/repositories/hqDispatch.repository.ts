/**
 * BummptEducation — Headquarters Dispatch & Live Chat Repository
 * 
 * Server-authoritative communication pipeline connecting Benue State Ministry of Education
 * HQ with Heads of School across all 23 LGAs.
 * 
 * Strict Server-Side Privacy:
 * School-specific communications (requests, complaints, statutory submissions)
 * must NEVER be visible or accessible to other schools.
 */

import { query, withTransaction } from '../client';
import { SafeUser, AuthRole } from '../../auth/types';
import { getRoleDisplayName } from '../../auth/roles';

export interface DispatchReplyRecord {
  id: string;
  dispatch_id: string;
  responder_name: string;
  responder_role: string;
  reply_content: string;
  sender_type: 'HQ' | 'SCHOOL_HEAD';
  created_at: string;
}

export interface HqDispatchRecord {
  id: string;
  school_id: string | null;
  target_school_id: string | null;
  target_school_name: string | null;
  official_ref_number: string;
  sender_name: string;
  sender_role: string;
  school_name: string;
  lga: string;
  zone: string;
  channel_id: string;
  message_type: 'update' | 'complaint' | 'request' | 'directive' | 'executive';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  audience_type: 'SPECIFIC_SCHOOL' | 'ALL_SCHOOLS' | 'ZONE' | 'LGA';
  content: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
  status: 'received' | 'in-review' | 'forwarded-to-head' | 'approved' | 'resolved';
  is_escalated_to_commissioner: boolean;
  hq_response_content?: string | null;
  hq_responder_name?: string | null;
  hq_responder_role?: string | null;
  hq_responded_at?: string | null;
  created_at: string;
  updated_at: string;
  replies?: DispatchReplyRecord[];
}

export interface CreateDispatchDto {
  channelId: string;
  messageType: 'update' | 'complaint' | 'request' | 'directive' | 'executive';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  content: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isEscalatedToCommissioner?: boolean;
  targetSchoolId?: string;
  targetSchoolName?: string;
  audienceType?: 'SPECIFIC_SCHOOL' | 'ALL_SCHOOLS' | 'ZONE' | 'LGA';
  lga?: string;
  zone?: string;
}

export class HqDispatchRepository {
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
   * Generates a deterministic, sequential official reference number
   */
  async generateOfficialRef(lgaCode: string = 'MKD', year: number = new Date().getFullYear()): Promise<string> {
    const res = await query<{ count: string }>(`
      SELECT COUNT(*)::text AS count FROM hq_dispatches;
    `);
    const nextSeq = (parseInt(res.rows[0]?.count || '0', 10) + 1).toString().padStart(4, '0');
    const safeCode = (lgaCode || 'BN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    return `MOE/BN/${safeCode}/${year}/${nextSeq}`;
  }

  /**
   * Retrieves messages visible to the user under strict scoping rules
   */
  async getMessages(
    user: SafeUser,
    queryParams?: {
      channelId?: string;
      lga?: string;
      zone?: string;
      status?: string;
      priority?: string;
      search?: string;
    }
  ): Promise<HqDispatchRecord[]> {
    const isHq = this.isHqOfficer(user.role);
    const isHead = this.isHeadOfSchool(user.role);

    if (!isHq && !isHead) {
      throw new Error('FORBIDDEN: Ministry Portal messaging is restricted exclusively to HQ Officers and Heads of School.');
    }

    let userSchoolLga: string | null = null;
    let userSchoolZone: string | null = null;
    let userSchoolName: string | null = null;

    if (isHead && user.schoolId) {
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
      SELECT d.*
      FROM hq_dispatches d
      WHERE 1=1
    `;
    const params: any[] = [];

    // Privacy & Scoping: If Head of School, strictly hide other schools' private messages
    if (!isHq) {
      if (!user.schoolId) {
        sql += ` AND d.audience_type = 'ALL_SCHOOLS'`;
      } else {
        sql += ` AND (
          d.audience_type = 'ALL_SCHOOLS'
          OR d.school_id = $${params.length + 1}
          OR d.target_school_id = $${params.length + 1}
          OR (d.audience_type = 'LGA' AND LOWER(d.lga) = LOWER($${params.length + 2}))
          OR (d.audience_type = 'ZONE' AND LOWER(d.zone) = LOWER($${params.length + 3}))
        )`;
        params.push(user.schoolId, userSchoolLga || '', userSchoolZone || '');
      }
    }

    if (queryParams?.channelId && queryParams.channelId !== 'all') {
      params.push(queryParams.channelId);
      sql += ` AND d.channel_id = $${params.length}`;
    }

    if (queryParams?.status && queryParams.status !== 'All') {
      params.push(queryParams.status);
      sql += ` AND d.status = $${params.length}`;
    }

    if (queryParams?.priority && queryParams.priority !== 'All') {
      params.push(queryParams.priority);
      sql += ` AND d.priority = $${params.length}`;
    }

    if (queryParams?.lga && queryParams.lga !== 'All') {
      params.push(queryParams.lga);
      sql += ` AND LOWER(d.lga) = LOWER($${params.length})`;
    }

    if (queryParams?.zone && queryParams.zone !== 'All') {
      params.push(`%${queryParams.zone}%`);
      sql += ` AND d.zone ILIKE $${params.length}`;
    }

    if (queryParams?.search && queryParams.search.trim()) {
      params.push(`%${queryParams.search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(d.content) LIKE $${params.length}
        OR LOWER(d.school_name) LIKE $${params.length}
        OR LOWER(d.sender_name) LIKE $${params.length}
        OR LOWER(d.official_ref_number) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY d.created_at ASC;`;

    const res = await query<HqDispatchRecord>(sql, params);
    const dispatches = res.rows;

    // Fetch replies in batch
    if (dispatches.length > 0) {
      const dispatchIds = dispatches.map(d => d.id);
      const repliesRes = await query<DispatchReplyRecord>(`
        SELECT * FROM hq_dispatch_replies
        WHERE dispatch_id = ANY($1)
        ORDER BY created_at ASC;
      `, [dispatchIds]);

      const repliesMap: Record<string, DispatchReplyRecord[]> = {};
      for (const r of repliesRes.rows) {
        if (!repliesMap[r.dispatch_id]) {
          repliesMap[r.dispatch_id] = [];
        }
        repliesMap[r.dispatch_id].push(r);
      }

      for (const d of dispatches) {
        d.replies = repliesMap[d.id] || [];
      }
    }

    return dispatches;
  }

  /**
   * Retrieves a single message by ID with replies, enforcing school boundary checks
   */
  async getMessageById(id: string, user: SafeUser): Promise<HqDispatchRecord | null> {
    const isHq = this.isHqOfficer(user.role);
    const isHead = this.isHeadOfSchool(user.role);

    if (!isHq && !isHead) {
      throw new Error('FORBIDDEN: Access denied.');
    }

    const res = await query<HqDispatchRecord>(`
      SELECT * FROM hq_dispatches WHERE id = $1 LIMIT 1;
    `, [id]);

    if (res.rows.length === 0) {
      return null;
    }

    const dispatch = res.rows[0];

    // Privacy boundary check for Head of School
    if (!isHq) {
      if (dispatch.audience_type === 'ALL_SCHOOLS') {
        // Explicit ALL_SCHOOLS broadcast is visible to all authorized school heads
      } else {
        if (!user.schoolId) {
          return null;
        }

        let userSchoolLga = '';
        let userSchoolZone = '';
        const schoolRes = await query<{ lga: string; senatorial_zone: string }>(`
          SELECT lga, senatorial_zone FROM schools WHERE id = $1 LIMIT 1;
        `, [user.schoolId]);

        if (schoolRes.rows.length > 0) {
          userSchoolLga = schoolRes.rows[0].lga || '';
          userSchoolZone = schoolRes.rows[0].senatorial_zone || '';
        }

        const isOwnSchool = dispatch.school_id === user.schoolId || dispatch.target_school_id === user.schoolId;
        const isLgaAudience = dispatch.audience_type === 'LGA' && !!userSchoolLga && !!dispatch.lga && dispatch.lga.toLowerCase() === userSchoolLga.toLowerCase();
        const isZoneAudience = dispatch.audience_type === 'ZONE' && !!userSchoolZone && !!dispatch.zone && dispatch.zone.toLowerCase() === userSchoolZone.toLowerCase();

        if (!isOwnSchool && !isLgaAudience && !isZoneAudience) {
          return null; // Invisible to foreign schools
        }
      }
    }

    // Attach replies
    const repliesRes = await query<DispatchReplyRecord>(`
      SELECT * FROM hq_dispatch_replies WHERE dispatch_id = $1 ORDER BY created_at ASC;
    `, [id]);

    dispatch.replies = repliesRes.rows;
    return dispatch;
  }

  /**
   * Creates a new dispatch with trusted sender identity derivation
   */
  async createMessage(
    dto: CreateDispatchDto,
    user: SafeUser,
    ipAddress?: string
  ): Promise<HqDispatchRecord> {
    const isHq = this.isHqOfficer(user.role);
    const isHead = this.isHeadOfSchool(user.role);

    if (!isHq && !isHead) {
      throw new Error('FORBIDDEN: Only State HQ Officers and Heads of School may send Ministry communications.');
    }

    return withTransaction(async (client) => {
      let senderName = user.fullName;
      let senderRole = getRoleDisplayName(user.role);
      let schoolName = 'Ministry of Education Headquarters, Makurdi';
      let schoolId: string | null = null;
      let targetSchoolId: string | null = dto.targetSchoolId || null;
      let targetSchoolName: string | null = dto.targetSchoolName || null;
      let lga = dto.lga || 'Makurdi';
      let zone = dto.zone || 'Zone B (Benue North-West)';
      let audienceType = dto.audienceType || (dto.channelId === 'all-schools-announcements' ? 'ALL_SCHOOLS' : 'SPECIFIC_SCHOOL');

      // For Head of School, strictly derive school identity from database
      if (isHead) {
        if (!user.schoolId) {
          throw new Error('Authenticated Head of School is not linked to an active school assignment.');
        }

        const schoolRes = await client.query<{
          id: string;
          name: string;
          lga: string;
          senatorial_zone: string;
          organization_id: string;
        }>(`
          SELECT id, name, lga, senatorial_zone, organization_id
          FROM schools
          WHERE id = $1
          LIMIT 1;
        `, [user.schoolId]);

        if (schoolRes.rows.length === 0) {
          throw new Error('Assigned school not found in registry.');
        }

        const school = schoolRes.rows[0];
        senderName = user.fullName;
        senderRole = getRoleDisplayName(user.role);
        schoolId = school.id;
        schoolName = school.name;
        lga = school.lga;
        zone = school.senatorial_zone;
        targetSchoolId = null;
        targetSchoolName = null;
        audienceType = 'SPECIFIC_SCHOOL';
      } else if (isHq && targetSchoolId) {
        // HQ sending to specific school
        const targetSchoolRes = await client.query<{ name: string; lga: string; senatorial_zone: string }>(`
          SELECT name, lga, senatorial_zone FROM schools WHERE id = $1 LIMIT 1;
        `, [targetSchoolId]);
        if (targetSchoolRes.rows.length > 0) {
          targetSchoolName = targetSchoolRes.rows[0].name;
          lga = targetSchoolRes.rows[0].lga;
          zone = targetSchoolRes.rows[0].senatorial_zone;
          audienceType = 'SPECIFIC_SCHOOL';
        }
      }

      const officialRef = await this.generateOfficialRef(lga);

      // Normalize message_type to match check constraint: ('update', 'complaint', 'request', 'directive', 'executive')
      const validTypes = ['update', 'complaint', 'request', 'directive', 'executive'];
      let normalizedType = (dto.messageType || 'update').toLowerCase();
      if (!validTypes.includes(normalizedType)) {
        if (normalizedType.includes('req') || normalizedType.includes('order')) normalizedType = 'request';
        else if (normalizedType.includes('sec') || normalizedType.includes('comp') || normalizedType.includes('urgent')) normalizedType = 'complaint';
        else if (normalizedType.includes('exec')) normalizedType = 'executive';
        else if (normalizedType.includes('direct')) normalizedType = 'directive';
        else normalizedType = 'update';
      }

      const res = await client.query<HqDispatchRecord>(`
        INSERT INTO hq_dispatches (
          school_id, target_school_id, target_school_name,
          official_ref_number, sender_name, sender_role,
          school_name, lga, zone, channel_id,
          message_type, priority, audience_type, content,
          attachment_name, attachment_url, status,
          is_escalated_to_commissioner, sender_user_id
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17,
          $18, $19
        )
        RETURNING *;
      `, [
        schoolId,
        targetSchoolId,
        targetSchoolName,
        officialRef,
        senderName,
        senderRole,
        schoolName,
        lga,
        zone,
        dto.channelId,
        normalizedType,
        dto.priority,
        audienceType,
        dto.content.trim(),
        dto.attachmentName || null,
        dto.attachmentUrl || null,
        dto.isEscalatedToCommissioner ? 'forwarded-to-head' : 'received',
        Boolean(dto.isEscalatedToCommissioner),
        user.id,
      ]);

      const dispatch = res.rows[0];

      // Audit Log
      await client.query(`
        INSERT INTO hq_audit_logs (
          school_id, user_id, user_name, user_role,
          action, resource_id, resource_type, details, ip_address
        ) VALUES (
          $1, $2, $3, $4,
          'HQ_DISPATCH_CREATED', $5, 'HQ_DISPATCH', $6, $7
        );
      `, [
        schoolId || targetSchoolId,
        user.id,
        user.fullName,
        user.role,
        dispatch.id,
        JSON.stringify({
          ref: dispatch.official_ref_number,
          channelId: dispatch.channel_id,
          messageType: dispatch.message_type,
          priority: dispatch.priority,
          schoolName: dispatch.school_name,
        }),
        ipAddress || null,
      ]);

      dispatch.replies = [];
      return dispatch;
    });
  }

  /**
   * Adds a reply to a dispatch, enforcing school isolation
   */
  async createReply(
    dispatchId: string,
    replyContent: string,
    user: SafeUser,
    ipAddress?: string
  ): Promise<DispatchReplyRecord> {
    const isHq = this.isHqOfficer(user.role);
    const isHead = this.isHeadOfSchool(user.role);

    if (!isHq && !isHead) {
      throw new Error('FORBIDDEN: Only HQ Officers and Heads of School may post replies.');
    }

    return withTransaction(async (client) => {
      // 1. Fetch dispatch
      const dispatchRes = await client.query<HqDispatchRecord>(`
        SELECT * FROM hq_dispatches WHERE id = $1 LIMIT 1;
      `, [dispatchId]);

      if (dispatchRes.rows.length === 0) {
        throw new Error('Dispatch not found.');
      }

      const dispatch = dispatchRes.rows[0];

      // 2. Privacy check: School Head can only reply to their own school's dispatch
      if (!isHq) {
        const isOwn = dispatch.school_id === user.schoolId || dispatch.target_school_id === user.schoolId;
        if (!isOwn) {
          throw new Error('FORBIDDEN: Cannot reply to another school’s communication dispatch.');
        }
      }

      const senderType = isHq ? 'HQ' : 'SCHOOL_HEAD';
      const responderRole = getRoleDisplayName(user.role);

      // 3. Insert reply
      const replyRes = await client.query<DispatchReplyRecord>(`
        INSERT INTO hq_dispatch_replies (
          dispatch_id, responder_name, responder_role,
          reply_content, sender_type, user_id, school_id
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6, $7
        )
        RETURNING *;
      `, [
        dispatchId,
        user.fullName,
        responderRole,
        replyContent.trim(),
        senderType,
        user.id,
        user.schoolId || null,
      ]);

      const reply = replyRes.rows[0];

      // 4. If HQ replied, update main dispatch summary fields
      if (isHq) {
        await client.query(`
          UPDATE hq_dispatches
          SET 
            hq_response_content = $1,
            hq_responder_name = $2,
            hq_responder_role = $3,
            hq_responded_at = NOW(),
            status = CASE WHEN status = 'received' THEN 'in-review' ELSE status END,
            updated_at = NOW()
          WHERE id = $4;
        `, [replyContent.trim(), user.fullName, responderRole, dispatchId]);
      }

      // 5. Audit Log
      await client.query(`
        INSERT INTO hq_audit_logs (
          school_id, user_id, user_name, user_role,
          action, resource_id, resource_type, details, ip_address
        ) VALUES (
          $1, $2, $3, $4,
          'HQ_DISPATCH_REPLY_CREATED', $5, 'HQ_DISPATCH_REPLY', $6, $7
        );
      `, [
        dispatch.school_id,
        user.id,
        user.fullName,
        user.role,
        reply.id,
        JSON.stringify({
          dispatchId,
          dispatchRef: dispatch.official_ref_number,
          senderType,
        }),
        ipAddress || null,
      ]);

      return reply;
    });
  }

  /**
   * Updates dispatch workflow status or commissioner escalation (HQ Admin only)
   */
  async updateStatus(
    dispatchId: string,
    status: string,
    isEscalated: boolean | undefined,
    user: SafeUser,
    ipAddress?: string
  ): Promise<HqDispatchRecord> {
    const isHq = this.isHqOfficer(user.role);
    const isHead = this.isHeadOfSchool(user.role);

    if (!isHq && !isHead) {
      throw new Error('FORBIDDEN: Only State HQ Officers and authenticated Heads of School may alter dispatch status or escalate.');
    }

    return withTransaction(async (client) => {
      // If Head of school, ensure they own the dispatch
      if (isHead && !isHq) {
        const checkRes = await client.query<{ school_id: string; target_school_id: string }>(
          'SELECT school_id, target_school_id FROM hq_dispatches WHERE id = $1 LIMIT 1;',
          [dispatchId]
        );
        if (checkRes.rows.length === 0) {
          throw new Error('Dispatch not found.');
        }
        const isOwn = checkRes.rows[0].school_id === user.schoolId || checkRes.rows[0].target_school_id === user.schoolId;
        if (!isOwn) {
          throw new Error('FORBIDDEN: Cannot alter dispatch status for another school.');
        }
      }

      const res = await client.query<HqDispatchRecord>(`
        UPDATE hq_dispatches
        SET 
          status = COALESCE($1, status),
          is_escalated_to_commissioner = COALESCE($2, is_escalated_to_commissioner),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `, [status || null, isEscalated !== undefined ? isEscalated : null, dispatchId]);

      if (res.rows.length === 0) {
        throw new Error('Dispatch not found.');
      }

      const updated = res.rows[0];
      const auditAction = isEscalated ? 'DISPATCH_ESCALATED' : 'HQ_DISPATCH_STATUS_CHANGED';

      // Audit Log
      await client.query(`
        INSERT INTO hq_audit_logs (
          school_id, user_id, user_name, user_role,
          action, resource_id, resource_type, details, ip_address
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, 'HQ_DISPATCH', $7, $8
        );
      `, [
        updated.school_id,
        user.id,
        user.fullName,
        user.role,
        auditAction,
        updated.id,
        JSON.stringify({
          status: updated.status,
          isEscalated: updated.is_escalated_to_commissioner,
          ref: updated.official_ref_number,
        }),
        ipAddress || null,
      ]);

      return updated;
    });
  }
}

export const hqDispatchRepository = new HqDispatchRepository();
