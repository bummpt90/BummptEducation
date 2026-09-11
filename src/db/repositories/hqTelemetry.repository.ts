/**
 * BummptEducation — Benue State HQ Telemetry Repository
 * 
 * Server-authoritative data layer for statewide education telemetry across all 23 LGAs.
 * Direct PostgreSQL queries, zero localStorage or randomized synthetic generation.
 */

import { query, withTransaction } from '../client';
import { SafeUser } from '../../auth/types';

export interface StatewideOverview {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  subventionDisbursedNaira: number;
  averagePassRate: number;
  telemetryActivityCount: number;
  lastSyncTime: string;
  lgaCount: number;
  totalLGAs: number;
}

export interface LgaMetadataRecord {
  id: string;
  lga: string;
  zone: string;
  headquarters: string;
  education_secretary: string;
  total_government_schools: number;
  total_student_population: number;
  total_teacher_count: number;
  average_pass_rate: number;
  subvention_disbursed_naira: number;
  priority_flag: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolKpiSummary {
  schoolId: string;
  teacherKPIs?: any;
  studentKPIs?: any;
  inspectionReports?: any[];
  governingBodyReview?: any;
  liveStats?: {
    enrolledStudents: number;
    activeStaff: number;
    publishedLessonNotes: number;
    recordedAttendanceLogs: number;
  };
}

export class HqTelemetryRepository {
  /**
   * Fetches real aggregate statewide telemetry across all 23 LGAs from PostgreSQL.
   * 
   * DATA AUTHORITY SPECIFICATION:
   * - `totalSchools`: Aggregated via `SUM(total_government_schools) FROM lga_metadata` (authoritative statewide directory)
   * - `totalStudents`: Aggregated via `SUM(total_student_population) FROM lga_metadata` (authoritative verified LGA census)
   * - `totalTeachers`: Aggregated via `SUM(total_teacher_count) FROM lga_metadata` (TRCN & public teacher census)
   * - `subventionDisbursedNaira`: Aggregated via `SUM(subvention_disbursed_naira) FROM lga_metadata` (updated atomically on grants)
   * - `averagePassRate`: Aggregated via `AVG(average_pass_rate) FROM lga_metadata` (terminal examination baseline)
   * - `telemetryActivityCount`: Real PostgreSQL live event total calculated directly from operational & audit tables:
   *     `hq_audit_logs`, `hq_dispatches`, `hq_dispatch_replies`, `ministry_directives`, `directive_acknowledgements`,
   *     `lesson_notes`, `daily_attendance`, `student_enrollments`.
   * 
   * ZERO SYNTHETIC METRICS INVARIANT:
   * No hardcoded artificial offsets, random noise generation, or client-side synthetic simulations.
   */
  async getOverview(): Promise<StatewideOverview> {
    const lgaAggRes = await query<{
      lga_count: string;
      total_schools: string;
      total_students: string;
      total_teachers: string;
      total_subvention: string;
      avg_pass_rate: string;
    }>(`
      SELECT 
        COUNT(*)::text AS lga_count,
        COALESCE(SUM(total_government_schools), 0)::text AS total_schools,
        COALESCE(SUM(total_student_population), 0)::text AS total_students,
        COALESCE(SUM(total_teacher_count), 0)::text AS total_teachers,
        COALESCE(SUM(subvention_disbursed_naira), 0)::text AS total_subvention,
        COALESCE(AVG(average_pass_rate), 0)::text AS avg_pass_rate
      FROM lga_metadata;
    `);

    // Authoritative event activity count directly from database activity logs - 100% PostgreSQL derived
    const activityRes = await query<{ activity_count: string }>(`
      SELECT (
        COALESCE((SELECT COUNT(*) FROM hq_audit_logs), 0) +
        COALESCE((SELECT COUNT(*) FROM hq_dispatches), 0) +
        COALESCE((SELECT COUNT(*) FROM hq_dispatch_replies), 0) +
        COALESCE((SELECT COUNT(*) FROM ministry_directives), 0) +
        COALESCE((SELECT COUNT(*) FROM directive_acknowledgements), 0) +
        COALESCE((SELECT COUNT(*) FROM lesson_notes), 0) +
        COALESCE((SELECT COUNT(*) FROM daily_attendance), 0) +
        COALESCE((SELECT COUNT(*) FROM student_enrollments), 0)
      )::text AS activity_count;
    `);

    const row = lgaAggRes.rows[0];
    const activityCount = parseInt(activityRes.rows[0]?.activity_count || '0', 10);

    return {
      totalSchools: parseInt(row?.total_schools || '0', 10),
      totalStudents: parseInt(row?.total_students || '0', 10),
      totalTeachers: parseInt(row?.total_teachers || '0', 10),
      subventionDisbursedNaira: parseFloat(row?.total_subvention || '0'),
      averagePassRate: Math.round(parseFloat(row?.avg_pass_rate || '0') * 10) / 10,
      telemetryActivityCount: activityCount,
      lastSyncTime: new Date().toISOString(),
      lgaCount: parseInt(row?.lga_count || '23', 10),
      totalLGAs: parseInt(row?.lga_count || '23', 10),
    };
  }

