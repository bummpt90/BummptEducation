import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  ShieldCheck, 
  Landmark, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Search, 
  Filter, 
  Users, 
  MessageSquare, 
  FileText, 
  RefreshCw, 
  Download, 
  ChevronRight, 
  Eye, 
  CheckCheck, 
  ArrowUpRight,
  AlertTriangle,
  FileCheck,
  Zap,
  PhoneCall,
  UserCheck,
  School,
  X,
  CornerDownRight,
  Tag
} from 'lucide-react';
import { BENUE_GOVERNMENT_SCHOOLS, BENUE_LGAS_METADATA } from '../data/benueStateData';
import { GovSchool, BenueLGA, SenatorialZone } from '../types';

export interface HQChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  schoolName: string;
  lga: BenueLGA;
  zone: SenatorialZone;
  channelId: string;
  messageType: 'update' | 'complaint' | 'request' | 'directive' | 'executive';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
  content: string;
  status: 'received' | 'in-review' | 'forwarded-to-head' | 'approved' | 'resolved';
  attachmentName?: string;
  officialRefNumber?: string;
  hqResponse?: {
    responderName: string;
    responderRole: string;
    replyContent: string;
    timestamp: string;
  };
  isEscalatedToCommissioner?: boolean;
}

const INITIAL_HQ_MESSAGES: HQChatMessage[] = [
  {
    id: 'MSG-BN-001',
    senderName: 'Prof. Frederick Ikyaan',
    senderRole: 'Hon. Commissioner for Education, Science & Technology',
    schoolName: 'Ministry of Education Headquarters, Makurdi',
    lga: 'Makurdi',
    zone: 'Zone B (Benue North-West)',
    channelId: 'all-schools-announcements',
    messageType: 'directive',
    priority: 'urgent',
    timestamp: 'Today at 08:30 AM',
    content: 'EXECUTIVE DIRECTIVE: All 23 LGA School Heads (Principals & Headteachers) must finalize 2nd Term 2025/2026 Continuous Assessment (40/60 CA/Exam) broadsheets by Friday. The State Ministry Inspectorate will initiate random biometric faculty audits next Monday.',
    status: 'resolved',
    officialRefNumber: 'MOE/BN/ADM/2026/CIRC-089',
    isEscalatedToCommissioner: true
  },
  {
    id: 'MSG-BN-002',
    senderName: 'Mr. Terver Tyokyaa',
    senderRole: 'Principal / School Head',
    schoolName: 'Government College Makurdi',
    lga: 'Makurdi',
    zone: 'Zone B (Benue North-West)',
    channelId: 'statutory-requests',
    messageType: 'request',
    priority: 'high',
    timestamp: 'Today at 09:15 AM',
    content: 'Formal Requisition: We urgently request the deployment of 2 TRCN-certified Physics and Further Mathematics teachers for our SSS 2 and SSS 3 classes preparing for WAEC/NECO. Current teacher-student ratio in senior STEM exceeds 1:55.',
    status: 'forwarded-to-head',
    officialRefNumber: 'GCM/REQ/TRCN/2026/014',
    attachmentName: 'Teacher_Deficit_Audit_GCMakurdi_2026.pdf',
    hqResponse: {
      responderName: 'Dr. Grace Adagba',
      responderRole: 'Executive Chairman, Benue SUBEB / Teaching Service Board',
      replyContent: 'Requisition received and evaluated. 2 Teachers under the Benue State Special STEM Recruitment have been shortlisted for posting to Gov College Makurdi by Wednesday.',
      timestamp: 'Today at 10:45 AM'
    },
    isEscalatedToCommissioner: true
  },
  {
    id: 'MSG-BN-003',
    senderName: 'Mrs. Bridget Shima',
    senderRole: 'Headteacher / School Administrator',
    schoolName: 'LGEA Central Primary School, Gboko',
    lga: 'Gboko',
    zone: 'Zone A (Benue North-East)',
    channelId: 'complaints-and-grievances',
    messageType: 'complaint',
    priority: 'urgent',
    timestamp: 'Today at 10:05 AM',
    content: 'URGENT FACILITY COMPLAINT: Recent rainfall caused roof deterioration in the Basic 4 and Basic 5 classroom block. We request an emergency structural assessment from the SUBEB Physical Planning Unit to prevent pupil disruptions.',
    status: 'in-review',
    officialRefNumber: 'LGEA/GBK/FAC/2026/041',
    attachmentName: 'Damage_Photos_Classroom_BlockB.pdf',
    hqResponse: {
      responderName: 'Engr. Iorfa Bem',
      responderRole: 'Director of Quality Assurance & Physical Infrastructure',
      replyContent: 'Zone A Engineering Field Officer dispatched to Gboko LGA. Emergency reroofing intervention registered under Q1 SUBEB Capital Repairs.',
      timestamp: 'Today at 11:20 AM'
    },
    isEscalatedToCommissioner: true
  },
  {
    id: 'MSG-BN-004',
    senderName: 'Dr. Godwin Ochigbo',
    senderRole: 'Principal / Chief Executive',
    schoolName: 'Jesus College, Otukpo',
    lga: 'Otukpo',
    zone: 'Zone C (Benue South)',
    channelId: 'statutory-requests',
    messageType: 'request',
    priority: 'normal',
    timestamp: 'Yesterday at 04:20 PM',
    content: 'Reconciliation Request: We submit our 2nd Term 2025/2026 WAEC and NECO registration fee subsidy receipt schedule for state counterpart grant verification (₦4,200,000 reconciled).',
    status: 'approved',
    officialRefNumber: 'JCO/FIN/SUB/2026/009',
    attachmentName: 'WAEC_NECO_Counterpart_Subsidy_Schedule.pdf',
    hqResponse: {
      responderName: 'Hon. Bursar General',
      responderRole: 'Director of Finance & Accounts, MOE Makurdi',
      replyContent: 'Subsidy schedule verified and approved. Electronic payment voucher forwarded to State Treasury for direct disbursement.',
      timestamp: 'Yesterday at 05:40 PM'
    }
  },
  {
    id: 'MSG-BN-005',
    senderName: 'Mr. Emmanuel Agbo',
    senderRole: 'Principal',
    schoolName: 'Government Model Secondary School, Katsina-Ala',
    lga: 'Katsina-Ala',
    zone: 'Zone A (Benue North-East)',
    channelId: 'direct-hq-helpdesk',
    messageType: 'update',
    priority: 'normal',
    timestamp: 'Yesterday at 02:10 PM',
    content: 'Weekly Term Progress Update: Week 8 continuous assessment completed across all 18 classes. TRCN faculty biometric attendance index recorded at 96.4%. No security incidents reported.',
    status: 'received',
    officialRefNumber: 'GMSK/WK8/AUDIT/2026'
  }
];

