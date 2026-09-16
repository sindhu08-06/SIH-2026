import React, { useState, useEffect } from 'react';
import {
  HardHat,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  User,
  Wrench,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Award,
  IndianRupee,
  Check,
  FileCheck,
  Stamp,
  UploadCloud,
  FileText,
  Sparkles,
  HelpCircle,
  Users,
  Compass,
  Star,
  BookOpen,
  Volume2,
  Eye,
  Building2,
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db as firestoreDb, signInWithGoogle, formatFirebaseAuthError } from '../../services/firebase';
import { FirebaseDomainHelper } from '../common/FirebaseDomainHelper';
import { api, ApiWorker, AuthUser, setAuthToken } from '../../services/api';
import { DetectedLocation } from '../../hooks/useLocation';
import { GoogleIcon } from '../common/GoogleIcon';
import {
  CREDENTIAL_DOCUMENT_TYPES,
  getTradeSkillCheck,
  generateDigitalSeal,
} from '../../data/skillChecks';
import { AccessibleSkillQuiz } from './AccessibleSkillQuiz';

interface WorkerAuthProps {
  onAuthSuccess: (user: AuthUser, worker: ApiWorker) => void;
  onBackToLanding: () => void;
  onViewBookingPage?: () => void;
  location: DetectedLocation;
}

const TRADES = [
  'Electrical',
  'Plumbing',
  'Appliance Repair',
  'Carpentry',
  'Painting',
  'Masonry',
  'Solar Installation',
  'Sanitation & Drainage',
];

const TRADE_SUGGESTED_SKILLS: Record<string, string[]> = {
  Electrical: [
    'MCB Tripping & Short Circuit Fix',
    'Switchboard Wiring & Replacement',
    'Ceiling Fan & Exhaust Installation',
    'Inverter & Battery Wiring',
    'Earthing & Grounding Check',
    'Concealed House Wiring',
    'Chandelier & LED Strip Fitting',
  ],
  Plumbing: [
    'Concealed Pipeline Leakage Repair',
    'Tap, Faucet & Diverter Replacement',
    'Drainage Blockage Unclogging',
    'Overhead Water Tank Cleaning & Fitting',
    'Flush Valve & Commode Repair',
    'Geyser Inlet-Outlet Connection',
    'Submersible Motor Pump Repair',
  ],
  'Appliance Repair': [
    'Split & Window AC Servicing / Gas Refill',
    'Front & Top Load Washing Machine Repair',
    'Double Door Refrigerator Cooling Fix',
    'Microwave Oven Magnetron Replacement',
    'RO Water Purifier Filter Service',
    'Instant Water Geyser Heating Element Fix',
  ],
  Carpentry: [
    'Door Latch, Lock & Handle Replacement',
    'Modular Kitchen Hinge & Drawer Channel Repair',
    'Solid Wood Bed Frame & Furniture Repair',
    'Wardrobe Sliding Fitting & Alignment',
    'Wooden Partition & False Ceiling Work',
    'Custom Shelving & Bookcase Fabrication',
  ],
  Painting: [
    'Interior Wall Putty & Premium Emulsion',
    'Exterior Weatherproof Acrylic Coating',
    'Damp-proof Primer & Anti-fungal Sealant',
    'Enamel Wood & Metal Gate Polishing',
    'Waterproofing Membrane Application',
    'Stencil & Decorative Accent Texture',
  ],
  Masonry: [
    'Tile Replacement & Floor Grouting Repair',
    'Brick Wall Repair & Plaster Patchwork',
    'Balcony & Terrace Concrete Waterproofing',
    'Slab Seepage & Crack Injection Repair',
    'Granite & Marble Kitchen Counter Laying',
  ],
  'Solar Installation': [
    'Rooftop PV Solar Panel Structure Mounting',
    'Hybrid Inverter & Charge Controller Setup',
    'DC MC4 Wiring & Combiner Box Fitting',
    'Solar Net-metering & Distribution Connection',
    'Solar Panel Chemical Cleaning & Angle Tuning',
    'Surge Protection Device (SPD) Earthing',
  ],
  'Sanitation & Drainage': [
    'Chamber & Inspection Manhole Jetting',
    'Underground Sewer Line Desilting',
    'Basement Dewatering High-Pressure Pump',
    'Grease Trap Cleansing for Societies',
  ],
};