  /**
   * Retrieves school details along with performance KPIs
   */
  async getSchoolDetailsWithKpis(schoolId: string): Promise<{ school: any; kpis: SchoolKpiSummary } | null> {
    const schoolRes = await query(`
      SELECT id, name, code, lga, senatorial_zone, category, principal_name, phone, email, is_active
      FROM schools
      WHERE id = $1;
    `, [schoolId]);

    if (schoolRes.rows.length === 0) {
      return null;
    }

    const kpis = await this.getSchoolKpis(schoolId);
    return {
      school: schoolRes.rows[0],
      kpis,
    };
  }

  /**
   * Retrieves all 23 LGAs metadata ordered alphabetically
   */
  async getAllLgas(): Promise<LgaMetadataRecord[]> {
    const res = await query<LgaMetadataRecord>(`
      SELECT * FROM lga_metadata ORDER BY lga ASC;
    `);
    return res.rows;
  }

  /**
   * Retrieves single LGA metadata and all registered schools in that LGA
   */
  async getLgaDetails(lgaName: string): Promise<{ lga: LgaMetadataRecord | null; schools: any[] }> {
    const lgaRes = await query<LgaMetadataRecord>(`
      SELECT * FROM lga_metadata WHERE LOWER(lga) = LOWER($1) LIMIT 1;
    `, [lgaName]);

    if (lgaRes.rows.length === 0) {
      return { lga: null, schools: [] };
    }

    const schoolsRes = await query(`
      SELECT id, name, code, lga, senatorial_zone, category, principal_name, phone, email, is_active
      FROM schools
      WHERE LOWER(lga) = LOWER($1)
      ORDER BY name ASC;
    `, [lgaName]);

    return {
      lga: lgaRes.rows[0],
      schools: schoolsRes.rows,
    };
  }