const CHANNELS = [
  { id: 'all-schools-announcements', label: '📢 Official Ministry Circulars', desc: 'Broadcast directives from Hon. Commissioner & SUBEB' },
  { id: 'direct-hq-helpdesk', label: '💬 General Inquiries & Helpdesk', desc: 'Direct Q&A with Ministry desk officers' },
  { id: 'complaints-and-grievances', label: '⚠️ Complaints & Infrastructure', desc: 'Facility repairs, deficits & emergency complaints' },
  { id: 'statutory-requests', label: '📋 Statutory Requests & Grants', desc: 'Teacher postings, grants & accreditation requests' },
  { id: 'executive-governor-escalations', label: '🏛️ Commissioner & Governor Desk', desc: 'High-priority escalations to the Ministry Head' },
  { id: 'zone-a-northeast', label: '🗺️ Zone A (Benue North-East)', desc: 'Gboko, Katsina-Ala, Vandeikya, Ukum, etc.' },
  { id: 'zone-b-northwest', label: '🗺️ Zone B (Benue North-West)', desc: 'Makurdi, Guma, Gwer, Buruku, etc.' },
  { id: 'zone-c-south', label: '🗺️ Zone C (Benue South)', desc: 'Otukpo, Apa, Agatu, Oju, Ogbadibo, etc.' },
];

