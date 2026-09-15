import React from 'react';
import { ShieldCheck, X, Award, CheckCircle2, Calendar, FileText, ExternalLink, Stamp } from 'lucide-react';
import { WorkerProfile, Language } from '../../types';

interface WorkerCredentialsModalProps {
  worker: WorkerProfile;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const WorkerCredentialsModal: React.FC<WorkerCredentialsModalProps> = ({
  worker,
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  const verifiedCerts = (worker.certifications || []).filter(
    (c) => c.verificationStatus === 'verified'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 shrink-0">
          <div className="relative">
            <img
              src={worker.avatar}
              alt={worker.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-300"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">{worker.name}</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Coop Certified
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-800">{worker.primarySkill}</p>
            <p className="text-[11px] text-slate-500">{worker.societyName}</p>
          </div>
        </div>

        {/* Verification Authority Banner */}
        <div className="my-3 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Stamp className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-emerald-950">
              Federation Audited & Police Clearance Verified
            </p>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Verified by {worker.verifiedBy || 'State Cooperative Technical Inspection Board'} on{' '}
              {worker.verifiedAt || 'Active Roster'}.
            </p>
          </div>
        </div>

        {/* Trade Skill Competency Assessment Clearance */}
        <div className="mb-3 p-3 rounded-2xl bg-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-xs text-white">Trade Competency & Safety Cleared</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              Score: {worker.skillCheckScore ?? 100}%
            </span>
          </div>
          <p className="text-[10px] text-slate-300">
            Adheres to Indian Standard (IS) work protocols, verified diagnostic measurements, and mandatory PPE safety codes.
          </p>
          {worker.digitalSealCode && (
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-emerald-400">
              <span>Digital Cooperative Seal:</span>
              <span className="font-bold">{worker.digitalSealCode}</span>
            </div>
          )}
        </div>

        {/* Certifications List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verified Trade Licenses & Credentials ({worker.certifications?.length || 0})
          </h4>

          {worker.certifications && worker.certifications.length > 0 ? (
            worker.certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 hover:border-emerald-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-extrabold text-xs text-slate-900">{cert.title}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      cert.verificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {cert.verificationStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">{cert.issuingBody}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Credential / Reg No:</span>
                    <span className="font-mono font-bold text-slate-800">{cert.credentialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Validity:</span>
                    <span className="font-semibold text-slate-700">
                      {cert.expiryDate || 'Life Validity'}
                    </span>
                  </div>
                </div>

                {cert.digitalSealCode && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Cryptographic Seal: {cert.digitalSealCode}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No additional certifications uploaded yet. Primary trade clearance verified.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Cooperative Board Guaranteed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