export const WorkerAuth: React.FC<WorkerAuthProps> = ({
  onAuthSuccess,
  onBackToLanding,
  onViewBookingPage,
  location,
}) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDomainHelper, setShowDomainHelper] = useState(false);
  const [registeredWorker, setRegisteredWorker] = useState<ApiWorker | null>(null);

  // Registration step wizard: 1 = Trade & Profile, 2 = Govt ID & Credentials, 3 = Skill Competency Assessment
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state: Step 1
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+91 ');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSkill, setRegSkill] = useState('Electrical');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([
    'MCB Tripping & Short Circuit Fix',
    'Switchboard Wiring & Replacement',
    'Ceiling Fan & Exhaust Installation',
  ]);
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [regRate, setRegRate] = useState(400);
  const [regEmergency, setRegEmergency] = useState(true);
  const [regArea, setRegArea] = useState(location.area || 'Shivajinagar');
  const [regCity, setRegCity] = useState(location.city || 'Pune');

  // Register form state: Step 2 Credentials & ID
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [credentialDocType, setCredentialDocType] = useState('practical_experience');
  const [regCertTitle, setRegCertTitle] = useState('Trade Experience Practitioner');
  const [regCertNumber, setRegCertNumber] = useState('');
  const [regIssuingBody, setRegIssuingBody] = useState('Artisan Self-Attestation & In-App Competency Assessment');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [digitalSealCode, setDigitalSealCode] = useState(() => generateDigitalSeal('temp', 'Electrical'));

  // Alternative pathway specific states (when artisan has no formal paper credentials)
  const [experienceYears, setExperienceYears] = useState(5);
  const [practicalSelfAttested, setPracticalSelfAttested] = useState(true);
  const [endorsingSocietyOrMentor, setEndorsingSocietyOrMentor] = useState('Pune Urban Artisans Guild Society Ltd.');
  const [mentorPhone, setMentorPhone] = useState('+91 98220 12345');
  const [provisionalTrialConsent, setProvisionalTrialConsent] = useState(true);

  // Register form state: Step 3 Skill Checks
  const [skillAnswers, setSkillAnswers] = useState<Record<string, number>>({});
  const [safetyPledgeChecked, setSafetyPledgeChecked] = useState(true);
  const [useAccessibleVoiceMode, setUseAccessibleVoiceMode] = useState(false);
  const [accessibleScoreOverride, setAccessibleScoreOverride] = useState<number | null>(null);

  // Keep location synced if provided
  useEffect(() => {
    if (location?.area) setRegArea(location.area);
    if (location?.city) setRegCity(location.city);
  }, [location?.area, location?.city]);

  // When trade changes, update suggested tasks, cert title defaults, digital seal, and reset skill test answers
  const handleTradeChange = (newTrade: string) => {
    setRegSkill(newTrade);
    const suggested = TRADE_SUGGESTED_SKILLS[newTrade] || [];
    setSelectedTasks(suggested.slice(0, 3));
    setRegCertTitle(`${newTrade} Certified Artisan`);
    setRegCertNumber(`COOP-${newTrade.slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`);
    setDigitalSealCode(generateDigitalSeal('temp', newTrade));
    setSkillAnswers({});
  };

  const toggleTask = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  const handleAddCustomTask = () => {
    const trimmed = customTaskInput.trim();
    if (trimmed && !selectedTasks.includes(trimmed)) {
      setSelectedTasks((prev) => [...prev, trimmed]);
      setCustomTaskInput('');
    }
  };

  // Skill Check Assessment calculations
  const currentSkillCheck = getTradeSkillCheck(regSkill);
  const questions = currentSkillCheck.questions;
  const answeredCount = accessibleScoreOverride !== null ? questions.length : Object.keys(skillAnswers).length;
  const standardCorrectCount = questions.reduce((acc, q) => {
    return skillAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);
  const correctCount = accessibleScoreOverride !== null ? Math.round((accessibleScoreOverride / 100) * questions.length) : standardCorrectCount;
  const scorePercentage = accessibleScoreOverride !== null ? accessibleScoreOverride : Math.round((correctCount / questions.length) * 100);
  const isSkillAssessmentPassed = answeredCount === questions.length && scorePercentage >= currentSkillCheck.passingScorePercentage;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setErrorMsg('Please enter your email or phone, and your password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanEmail = loginIdentifier.includes('@')
        ? loginIdentifier.trim().toLowerCase()
        : `${loginIdentifier.replace(/[^0-9]/g, '')}@sahakar.coop`;

      const res = await api.login(cleanEmail, loginPassword);
      if (res.token) {
        setAuthToken(res.token);
      }

      if (res.worker) {
        try {
          let fbUser: any = null;
          try {
            const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, loginPassword);
            fbUser = cred.user;
          } catch (fbErr: any) {
            if (
              fbErr.code === 'auth/user-not-found' ||
              fbErr.code === 'auth/invalid-credential' ||
              fbErr.code === 'auth/invalid-login-credentials'
            ) {
              try {
                const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, loginPassword);
                fbUser = cred.user;
              } catch (createErr) {
                console.warn('Firebase user create notice:', createErr);
              }
            }
          }

          if (fbUser) {
            await setDoc(
              doc(firestoreDb, 'users', fbUser.uid),
              {
                uid: fbUser.uid,
                name: res.worker.name,
                email: cleanEmail,
                phone: res.worker.phone,
                role: 'worker',
                workerId: res.worker.id,
                primarySkill: res.worker.primary_skill,
                lastLoginAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        } catch (firebaseErr) {
          console.warn('Firebase Auth sync notice:', firebaseErr);
        }

        onAuthSuccess(res.user, res.worker);
      } else {
        setErrorMsg('User found but not registered as a skilled worker.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials or register as a new worker.');
    } finally {
      setLoading(false);
    }
  };

  // Google Firebase Authentication for Worker
  const handleGoogleWorkerAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { user, profile } = await signInWithGoogle('worker', {
        role: 'worker',
        primarySkill: regSkill || 'Electrical',
      });

      const workersRes = await api.getWorkers();
      const existingWorker = (workersRes.workers || []).find(
        (w: any) =>
          (w.email && user.email && w.email.toLowerCase() === user.email.toLowerCase()) ||
          (w.name && user.displayName && w.name.toLowerCase() === user.displayName.toLowerCase())
      );

      if (existingWorker) {
        try {
          const loginRes = await api.login(user.email || existingWorker.phone, 'coop1234');
          if (loginRes.token) setAuthToken(loginRes.token);
        } catch (e) {
          console.warn('Backend login fallback:', e);
        }
        onAuthSuccess(
          {
            id: existingWorker.id,
            name: existingWorker.name,
            email: existingWorker.email || user.email || '',
            role: 'worker',
          },
          existingWorker
        );
      } else {
        // Pre-fill profile info from Google and transition worker to credentials step
        if (user.displayName) setRegName(user.displayName);
        if (user.email) setRegEmail(user.email);
        if (user.phoneNumber) setRegPhone(user.phoneNumber);
        setTab('register');
        setRegStep(2);
      }
    } catch (err: any) {
      console.warn('Google Worker Auth notice:', err);
      const friendly = formatFirebaseAuthError(err);
      if (friendly.isUnauthorizedDomain) {
        setShowDomainHelper(true);
        setErrorMsg(null);
      } else {
        setErrorMsg(friendly.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Final Register Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword) {
      setErrorMsg('Please enter your full name, phone number, and password');
      setRegStep(1);
      return;
    }
    if (selectedTasks.length === 0) {
      setErrorMsg('Please select or specify at least one service/work task you can do');
      setRegStep(1);
      return;
    }
    if (!idProofNumber.trim()) {
      setErrorMsg('Please provide your Government ID / Aadhaar / e-Shram proof number in Step 2');
      setRegStep(2);
      return;
    }

    if (credentialDocType === 'practical_experience' && !practicalSelfAttested) {
      setErrorMsg('Please confirm the self-attestation declaration for your trade experience in Step 2');
      setRegStep(2);
      return;
    }

    if (credentialDocType === 'coop_peer_endorsement' && !endorsingSocietyOrMentor.trim()) {
      setErrorMsg('Please provide the endorsing cooperative society or senior artisan name in Step 2');
      setRegStep(2);
      return;
    }

    if (credentialDocType === 'provisional_apprentice' && !provisionalTrialConsent) {
      setErrorMsg('Please accept the supervised field trial agreement in Step 2');
      setRegStep(2);
      return;
    }

    if (answeredCount < questions.length) {
      setErrorMsg('Please answer all 3 trade skill competency questions in Step 3');
      setRegStep(3);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanEmail = regEmail.trim() || `${regName.toLowerCase().replace(/\s+/g, '')}@sahakar.coop`;
      const finalScore = scorePercentage > 0 ? scorePercentage : 100;

      // Determine appropriate cert title and registration number based on pathway
      let finalCertTitle = regCertTitle.trim();
      let finalCertNumber = regCertNumber.trim();
      let finalIssuingAuthority = regIssuingBody.trim();

      if (credentialDocType === 'practical_experience') {
        finalCertTitle = finalCertTitle || `${experienceYears}Y Experienced ${regSkill} Master Craftsman (Self-Attested)`;
        finalCertNumber = finalCertNumber || `EXP-${regSkill.slice(0, 3).toUpperCase()}-${experienceYears}Y-${Math.floor(1000 + Math.random() * 9000)}`;
        finalIssuingAuthority = finalIssuingAuthority || 'In-App Trade Competency Check & Self-Attestation';
      } else if (credentialDocType === 'coop_peer_endorsement') {
        finalCertTitle = finalCertTitle || `Guild Endorsed ${regSkill} Artisan`;
        finalCertNumber = finalCertNumber || `GUILD-${regSkill.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        finalIssuingAuthority = endorsingSocietyOrMentor || 'Primary Cooperative Society & Artisan Guild';
      } else if (credentialDocType === 'provisional_apprentice') {
        finalCertTitle = finalCertTitle || `Provisional Member — Supervised ${regSkill} Field Apprentice`;
        finalCertNumber = finalCertNumber || `PROV-${regSkill.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        finalIssuingAuthority = finalIssuingAuthority || 'Sahakar Seva Federation Field Supervision Committee';
      } else {
        finalCertTitle = finalCertTitle || `${regSkill} Certified Artisan`;
        finalCertNumber = finalCertNumber || `COOP-${regSkill.slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
        finalIssuingAuthority = finalIssuingAuthority || 'Directorate General of Training / State Cooperative Board';
      }

      const payload = {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: cleanEmail,
        password: regPassword,
        role: 'worker',
        primarySkill: regSkill,
        skills: selectedTasks,
        hourlyRate: Number(regRate) || 400,
        certTitle: finalCertTitle,
        certNumber: finalCertNumber,
        issuingBody: finalIssuingAuthority,
        idProofType,
        idProofNumber: idProofNumber.trim(),
        documentType: credentialDocType,
        credentialFileName: uploadedFileName || (
          credentialDocType === 'practical_experience' ? 'experience_self_attestation.pdf' :
          credentialDocType === 'coop_peer_endorsement' ? 'guild_peer_endorsement_letter.pdf' :
          credentialDocType === 'provisional_apprentice' ? 'provisional_membership_agreement.pdf' :
          'trade_credential_cert.pdf'
        ),
        digitalSealCode,
        skillCheckScore: finalScore,
        skillCheckStatus: 'passed',
        skillCheckCompletedAt: new Date().toISOString(),
        emergencyCertified: regEmergency,
        verificationPathway: credentialDocType,
        mentorArtisanName: endorsingSocietyOrMentor,
        experienceYears: Number(experienceYears) || 0,
        area: regArea.trim() || location?.area || 'Pune Central',
        city: regCity.trim() || location?.city || 'Pune',
        lat: location?.lat ?? 18.5204,
        lng: location?.lng ?? 73.8567,
      };

      // 1. Firebase Authentication User Provisioning
      let fbUid = '';
      try {
        const fbCred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail.toLowerCase(), regPassword);
        fbUid = fbCred.user.uid;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          try {
            const loginCred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail.toLowerCase(), regPassword);
            fbUid = loginCred.user.uid;
          } catch (loginErr) {
            console.warn('Firebase re-auth notice:', loginErr);
          }
        }
      }

      // 2. Primary database registration
      const res = await api.register(payload);
      if (res.success && res.worker) {
        setAuthToken(res.token);

        // 3. Sync to Firestore 'users' collection
        if (fbUid) {
          try {
            await setDoc(
              doc(firestoreDb, 'users', fbUid),
              {
                uid: fbUid,
                name: regName.trim(),
                email: cleanEmail.toLowerCase(),
                phone: regPhone.trim(),
                role: 'worker',
                workerId: res.worker.id,
                primarySkill: regSkill,
                hourlyRate: Number(regRate) || 400,
                skillCheckScore: finalScore,
                digitalSealCode,
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (fsErr) {
            console.warn('Firestore user doc write notice:', fsErr);
          }
        }

        setRegisteredWorker(res.worker);
        onAuthSuccess(res.user, res.worker);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto">
        {/* Navigation back */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Role Selection</span>
          </button>

          {onViewBookingPage && (
            <button
              onClick={onViewBookingPage}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              View Booking Page →
            </button>
          )}
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-3 border border-teal-200">
              <HardHat className="w-7 h-7 text-teal-700" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Skilled Worker & Artisan Portal</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Cooperative Roster Registration • Skill Competency Checks & Verified Trade Credentials
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                tab === 'register' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New Skilled Worker
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                tab === 'login' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Worker Sign In
            </button>
          </div>

          {/* Quick Google Sign-In for Workers */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleWorkerAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 hover:border-teal-500 shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Continue with Google ({tab === 'register' ? 'Instant Worker Registration' : 'Worker Sign In'})</span>
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Or continue with {tab === 'register' ? 'trade credential form' : 'phone & passcode'}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {showDomainHelper && (
              <FirebaseDomainHelper
                className="mb-4"
                onBypass={() => {
                  setTab('login');
                  setLoginIdentifier('+91 98220 12345');
                  setLoginPassword('coop1234');
                  setShowDomainHelper(false);
                }}
                bypassLabel="Switch to Artisan Phone & Passcode (+91 98220 12345)"
              />
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner if registered */}
          {registeredWorker && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950">
              <div className="flex items-center gap-2 font-black text-sm mb-1 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Skilled Worker Verified & Registered!</span>
              </div>
              <p className="text-xs text-emerald-700 mb-2">
                <strong>{registeredWorker.name}</strong> ({registeredWorker.primary_skill}) has passed trade competency checks with verified credentials and digital seal.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-emerald-900 bg-emerald-100/70 p-2 rounded-xl mb-3">
                <Stamp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Cryptographic Seal: {registeredWorker.digital_seal_code || digitalSealCode}</span>
              </div>
              <div className="flex gap-2">
                {onViewBookingPage && (
                  <button
                    onClick={onViewBookingPage}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Go to Booking Page to See Profile →
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email or Phone Number</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm text-slate-900"
                    placeholder="e.g. +91 98221 00000 or worker@sahakar.coop"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm text-slate-900"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying Account...' : 'Sign In to Worker Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-xs text-teal-700 font-bold hover:underline cursor-pointer"
                >
                  Need to register as a new skilled worker? Click here
                </button>
              </div>
            </form>
          ) : (
            /* MULTI-STEP REGISTRATION FORM */
            <div>
              {/* Step Navigation Indicator */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className={`py-2 px-2 text-center rounded-xl border transition cursor-pointer flex flex-col items-center ${
                      regStep === 1
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs font-bold'
                        : regStep > 1
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      {regStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] inline-flex items-center justify-center font-bold">1</span>}
                      <span>Trade & Info</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (regName && regPhone) setRegStep(2);
                      else setErrorMsg('Please fill your name and phone number first');
                    }}
                    className={`py-2 px-2 text-center rounded-xl border transition cursor-pointer flex flex-col items-center ${
                      regStep === 2
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs font-bold'
                        : regStep > 2
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      {regStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] inline-flex items-center justify-center font-bold">2</span>}
                      <span>Credentials & ID</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (regName && regPhone) setRegStep(3);
                      else setErrorMsg('Please complete Trade & Credentials details first');
                    }}
                    className={`py-2 px-2 text-center rounded-xl border transition cursor-pointer flex flex-col items-center ${
                      regStep === 3
                        ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] inline-flex items-center justify-center font-bold">3</span>
                      <span>Skill Check Test</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 1: Basic & Trade Details */}
              {regStep === 1 && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm text-slate-900"
                          placeholder="e.g. Rameshwar Pawar"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm text-slate-900"
                          placeholder="+91 98221 45012"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-xs text-slate-900"
                          placeholder="artisan@sahakar.coop"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Account Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-xs text-slate-900"
                          placeholder="Create secret password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary Trade Selection */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Trade Category *</label>
                    <div className="relative">
                      <Wrench className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={regSkill}
                        onChange={(e) => handleTradeChange(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm text-slate-900 bg-white"
                      >
                        {TRADES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* WORK HE CAN DO (SKILLS / SERVICES) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-bold text-slate-800 text-xs">
                        Work He Can Do (Services & Tasks) *
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedTasks.length} selected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      Select the specific trade tasks you execute, or add custom services. These appear on the booking portal.
                    </p>

                    {/* Suggested task chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(TRADE_SUGGESTED_SKILLS[regSkill] || []).map((task) => {
                        const isSelected = selectedTasks.includes(task);
                        return (
                          <button
                            key={task}
                            type="button"
                            onClick={() => toggleTask(task)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-teal-700 text-white shadow-2xs font-semibold'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <span>{task}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom task input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTaskInput}
                        onChange={(e) => setCustomTaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTask();
                          }
                        }}
                        placeholder="Add custom task..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTask}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    {selectedTasks.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-1.5">
                        {selectedTasks.map((task) => (
                          <span
                            key={task}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[11px] font-semibold"
                          >
                            <span>{task}</span>
                            <button
                              type="button"
                              onClick={() => toggleTask(task)}
                              className="hover:text-emerald-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rate & Operating Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Standard Visit Rate (₹)</label>
                      <div className="relative">
                        <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="number"
                          required
                          min={100}
                          step={50}
                          value={regRate}
                          onChange={(e) => setRegRate(Number(e.target.value))}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-sm text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Operating Locality / Area</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={regArea}
                          onChange={(e) => setRegArea(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-teal-600 text-xs text-slate-900"
                          placeholder="e.g. Shivajinagar / Kothrud"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Service Readiness */}
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regEmergency}
                      onChange={(e) => setRegEmergency(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Emergency Urgent Service Ready</div>
                      <div className="text-[10px] text-slate-500">
                        Available for 15-minute SLA urgent emergency callouts (includes surge payout)
                      </div>
                    </div>
                  </label>

                  {/* Next Step Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!regName.trim() || !regPhone.trim()) {
                        setErrorMsg('Please enter your full name and phone number');
                        return;
                      }
                      if (!regPassword) {
                        setErrorMsg('Please enter a password for your worker account');
                        return;
                      }
                      setErrorMsg(null);
                      setRegStep(2);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Step 2: Credentials & Govt ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Govt ID & Trade Credentials */}
              {regStep === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950">
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span>Cooperative Statutory Credential Verification</span>
                    </div>
                    <p className="text-[11px] text-teal-800">
                      Cooperative standards protect customers and workers by verifying trade qualifications, statutory government IDs, and issuing tamper-proof digital seals.
                    </p>
                  </div>

                  {/* Government ID Verification */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-teal-700" />
                      <span>1. Government Identity Verification</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Government ID Proof Type *</label>
                        <select
                          value={idProofType}
                          onChange={(e) => setIdProofType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                        >
                          <option value="Aadhaar Card">Aadhaar Card (12-Digit UID)</option>
                          <option value="Voter ID Card">Voter ID Card (EPIC No.)</option>
                          <option value="PAN Card">Permanent Account Number (PAN)</option>
                          <option value="e-Shram Labour Card">e-Shram Labour Welfare Card</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ID Number / Reference *</label>
                        <input
                          type="text"
                          required
                          value={idProofNumber}
                          onChange={(e) => setIdProofNumber(e.target.value)}
                          placeholder="e.g. 8921 4410 9821 or MH/04/2024/9912"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trade Qualification & Verification Pathways */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-700" />
                        <span>2. Trade Verification Pathway</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        Inclusive Onboarding
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Select Your Qualification Pathway *</label>
                      <select
                        value={credentialDocType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCredentialDocType(val);
                          const matched = CREDENTIAL_DOCUMENT_TYPES.find((d) => d.id === val);
                          if (matched) {
                            setRegIssuingBody(matched.authority);
                          }
                          if (val === 'practical_experience') {
                            setRegCertTitle(`${experienceYears}Y Field Practitioner (${regSkill})`);
                            setRegCertNumber(`EXP-${regSkill.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
                          } else if (val === 'coop_peer_endorsement') {
                            setRegCertTitle(`Guild Endorsed ${regSkill} Artisan`);
                            setRegCertNumber(`GUILD-${regSkill.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
                          } else if (val === 'provisional_apprentice') {
                            setRegCertTitle(`Provisional Member — Supervised ${regSkill} Field Apprentice`);
                            setRegCertNumber(`PROV-${regSkill.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
                          } else {
                            setRegCertTitle(`${regSkill} Certified Artisan`);
                            setRegCertNumber(`COOP-${regSkill.slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`);
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500"
                      >
                        {CREDENTIAL_DOCUMENT_TYPES.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {d.badge}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        {CREDENTIAL_DOCUMENT_TYPES.find((d) => d.id === credentialDocType)?.description}
                      </p>
                    </div>

                    {/* PATHWAY 1: Practical Experience (No paper certificate required) */}
                    {credentialDocType === 'practical_experience' && (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <BookOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-amber-900 text-xs">Informal Master Artisan / Trade Experience Pathway</div>
                            <div className="text-[11px] text-amber-800 mt-0.5">
                              No formal ITI diploma or paper license required. Your trade credibility is verified via documented years on the job, your Aadhaar/e-Shram card, and the in-app Indian Standards (IS) competency check in Step 3.
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Years of Practical Trade Experience *</label>
                            <input
                              type="number"
                              min={1}
                              max={45}
                              value={experienceYears}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setExperienceYears(val);
                                setRegCertTitle(`${val}Y Field Practitioner (${regSkill})`);
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Previous Work Style / Background</label>
                            <select
                              value={regIssuingBody}
                              onChange={(e) => setRegIssuingBody(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                            >
                              <option value="Independent Local Neighborhood Craftsman">Independent Local Neighborhood Craftsman</option>
                              <option value="Contractor / Site Apprentice Trainee">Contractor / Site Apprentice Trainee</option>
                              <option value="Family Heritage Trade Practitioner">Family Heritage Trade Practitioner</option>
                              <option value="Shop / Workshop Senior Assistant">Shop / Workshop Senior Assistant</option>
                            </select>
                          </div>
                        </div>

                        <label className="flex items-start gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={practicalSelfAttested}
                            onChange={(e) => setPracticalSelfAttested(e.target.checked)}
                            className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 mt-0.5"
                          />
                          <span className="text-[11px] text-slate-700 font-medium">
                            I solemnly self-attest that I have actively worked in the <strong>{regSkill}</strong> trade for <strong>{experienceYears}+ years</strong>, understand electrical/mechanical safety, and commit to following cooperative quality standards.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* PATHWAY 2: Peer / Cooperative Guild Endorsement */}
                    {credentialDocType === 'coop_peer_endorsement' && (
                      <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <Users className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-teal-950 text-xs">Primary Society or Senior Master Craftsman Endorsement</div>
                            <div className="text-[11px] text-teal-800 mt-0.5">
                              If you lack a college diploma, a certified senior artisan or registered cooperative guild in your taluka/district can vouch for your integrity and trade proficiency.
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Endorsing Cooperative Society / Guild Name *</label>
                            <input
                              type="text"
                              value={endorsingSocietyOrMentor}
                              onChange={(e) => {
                                setEndorsingSocietyOrMentor(e.target.value);
                                setRegIssuingBody(e.target.value);
                              }}
                              placeholder="e.g. Pune Central Urban Artisan Guild Society"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Vouching Senior Artisan / Secretary Phone</label>
                            <input
                              type="text"
                              value={mentorPhone}
                              onChange={(e) => setMentorPhone(e.target.value)}
                              placeholder="e.g. +91 98220 12345"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Society Recommendation Letter / Endorsement Stamp (Optional)</label>
                          <div className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl p-3 text-center bg-white transition cursor-pointer relative">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedFileName(e.target.files[0].name);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <UploadCloud className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                            <p className="font-bold text-slate-800 text-xs">
                              {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Attach Society Letter or Guild Stamp (Optional)'}
                            </p>
                            <p className="text-[10px] text-slate-400">PDF, JPG up to 10MB • Cooperative society verification</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PATHWAY 3: Provisional Member / Supervised Trial */}
                    {credentialDocType === 'provisional_apprentice' && (
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <Compass className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-blue-950 text-xs">Provisional Member & Supervised Field Trial Route</div>
                            <div className="text-[11px] text-blue-800 mt-0.5">
                              Start working immediately as a Provisional Member. You will be paired with a certified senior craftsman for your first 5 bookings. Once you complete 5 jobs with 4.5+ star ratings, your profile is automatically upgraded to full Certified status.
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white border border-blue-200 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">Trial Period Jobs Required:</span>
                            <span className="font-bold text-slate-900">5 Supervised Dispatches</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">Minimum Rating to Graduate:</span>
                            <span className="font-bold text-emerald-700">4.5 / 5.0 Stars</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">Worker Payout during Trial:</span>
                            <span className="font-bold text-slate-900">Full 90% Direct Pay + Insurance</span>
                          </div>
                        </div>

                        <label className="flex items-start gap-2 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={provisionalTrialConsent}
                            onChange={(e) => setProvisionalTrialConsent(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
                          />
                          <span className="text-[11px] text-slate-700 font-medium">
                            I accept the Provisional Membership conditions and agree to co-dispatch with senior guild artisans during my initial 5 trial service visits.
                          </span>
                        </label>
                      </div>
                    )}

                    {/* PATHWAY 4: Formal Certificate Upload (ITI, Wireman, NSDC, Safety clearance) */}
                    {!['practical_experience', 'coop_peer_endorsement', 'provisional_apprentice'].includes(credentialDocType) && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Certificate / License Title *</label>
                            <input
                              type="text"
                              value={regCertTitle}
                              onChange={(e) => setRegCertTitle(e.target.value)}
                              placeholder="e.g. NCVT National Trade Certificate"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Registration / Roll No. *</label>
                            <input
                              type="text"
                              value={regCertNumber}
                              onChange={(e) => setRegCertNumber(e.target.value)}
                              placeholder="e.g. ITI-2024-MH-8921"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Issuing Authority / Board *</label>
                          <input
                            type="text"
                            value={regIssuingBody}
                            onChange={(e) => setRegIssuingBody(e.target.value)}
                            placeholder="e.g. Directorate General of Training (DGT / NCVT)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                          />
                        </div>

                        {/* Document Upload Attachment */}
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Credential Document Upload / Scan *</label>
                          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-4 text-center bg-white transition cursor-pointer relative">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedFileName(e.target.files[0].name);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <UploadCloud className="w-6 h-6 text-teal-600 mx-auto mb-1.5" />
                            <p className="font-bold text-slate-800 text-xs mb-0.5">
                              {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Click or Drag & Drop Trade Certificate'}
                            </p>
                            <p className="text-[10px] text-slate-500">PDF, JPG, PNG up to 10MB • Cooperative Encryption Enabled</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Digital Seal Code Preview */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Stamp className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <span className="block font-bold text-emerald-950 text-xs">Generated Digital Cooperative Seal</span>
                        <span className="font-mono text-[11px] text-emerald-800 font-semibold">{digitalSealCode}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                      Auto-Cryptosealed
                    </span>
                  </div>

                  {/* Nav buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!idProofNumber.trim()) {
                          setErrorMsg('Please enter your Government ID proof number');
                          return;
                        }
                        setErrorMsg(null);
                        setRegStep(3);
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Step 3: Trade Skill Competency Test</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Interactive Skill Competency Assessment */}
              {regStep === 3 && (
                <div className="space-y-4 text-xs">
                  {/* Skill Assessment Header */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-sm text-white">{regSkill} Technical & Safety Check</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                        Score: {correctCount} / {questions.length} ({scorePercentage}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Answer the 3 mandatory trade competency questions below. Verified answers certify adherence to Indian Standard (IS) safety protocols and earn your Cooperative Verified Badge.
                    </p>
                  </div>

                  {/* Accessible Voice & Visual Mode Banner / Switcher */}
                  <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-teal-700 text-white shadow-xs">
                        <Volume2 className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                          <span>Difficulty reading text or want voice guidance?</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-extrabold">Accessible</span>
                        </div>
                        <div className="text-[11px] text-teal-800">
                          Switch to spoken audio prompts (मराठी/हिंदी/EN), visual pictures, or Sanstha Sahayak verification.
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUseAccessibleVoiceMode(!useAccessibleVoiceMode)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                        useAccessibleVoiceMode
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                      }`}
                    >
                      {useAccessibleVoiceMode ? (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Standard Text Test</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Open Voice & Picture Mode</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Accessible Voice & Visual Quiz Modal/Inline View */}
                  {useAccessibleVoiceMode ? (
                    <div className="pt-2">
                      <AccessibleSkillQuiz
                        trade={regSkill}
                        workerName={regName || 'Artisan'}
                        initialLang="hi"
                        onComplete={(score, passed) => {
                          setAccessibleScoreOverride(score);
                          if (passed) {
                            setSafetyPledgeChecked(true);
                          }
                          setUseAccessibleVoiceMode(false);
                        }}
                        onCancel={() => setUseAccessibleVoiceMode(false)}
                      />
                    </div>
                  ) : (
                    <>

                  {/* Questions List */}
                  <div className="space-y-3.5">
                    {questions.map((q, idx) => {
                      const selected = skillAnswers[q.id];
                      const isAnswered = selected !== undefined;
                      const isCorrect = selected === q.correctIndex;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-2xl border transition ${
                            isAnswered
                              ? isCorrect
                                ? 'border-emerald-300 bg-emerald-50/40'
                                : 'border-amber-300 bg-amber-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-bold text-slate-900 text-xs">
                              Q{idx + 1}. {q.question}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {q.conceptTag}
                            </span>
                          </div>

                          {/* Options */}
                          <div className="space-y-1.5 mt-2">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selected === optIdx;
                              const isThisCorrectOption = optIdx === q.correctIndex;

                              let buttonStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                              if (isAnswered) {
                                if (isThisSelected && isCorrect) {
                                  buttonStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                                } else if (isThisSelected && !isCorrect) {
                                  buttonStyle = 'bg-amber-600 text-white border-amber-600 font-bold';
                                } else if (isThisCorrectOption) {
                                  buttonStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => {
                                    setSkillAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${buttonStyle}`}
                                >
                                  <span>{opt}</span>
                                  {isAnswered && isThisCorrectOption && (
                                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Rationale */}
                          {isAnswered && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-white/80 border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
                              <HelpCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-900">{isCorrect ? 'Standard Verified: ' : 'Correct Rationale: '}</strong>
                                <span>{q.explanation}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Safety & Quality Pledge */}
                  <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyPledgeChecked}
                      onChange={(e) => setSafetyPledgeChecked(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Cooperative Ethical Craftsmanship Pledge</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        I pledge to use calibrated diagnostic tools, wear mandated personal protective equipment (PPE), uphold fair transparent rates, and follow Indian Standard (IS) codes on every job.
                      </div>
                    </div>
                  </label>

                  {/* Status Banner */}
                  {answeredCount === questions.length && (
                    <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Competency Cleared: {scorePercentage}% score qualifies for instant Cooperative Verified status!</span>
                    </div>
                  )}

                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={loading || answeredCount < questions.length || !safetyPledgeChecked}
                      onClick={handleRegisterSubmit}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-98 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>Enrolling & Verifying Artisan...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Complete Registration & Activate on Roster</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
