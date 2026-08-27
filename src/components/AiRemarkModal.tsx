import React, { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, X } from 'lucide-react';
import { Student, StudentReportCard, getSchoolArm } from '../types';

interface AiRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  reportCard: StudentReportCard;
  onApplyRemark: (type: 'tutor' | 'principal', remark: string) => void;
}

export const AiRemarkModal: React.FC<AiRemarkModalProps> = ({
  isOpen,
  onClose,
  student,
  reportCard,
  onApplyRemark,
}) => {
  const arm = student.arm || getSchoolArm(student.currentClass);
  const [targetType, setTargetType] = useState<'tutor' | 'principal'>('tutor');
  const [tone, setTone] = useState<'encouraging' | 'rigorous' | 'balanced' | 'distinction'>('balanced');
  const [copied, setCopied] = useState(false);
  const [generatedRemark, setGeneratedRemark] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const generateSmartRemark = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const avg = reportCard.overallPercentage;
      const pos = reportCard.positionInClass;
      const punctuality = reportCard.psychomotor.punctuality;
      const isFemale = student.gender === 'Female';
      const pronoun = isFemale ? 'She' : 'He';
      const possessive = isFemale ? 'Her' : 'His';
      const objective = isFemale ? 'her' : 'him';

      let remark = '';

      if (arm === 'kindergarten') {
        if (targetType === 'tutor') {
          if (avg >= 85) {
            remark = `${student.fullName} is a joyful and vibrant learner in our Early Years classroom! ${pronoun} has shown remarkable mastery in Jolly Phonics sound blending, fine motor pencil control, and number recognition. ${pronoun} shares educational toys selflessly and actively participates in nursery rhyme circle sessions.`;
          } else if (avg >= 70) {
            remark = `${student.fullName} is progressing very well across all early childhood developmental domains. ${possessive} curiosity in sensory exploration and social habits is wonderful. With continued daily bedtime story reading at home, ${possessive.toLowerCase()} vocabulary will expand even faster.`;
          } else {
            remark = `${student.fullName} is developing pleasantly and becoming more confident with daily classroom routines. We are providing additional encouragement in pencil grip and color sorting. A lovely child to teach!`;
          }
        } else {
          // Kindergarten Sub-Head Remark (Mrs. Abigail Balogun)
          if (avg >= 80) {
            remark = `Exceptional early childhood developmental milestones achieved! ${student.fullName} displays high curiosity, emotional maturity, and foundational readiness for Primary transition. Commendable support from home.`;
          } else {
            remark = `Satisfactory early learning growth and positive social adaptation. The Kindergarten department is delighted with ${student.fullName}'s steady developmental progress this term.`;
          }
        }
      } else if (arm === 'primary') {
        if (targetType === 'tutor') {
          if (avg >= 85) {
            remark = `${student.fullName} has had a stellar term in ${student.currentClass}, taking the ${pos === 1 ? '1st' : pos === 2 ? '2nd' : '3rd'} position with a formidable ${avg}% average. ${possessive} comprehension in Mathematics, English Studies, and Quantitative Reasoning is exemplary. Ready for greater academic challenges!`;
          } else if (avg >= 70) {
            remark = `A very commendable academic performance by ${student.fullName}, finishing ${pos}th in class. ${pronoun} demonstrates strong mental arithmetic and neat handwriting. A little more revision in science practicals will elevate ${objective} to total distinction.`;
          } else if (avg >= 50) {
            remark = `${student.fullName} has made fair progress this term. ${pronoun} is polite and eager to learn, but needs closer monitoring with daily homework assignments and spelling drills.`;
          } else {
            remark = `${student.fullName} requires foundational reinforcement in core literacy and numeracy. Parents are advised to enroll ${objective} in the school's guided after-school academic clinic.`;
          }
        } else {
          // Headmistress's Remark (Mrs. Grace Iveren Shima)
          if (student.currentClass === 'Basic 6') {
            remark = `Hearty congratulations on completing the Primary school curriculum with distinction. ${student.fullName} is fully certified and recommended for the National Common Entrance Examination (NCEE) and Junior Secondary admission.`;
          } else if (avg >= 80) {
            remark = `Brilliant and praiseworthy terminal achievement! ${student.fullName} embodies our primary school ethos of diligence and character. Keep up the high standard.`;
          } else {
            remark = `A satisfactory result with room for continued academic expansion. The Primary administration commends the effort and expects greater heights next term.`;
          }
        }
      } else {
        // Secondary Arm
        if (targetType === 'tutor') {
          if (avg >= 85) {
            remark = `${student.fullName} has delivered an extraordinary academic performance this term, finishing ${pos === 1 ? '1st' : pos === 2 ? '2nd' : 'top tier'} with an exceptional average of ${avg}%. ${possessive} diligence in both core and track-specific subjects is commendable. ${punctuality >= 4 ? `${pronoun} maintains impeccable punctuality and classroom decorum.` : 'Keep up the exemplary focus.'}`;
          } else if (avg >= 70) {
            remark = `A very commendable and steady academic outing by ${student.fullName}, securing ${pos}${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} position. ${pronoun} demonstrates active participation and sound grasp of key concepts. With a bit more time allocated to revision in core subjects, an absolute distinction is well within reach.`;
          } else if (avg >= 55) {
            remark = `${student.fullName} has shown satisfactory progress this term with a ${avg}% average. While ${pronoun.toLowerCase()} grasps the fundamentals, more consistency in homework completion and test preparation is advised for the coming promotional term.`;
          } else {
            remark = `${student.fullName} is capable of far greater academic output than reflected in this term's result (${avg}%). I strongly recommend focused holiday coaching, regular study timetables, and closer engagement with subject teachers.`;
          }
        } else {
          // Principal's Remark (Dr. Mrs. Grace Okafor)
          if (student.currentClass.startsWith('SSS 3')) {
            remark = `An outstanding candidate for WAEC WASSCE, NECO SSCE, Cambridge IGCSE, SAT & JAMB UTME. ${student.fullName} has demonstrated academic rigor and leadership. We anticipate flying colors in the upcoming external national and international finals.`;
          } else if (avg >= 80) {
            remark = `An outstanding, scholarly result! ${student.fullName} embodies the academic excellence and moral rectitude that BummptEducation champions. Keep shining and setting the benchmark.`;
          } else if (avg >= 60) {
            remark = `A good and solid terminal achievement. ${student.fullName} is encouraged to sustain this positive trajectory and strive for academic honors in the upcoming session.`;
          } else if (avg >= 50) {
            remark = `Promising effort, but there is substantial room for advancement. The school urges the student to apply greater discipline and focus in the next term.`;
          } else {
            remark = `Result requires urgent remediation. Parents/guardians are invited for an academic counseling conference with the Vice-Principal (Academics).`;
          }
        }
      }

      setGeneratedRemark(remark);
      setIsGenerating(false);
    }, 400);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedRemark);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyRemark(targetType, generatedRemark);
    onClose();
  };

  const getSubHeadLabel = () => {
    if (arm === 'kindergarten') return 'Head of Early Childhood (Mrs. Abigail Balogun)';
    if (arm === 'primary') return 'Headmistress (Mrs. Grace Iveren Shima)';
    return 'Principal (Dr. Mrs. Grace Nkechi Okafor)';
  };

  const getTutorLabel = () => {
    if (arm === 'kindergarten') return 'Early Years Lead Facilitator / Care Teacher';
    if (arm === 'primary') return 'Primary Class Teacher';
    return 'Secondary Form Tutor';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/20 p-2 border border-blue-400/30">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">AI Academic & Milestone Remark Generator</h3>
              <p className="text-xs text-blue-200">
                Tailored for {arm.toUpperCase()} arm • Standards for West African & International Schools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Candidate / Pupil:</span>
              <strong className="text-slate-900 text-sm">{student.fullName} ({student.currentClass})</strong>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                {arm} arm
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Overall Term Average:</span>
              <span className="font-bold text-emerald-700 text-sm">{reportCard.overallPercentage}% ({reportCard.positionInClass} in class)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Leadership Role:
              </label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as any);
                  setGeneratedRemark('');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="tutor">{getTutorLabel()}</option>
                <option value="principal">{getSubHeadLabel()}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pedagogical Tone:
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="balanced">Balanced & Constructive</option>
                <option value="encouraging">Motivational & Inspiring</option>
                <option value="rigorous">Academic Rigor & High Expectations</option>
                <option value="distinction">Excellence & Distinction</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateSmartRemark}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synthesizing student developmental & academic matrix...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                Generate Tailored Remark
              </>
            )}
          </button>

          {generatedRemark && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Synthesized Official Remark:</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                value={generatedRemark}
                onChange={(e) => setGeneratedRemark(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50 font-sans leading-relaxed"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  Apply to Student Record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
