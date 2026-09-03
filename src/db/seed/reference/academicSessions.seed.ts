/**
 * BummptEducation — Academic Sessions & Terms Seeder
 * 
 * Populates:
 * - Authoritative Academic Sessions: '2024/2025', '2025/2026' (Current), '2026/2027'
 * - Statutory Academic Terms for 2025/2026:
 *   - '1st Term' (Resumption: 2025-09-08, Vacation: 2025-12-12, 65 statutory days)
 *   - '2nd Term' (Current, Resumption: 2026-01-05, Vacation: 2026-04-03, 65 statutory days)
 *   - '3rd Term' (Resumption: 2026-04-27, Vacation: 2026-07-24, 65 statutory days)
 * 
 * Idempotent: ON CONFLICT (session_name) / ON CONFLICT (session_id, term_name)
 */

import type { PoolClient } from 'pg';
import type { SeedResultSummary } from './organizations.seed';

export interface AcademicCalendarSeedData {
  sessions: {
    sessionName: string;
    isCurrent: boolean;
    startDate: string;
    endDate: string;
    terms?: {
      termName: '1st Term' | '2nd Term' | '3rd Term';
      isCurrent: boolean;
      resumptionDate: string;
      vacationDate: string;
      statutoryDays: number;
      nextTermResumption: string;
    }[];
  }[];
}

export const ACADEMIC_CALENDAR_DATA: AcademicCalendarSeedData = {
  sessions: [
    {
      sessionName: '2024/2025',
      isCurrent: false,
      startDate: '2024-09-09',
      endDate: '2025-07-25',
      terms: [
        { termName: '1st Term', isCurrent: false, resumptionDate: '2024-09-09', vacationDate: '2024-12-13', statutoryDays: 65, nextTermResumption: '2025-01-06' },
        { termName: '2nd Term', isCurrent: false, resumptionDate: '2025-01-06', vacationDate: '2025-04-04', statutoryDays: 65, nextTermResumption: '2025-04-28' },
        { termName: '3rd Term', isCurrent: false, resumptionDate: '2025-04-28', vacationDate: '2025-07-25', statutoryDays: 65, nextTermResumption: '2025-09-08' },
      ],
    },
    {
      sessionName: '2025/2026',
      isCurrent: true,
      startDate: '2025-09-08',
      endDate: '2026-07-24',
      terms: [
        { termName: '1st Term', isCurrent: false, resumptionDate: '2025-09-08', vacationDate: '2025-12-12', statutoryDays: 65, nextTermResumption: '2026-01-05' },
        { termName: '2nd Term', isCurrent: true, resumptionDate: '2026-01-05', vacationDate: '2026-04-03', statutoryDays: 65, nextTermResumption: '2026-04-27' },
        { termName: '3rd Term', isCurrent: false, resumptionDate: '2026-04-27', vacationDate: '2026-07-24', statutoryDays: 65, nextTermResumption: '2026-09-07' },
      ],
    },
    {
      sessionName: '2026/2027',
      isCurrent: false,
      startDate: '2026-09-07',
      endDate: '2027-07-23',
      terms: [
        { termName: '1st Term', isCurrent: false, resumptionDate: '2026-09-07', vacationDate: '2026-12-11', statutoryDays: 65, nextTermResumption: '2027-01-04' },
        { termName: '2nd Term', isCurrent: false, resumptionDate: '2027-01-04', vacationDate: '2027-04-02', statutoryDays: 65, nextTermResumption: '2027-04-26' },
        { termName: '3rd Term', isCurrent: false, resumptionDate: '2027-04-26', vacationDate: '2027-07-23', statutoryDays: 65, nextTermResumption: '2027-09-06' },
      ],
    },
  ],
};

export async function seedAcademicSessionsAndTerms(client: PoolClient): Promise<{
  sessions: SeedResultSummary;
  terms: SeedResultSummary;
  currentSessionId: string;
  currentTermId: string;
}> {
  let sessionsInserted = 0;
  let sessionsUpdated = 0;
  let termsInserted = 0;
  let termsUpdated = 0;

  let currentSessionId = '';
  let currentTermId = '';

  for (const session of ACADEMIC_CALENDAR_DATA.sessions) {
    const sRes = await client.query<{ id: string; is_inserted: boolean }>(
      `INSERT INTO academic_sessions (session_name, is_current, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_name) DO UPDATE SET
         is_current = EXCLUDED.is_current,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         updated_at = NOW()
       RETURNING id, (xmax = 0) AS is_inserted;`,
      [session.sessionName, session.isCurrent, session.startDate, session.endDate]
    );

    const sessionId = sRes.rows[0].id;
    if ((sRes.rows[0] as any).is_inserted) {
      sessionsInserted++;
    } else {
      sessionsUpdated++;
    }

    if (session.isCurrent) {
      currentSessionId = sessionId;
    }

    if (session.terms && session.terms.length > 0) {
      for (const term of session.terms) {
        const tRes = await client.query<{ id: string; is_inserted: boolean }>(
          `INSERT INTO academic_terms (
             session_id, term_name, is_current, resumption_date,
             vacation_date, statutory_school_days, next_term_resumption
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (session_id, term_name) DO UPDATE SET
             is_current = EXCLUDED.is_current,
             resumption_date = EXCLUDED.resumption_date,
             vacation_date = EXCLUDED.vacation_date,
             statutory_school_days = EXCLUDED.statutory_school_days,
             next_term_resumption = EXCLUDED.next_term_resumption,
             updated_at = NOW()
           RETURNING id, (xmax = 0) AS is_inserted;`,
          [
            sessionId,
            term.termName,
            term.isCurrent,
            term.resumptionDate,
            term.vacationDate,
            term.statutoryDays,
            term.nextTermResumption,
          ]
        );

        if ((tRes.rows[0] as any).is_inserted) {
          termsInserted++;
        } else {
          termsUpdated++;
        }

        if (session.isCurrent && term.isCurrent) {
          currentTermId = tRes.rows[0].id;
        }
      }
    }
  }

  return {
    sessions: {
      inserted: sessionsInserted,
      updated: sessionsUpdated,
      total: ACADEMIC_CALENDAR_DATA.sessions.length,
    },
    terms: {
      inserted: termsInserted,
      updated: termsUpdated,
      total: ACADEMIC_CALENDAR_DATA.sessions.reduce((acc, s) => acc + (s.terms?.length || 0), 0),
    },
    currentSessionId,
    currentTermId,
  };
}
