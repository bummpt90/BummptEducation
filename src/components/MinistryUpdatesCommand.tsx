import React, { useState } from 'react';
import { 
  Building2, 
  Send, 
  FileText, 
  DollarSign, 
  Users, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  Printer, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle, 
  Clock, 
  Check, 
  Landmark,
  Layers,
  ChevronRight,
  Filter,
  Search,
  School
} from 'lucide-react';
import { GovSchool, BenueLGA, SenatorialZone } from '../types';
import { 
  MinistryDirective, 
  getStoredDirectives, 
  saveStoredDirectives 
} from '../data/benueDirectivesData';
import { BENUE_LGAS_METADATA } from '../data/benueStateData';

interface MinistryUpdatesCommandProps {
  activeSchool: GovSchool;
  onUpdateSchoolFinancials: (subventionIncrease: number, grantType: string, purpose: string) => void;
  onDeployTeacher: (subject: string, teacherName: string, qualification: string) => void;
  onUpdateAccreditation: (status: string, remarks: string) => void;
  currentLga: BenueLGA;
  currentZone: SenatorialZone;
  authenticatedStaffName?: string;
  authenticatedStaffRole?: string;
}

export const MinistryUpdatesCommand: React.FC<MinistryUpdatesCommandProps> = ({
  activeSchool,
  onUpdateSchoolFinancials,
  onDeployTeacher,
  onUpdateAccreditation,
  currentLga,
  currentZone,
  authenticatedStaffName = 'Prof. Frederick Ikyaan',
  authenticatedStaffRole = 'Hon. Commissioner for Education'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'broadcast' | 'subvention' | 'teachers' | 'accreditation'>('broadcast');
  const [directives, setDirectives] = useState<MinistryDirective[]>(getStoredDirectives());
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 1. Broadcast Circular Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MinistryDirective['category']>('Academic Calendar');
  const [newPriority, setNewPriority] = useState<MinistryDirective['priority']>('Executive Order');
  const [newAudience, setNewAudience] = useState<MinistryDirective['targetAudience']>('Statewide (All 23 LGAs)');
  const [newContent, setNewContent] = useState('');
  const [newActionRequired, setNewActionRequired] = useState('');
  const [activeSlipDirective, setActiveSlipDirective] = useState<MinistryDirective | null>(null);

  // 2. Subvention Allocation Form State
  const [grantAmount, setGrantAmount] = useState<number>(2000000);
  const [grantType, setGrantType] = useState<string>('STEM Laboratory & Reagents Grant');
  const [grantPurpose, setGrantPurpose] = useState<string>('Procurement of WAEC & NECO science mock reagents and lab glasswares.');

  // 3. Teacher Deployment Form State
  const [deficitSubject, setDeficitSubject] = useState<string>(activeSchool.teacherKPIs.teacherDeficitSubjects[0] || 'Physics');
  const [deployedTeacherName, setDeployedTeacherName] = useState<string>('Mr. David Terhemen Aondo (B.Sc Ed, TRCN)');
  const [deployedQualification, setDeployedQualification] = useState<string>('B.Sc (Ed) Physics • TRCN Certified');

  // 4. Accreditation & Inspection Form State
  const [newAccreditationStatus, setNewAccreditationStatus] = useState<string>(activeSchool.governingBodyReview.accreditationStatus);
  const [inspectionRemarks, setInspectionRemarks] = useState<string>(activeSchool.governingBodyReview.headquarterInspectionRemarks);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Handle Publishing New Directive
  const handlePublishDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please provide a circular title and directive content.');
      return;
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newDirective: MinistryDirective = {
      id: `DIR-MOE-${Date.now()}`,
      referenceNumber: `MOE/HQ/CIR/2026/${randomNum}`,
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      targetAudience: newAudience,
      targetLGA: newAudience === 'Specific LGA / Schools' ? currentLga : undefined,
      targetSchoolName: newAudience === 'Specific LGA / Schools' ? activeSchool.name : undefined,
      issuedBy: authenticatedStaffName,
      issuingOffice: 'Headquarters Command & Executive Secretariat, Makurdi',
      issuedDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      content: newContent.trim(),
      actionRequired: newActionRequired.trim() || 'All school administrators must comply immediately.',
      status: 'Broadcasted & Active'
    };

    const updated = [newDirective, ...directives];
    setDirectives(updated);
    saveStoredDirectives(updated);

    showToast(`State Directive "${newTitle}" successfully broadcasted across Benue State schools!`);
    setNewTitle('');
    setNewContent('');
    setNewActionRequired('');
    setActiveSlipDirective(newDirective);
  };

  // Handle Subvention Release
  const handleDisburseSubvention = (e: React.FormEvent) => {
    e.preventDefault();
    if (grantAmount <= 0) {
      alert('Please enter a valid grant amount.');
      return;
    }

    onUpdateSchoolFinancials(grantAmount, grantType, grantPurpose);
    showToast(`₦${grantAmount.toLocaleString()} ${grantType} approved and credited to ${activeSchool.name}!`);
  };

  // Handle Deploying Teacher
  const handleDeployTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployedTeacherName.trim()) {
      alert('Please enter the name of the deploying teacher.');
      return;
    }

    onDeployTeacher(deficitSubject, deployedTeacherName, deployedQualification);
    showToast(`TRCN Teacher ${deployedTeacherName} successfully posted to ${activeSchool.name} for ${deficitSubject}!`);
  };

  // Handle Accreditation Update
  const handleUpdateAccreditationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccreditation(newAccreditationStatus, inspectionRemarks);
    showToast(`Accreditation rating updated to "${newAccreditationStatus}" for ${activeSchool.name}!`);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in" id="ministry-updates-command-module">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-900 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-xl border border-emerald-500 animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded text-emerald-200">OFFICIAL BENUE MOE DISPATCH</span>
        </div>
      )}

      {/* Header Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-6 rounded-2xl text-white border border-emerald-800/80 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
              EXECUTIVE TWO-WAY COMMAND
            </span>
            <span className="text-xs text-emerald-300 font-medium">Benue State Ministry of Education & SUBEB</span>
          </div>
          <h3 className="text-xl font-black text-white">
            Ministry-to-Schools Interactive Update & Governance Center
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Authorized Headquarters tool to publish statewide circulars, disburse statutory subvention funds, resolve teacher deficits, and update institutional quality assurance ratings for <strong>{activeSchool.name}</strong> ({activeSchool.lga} LGA).
          </p>
        </div>

        <div className="text-right bg-white/10 p-3.5 rounded-xl border border-white/10 shrink-0">
          <div className="text-[10px] text-slate-300 uppercase">Authenticated Official:</div>
          <div className="text-xs font-black text-amber-300 mt-0.5">{authenticatedStaffName}</div>
          <div className="text-[10px] text-emerald-300">{authenticatedStaffRole}</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'broadcast', label: '1. Broadcast State Directives & Circulars', icon: Send, badge: `${directives.length} Circulars` },
          { id: 'subvention', label: '2. Disburse State Subvention & Lab Grants', icon: DollarSign, badge: 'Approved Funds' },
          { id: 'teachers', label: '3. TRCN Teacher Postings & Deficit Remediation', icon: Users, badge: `${activeSchool.teacherKPIs.teacherDeficitSubjects.length} Deficits` },
          { id: 'accreditation', label: '4. School Accreditation & Inspectorate Rating', icon: Award, badge: activeSchool.governingBodyReview.accreditationStatus }
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
                isCurrent
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                isCurrent ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= SECTION 1: BROADCAST STATE DIRECTIVES ================= */}
      {activeSubTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Draft New Directive Form */}
            <form onSubmit={handlePublishDirective} className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  EXECUTIVE DISPATCH DESK
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1">
                  Draft & Broadcast Official State Circular
                </h4>
                <p className="text-xs text-slate-500">
                  Publish ministerial instructions to secondary colleges, technical schools, and primary SUBEB centers across Benue State.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Circular Title / Subject:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mandatory Uniform Terminal Examination Dates & Guidelines..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Academic Calendar">Academic Calendar & Resumption</option>
                    <option value="Examination Standards">Examination & Assessment Standards (40/60)</option>
                    <option value="Teacher Deployment">Teacher Deployment & TRCN Standards</option>
                    <option value="Financial Grant">Financial Grants & Subvention Protocols</option>
                    <option value="Security & Safety">School Security & Disaster Safety</option>
                    <option value="Curriculum & Textbooks">Curriculum Delivery & Textbooks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Level:
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Executive Order">Executive Order (Governor / Commissioner)</option>
                    <option value="Urgent / High Priority">Urgent / High Priority Circular</option>
                    <option value="Routine Circular">Routine Administrative Circular</option>
                    <option value="Statutory Notice">Statutory Regulatory Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Audience / Distribution Scope:
                </label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Statewide (All 23 LGAs)">Statewide (All 23 LGAs & 115+ Colleges)</option>
                  <option value="Zone A (North-East)">Zone A (Benue North-East • Katsina-Ala, Gboko, etc.)</option>
                  <option value="Zone B (North-West)">Zone B (Benue North-West • Makurdi, Gwer, etc.)</option>
                  <option value="Zone C (South)">Zone C (Benue South • Otukpo, Ogbadibo, etc.)</option>
                  <option value="Specific LGA / Schools">Specific to {activeSchool.name} ({currentLga} LGA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Directive Body / Policy Statement:
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter the full ministerial policy instruction, standard guidelines, or executive decision to be enforced..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Immediate Action Required from Principals / Headteachers:
                </label>
                <input
                  type="text"
                  value={newActionRequired}
                  onChange={(e) => setNewActionRequired(e.target.value)}
                  placeholder="e.g. Collate and remit signed score broadsheets to Zonal Inspector within 5 working days."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                id="publish-directive-submit-btn"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Publish & Broadcast State Circular</span>
              </button>
            </form>

            {/* Right Column: Published Circulars Feed */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Active Ministerial Directives & School Circulars ({directives.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Real-time status of circulars dispatched to school portals and zonal inspectorates.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Live Broadcast Active
                </span>
              </div>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {directives.map((dir) => (
                  <div key={dir.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-300 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            dir.priority === 'Executive Order' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            dir.priority === 'Urgent / High Priority' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}>
                            {dir.priority}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {dir.referenceNumber}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {dir.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-slate-900 mt-1.5 leading-snug">
                          {dir.title}
                        </h5>
                      </div>

                      <button
                        onClick={() => setActiveSlipDirective(dir)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer shrink-0 flex items-center gap-1"
                        title="View & Print Official Circular"
                      >
                        <Printer className="h-3 w-3" />
                        <span>Print</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {dir.content}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <span className="font-semibold text-emerald-800">
                        Scope: <strong>{dir.targetAudience}</strong>
                      </span>
                      <span>Issued: {dir.issuedDate}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                        <Check className="h-3 w-3" /> Dispatched to Portals
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Printable Official Circular Slip Modal */}
          {activeSlipDirective && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-slate-300 shadow-2xl space-y-6 text-slate-900">
                {/* Official Crest Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-2">
                    <Landmark className="w-7 h-7 text-emerald-800" />
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                    GOVERNMENT OF BENUE STATE OF NIGERIA
                  </div>
                  <h3 className="text-lg font-black text-slate-950 uppercase">
                    MINISTRY OF EDUCATION, SCIENCE & TECHNOLOGY
                  </h3>
                  <div className="text-xs font-bold text-emerald-800">
                    EXECUTIVE DIRECTIVE & POLICY CIRCULAR
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">
                    REF: {activeSlipDirective.referenceNumber} • DATE: {activeSlipDirective.issuedDate}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div><strong>TITLE:</strong> {activeSlipDirective.title}</div>
                  <div><strong>DISTRIBUTION:</strong> {activeSlipDirective.targetAudience}</div>
                  <div><strong>AUTHORITY:</strong> {activeSlipDirective.issuedBy} ({activeSlipDirective.issuingOffice})</div>
                </div>

                <div className="text-xs text-slate-800 leading-relaxed space-y-3">
                  <p className="font-bold">To: All Zonal Inspectors of Education, College Principals & Headteachers,</p>
                  <p>{activeSlipDirective.content}</p>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 font-semibold">
                    <strong>ACTION REQUIRED:</strong> {activeSlipDirective.actionRequired}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
                  <div>
                    <div className="font-black text-slate-900">{activeSlipDirective.issuedBy}</div>
                    <div className="text-[10px] text-slate-500">Hon. Commissioner / Executive Directorate</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                      OFFICIAL STATE SEAL VERIFIED
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setActiveSlipDirective(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Official Memorandum</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 2: SUBVENTION DISBURSAL & GRANTS ================= */}
      {activeSubTab === 'subvention' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                TREASURY DISBURSEMENT ENGINE
              </span>
              <h4 className="text-base font-black text-slate-900 mt-1">
                Disburse Special Subvention & Development Grant to {activeSchool.name}
              </h4>
              <p className="text-xs text-slate-500">
                Execute electronic funds approval to increase the school's allocated subvention and operational reserves.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Disbursed Subvention:</div>
              <div className="text-lg font-black text-emerald-700">
                ₦{activeSchool.financialStatement.stateSubventionDisbursed.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">
                Net Operating Balance: <strong>₦{activeSchool.financialStatement.netOperatingBalance.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <form onSubmit={handleDisburseSubvention} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grant / Subvention Amount (NGN):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">₦</span>
                  <input
                    type="number"
                    min="100000"
                    step="50000"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-8 pr-3 py-2.5 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[500000, 1000000, 2000000, 3500000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGrantAmount(amt)}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-[10px] font-bold text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      +₦{(amt / 1000000).toFixed(1)}M
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grant Classification & Budget Line:
                </label>
                <select
                  value={grantType}
                  onChange={(e) => setGrantType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="STEM Laboratory & Reagents Grant">STEM Laboratory & Science Reagents Subvention</option>
                  <option value="Solar Infrastructure & Energy Grant">Solar Primary Inverter & Borehole Maintenance Grant</option>
                  <option value="Instructional Textbooks & Digital Learning">UBEC Instructional Materials & E-Learning Allowance</option>
                  <option value="WAEC / NECO Practical Examination Support">WAEC / NECO Practical Exam Center Subsidy</option>
                  <option value="Staff Welfare & Rural Posting Allowance">Teacher Rural Hardship & Special Allowance Subvention</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Justification & Disbursement Purpose:
                </label>
                <textarea
                  rows={4}
                  value={grantPurpose}
                  onChange={(e) => setGrantPurpose(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  placeholder="Specify procurement mandates, audit compliance requirements, or targeted infrastructure needs..."
                />
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>Executive Treasury Warrant #BW-2026/891</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Approving this subvention will instantly update the school's live bursary statement and net operating reserve balance in the State Headquarters records.
                </p>
              </div>

              <button
                type="submit"
                id="disburse-subvention-submit-btn"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Authorize & Disburse ₦{grantAmount.toLocaleString()} to School</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= SECTION 3: TEACHER DEPLOYMENT & DEFICITS ================= */}
      {activeSubTab === 'teachers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                TEACHING SERVICE BOARD (TSB) DEPLOYMENT HUB
              </span>
              <h4 className="text-base font-black text-slate-900 mt-1">
                Deploy TRCN Qualified Teachers to Resolve Subject Deficits
              </h4>
              <p className="text-xs text-slate-500">
                Active school deficit alert: <strong>{activeSchool.teacherKPIs.teacherDeficitSubjects.join(', ') || 'No Critical Deficits'}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Current Faculty Strength:</div>
              <div className="text-lg font-black text-slate-900">
                {activeSchool.totalTeachers} Teachers ({activeSchool.trcnCertifiedTeachers} TRCN)
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                Student-to-Teacher: {activeSchool.teacherStudentRatio}
              </div>
            </div>
          </div>

          <form onSubmit={handleDeployTeacherSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Deficit Subject to Remediate:
                </label>
                <select
                  value={deficitSubject}
                  onChange={(e) => setDeficitSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Physics Teacher">Physics (Senior Secondary College)</option>
                  <option value="Further Mathematics Teacher">Further Mathematics</option>
                  <option value="Technical Drawing / Auto Mechanics">Technical Drawing & Basic Technology</option>
                  <option value="Agricultural Science & Fishery">Agricultural Science & Practical Farm Lead</option>
                  <option value="Chemistry Practical Lead">Chemistry & Lab Instructor</option>
                  <option value="English Studies & Phonetics">English Studies & Phonetics Master</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deployed Teacher Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={deployedTeacherName}
                  onChange={(e) => setDeployedTeacherName(e.target.value)}
                  placeholder="e.g. Mr. Emmanuel Terver Gbilekaa"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Qualification & TRCN Pin:
                </label>
                <input
                  type="text"
                  required
                  value={deployedQualification}
                  onChange={(e) => setDeployedQualification(e.target.value)}
                  placeholder="e.g. B.Sc (Ed) Physics • TRCN/BN/2024/0918"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-700" />
                  <span>Statutory TSB Posting Order</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Submitting this posting updates the school's faculty census in real-time and clears the teacher deficit tag in the Executive Governor's Briefing engine.
                </p>
              </div>

              <button
                type="submit"
                id="deploy-teacher-submit-btn"
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Issue Official Teacher Posting to {activeSchool.name}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= SECTION 4: ACCREDITATION & INSPECTION RATINGS ================= */}
      {activeSubTab === 'accreditation' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                STATE STANDARDS & ACCREDITATION BOARD
              </span>
              <h4 className="text-base font-black text-slate-900 mt-1">
                Quality Assurance Status & Inspection Log for {activeSchool.name}
              </h4>
              <p className="text-xs text-slate-500">
                Update accreditation standing and official supervisory recommendations for {activeSchool.lga} LGA.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Current State Standing:</div>
              <div className="text-sm font-black text-emerald-800">
                {activeSchool.governingBodyReview.accreditationStatus}
              </div>
              <div className="text-[10px] text-amber-700 font-bold">
                State Ranking: #{activeSchool.governingBodyReview.stateRanking} in Benue
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateAccreditationSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accreditation Rating:
                </label>
                <select
                  value={newAccreditationStatus}
                  onChange={(e) => setNewAccreditationStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Full State Accreditation">Full State Accreditation (Exemplary Standing)</option>
                  <option value="Center of Academic Excellence">Center of Academic Excellence (Model College)</option>
                  <option value="Provisional Accreditation">Provisional Accreditation (Subject to Science Lab Upgrade)</option>
                  <option value="Special Quality Assurance Intervention">Special Quality Assurance Intervention Mandate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lead Supervisory Inspector:
                </label>
                <input
                  type="text"
                  disabled
                  value={`${activeSchool.governingBodyReview.zonalInspectorName} (Zonal Inspectorate)`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-bold text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Headquarters Inspection Remarks & Action Items:
              </label>
              <textarea
                rows={3}
                value={inspectionRemarks}
                onChange={(e) => setInspectionRemarks(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                placeholder="Enter formal inspection observations and compliance instructions for the school administration..."
              />
            </div>

            <button
              type="submit"
              id="save-accreditation-submit-btn"
              className="py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Award className="h-4 w-4" />
              <span>Commit Quality Assurance & Accreditation Rating</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
