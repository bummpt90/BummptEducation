/**
 * BummptEducation — Term Calendar Reference & Attendance Utility Engine
 * 
 * REFERENCE DATA & UTILITIES ONLY:
 * - TERM_CALENDAR_DAYS: Statutory 13-week term calendar reference.
 * - computeStudentAttendanceSummary & computeClassSessionSummary: Pure calculation utilities.
 * 
 * ARCHITECTURAL INVARIANT:
 * - Structural class definitions are isolated in `src/data/reference/classDefinitions.ts`.
 * - Zero operational student attendance records or staff records may be manufactured or stored here.
 * - Live operational attendance is strictly fetched from and persisted to PostgreSQL.
 */

import { 
  ClassLevel, 
  Term, 
  AcademicYear, 
  Student, 
  DailyAttendanceEntry, 
  TermCalendarDay, 
  StudentAttendanceSummary, 
  ClassAttendanceSessionSummary 
} from '../types';

// ==================== 13-WEEK TERM CALENDAR ENGINE ====================
// Term 2 (2025/2026 Academic Session):
// School Resumes / Open Date: Monday, January 5, 2026
// School Closes / Vacation Date: Friday, April 3, 2026
// Total Statutory School Days: 65 Days (13 Weeks x 5 Days per week, Mon - Fri)
export const TERM_OPEN_DATE = '2026-01-05';
export const TERM_CLOSE_DATE = '2026-04-03';
export const TOTAL_STATUTORY_SCHOOL_DAYS = 65;
export const CURRENT_DEFAULT_SCHOOL_DAY = 48; // Day 48 of 65 (Week 10 - Wednesday, March 11, 2026)

