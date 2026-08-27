import React from 'react';
import { FeePayment, Student } from '../types';
import { formatNaira } from '../utils/grading';
import { BummptechLogo } from './BummptechLogo';
import { Printer, X, CheckCircle, Receipt, ShieldCheck } from 'lucide-react';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: FeePayment;
  student?: Student;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  student,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div 
        id="bursary-receipt-modal"
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:my-0 print:w-full"
      >
        {/* Top Action Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800">
              Official Bursary Receipt • {payment.receiptNumber}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              id="print-receipt-btn"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 text-slate-800 print:p-6 text-sm">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <BummptechLogo size="md" />
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {payment.status.toUpperCase()}
                </span>
                <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                  Receipt No: {payment.receiptNumber}
                </p>
                <p className="text-[11px] text-slate-500">Date: {payment.paymentDate}</p>
              </div>
            </div>
            <div className="mt-2 text-center">
              <h2 className="text-lg font-black uppercase text-slate-900">
                BummptEducation Secondary School
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Official Bursary & School Fees Electronic Clearance Slip
              </p>
            </div>
          </div>

          {/* Student details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-slate-500 block">Received From Student:</span>
              <strong className="text-slate-900 text-sm">{student?.fullName || payment.studentId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Admission Number:</span>
              <strong className="text-slate-900 text-sm font-mono">{student?.admissionNumber || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Class Level:</span>
              <strong className="text-slate-800">{payment.classLevel}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Term / Session:</span>
              <strong className="text-slate-800">{payment.term} ({payment.academicYear})</strong>
            </div>
          </div>

          {/* Transaction Summary Table */}
          <table className="w-full border-collapse border border-slate-300 text-xs mb-6">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="border border-slate-300 p-2.5 text-left">Description of Academic & Auxiliary Fees</th>
                <th className="border border-slate-300 p-2.5 text-right w-36">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2.5 font-medium text-slate-800">
                  Total Termly Fee Schedule (Tuition, Development, Lab, PTA, ICT & Medical)
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono text-slate-900">
                  {formatNaira(payment.totalBilled)}
                </td>
              </tr>
              <tr className="bg-emerald-50/50">
                <td className="border border-slate-300 p-2.5 font-bold text-emerald-900">
                  Amount Paid (Payment Method: {payment.paymentMethod})
                </td>
                <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-emerald-700 text-sm">
                  {formatNaira(payment.amountPaid)}
                </td>
              </tr>
              <tr className="bg-slate-100">
                <td className="border border-slate-300 p-2.5 font-bold text-slate-900">
                  Outstanding Balance
                </td>
                <td className={`border border-slate-300 p-2.5 text-right font-mono font-bold ${payment.balance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatNaira(payment.balance)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Authorization signature */}
          <div className="flex justify-between items-end border-t border-slate-200 pt-6 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Verified & Authorized By:</p>
              <p className="text-slate-600 italic mt-1">{payment.collectedBy}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">School Bursar & Head of Finance</span>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                <span>CLEARED FOR TERM EXAMS</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Generated via BummptEducation Bursary Portal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