const CANNED_TEMPLATES = [
  {
    title: 'Teacher Deficit & Posting Request',
    type: 'request' as const,
    priority: 'high' as const,
    content: 'Formal Requisition: Our school requires additional TRCN-certified teachers for Senior Secondary Physics, Chemistry, and English Language. Current class populations have created teacher deficit ratios exceeding statutory standards.'
  },
  {
    title: 'Emergency Classroom & Infrastructure Repair',
    type: 'complaint' as const,
    priority: 'urgent' as const,
    content: 'Urgent Facility Complaint: Heavy storm damage has affected our classroom roofing and laboratory block. We request an immediate inspection by the SUBEB/Ministry Physical Infrastructure team and emergency subvention.'
  },
  {
    title: 'Continuous Assessment (40/60) Submission Notice',
    type: 'update' as const,
    priority: 'normal' as const,
    content: 'Term Progress Notice: All Continuous Assessment (1st Test 10%, 2nd Test 10%, Project/Lab 20%) scores have been compiled in the school registry and are ready for official state broadsheet audit.'
  },
  {
    title: 'State Subvention & Grant Disbursement Inquiry',
    type: 'request' as const,
    priority: 'normal' as const,
    content: 'Financial Inquiry: Inquiring on the clearance status of our 2nd Term 2025/2026 State Subvention and Science Laboratory counterpart grant allocation (Ref #SUB/BN/2026).'
  }
];

interface HeadquartersLiveChatProps {
  currentLga?: BenueLGA;
  activeSchool?: GovSchool;
  onSelectSchool?: (schoolId: string) => void;
}