export function generate13WeekTermCalendar(_term: Term = '2nd Term', _academicYear: AcademicYear = '2025/2026'): TermCalendarDay[] {
  const days: TermCalendarDay[] = [];
  const startDate = new Date(2026, 0, 5); // Jan 5, 2026 (Monday)

  let dayCount = 0;
  const currentDate = new Date(startDate);

  // Generate 13 weeks (65 school weekdays)
  for (let week = 1; week <= 13; week++) {
    for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
      dayCount++;
      const dateStr = currentDate.toISOString().split('T')[0];
      const weekdayNames: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
      ];
      const dayName = weekdayNames[dayIndex];

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedLabel = `${dayName.substring(0, 3)}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

      // Check for mid-term break (e.g. Week 7 Thursday & Friday)
      const isMidTerm = week === 7 && (dayIndex === 3 || dayIndex === 4);
      // Check for public holidays (e.g. Armed Forces Remembrance Jan 15)
      const isHoliday = dateStr === '2026-01-15';
      const holidayName = isHoliday ? 'Armed Forces Remembrance Day' : isMidTerm ? '2nd Term Mid-Term Break' : undefined;

      days.push({
        date: dateStr,
        weekNumber: week,
        dayOfWeek: dayName,
        dayNumberInTerm: dayCount,
        isSchoolDay: !isHoliday && !isMidTerm,
        isHoliday,
        holidayName,
        isMidTermBreak: isMidTerm,
        label: formattedLabel
      });

      // Move to next calendar day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    // Skip weekend (Saturday & Sunday)
    currentDate.setDate(currentDate.getDate() + 2);
  }

  return days;
}

// Global cached calendar
export const TERM_CALENDAR_DAYS = generate13WeekTermCalendar('2nd Term', '2025/2026');

// ==================== STORAGE & PERSISTENCE ENGINE ====================
/**
 * Authoritative attendance persistence is strictly handled via PostgreSQL / REST API.
 * LocalStorage storage of attendance records is prohibited (Zero-Mock mandate).
 */
export function getStoredAttendanceRecords(
  _classLevel: ClassLevel,
  _term: Term = '2nd Term',
  _academicYear: AcademicYear = '2025/2026',
  _students: Student[]
): Record<string, Record<string, DailyAttendanceEntry>> {
  // Operational attendance is strictly fetched from PostgreSQL via useData() -> fetchClassAttendance()
  return {};
}

export function saveStoredAttendanceRecords(
  _classLevel: ClassLevel,
  _term: Term = '2nd Term',
  _academicYear: AcademicYear = '2025/2026',
  _records: Record<string, Record<string, DailyAttendanceEntry>>
): void {
  // No-op: LocalStorage persistence of business data is strictly prohibited.
}

// ==================== ATTENDANCE COMPUTATIONS & TOTALS ====================
export function computeStudentAttendanceSummary(
  student: Student,
  records: Record<string, Record<string, DailyAttendanceEntry>>,
  calendarDays: TermCalendarDay[] = TERM_CALENDAR_DAYS,
  upToDayNumber: number = CURRENT_DEFAULT_SCHOOL_DAY
): StudentAttendanceSummary {
  const eligibleSchoolDays = calendarDays.filter(
    d => d.dayNumberInTerm <= upToDayNumber && d.isSchoolDay
  );
  const totalDaysOpened = eligibleSchoolDays.length;

  let recordedDays = 0;
  let timesPresent = 0;
  let timesAbsent = 0;
  let timesLate = 0;
  let timesExcused = 0;
  let unexcusedAbsences = 0;
  let streak = 0;
  let consecutivePresent = 0;

  // Process chronologically to compute streak
  eligibleSchoolDays.forEach(day => {
    const dayEntry = records[day.date]?.[student.id];
    if (!dayEntry) return;

    recordedDays++;
    const status = dayEntry.status;

    if (status === 'present') {
      timesPresent++;
      consecutivePresent++;
    } else if (status === 'late') {
      timesPresent++; // Late counts as present in Nigerian education standards
      timesLate++;
      consecutivePresent++;
    } else if (status === 'excused') {
      timesExcused++;
      consecutivePresent = 0;
    } else if (status === 'absent') {
      timesAbsent++;
      unexcusedAbsences++;
      consecutivePresent = 0;
    }
  });

  streak = consecutivePresent;

  const denominator = recordedDays > 0 ? recordedDays : 1;
  const attendancePercentage = recordedDays > 0 
    ? Math.round(((timesPresent + (timesLate * 0.8)) / denominator) * 100)
    : 100;

  const punctualityScore = recordedDays > 0
    ? Math.round(((timesPresent - timesLate) / Math.max(1, timesPresent)) * 100)
    : 100;

  let ratingStatus: 'Outstanding' | 'Satisfactory' | 'Needs Improvement' | 'Critical Warning' = 'Outstanding';
  if (attendancePercentage >= 95) {
    ratingStatus = 'Outstanding';
  } else if (attendancePercentage >= 85) {
    ratingStatus = 'Satisfactory';
  } else if (attendancePercentage >= 75) {
    ratingStatus = 'Needs Improvement';
  } else {
    ratingStatus = 'Critical Warning';
  }

  return {
    studentId: student.id,
    studentName: student.fullName,
    admissionNumber: student.admissionNumber,
    gender: student.gender,
    currentClass: student.currentClass,
    house: student.house,
    timesSchoolOpened: totalDaysOpened,
    timesPresent,
    timesAbsent,
    timesLate,
    timesExcused,
    attendancePercentage: Math.min(100, Math.max(0, attendancePercentage)),
    punctualityScore: Math.min(100, Math.max(0, punctualityScore)),
    consecutivePresentStreak: streak,
    status: ratingStatus,
    unexcusedAbsences
  };
}

export function computeClassSessionSummary(
  classLevel: ClassLevel,
  term: Term = '2nd Term',
  academicYear: AcademicYear = '2025/2026',
  selectedDate: string,
  records: Record<string, Record<string, DailyAttendanceEntry>>,
  students: Student[],
  calendarDays: TermCalendarDay[] = TERM_CALENDAR_DAYS
): ClassAttendanceSessionSummary {
  const currentDayMeta = calendarDays.find(d => d.date === selectedDate) || calendarDays[CURRENT_DEFAULT_SCHOOL_DAY - 1];

  const totalEnrolled = students.length;
  const dayRecords = records[selectedDate] || {};

  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;
  let excusedToday = 0;

  students.forEach(s => {
    const entry = dayRecords[s.id];
    if (!entry) return;
    const status = entry.status;
    if (status === 'present') presentToday++;
    else if (status === 'absent') absentToday++;
    else if (status === 'late') lateToday++;
    else if (status === 'excused') excusedToday++;
  });

  const totalMarkedToday = presentToday + absentToday + lateToday + excusedToday;
  const todayEffectivePresent = presentToday + lateToday;
  const todayAttendanceRate = totalMarkedToday > 0 
    ? Math.round((todayEffectivePresent / totalMarkedToday) * 100)
    : (totalEnrolled > 0 ? 0 : 100);

  // Compute all student summaries up to selected date's day number
  const studentSummaries = students.map(s => 
    computeStudentAttendanceSummary(s, records, calendarDays, currentDayMeta.dayNumberInTerm)
  );

  const avgCumulativeRate = studentSummaries.length > 0
    ? Math.round(studentSummaries.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentSummaries.length)
    : 100;

  const boys = studentSummaries.filter(s => s.gender === 'Male');
  const girls = studentSummaries.filter(s => s.gender === 'Female');

  const boysRate = boys.length > 0
    ? Math.round(boys.reduce((acc, s) => acc + s.attendancePercentage, 0) / boys.length)
    : 100;

  const girlsRate = girls.length > 0
    ? Math.round(girls.reduce((acc, s) => acc + s.attendancePercentage, 0) / girls.length)
    : 100;

  const daysElapsed = currentDayMeta.dayNumberInTerm;
  const daysRemaining = Math.max(0, TOTAL_STATUTORY_SCHOOL_DAYS - daysElapsed);

  return {
    classLevel,
    term,
    academicYear,
    termOpenDate: TERM_OPEN_DATE,
    termCloseDate: TERM_CLOSE_DATE,
    statutoryDaysOpened: TOTAL_STATUTORY_SCHOOL_DAYS,
    daysElapsed,
    daysRemaining,
    selectedDate,
    selectedWeek: currentDayMeta.weekNumber,
    totalEnrolledStudents: totalEnrolled,
    presentToday,
    absentToday,
    lateToday,
    excusedToday,
    todayAttendanceRate,
    cumulativeClassAttendanceRate: avgCumulativeRate,
    boysAttendanceRate: boysRate,
    girlsAttendanceRate: girlsRate,
  };
}
