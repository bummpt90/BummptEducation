import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { BummptechLogo } from '../components/BummptechLogo';
import { NavigationPage } from '../types';

interface PrivacyTermsPageProps {
  initialTab?: 'privacy' | 'terms';
  onNavigate?: (page: NavigationPage, subTab?: string, param?: any) => void;
}

export const PrivacyTermsPage: React.FC<PrivacyTermsPageProps> = ({ 
  initialTab = 'privacy',
  onNavigate 
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const navigateTo = (page: NavigationPage, subTab?: string, param?: any) => {
    if (onNavigate) {
      onNavigate(page, subTab, param);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8" id="privacy-terms-root">
      {/* Title */}
      <div className="text-center space-y-2 border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Institutional Legal & Compliance Policies</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Privacy Policy & Terms of Service
        </h1>
        <p className="text-xs text-slate-600">
          BummptEducation compliance framework for student educational records and digital school data security.
        </p>

        {/* Tab switch */}
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setTab('privacy')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'privacy' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('terms')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              tab === 'terms' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Terms of Service
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 sm:p-10 border border-slate-200 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
        {tab === 'privacy' ? (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">BummptEducation Student Data Privacy Policy</h2>
            <p>
              This Privacy Policy explains how <strong>BummptEducation</strong>, developed and operated by <strong>Bummptech Global Concepts</strong>, collects, processes, and protects personal and academic information for secondary school students, parents/guardians, and teaching faculty.
            </p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">1. Scope of Data Collected</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Student Bio-Data:</strong> Full names, admission numbers, dates of birth, state of origin, gender, and school house allocations.</li>
              <li><strong>Academic Records:</strong> Continuous assessments (40%), terminal exam scores (60%), WAEC/NECO grades, examination metrics (including SAT, Cambridge IGCSE & JAMB UTME), class positions, teacher remarks, and psychomotor behavioral ratings.</li>
              <li><strong>Financial Transactions:</strong> Bursary fee schedules, payment receipts, bank transfer confirmation codes, and fee clearance logs.</li>
              <li><strong>Guardian Details:</strong> Contact phone numbers, email addresses, and residential location in Makurdi/Benue State.</li>
            </ul>

            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Confidentiality & Exam Integrity</h3>
            <p>
              Academic marks and terminal report cards are strictly confidential. Only authorized Form Tutors, Examination Officers, the Vice-Principal, the Principal, and verified parents/guardians are granted access to individual score matrices.
            </p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">3. Data Protection & Security</h3>
            <p>
              All academic databases, scoresheets, and payment records are encrypted at rest and in transit. Bummptech Global Concepts employs strict role-based access control (RBAC) to ensure unauthorized tampering of student results is prevented.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">BummptEducation Portal Terms of Service</h2>
            <p>
              By accessing the <strong>BummptEducation</strong> platform, secondary school staff, students, parents, and examination personnel agree to adhere to the following institutional standards:
            </p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">1. Academic Honesty & Score Integrity</h3>
            <p>
              All scores entered into the Continuous Assessment (40%) and Examination (60%) fields must represent genuine, audited classroom performance. Any attempt to artificially manipulate grades or fabricate scores is subject to disciplinary action by the Board of Governors.
            </p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">2. Bursary & Fee Clearance Protocols</h3>
            <p>
              Official examination admission cards and terminal report sheets are issued upon complete fee payment reconciliation by the School Bursar. Generated e-receipts must contain valid transaction references.
            </p>

            <h3 className="text-sm font-bold text-slate-900 pt-2">3. Intellectual Property</h3>
            <p>
              The BummptEducation platform, including the underlying algorithms, interface designs, brand identity ("BI Innovate & Create"), and software codebase, is the exclusive intellectual property of <strong>Bummptech Global Concepts</strong>, led by CEO Matthew Ternenge Beeun.
            </p>
          </div>
        )}

        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => navigateTo('home')}
            className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            ← Return to Home Overview
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('docs')}
              className="text-slate-600 font-medium hover:text-blue-600 cursor-pointer"
            >
              Operating Manual
            </button>
            <span>•</span>
            <button
              onClick={() => navigateTo('contact')}
              className="text-slate-600 font-medium hover:text-blue-600 cursor-pointer"
            >
              Contact Legal Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