export const HeadquartersLiveChat: React.FC<HeadquartersLiveChatProps> = ({
  currentLga = 'Makurdi',
  activeSchool,
  onSelectSchool
}) => {
  const [messages, setMessages] = useState<HQChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('benue_moe_hq_chat_messages_v1');
      return saved ? JSON.parse(saved) : INITIAL_HQ_MESSAGES;
    } catch {
      return INITIAL_HQ_MESSAGES;
    }
  });

  const [activeChannelId, setActiveChannelId] = useState<string>('all-schools-announcements');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Active Sender Profile Persona Switcher
  const [activeSenderRole, setActiveSenderRole] = useState<'head_of_school' | 'ministry_officer' | 'hon_commissioner'>('head_of_school');
  const [customSenderName, setCustomSenderName] = useState<string>('Mr. Terver Tyokyaa');
  const [customSchoolName, setCustomSchoolName] = useState<string>(activeSchool?.name || 'Government College Makurdi');
  const [customLga, setCustomLga] = useState<BenueLGA>(currentLga || 'Makurdi');

  // New Message Form State
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [newMessageType, setNewMessageType] = useState<HQChatMessage['messageType']>('update');
  const [newMessagePriority, setNewMessagePriority] = useState<HQChatMessage['priority']>('normal');
  const [attachedFileName, setAttachedFileName] = useState<string>('');
  const [isEscalateChecked, setIsEscalateChecked] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [selectedMessageModal, setSelectedMessageModal] = useState<HQChatMessage | null>(null);

  // Quick reply input for selected modal
  const [quickReplyText, setQuickReplyText] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Update default school when activeSchool changes
  useEffect(() => {
    if (activeSchool) {
      setCustomSchoolName(activeSchool.name);
      setCustomLga(activeSchool.lga);
    }
  }, [activeSchool]);

  // Persist messages to local storage
  const saveMessages = (updatedList: HQChatMessage[]) => {
    setMessages(updatedList);
    try {
      localStorage.setItem('benue_moe_hq_chat_messages_v1', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save HQ chat messages', e);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  // Filtered messages
  const filteredMessages = messages.filter(m => {
    // Channel match
    if (activeChannelId !== 'all-schools-announcements' && m.channelId !== activeChannelId) {
      // If zone channel, match zone
      if (activeChannelId === 'zone-a-northeast' && !m.zone.includes('Zone A')) return false;
      if (activeChannelId === 'zone-b-northwest' && !m.zone.includes('Zone B')) return false;
      if (activeChannelId === 'zone-c-south' && !m.zone.includes('Zone C')) return false;
      if (activeChannelId === 'executive-governor-escalations' && !m.isEscalatedToCommissioner && m.messageType !== 'directive') return false;
      if (activeChannelId !== 'zone-a-northeast' && activeChannelId !== 'zone-b-northwest' && activeChannelId !== 'zone-c-south' && activeChannelId !== 'executive-governor-escalations') {
        if (m.channelId !== activeChannelId) return false;
      }
    }
    // Zone filter
    if (selectedZoneFilter !== 'All' && m.zone !== selectedZoneFilter) return false;
    // Status filter
    if (selectedStatusFilter !== 'All' && m.status !== selectedStatusFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = m.content.toLowerCase().includes(q);
      const matchSchool = m.schoolName.toLowerCase().includes(q);
      const matchSender = m.senderName.toLowerCase().includes(q);
      const matchLga = m.lga.toLowerCase().includes(q);
      const matchRef = m.officialRefNumber?.toLowerCase().includes(q);
      if (!matchContent && !matchSchool && !matchSender && !matchLga && !matchRef) return false;
    }
    return true;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setIsSending(true);

    const now = new Date();
    const timeString = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const randomRef = `BN/HQ/${customLga.substring(0, 3).toUpperCase()}/${Math.floor(1000 + Math.random() * 9000)}`;

    const zoneForLga: SenatorialZone = 
      ['Gboko', 'Katsina-Ala', 'Kwande', 'Konshisha', 'Ushongo', 'Vandeikya', 'Logo', 'Ukum'].includes(customLga)
        ? 'Zone A (Benue North-East)'
        : ['Ado', 'Agatu', 'Apa', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo'].includes(customLga)
        ? 'Zone C (Benue South)'
        : 'Zone B (Benue North-West)';

    let senderRoleLabel = 'Principal / School Head';
    if (activeSenderRole === 'ministry_officer') {
      senderRoleLabel = 'Director of Quality Assurance & Standards, MOE';
    } else if (activeSenderRole === 'hon_commissioner') {
      senderRoleLabel = 'Hon. Commissioner for Education, Science & Technology';
    }

    const newMsg: HQChatMessage = {
      id: `MSG-BN-${Date.now().toString().slice(-4)}`,
      senderName: customSenderName,
      senderRole: senderRoleLabel,
      schoolName: activeSenderRole === 'head_of_school' ? customSchoolName : 'Ministry of Education Headquarters, Makurdi',
      lga: customLga,
      zone: zoneForLga,
      channelId: activeChannelId,
      messageType: newMessageType,
      priority: newMessagePriority,
      timestamp: timeString,
      content: newMessageText.trim(),
      status: isEscalateChecked ? 'forwarded-to-head' : 'received',
      attachmentName: attachedFileName || undefined,
      officialRefNumber: randomRef,
      isEscalatedToCommissioner: isEscalateChecked || activeSenderRole === 'hon_commissioner'
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    setNewMessageText('');
    setAttachedFileName('');
    setIsEscalateChecked(false);

    // If sent by School Head, simulate intelligent automated acknowledgment from the Ministry HQ Desk after 1.5s
    if (activeSenderRole === 'head_of_school') {
      setTimeout(() => {
        const hqReplyContent = isEscalateChecked
          ? `OFFICIAL ACKNOWLEDGMENT (Ref ${randomRef}): Your urgent request has been prioritized and placed directly on the Hon. Commissioner Prof. Frederick Ikyaan's executive review desk. An inspection / audit directive has been generated.`
          : `ACKNOWLEDGMENT (Ref ${randomRef}): Ministry desk officer has registered your ${newMessageType}. Assigned to the Zonal Inspectorate (${zoneForLga}) for compliance validation.`;

        const replyWithHQ: HQChatMessage[] = updated.map(item => {
          if (item.id === newMsg.id) {
            return {
              ...item,
              status: isEscalateChecked ? 'forwarded-to-head' : 'in-review',
              hqResponse: {
                responderName: isEscalateChecked ? 'Prof. Frederick Ikyaan' : 'Director of Quality Assurance, MOE',
                responderRole: isEscalateChecked ? 'Hon. Commissioner for Education' : 'State Quality Assurance Officer',
                replyContent: hqReplyContent,
                timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              }
            };
          }
          return item;
        });
        saveMessages(replyWithHQ);
      }, 1500);
    }

    setIsSending(false);
  };

  const handleApplyTemplate = (tmpl: typeof CANNED_TEMPLATES[0]) => {
    setNewMessageText(tmpl.content);
    setNewMessageType(tmpl.type);
    setNewMessagePriority(tmpl.priority);
  };

  const handleSimulateAttachment = () => {
    const mockFiles = [
      'Official_Requisition_Memo_Signed.pdf',
      'School_Facilities_Condition_Audit.pdf',
      'Continuous_Assessment_Broadsheet_Summary.pdf',
      'TRCN_Faculty_Biometric_Log.pdf',
      'PTA_and_Subvention_Reconciliation_Statement.pdf'
    ];
    const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachedFileName(picked);
  };

  const handleQuickAddHQReply = (messageId: string) => {
    if (!quickReplyText.trim()) return;

    const updated = messages.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          status: 'resolved' as const,
          hqResponse: {
            responderName: 'Prof. Frederick Ikyaan',
            responderRole: 'Hon. Commissioner for Education / Desk Official',
            replyContent: quickReplyText.trim(),
            timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          }
        };
      }
      return m;
    });

    saveMessages(updated);
    setQuickReplyText('');
    if (selectedMessageModal && selectedMessageModal.id === messageId) {
      setSelectedMessageModal({
        ...selectedMessageModal,
        status: 'resolved',
        hqResponse: {
          responderName: 'Prof. Frederick Ikyaan',
          responderRole: 'Hon. Commissioner for Education / Desk Official',
          replyContent: quickReplyText.trim(),
          timestamp: 'Just now'
        }
      });
    }
  };

  const handleEscalateExistingMessage = (messageId: string) => {
    const updated = messages.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          isEscalatedToCommissioner: true,
          status: 'forwarded-to-head' as const
        };
      }
      return m;
    });
    saveMessages(updated);
    if (selectedMessageModal && selectedMessageModal.id === messageId) {
      setSelectedMessageModal({
        ...selectedMessageModal,
        isEscalatedToCommissioner: true,
        status: 'forwarded-to-head'
      });
    }
  };

  const handleResetToDefault = () => {
    saveMessages(INITIAL_HQ_MESSAGES);
  };

  const currentChannelObj = CHANNELS.find(c => c.id === activeChannelId) || CHANNELS[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-slate-900" id="hq-live-chat-hub">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6 border-b border-emerald-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10.5px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                <Landmark className="h-3 w-3 text-emerald-400" />
                Benue State Ministry of Education & SUBEB Headquarters
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.2 rounded shadow-2xs">
                HEADS OF SCHOOLS ↔ MINISTRY LIVE DISPATCH
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Headquarters Live Communication & Grievance Console</span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Direct two-way dispatch channel connecting Principals and Headteachers from all 23 Local Government Areas with Ministry representatives, SUBEB directors, and the Hon. Commissioner for emergency school updates, teacher requisitions, complaints, and official circular clarifications.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition cursor-pointer"
              title="Reset sample conversations"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Feed</span>
            </button>
          </div>
        </div>

        {/* Persona & Identity Selector Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Active Sender Mode */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Sender Identity (Simulate As):
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveSenderRole('head_of_school');
                  setCustomSenderName('Mr. Terver Tyokyaa');
                  setCustomSchoolName(activeSchool?.name || 'Government College Makurdi');
                }}
                className={`py-1.5 px-2 rounded-lg text-[10.5px] font-black transition text-center cursor-pointer ${
                  activeSenderRole === 'head_of_school'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                School Head
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSenderRole('ministry_officer');
                  setCustomSenderName('Dr. Grace Adagba');
                  setCustomSchoolName('Ministry of Education HQ');
                }}
                className={`py-1.5 px-2 rounded-lg text-[10.5px] font-black transition text-center cursor-pointer ${
                  activeSenderRole === 'ministry_officer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                SUBEB Desk
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSenderRole('hon_commissioner');
                  setCustomSenderName('Prof. Frederick Ikyaan');
                  setCustomSchoolName('Executive Commissioner Office');
                }}
                className={`py-1.5 px-2 rounded-lg text-[10.5px] font-black transition text-center cursor-pointer ${
                  activeSenderRole === 'hon_commissioner'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Commissioner
              </button>
            </div>
          </div>

          {/* School & LGA Context */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Sender Name & Institution:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSenderName}
                onChange={(e) => setCustomSenderName(e.target.value)}
                placeholder="Sender name..."
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-bold"
              />
              <select
                value={customLga}
                onChange={(e) => {
                  const newLga = e.target.value as BenueLGA;
                  setCustomLga(newLga);
                  const firstSchool = BENUE_GOVERNMENT_SCHOOLS.find(s => s.lga === newLga);
                  if (firstSchool) setCustomSchoolName(firstSchool.name);
                }}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 focus:outline-none font-bold cursor-pointer"
              >
                {BENUE_LGAS_METADATA.map((lga) => (
                  <option key={lga.lga} value={lga.lga}>
                    {lga.lga} ({lga.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats & Live Indicator */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">HQ Resolution Rate</span>
              <div className="text-lg font-black text-emerald-400">94.8%</div>
              <span className="text-[10px] text-slate-400 font-medium">Avg response: &lt; 45 mins</span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Messages Ingested</span>
              <div className="text-lg font-black text-amber-300">{messages.length} Records</div>
              <span className="text-[10px] text-emerald-400 font-semibold">23 LGAs Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar Channels + Chat Stream + Compose Desk) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* Left Sidebar: Channels & Filters (Col 1-4) */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/70 p-4 space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search complaints, schools, refs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Quick Filters: Zone & Status */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zone:</label>
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Senatorial Zones</option>
                <option value="Zone A">Zone A (North-East)</option>
                <option value="Zone B">Zone B (North-West)</option>
                <option value="Zone C">Zone C (South)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status:</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="received">Received</option>
                <option value="in-review">In Review</option>
                <option value="forwarded-to-head">Forwarded to Head</option>
                <option value="approved">Approved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Dispatch Channels List */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block">
              Direct Dispatch Channels
            </span>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {CHANNELS.map((ch) => {
                const isActive = activeChannelId === ch.id;
                const channelCount = messages.filter(m => m.channelId === ch.id || (ch.id === 'executive-governor-escalations' && m.isEscalatedToCommissioner)).length;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs font-bold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-medium'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold truncate">{ch.label}</div>
                      <div className={`text-[10px] line-clamp-1 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {ch.desc}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {channelCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canned School Head Templates */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Quick Head Templates (1-Click)</span>
            </div>
            <div className="space-y-1.5">
              {CANNED_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="w-full text-left p-1.5 rounded-lg bg-white/80 hover:bg-white text-[11px] font-semibold text-slate-700 border border-amber-200 hover:border-amber-400 transition cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate pr-1">{tmpl.title}</span>
                  <CornerDownRight className="h-3 w-3 text-amber-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Main Chat & Dispatch Arena (Col 5-12) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white">
          
          {/* Active Channel Top Info Bar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">{currentChannelObj.label}</h3>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs text-slate-500">{filteredMessages.length} Messages in View</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                HQ Desk: Online
              </span>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[460px] min-h-[380px]">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-slate-600">No Messages in this Channel Filter</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Be the first to submit a request, update, or complaint to the Benue State Education Headquarters.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isHQAuthor = msg.senderRole.includes('Commissioner') || msg.senderRole.includes('SUBEB') || msg.senderRole.includes('Quality Assurance');
                const isUrgent = msg.priority === 'urgent' || msg.priority === 'high';
                
                return (
                  <div 
                    key={msg.id} 
                    className={`rounded-2xl p-4 transition border shadow-xs ${
                      isHQAuthor 
                        ? 'bg-gradient-to-br from-emerald-50/90 to-slate-50 border-emerald-200' 
                        : msg.isEscalatedToCommissioner
                        ? 'bg-amber-50/60 border-amber-300/80'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900">{msg.senderName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                            isHQAuthor ? 'bg-emerald-800 text-white' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {msg.senderRole}
                          </span>
                          {msg.isEscalatedToCommissioner && (
                            <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.2 rounded shadow-2xs flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5 fill-slate-950" />
                              Escalated to Head
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700">{msg.schoolName}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">{msg.lga} LGA ({msg.zone})</span>
                          <span>•</span>
                          <span className="text-slate-400">{msg.timestamp}</span>
                        </div>
                      </div>

                      {/* Right Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {msg.officialRefNumber && (
                          <span className="text-[9.5px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {msg.officialRefNumber}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          msg.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : msg.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {msg.priority}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          msg.status === 'resolved' || msg.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : msg.status === 'forwarded-to-head'
                            ? 'bg-amber-100 text-amber-900 font-black'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                    </div>

                    {/* Message Body Content */}
                    <div className="text-xs text-slate-800 leading-relaxed font-medium">
                      {msg.content}
                    </div>

                    {/* Attachment if present */}
                    {msg.attachmentName && (
                      <div className="mt-2.5 inline-flex items-center gap-2 p-2 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer">
                        <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="text-[11px] underline truncate">{msg.attachmentName}</span>
                        <span className="text-[9px] bg-slate-300 text-slate-800 px-1.5 py-0.2 rounded font-mono">PDF</span>
                      </div>
                    )}

                    {/* Official HQ Response Box if replied */}
                    {msg.hqResponse && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-900/10 border border-emerald-300 text-xs space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1 text-[10.5px]">
                          <div className="flex items-center gap-1.5 font-black text-emerald-950">
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Headquarters Action / Official Directive</span>
                            <span className="text-slate-500 font-normal">by {msg.hqResponse.responderName} ({msg.hqResponse.responderRole})</span>
                          </div>
                          <span className="text-slate-500 text-[10px]">{msg.hqResponse.timestamp}</span>
                        </div>
                        <p className="text-slate-800 text-[11.5px] font-medium leading-normal pl-4 border-l-2 border-emerald-500">
                          {msg.hqResponse.replyContent}
                        </p>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {!msg.isEscalatedToCommissioner && (
                          <button
                            onClick={() => handleEscalateExistingMessage(msg.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 transition cursor-pointer"
                            title="Escalate directly to the Hon. Commissioner Prof. Frederick Ikyaan"
                          >
                            <Zap className="h-3 w-3 text-amber-600" />
                            <span>Escalate to Head</span>
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMessageModal(msg)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 transition cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Official Dispatch Memo</span>
                        </button>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        Ref: {msg.officialRefNumber || 'BN-PORTAL-LOG'}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Message Composition Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-3">
            
            {/* Topic Type & Priority Selectors */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase text-slate-500">Type:</span>
                <div className="flex items-center gap-1">
                  {(['update', 'complaint', 'request', 'directive'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewMessageType(t)}
                      className={`px-2 py-1 rounded-md text-[10.5px] font-bold capitalize transition cursor-pointer ${
                        newMessageType === t
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <span className="text-slate-300">|</span>

                <span className="text-[10px] font-extrabold uppercase text-slate-500">Priority:</span>
                <select
                  value={newMessagePriority}
                  onChange={(e) => setNewMessagePriority(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Escalation</option>
                </select>
              </div>

              {/* Escalate checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none bg-amber-100/80 px-2 py-1 rounded-md border border-amber-300">
                <input
                  type="checkbox"
                  checked={isEscalateChecked}
                  onChange={(e) => setIsEscalateChecked(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                />
                <span className="text-[10.5px] font-black text-amber-900 flex items-center gap-1">
                  <Zap className="h-3 w-3 fill-amber-600 text-amber-600" />
                  Route to Commissioner Desk
                </span>
              </label>
            </div>

            {/* Attached file tag if chosen */}
            {attachedFileName && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-[11px]">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>Attached: {attachedFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFileName('')}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Textarea Input and Send Action */}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  rows={2}
                  required
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={`Write official dispatch, update, request, or complaint to the Headquarters...`}
                  className="w-full bg-white border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none font-medium shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSimulateAttachment}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 transition cursor-pointer shadow-2xs"
                  title="Attach Official Memo Document PDF"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <button
                  type="submit"
                  disabled={isSending || !newMessageText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Dispatch</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>All dispatches are recorded with official Ministry Reference IDs.</span>
              <span className="font-semibold text-slate-500">Sender: {customSenderName} ({customLga} LGA)</span>
            </div>

          </form>

        </div>

      </div>

      {/* Official Dispatch Memo Modal (For viewing in-depth transcript / giving quick reply) */}
      {selectedMessageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Top Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    Benue State MOE Memo Ref
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">{selectedMessageModal.officialRefNumber}</span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Official Headquarters Communication Transcript
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessageModal(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Memo Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Sender:</span>
                <span className="font-bold text-slate-800">{selectedMessageModal.senderName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">School / LGA:</span>
                <span className="font-bold text-slate-800">{selectedMessageModal.lga} LGA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Senatorial Zone:</span>
                <span className="font-bold text-emerald-700">{selectedMessageModal.zone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status:</span>
                <span className="font-bold capitalize text-blue-700">{selectedMessageModal.status}</span>
              </div>
            </div>

            {/* Original Message Content Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                School Head Communication:
              </span>
              <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
                {selectedMessageModal.content}
              </div>
            </div>

            {/* Response Section */}
            {selectedMessageModal.hqResponse ? (
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Ministry Headquarters Official Reply / Directive:
                </span>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium">
                  <div className="text-[10.5px] font-bold text-emerald-800 mb-1">
                    {selectedMessageModal.hqResponse.responderName} — {selectedMessageModal.hqResponse.responderRole}
                  </div>
                  {selectedMessageModal.hqResponse.replyContent}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Add Headquarters Desk Reply / Action:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickReplyText}
                    onChange={(e) => setQuickReplyText(e.target.value)}
                    placeholder="Enter official ministry approval, directive, or dispatch response..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickAddHQReply(selectedMessageModal.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer shrink-0"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Print Official State Dispatch Transcript</span>
              </button>

              <button
                onClick={() => setSelectedMessageModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Close Memo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
