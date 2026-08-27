import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AcademicDashboard } from './pages/AcademicDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrganogramPage } from './pages/OrganogramPage';
import { AboutMePage } from './pages/AboutMePage';
import { ContactPage } from './pages/ContactPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { PrivacyTermsPage } from './pages/PrivacyTermsPage';
import { EarlyChildhoodPage } from './pages/EarlyChildhoodPage';
import { PrimarySchoolPage } from './pages/PrimarySchoolPage';
import { SecondaryCollegePage } from './pages/SecondaryCollegePage';
import { StudentLeadershipPage } from './pages/StudentLeadershipPage';
import { LessonNotesPage } from './pages/LessonNotesPage';
import { ReportCardModal } from './components/ReportCardModal';
import { FeeReceiptModal } from './components/FeeReceiptModal';
import { AiRemarkModal } from './components/AiRemarkModal';
import { 
  INITIAL_STUDENTS, 
  INITIAL_SUBJECTS, 
  INITIAL_ASSESSMENTS, 
  INITIAL_PAYMENTS 
} from './data/mockData';
import { 
  NavigationPage, 
  UserRole, 
  Student, 
  StudentReportCard, 
  FeePayment,
  ClassLevel
} from './types';

export function App() {
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [activeParam, setActiveParam] = useState<any>(undefined);
  const [userRole, setUserRole] = useState<UserRole>('principal');

  // Modals state
  const [reportCardModalData, setReportCardModalData] = useState<{
    student: Student;
    reportCard: StudentReportCard;
  } | null>(null);

  const [receiptModalData, setReceiptModalData] = useState<{
    payment: FeePayment;
    student?: Student;
  } | null>(null);

  const [aiRemarkModalData, setAiRemarkModalData] = useState<{
    student: Student;
    reportCard: StudentReportCard;
  } | null>(null);

  const handleNavigate = (page: NavigationPage, subTab?: string, param?: any) => {
    setActivePage(page);
    setActiveSubTab(subTab);
    setActiveParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReportCard = (student: Student, reportCard: StudentReportCard) => {
    setReportCardModalData({ student, reportCard });
  };

  const handleOpenReceipt = (payment: FeePayment, student?: Student) => {
    setReceiptModalData({ payment, student });
  };

  const handleOpenAiRemark = (student: Student, reportCard: StudentReportCard) => {
    setAiRemarkModalData({ student, reportCard });
  };

  const handleApplyAiRemarks = (formTutorRemark: string, principalRemark: string) => {
    if (reportCardModalData) {
      setReportCardModalData({
        ...reportCardModalData,
        reportCard: {
          ...reportCardModalData.reportCard,
          formTutorRemark,
          principalRemark,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white" id="bummpt-education-app">
      {/* Global Navigation Header */}
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        userRole={userRole}
        onRoleChange={setUserRole}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            students={INITIAL_STUDENTS}
            assessments={INITIAL_ASSESSMENTS}
            onOpenReportCardModal={handleOpenReportCard}
          />
        )}

        {activePage === 'academic' && (
          <AcademicDashboard
            key={`academic-${activeSubTab || 'default'}-${activeParam || ''}`}
            students={INITIAL_STUDENTS}
            subjects={INITIAL_SUBJECTS}
            assessments={INITIAL_ASSESSMENTS}
            initialTab={activeSubTab as any}
            initialClass={activeParam as ClassLevel}
            onNavigate={handleNavigate}
            onOpenReportCardModal={handleOpenReportCard}
            onOpenAiRemarkModal={handleOpenAiRemark}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboard
            key={`admin-${activeSubTab || 'default'}`}
            students={INITIAL_STUDENTS}
            initialTab={activeSubTab as any}
            onNavigate={handleNavigate}
            onOpenReceiptModal={handleOpenReceipt}
          />
        )}

        {activePage === 'organogram' && (
          <OrganogramPage
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'kindergarten-arm' && (
          <EarlyChildhoodPage
            onNavigate={handleNavigate}
            onOpenReportCardModal={handleOpenReportCard}
          />
        )}

        {activePage === 'primary-arm' && (
          <PrimarySchoolPage
            onNavigate={handleNavigate}
            onOpenReportCardModal={handleOpenReportCard}
          />
        )}

        {activePage === 'secondary-arm' && (
          <SecondaryCollegePage
            onNavigate={handleNavigate}
            onOpenReportCardModal={handleOpenReportCard}
          />
        )}

        {activePage === 'student-leadership' && (
          <StudentLeadershipPage
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'lesson-notes' && (
          <LessonNotesPage
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'about' && <AboutMePage />}

        {activePage === 'contact' && <ContactPage />}

        {activePage === 'docs' && <DocumentationPage />}

        {activePage === 'privacy' && <PrivacyTermsPage />}
      </main>

      {/* Global Interactive Modals */}
      {reportCardModalData && (
        <ReportCardModal
          isOpen={true}
          onClose={() => setReportCardModalData(null)}
          student={reportCardModalData.student}
          reportCard={reportCardModalData.reportCard}
          onOpenAiRemarkModal={() => {
            setAiRemarkModalData({
              student: reportCardModalData.student,
              reportCard: reportCardModalData.reportCard,
            });
          }}
        />
      )}

      {receiptModalData && (
        <FeeReceiptModal
          isOpen={true}
          onClose={() => setReceiptModalData(null)}
          payment={receiptModalData.payment}
          student={receiptModalData.student}
        />
      )}

      {aiRemarkModalData && (
        <AiRemarkModal
          isOpen={true}
          onClose={() => setAiRemarkModalData(null)}
          student={aiRemarkModalData.student}
          reportCard={aiRemarkModalData.reportCard}
          onApplyRemarks={handleApplyAiRemarks}
        />
      )}

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default App;