  /**
   * Retrieves school performance KPIs from database
   */
  async getSchoolKpis(schoolId: string): Promise<SchoolKpiSummary> {
    const teacherKpiRes = await query(`
      SELECT * FROM teacher_performance_kpis WHERE school_id = $1 ORDER BY created_at DESC LIMIT 1;
    `, [schoolId]);

    const studentKpiRes = await query(`
      SELECT * FROM student_performance_kpis WHERE school_id = $1 ORDER BY created_at DESC LIMIT 1;
    `, [schoolId]);

    const inspectionRes = await query(`
      SELECT * FROM inspection_reports WHERE school_id = $1 ORDER BY inspection_date DESC LIMIT 5;
    `, [schoolId]);

    const reviewRes = await query(`
      SELECT * FROM governing_body_reviews WHERE school_id = $1 ORDER BY review_date DESC LIMIT 1;
    `, [schoolId]);

    const liveStatsRes = await query<{
      student_count: string;
      staff_count: string;
      lesson_notes_count: string;
      attendance_records_count: string;
    }>(`
      SELECT
        (SELECT COUNT(*)::text FROM students WHERE school_id = $1) AS student_count,
        (SELECT COUNT(*)::text FROM staff WHERE school_id = $1) AS staff_count,
        (SELECT COUNT(*)::text FROM lesson_notes WHERE school_id = $1) AS lesson_notes_count,
        (SELECT COUNT(*)::text FROM daily_attendance WHERE school_id = $1) AS attendance_records_count;
    `, [schoolId]);

    const liveStats = liveStatsRes.rows[0];

    return {
      schoolId,
      teacherKPIs: teacherKpiRes.rows[0] || null,
      studentKPIs: studentKpiRes.rows[0] || null,
      inspectionReports: inspectionRes.rows,
      governingBodyReview: reviewRes.rows[0] || null,
      liveStats: {
        enrolledStudents: parseInt(liveStats?.student_count || '0', 10),
        activeStaff: parseInt(liveStats?.staff_count || '0', 10),
        publishedLessonNotes: parseInt(liveStats?.lesson_notes_count || '0', 10),
        recordedAttendanceLogs: parseInt(liveStats?.attendance_records_count || '0', 10),
      },
    };
  }

  /**
   * Disburses or updates state subvention / grant for a school with immutable audit logging
   */
  async disburseSubvention(
    schoolId: string,
    grantAmount: number,
    grantType: string,
    purpose: string,
    user: SafeUser,
    ipAddress?: string
  ): Promise<{ success: boolean; updatedSubvention: number }> {
    return withTransaction(async (client) => {
      // 1. Fetch school info to identify LGA
      const schoolRes = await client.query<{ id: string; name: string; lga: string; organization_id: string }>(`
        SELECT id, name, lga, organization_id FROM schools WHERE id = $1 LIMIT 1;
      `, [schoolId]);

      if (schoolRes.rows.length === 0) {
        throw new Error('School not found.');
      }

      const school = schoolRes.rows[0];

      // 2. Increment LGA subvention in lga_metadata
      const lgaUpdateRes = await client.query<{ subvention_disbursed_naira: string }>(`
        UPDATE lga_metadata
        SET 
          subvention_disbursed_naira = subvention_disbursed_naira + $1,
          updated_at = NOW()
        WHERE LOWER(lga) = LOWER($2)
        RETURNING subvention_disbursed_naira;
      `, [grantAmount, school.lga]);

      // 3. Record audit log
      await client.query(`
        INSERT INTO hq_audit_logs (
          organization_id, school_id, user_id, user_name, user_role,
          action, resource_id, resource_type, details, ip_address
        ) VALUES (
          $1, $2, $3, $4, $5,
          'SUBVENTION_DISBURSED', $2, 'SCHOOL', $6, $7
        );
      `, [
        school.organization_id || null,
        school.id,
        user.id,
        user.fullName,
        user.role,
        JSON.stringify({
          schoolName: school.name,
          lga: school.lga,
          grantAmount,
          grantType,
          purpose,
        }),
        ipAddress || null,
      ]);

      const updatedVal = parseFloat(lgaUpdateRes.rows[0]?.subvention_disbursed_naira || '0');
      return { success: true, updatedSubvention: updatedVal };
    });
  }

  /**
   * Retrieves audit logs scoped by role and school boundary
   */
  async getAuditLogs(user: SafeUser, limit: number = 50): Promise<any[]> {
    const isHq = user.role === 'super_admin' || user.role === 'state_officer';
    if (isHq) {
      const res = await query(`
        SELECT * FROM hq_audit_logs ORDER BY created_at DESC LIMIT $1;
      `, [limit]);
      return res.rows;
    } else {
      if (!user.schoolId) return [];
      const res = await query(`
        SELECT * FROM hq_audit_logs WHERE school_id = $1 ORDER BY created_at DESC LIMIT $2;
      `, [user.schoolId, limit]);
      return res.rows;
    }
  }
}

export const hqTelemetryRepository = new HqTelemetryRepository();
