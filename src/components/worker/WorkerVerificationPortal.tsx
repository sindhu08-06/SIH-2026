import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  FileCheck,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Lock,
  ExternalLink,
  RefreshCw,
  Clock,
  Check,
  Plus,
  Stamp,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { ApiWorker, ApiCertification, api } from '../../services/api';
import { getTradeSkillCheck, CREDENTIAL_DOCUMENT_TYPES } from '../../data/skillChecks';
import { AccessibleSkillQuiz } from './AccessibleSkillQuiz';

interface WorkerVerificationPortalProps {
  worker: ApiWorker;
  onWorkerUpdated: (updated: ApiWorker) => void;
}

export const WorkerVerificationPortal: React.FC<WorkerVerificationPortalProps> = ({
  worker,
  onWorkerUpdated,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<ApiCertification[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);
  const [isAddingCert, setIsAddingCert] = useState(false);

  // Form states
  const [idType, setIdType] = useState(worker.id_proof_type || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(worker.id_proof_number || '');
  const [certTitle, setCertTitle] = useState(worker.cert_title || `${worker.primary_skill} Vocational Certificate`);
  const [certNumber, setCertNumber] = useState(worker.cert_number || '');
  const [issuingBody, setIssuingBody] = useState(worker.issuing_body || 'National Skill Development Corporation (NSDC)');
  const [emergencyConsent, setEmergencyConsent] = useState(true);
  const [safetyPledge, setSafetyPledge] = useState(true);

  // New Cert State
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newIssuingBody, setNewIssuingBody] = useState('Directorate General of Training (DGT)');
  const [newDocType, setNewDocType] = useState<'license' | 'degree' | 'police_clearance' | 'trade_certificate'>('license');

  // Skill Check Quiz State
  const [isTakingSkillCheck, setIsTakingSkillCheck] = useState(false);
  const [useAccessibleQuizMode, setUseAccessibleQuizMode] = useState(true);
  const [skillQuizTrade, setSkillQuizTrade] = useState(worker.primary_skill || 'Electrical');
  const [skillQuizAnswers, setSkillQuizAnswers] = useState<Record<string, number>>({});

  const handleSubmitSkillQuiz = async () => {
    const check = getTradeSkillCheck(skillQuizTrade);
    const correct = check.questions.reduce((acc, q) => {
      return skillQuizAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
    }, 0);
    const percentage = Math.round((correct / check.questions.length) * 100);

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.submitSkillCheck(worker.id, {
        trade: skillQuizTrade,
        score: correct,
        total: check.questions.length,
        percentage,
      });
      if (res.success && res.worker) {
        onWorkerUpdated(res.worker);
        setSuccessNotice(`Trade Skill Check passed with ${percentage}% score! Verification seal updated.`);
        setIsTakingSkillCheck(false);
        loadCertifications();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit skill assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const loadCertifications = async () => {
    setIsLoadingCerts(true);
    try {
      const res = await api.getCertifications({ workerId: worker.id });
      if (res.success) {
        setCertifications(res.certifications);
      }
    } catch (err) {
      console.warn('Could not load certifications:', err);
    } finally {
      setIsLoadingCerts(false);
    }
  };

  useEffect(() => {
    loadCertifications();
  }, [worker.id]);

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.submitWorkerVerification(worker.id, {
        idProofType: idType,
        idProofNumber: idNumber,
        certTitle,
        certNumber,
        issuingBody,
        emergencyCertified: emergencyConsent,
      });

      if (res.success && res.worker) {
        onWorkerUpdated(res.worker);
        setSuccessNotice('Verification credentials successfully submitted to the Federation Verification Queue!');
        loadCertifications();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNewCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertTitle || !newCertNumber) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.addCertification({
        workerId: worker.id,
        title: newCertTitle,
        credentialNumber: newCertNumber,
        issuingBody: newIssuingBody,
        documentType: newDocType,
        issueDate: new Date().toISOString().split('T')[0],
      });
      if (res.success) {
        setSuccessNotice('Additional trade license submitted for Board audit!');
        setIsAddingCert(false);
        setNewCertTitle('');
        setNewCertNumber('');
        loadCertifications();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit additional certification');
    } finally {
      setSubmitting(false);
    }
  };

  // Instant simulator for testing
  const handleSimulateApproval = async () => {
    setErrorMessage(null);
    try {
      const res = await api.approveWorker(worker.id, {
        approvedBy: 'Federation Technical Board',
        notes: 'Documents & trade certification validated against state cooperative database.',
      });
      if (res.success && res.worker) {
        onWorkerUpdated(res.worker);
        setSuccessNotice('Worker successfully verified with Official Cooperative Shield!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval simulation failed');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-slate-900">Artisan Verification Center</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                worker.verification_status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : worker.verification_status === 'under_review'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              Status: {worker.verification_status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Official federation background verification & skill credentials validation under Maharashtra Cooperative Act.
          </p>
        </div>

        {/* Action button if under review: Quick Test Approve */}
        {worker.verification_status === 'under_review' && (
          <button
            onClick={handleSimulateApproval}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simulate Admin Approval (Instant Test)</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {successNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Case 1: VERIFIED */}
      {worker.verification_status === 'verified' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Federation Verified Cooperative Artisan Badge Active
                  </h4>
                  {(worker as any).verification_pathway && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                      {(worker as any).verification_pathway === 'practical_experience' ? '🛠️ Practical Experience Pathway' :
                       (worker as any).verification_pathway === 'coop_peer_endorsement' ? '🤝 Cooperative Guild Endorsed' :
                       (worker as any).verification_pathway === 'provisional_apprentice' ? '🧭 Supervised Field Apprentice' :
                       'Certified Trade Pathway'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Your government identification, trade credentials, and practical competency have been audited and approved by the Cooperative Federation Board. You are authorized to receive high-value dispatches and emergency calls.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block">CREDENTIAL</span>
                    <span className="font-bold text-slate-900">{worker.cert_title || 'Master Technician'}</span>
                    <span className="text-[11px] text-slate-500 block">{worker.cert_number || 'REG-MH-2026'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block">VERIFIED BY</span>
                    <span className="font-bold text-slate-900">{worker.verified_by || 'State Board'}</span>
                    <span className="text-[11px] text-slate-500 block">Date: {worker.verified_at || 'Recent'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block">WELFARE COVER</span>
                    <span className="font-bold text-emerald-800">₹2,00,000 PMSBY</span>
                    <span className="text-[11px] text-emerald-600 block">Sahakar Arogya Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Skill Competency Assessment Status & Retake Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h5 className="font-bold text-sm text-white">Trade Skill & Safety Competency Assessment</h5>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Standardized technical diagnostic questions adhering to Indian Standards (IS codes)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Score: {worker.skill_check_score ?? 100}% Passed
                </span>
                <button
                  type="button"
                  onClick={() => setIsTakingSkillCheck(!isTakingSkillCheck)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {isTakingSkillCheck ? 'Close Quiz' : 'Retake Assessment'}
                </button>
              </div>
            </div>

            {worker.digital_seal_code && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <Stamp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cryptographic Digital Seal: {worker.digital_seal_code}</span>
              </div>
            )}

            {/* Interactive Assessment Modal / Form */}
            {isTakingSkillCheck && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                {/* Mode Selector */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">
                      {skillQuizTrade} Trade Competency Check
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUseAccessibleQuizMode(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        useAccessibleQuizMode
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Voice & Picture (Accessible)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseAccessibleQuizMode(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        !useAccessibleQuizMode
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Standard Text Quiz</span>
                    </button>
                  </div>
                </div>

                {useAccessibleQuizMode ? (
                  <div className="pt-1">
                    <AccessibleSkillQuiz
                      trade={skillQuizTrade}
                      workerName={worker.name}
                      initialLang="hi"
                      onComplete={async (scorePercentage, passed) => {
                        setSubmitting(true);
                        try {
                          const res = await api.submitSkillCheck(worker.id, {
                            trade: skillQuizTrade,
                            score: Math.round((scorePercentage / 100) * 3),
                            total: 3,
                            percentage: scorePercentage,
                          });
                          if (res.success && res.worker) {
                            onWorkerUpdated(res.worker);
                            setSuccessNotice(`Trade Skill Check passed with ${scorePercentage}% score! Cryptographic seal updated.`);
                            setIsTakingSkillCheck(false);
                            loadCertifications();
                          }
                        } catch (err: any) {
                          setErrorMessage(err.message || 'Failed to submit skill assessment');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      onCancel={() => setIsTakingSkillCheck(false)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {getTradeSkillCheck(skillQuizTrade).questions.map((q, idx) => {
                        const ans = skillQuizAnswers[q.id];
                        const isAnswered = ans !== undefined;
                        const isCorrect = ans === q.correctIndex;

                        return (
                          <div key={q.id} className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-200">
                                {idx + 1}. {q.question}
                              </span>
                              <span className="text-[10px] text-teal-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                                {q.conceptTag}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => {
                                const isChosen = ans === optIdx;
                                let cls = 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-700';
                                if (isAnswered) {
                                  if (isChosen && isCorrect) {
                                    cls = 'bg-emerald-700 border-emerald-500 text-white font-bold';
                                  } else if (isChosen && !isCorrect) {
                                    cls = 'bg-amber-700 border-amber-500 text-white font-bold';
                                  } else if (optIdx === q.correctIndex) {
                                    cls = 'bg-emerald-950 border-emerald-700 text-emerald-300 font-semibold';
                                  }
                                }
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => setSkillQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                    className={`w-full text-left p-2 rounded-lg border text-[11px] transition cursor-pointer flex items-center justify-between ${cls}`}
                                  >
                                    <span>{opt}</span>
                                    {isAnswered && optIdx === q.correctIndex && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                  </button>
                                );
                              })}
                            </div>

                            {isAnswered && (
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                ✓ {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsTakingSkillCheck(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitting || Object.keys(skillQuizAnswers).length < 3}
                        onClick={handleSubmitSkillQuiz}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        {submitting ? 'Saving Assessment...' : 'Submit & Update Digital Seal'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case 2: UNDER REVIEW */}
      {worker.verification_status === 'under_review' && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm mb-1">
                Your Credentials are Under Federation Board Audit
              </h4>
              <p className="text-slate-600 leading-relaxed mb-3">
                Your documents have been submitted to the cooperative verification officer queue. Typical review turnaround is 12–24 hours. Once approved, the Verified Artisan Badge will appear on your customer profile.
              </p>
              <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                <div><strong>Submitted ID:</strong> {worker.id_proof_type} ({worker.id_proof_number})</div>
                <div><strong>Trade License:</strong> {worker.cert_title} ({worker.cert_number})</div>
                <div><strong>Issuing Authority:</strong> {worker.issuing_body}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case 3: UNVERIFIED OR REJECTED (SUBMISSION FORM) */}
      {(worker.verification_status === 'unverified' || worker.verification_status === 'rejected') && (
        <form onSubmit={handleSubmitVerification} className="space-y-6 text-xs">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Verification Pending:</span> Complete your credential submission below to get verified and start receiving customer service requests.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Proof Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Government ID Proof Type</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm bg-white"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter Identity Card">Voter Identity Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Passport">Passport</option>
              </select>
            </div>

            {/* ID Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">ID Number / Reference</label>
              <input
                type="text"
                required
                placeholder="e.g. 5492 8491 0293"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm"
              />
            </div>

            {/* Trade Certificate Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trade Certificate / Vocational Credential</label>
              <input
                type="text"
                required
                placeholder="e.g. ITI National Trade Certificate / PWD Wireman License"
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm"
              />
            </div>

            {/* Certificate Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Certificate / License Number</label>
              <input
                type="text"
                required
                placeholder="e.g. ITI/2022/ELEC/8492"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm"
              />
            </div>

            {/* Issuing Authority */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Issuing Authority / Board</label>
              <input
                type="text"
                required
                placeholder="e.g. Directorate General of Training (DGT) / Maharashtra PWD Licensing Board"
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm"
              />
            </div>
          </div>

          {/* Document Upload Simulator */}
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">Upload Certificate Document (PDF or Photo)</div>
            <div className="text-slate-500 text-[11px] mt-1">Drag and drop or click to attach license/ID document</div>
            <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold">
              ✓ Document Attached: {certTitle || 'trade_certificate'}.pdf
            </div>
          </div>

          {/* Declarations */}
          <div className="space-y-2 pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyConsent}
                onChange={(e) => setEmergencyConsent(e.target.checked)}
                className="mt-1 rounded text-teal-600"
              />
              <span className="text-slate-700 text-xs">
                I am qualified and willing to receive emergency rapid-response dispatches (15-min response SLA).
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyPledge}
                onChange={(e) => setSafetyPledge(e.target.checked)}
                className="mt-1 rounded text-teal-600"
              />
              <span className="text-slate-700 text-xs">
                I pledge adherence to the Cooperative Code of Ethics, transparent pricing, and safety equipment standards.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting to Board...' : 'Submit Credentials for Federation Review'}
          </button>
        </form>
      )}

      {/* Trade Certifications & Credentials Portfolio */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Cooperative Trade Certifications & Digital Seals ({certifications.length})</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Each approved credential generates a cryptographic verification seal on the customer dispatch network.
            </p>
          </div>
          <button
            onClick={() => setIsAddingCert(!isAddingCert)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingCert ? 'Cancel' : 'Add Trade License'}</span>
          </button>
        </div>

        {/* Add Certificate Form */}
        {isAddingCert && (
          <form onSubmit={handleAddNewCert} className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-3">
            <h5 className="font-bold text-slate-900 text-xs">Submit Additional Trade Credential</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Certification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PWD Electrician License Class A"
                  value={newCertTitle}
                  onChange={(e) => setNewCertTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">License / Reg Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH/ELEC/2024/9021"
                  value={newCertNumber}
                  onChange={(e) => setNewCertNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Issuing Authority / Board</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra State Licensing Board"
                  value={newIssuingBody}
                  onChange={(e) => setNewIssuingBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Credential Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="license">Trade License</option>
                  <option value="trade_certificate">Vocational Certificate</option>
                  <option value="degree">ITI / Polytechnic Diploma</option>
                  <option value="police_clearance">Police Clearance Certificate</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Credential to Board'}
            </button>
          </form>
        )}

        {/* Certifications Cards */}
        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certifications.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{c.title}</h5>
                    <p className="text-[11px] text-slate-500">{c.issuing_body}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      c.verification_status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : c.verification_status === 'under_review'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {c.verification_status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                  <span className="font-mono font-semibold">{c.credential_number}</span>
                  <span>{c.expiry_date || 'Life Validity'}</span>
                </div>

                {c.digital_seal_code && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    <Stamp className="w-3 h-3 text-emerald-700" />
                    <span>Seal: {c.digital_seal_code}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            No additional trade certifications logged. Initial registration credential is active.
          </div>
        )}
      </div>
    </div>
  );
};
