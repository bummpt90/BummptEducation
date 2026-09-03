import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AcademicDashboard } from './pages/AcademicDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { OrganogramPage } from './pages/OrganogramPage';
import { AboutMePage } from './pages/AboutMePage';
import { ContactPage } from './pages/ContactPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { DeveloperDocsPage } from './pages/DeveloperDocsPage';
import { PrivacyTermsPage } from './pages/PrivacyTermsPage';
import { EarlyChildhoodPage } from './pages/EarlyChildhoodPage';
import { PrimarySchoolPage } from './pages/PrimarySchoolPage';
import { SecondaryCollegePage } from './pages/SecondaryCollegePage';
import { StudentLeadershipPage } from './pages/StudentLeadershipPage';
import { LessonNotesPage } from './pages/LessonNotesPage';
import { BenueStateHQPage } from './pages/BenueStateHQPage';
import { AttendancePage } from './pages/AttendancePage';
import { AuthenticationGateway } from './pages/AuthenticationGateway';
import { ReportCardModal } from './components/ReportCardModal';
import { FeeReceiptModal } from './components/FeeReceiptModal';
import { AiRemarkModal } from './components/AiRemarkModal';
import { AccessManagementModal } from './components/AccessManagementModal';
import { ParentReportPortalModal } from './components/ParentReportPortalModal';
import { AuthLoginModal } from './components/AuthLoginModal';
import { useAuth } from './context/AuthContext';
import { GraduationCap, ShieldCheck } from 'lucide-react';
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
  ClassLevel,
  Term,
  AcademicYear
} from './types';

export function App() {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);
  const [activeParam, setActiveParam] = useState<any>(undefined);
  const [userRole, setUserRole] = useState<UserRole>('principal');

  // Synchronize userRole with verified server identity
  useEffect(() => {
    if (currentUser?.role) {
      setUserRole(currentUser.role as UserRole);
    }
  }, [currentUser]);

  // Global Academic Context State
  const [academicYear, setAcademicYear] = useState<AcademicYear>('2025/2026');
  const [selectedTerm, setSelectedTerm] = useState<Term>('2nd Term');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>('SSS 2 Science');

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

  const [isGlobalPasskeyModalOpen, setIsGlobalPasskeyModalOpen] = useState(false);
  const [isGlobalParentPortalOpen, setIsGlobalParentPortalOpen] = useState(false);
  const [isGlobalAuthModalOpen, setIsGlobalAuthModalOpen] = useState(false);

  const handleNavigate = (page: NavigationPage, subTab?: string, param?: any) => {
    setActivePage(page);
    setActiveSubTab(subTab);
    setActiveParam(param);

    if (param && typeof param === 'string') {
      const validClasses: ClassLevel[] = [
        'KG 1', 'KG 2', 'KG 3',
        'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
        'JSS 1', 'JSS 2', 'JSS 3',
        'SSS 1 Science', 'SSS 1 Arts', 'SSS 1 Commercial',
        'SSS 2 Science', 'SSS 2 Arts', 'SSS 2 Commercial',
        'SSS 3 Science', 'SSS 3 Arts', 'SSS 3 Commercial'
      ];
      if (validClasses.includes(param as ClassLevel)) {
        setSelectedClass(param as ClassLevel);
      }
    }

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

  // Loading screen during initial session verification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white" id="auth-loading-screen">
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="h-10 w-10 text-blue-400 animate-pulse" />
          <span className="text-2xl font-black tracking-tight text-white">
            Bummpt<span className="text-blue-400">Education</span>
          </span>
        </div>
        <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div className="w-full h-full bg-blue-500 animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Verifying Institutional Clearance & Session...
        </p>
      </div>
    );
  }

  // Authentication Gateway Gatekeeper: Unauthenticated users are directed to the Gateway
  if (!isAuthenticated) {
    return <AuthenticationGateway />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white" id="bummpt-education-app">
      {/* Global Navigation Header */}
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        userRole={userRole}
        onRoleChange={setUserRole}
        academicYear={academicYear}
        onAcademicYearChange={setAcademicYear}
        selectedTerm={selectedTerm}
        onTermChange={setSelectedTerm}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        onOpenSecurityModal={() => setIsGlobalPasskeyModalOpen(true)}
        onOpenParentPortalModal={() => setIsGlobalParentPortalOpen(true)}
        onOpenAuthModal={() => setIsGlobalAuthModalOpen(true)}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            students={INITIAL_STUDENTS}
            assessments={INITIAL_ASSESSMENTS}
            onOpenReportCardModal={handleOpenReportCard}
            onOpenParentPortalModal={() => setIsGlobalParentPortalOpen(true)}
            onOpenSecurityModal={() => setIsGlobalPasskeyModalOpen(true)}
          />
        )}

        {(activePage === 'state-hq' || activePage === 'benue-state-hq') && (
          <BenueStateHQPage
            onNavigate={handleNavigate}
          />
        )}

        {(activePage === 'academic' || activePage === 'attendance') && (
          <AcademicDashboard
            key={`academic-${activeSubTab || (activePage === 'attendance' ? 'attendance' : 'default')}-${activeParam || ''}`}
            students={INITIAL_STUDENTS}
            subjects={INITIAL_SUBJECTS}
            assessments={INITIAL_ASSESSMENTS}
            initialTab={(activePage === 'attendance' ? 'attendance' : activeSubTab) as any}
            initialClass={selectedClass}
            academicYear={academicYear}
            onAcademicYearChange={setAcademicYear}
            selectedTerm={selectedTerm}
            onTermChange={setSelectedTerm}
            selectedClass={selectedClass}
            onClassChange={setSelectedClass}
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

        {activePage === 'docs' && <DocumentationPage onNavigate={handleNavigate} />}

        {(activePage === 'dev-docs' || activePage === 'developer-docs') && (
          <DeveloperDocsPage onNavigate={handleNavigate} />
        )}

        {activePage === 'privacy' && <PrivacyTermsPage />}
      </main>

      {/* Global Interactive Modals */}
      {reportCardModalData && (
        <ReportCardModal
          isOpen={true}
          onClose={() => setReportCardModalData(null)}
          student={reportCardModalData.student}
          reportCard={reportCardModalData.reportCard}
          subjects={INITIAL_SUBJECTS}
          onNavigate={(page, subTab, param) => {
            setReportCardModalData(null);
            handleNavigate(page, subTab, param);
          }}
          onSaveReportCard={(updated) => {
            setReportCardModalData({
              student: reportCardModalData.student,
              reportCard: updated,
            });
          }}
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

      {/* Global Staff Passkeys & Security Authorization Modal */}
      <AccessManagementModal
        isOpen={isGlobalPasskeyModalOpen}
        onClose={() => setIsGlobalPasskeyModalOpen(false)}
      />

      {/* Global Parent Report Card Verification & Download Portal Modal */}
      <ParentReportPortalModal
        isOpen={isGlobalParentPortalOpen}
        onClose={() => setIsGlobalParentPortalOpen(false)}
        onOpenReportCard={(student, reportCard) => {
          setIsGlobalParentPortalOpen(false);
          handleOpenReportCard(student, reportCard);
        }}
      />

      {/* Production Identity & RBAC Authentication Modal */}
      <AuthLoginModal
        isOpen={isGlobalAuthModalOpen}
        onClose={() => setIsGlobalAuthModalOpen(false)}
      />

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default App;
