import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Youtube, 
  Send, 
  Globe, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Clock,
  Building
} from 'lucide-react';
import { BummptechLogo } from '../components/BummptechLogo';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setSchoolName('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12" id="contact-page-root">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Connect with Bummptech Global Concepts</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Executive Contact & Portal Deployment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Reach out directly to CEO Matthew Ternenge Beeun for school portal customization, SAT/IGCSE/JAMB results integration, or technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Executive Direct Card */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                  Head of Operations & Founder
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Matthew Ternenge Beeun</h3>
                <p className="text-xs text-slate-400">Chief Executive Officer</p>
              </div>
              <BummptechLogo variant="compact" size="sm" />
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email:</span>
                  <a href="mailto:bummpt90@gmail.com" className="font-semibold text-slate-100 hover:text-blue-400 transition text-sm">
                    bummpt90@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone & WhatsApp Hotline:</span>
                  <a href="https://wa.me/2348115231834" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-100 hover:text-emerald-400 transition text-sm">
                    +234 811 523 1834
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Headquarters Address:</span>
                  <p className="font-medium text-slate-200 leading-relaxed">
                    Akperan Orshi Avenue, Owner Occupier Housing Estate, Along George Akume Road, Makurdi, Benue State, Nigeria.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Support Hours:</span>
                  <p className="text-slate-300">Monday – Friday: 8:00 AM – 6:00 PM (WAT)</p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Chat Action */}
            <div className="pt-2">
              <a
                href="https://wa.me/2348115231834?text=Hello%20Matthew%2C%20I%20am%20interested%20in%20deploying%20BummptEducation%20for%20our%20secondary%20school."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat Instantly on WhatsApp (+234 811 523 1834)</span>
              </a>
            </div>
          </div>

          {/* Social Channels & Online Hubs */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Official Media & Professional Networks
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <a
                href="https://linkedin.com/in/matthew-beeun-18853a1b2"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-800 hover:text-blue-700 transition"
              >
                <Linkedin className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="font-semibold truncate">LinkedIn</span>
                <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
              </a>

              <a
                href="https://youtube.com/@matthewbeeun2967"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-800 hover:text-rose-700 transition"
              >
                <Youtube className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="font-semibold truncate">YouTube</span>
                <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
              </a>

              <a
                href="https://t.me/matthew_beeun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-800 hover:text-sky-700 transition"
              >
                <Send className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="font-semibold truncate">Telegram</span>
                <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
              </a>

              <a
                href="https://bummpt90.blogspot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-800 hover:text-amber-700 transition"
              >
                <Globe className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-semibold truncate">Tech Blog</span>
                <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Inquiries & Deployment Form (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Request School Portal Deployment or Consultation</h3>
            <p className="text-xs text-slate-600 mt-1">
              Complete the form below to configure BummptEducation for your secondary school arm or schedule a demonstration.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-emerald-950">Inquiry Transmitted Successfully</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Thank you. Matthew Ternenge Beeun and the technical engineering desk at Bummptech Global Concepts will respond within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 inline-block text-xs font-bold text-emerald-800 underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Your Full Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. John Okeke"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email Address:</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. principal@school.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">School / Institution Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Secondary School, Makurdi"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deployment Scope / Message:</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Describe your student capacity (JSS1 - SSS3), grading requirements, or specific administrative workflows..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition active:scale-98"
              >
                <Send className="h-4 w-4" />
                <span>Submit Direct Inquiry to Bummptech Global</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
