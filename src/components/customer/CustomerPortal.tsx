import React, { useState, useEffect } from 'react';
import {
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
  Wrench,
  Flame,
  Hammer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Phone,
  ArrowLeft,
  Filter,
  CreditCard,
  HeartHandshake,
  Star,
  ExternalLink,
  HardHat,
  Check,
  LogOut,
  Radio,
  Globe2,
  Award,
  Stamp,
} from 'lucide-react';
import { DetectedLocation } from '../../hooks/useLocation';
import { ApiWorker, ApiBooking, api } from '../../services/api';
import { calculateDistanceKm, estimateTravelTimeMinutes } from '../../utils/geo';
import { Language, WorkerProfile } from '../../types';
import { auth, signInWithGoogle, signOutFirebase } from '../../services/firebase';
import { GoogleIcon } from '../common/GoogleIcon';
import { CustomerRealtimeRadarMap } from './CustomerRealtimeRadarMap';
import { WorkerRatingModal } from '../common/WorkerRatingModal';
import { WorkerCredentialsModal } from '../common/WorkerCredentialsModal';
import { WorkerReviewsModal } from '../common/WorkerReviewsModal';
import { CustomerAuthModal } from './CustomerAuthModal';
import { getTranslation } from '../../locales/i18n';

const getCategoryName = (id: string, name: string, lang: Language) => {
  if (lang === 'hi') {
    switch (id) {
      case 'all': return 'सभी सेवाएँ';
      case 'electrical': return 'विद्युत एवं वायरिंग';
      case 'plumbing': return 'प्लंबिंग एवं पाइप';
      case 'appliance': return 'उपकरण एवं एसी';
      case 'carpentry': return 'बढ़ईगीरी एवं ताले';
      case 'emergency': return '24x7 आपातकालीन सेवा';
      default: return name;
    }
  }
  if (lang === 'mr') {
    switch (id) {
      case 'all': return 'सर्व सेवा';
      case 'electrical': return 'विद्युत व वायरिंग';
      case 'plumbing': return 'प्लंबिंग व नळदुरुस्ती';
      case 'appliance': return 'उपकरणे व एसी दुरुस्ती';
      case 'carpentry': return 'सुतारकाम व कुलपे';
      case 'emergency': return '२४x७ तातडीची मदत';
      default: return name;
    }
  }
  if (lang === 'te') {
    switch (id) {
      case 'all': return 'అన్ని సేవలు';
      case 'electrical': return 'ఎలక్ట్రికల్ & వైరింగ్';
      case 'plumbing': return 'ప్లంబింగ్ & డ్రైనేజ్';
      case 'appliance': return 'ఏసీ & ఉపకరణాల మరమ్మతు';
      case 'carpentry': return 'కార్పెంట్రీ & లాక్స్';
      case 'emergency': return '24x7 అత్యవసర SOS';
      default: return name;
    }
  }
  return name;
};

interface CustomerPortalProps {
  lang: Language;
  onToggleLang: () => void;
  onSelectLang?: (lang: Language) => void;
  location: DetectedLocation;
  isDetectingLocation: boolean;
  onDetectLocation: () => void;
  onOpenLocationPicker?: () => void;
  onBackToLanding: () => void;
  onOpenInvoice: (booking: any) => void;
  onSwitchToWorker: () => void;
}

const SERVICE_CATEGORIES = [
  { id: 'all', name: 'All Services', icon: Wrench },
  { id: 'electrical', name: 'Electrical & Power', icon: Zap, basePrice: 450 },
  { id: 'plumbing', name: 'Plumbing & Drainage', icon: Wrench, basePrice: 380 },
  { id: 'appliance', name: 'AC & Appliance', icon: Flame, basePrice: 400 },
  { id: 'carpentry', name: 'Carpentry & Locks', icon: Hammer, basePrice: 380 },
  { id: 'emergency', name: '24x7 Emergency SOS', icon: AlertTriangle, basePrice: 750, isEmergency: true },
];

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  lang,
  onToggleLang,
  onSelectLang,
  location,
  isDetectingLocation,
  onDetectLocation,
  onOpenLocationPicker,
  onBackToLanding,
  onOpenInvoice,
  onSwitchToWorker,
}) => {
  const [workers, setWorkers] = useState<ApiWorker[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'find' | 'radar' | 'my_bookings'>('find');
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<ApiBooking | null>(null);
  const [ratedBookings, setRatedBookings] = useState<Record<string, { rating: number; comment?: string }>>({});
  const [selectedWorkerForCredentials, setSelectedWorkerForCredentials] = useState<WorkerProfile | null>(null);
  const [selectedWorkerForReviews, setSelectedWorkerForReviews] = useState<{
    id: string;
    name: string;
    skill: string;
    avatar?: string;
    isVerified: boolean;
  } | null>(null);
  const [verifiedOnlyFilter, setVerifiedOnlyFilter] = useState(false);

  // Customer Firebase Google & Local Auth State
  const [customerUser, setCustomerUser] = useState<{
    name: string;
    email: string;
    photoURL?: string;
    uid?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('sahakar_customer_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || 'Verified Customer',
          email: parsed.email || '',
          photoURL: parsed.photoURL,
          uid: parsed.id || parsed.uid,
        };
      }
    } catch {}
    const cur = auth.currentUser;
    if (cur) {
      return {
        name: cur.displayName || 'Verified Customer',
        email: cur.email || '',
        photoURL: cur.photoURL || undefined,
        uid: cur.uid,
      };
    }
    return null;
  });
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [targetWorker, setTargetWorker] = useState<ApiWorker | null>(null);
  const [formData, setFormData] = useState({
    name: 'Teja Reddy',
    phone: '+91 98450 12345',
    address: `${location.area}, ${location.city}`,
    category: 'Electrical',
    title: 'Emergency Power Tripping / Switchboard Spark',
    description: 'Main MCB switch is repeatedly tripping whenever water heater or heavy appliance is turned on.',
    isEmergency: false,
    timing: 'Immediate (Within 45 mins)',
    amount: 500,
  });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [bookingErrorMsg, setBookingErrorMsg] = useState<string | null>(null);

  // Handle Google Customer Login
  const handleGoogleCustomerSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      const { user, profile } = await signInWithGoogle('customer', {
        role: 'customer',
      });
      const userData = {
        name: profile.name || user.displayName || 'Verified Customer',
        email: profile.email || user.email || '',
        photoURL: profile.photoURL || user.photoURL || undefined,
        uid: user.uid,
      };
      localStorage.setItem('sahakar_customer_user', JSON.stringify(userData));
      setCustomerUser(userData);
      setFormData((prev) => ({
        ...prev,
        name: userData.name,
      }));
    } catch (e: any) {
      console.warn('Customer Google sign-in cancelled or failed:', e);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleCustomerSignOut = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    localStorage.removeItem('sahakar_customer_user');
    setCustomerUser(null);
  };

  // Sync address if location updates
  useEffect(() => {
    if (location.area && location.city) {
      setFormData((prev) => ({
        ...prev,
        address: `${location.area}, ${location.city}`,
      }));
    }
  }, [location]);

  // Load workers and bookings from connected database
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workersRes, bookingsRes] = await Promise.all([
        api.getWorkers(),
        api.getBookings(),
      ]);
      setWorkers(workersRes.workers || []);
      setBookings(bookingsRes.bookings || []);
    } catch (err) {
      console.error('Failed to load database items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter workers based on selected category and verification filter
  const filteredWorkers = workers.filter((w) => {
    if (verifiedOnlyFilter && w.verification_status !== 'verified') return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'emergency') return w.emergencyCertified;
    return (
      w.primary_skill.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase()))
    );
  });

  // Calculate distance for each worker to user's detected location
  const workersWithDistance = filteredWorkers.map((w) => {
    const workerCoords = { lat: w.lat, lng: w.lng };
    const userCoords = { lat: location.lat, lng: location.lng };
    const dist = calculateDistanceKm(userCoords, workerCoords);
    const eta = estimateTravelTimeMinutes(dist);
    return {
      ...w,
      calculatedDistanceKm: dist,
      estimatedEtaMinutes: eta,
    };
  }).sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);

  // Open booking modal for specific worker or general
  const handleOpenBooking = (worker?: ApiWorker, isEmergency = false) => {
    if (worker) {
      setTargetWorker(worker);
      setFormData((prev) => ({
        ...prev,
        category: worker.primary_skill,
        title: `${worker.primary_skill} Repair & Servicing`,
        isEmergency,
        amount: isEmergency ? 750 : worker.hourly_rate || 450,
      }));
    } else {
      setTargetWorker(null);
      setFormData((prev) => ({
        ...prev,
        category: selectedCategory === 'all' || selectedCategory === 'emergency' ? 'Electrical' : selectedCategory,
        isEmergency,
        amount: isEmergency ? 750 : 500,
      }));
    }
    setIsBookingModalOpen(true);
  };

  // Submit real booking to SQLite database
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setBookingErrorMsg(null);
    try {
      const payload = {
        customerId: 'cust-me',
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        serviceCategory: formData.category,
        title: formData.title,
        description: formData.description,
        isEmergency: formData.isEmergency,
        lat: location.lat,
        lng: location.lng,
        area: location.area,
        scheduledTime: formData.timing,
        totalAmount: formData.amount,
      };

      const res = await api.createBooking(payload);
      if (res.success && res.booking) {
        // If target worker was picked, automatically assign
        if (targetWorker) {
          await api.acceptBooking(res.booking.id, targetWorker.id, targetWorker.name);
        }

        setBookingSuccessMsg(`Booking ${res.booking.booking_code} created successfully in SQLite database!`);
        setIsBookingModalOpen(false);
        setActiveTab('my_bookings');
        await loadData();
      }
    } catch (err: any) {
      setBookingErrorMsg(err.message || 'Failed to submit service booking. Please verify details and try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const radarWorkers: WorkerProfile[] = workers.map((w) => ({
    id: w.id,
    name: w.name,
    nameHi: w.name_hi || w.name,
    phone: w.phone,
    avatar: w.avatar,
    primarySkill: w.primary_skill,
    skills: w.skills || [w.primary_skill],
    societyId: w.society_id,
    societyName: w.society_name,
    societyNameHi: w.society_name_hi || w.society_name,
    coopMemberId: w.coop_member_id,
    verificationStatus: w.verification_status,
    certifications: [],
    rating: w.rating || 4.8,
    completedJobsCount: w.completed_jobs_count || 12,
    availability: w.availability,
    emergencyCertified: w.emergency_certified,
    hourlyRate: w.hourly_rate || 450,
    location: {
      lat: w.lat,
      lng: w.lng,
      city: w.city,
      area: w.area,
      serviceRadiusKm: w.service_radius_km || 12,
      coordinates: {
        lat: w.lat,
        lng: w.lng,
      },
    },
    welfare: {
      thriftDepositBalance: 0,
      pmsbyActive: true,
      sahakarHealthCardValid: true,
      welfareFundContributionTotal: 0,
    },
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Context & Action Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Portal Identity (without repeating project brand title) */}
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
              Customer Booking Portal
            </span>
            <span className="text-xs text-slate-500 hidden md:inline">
              Verified Cooperative Artisans & Direct Local Dispatch
            </span>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2">
            {/* Detected Location Pill with Refresh Button & Accuracy */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="font-semibold text-slate-900 max-w-[180px] sm:max-w-[240px] truncate">
                {location.displayName || `${location.area}, ${location.city}`}
              </span>
              {location.accuracy && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                  ±{location.accuracy}m
                </span>
              )}
              <button
                id="btn-refresh-location-cust"
                onClick={onDetectLocation}
                disabled={isDetectingLocation}
                title="Re-detect your current GPS location"
                className="p-1 hover:bg-slate-200 rounded-md transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 text-slate-600 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              </button>
              {onOpenLocationPicker && (
                <button
                  onClick={onOpenLocationPicker}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-emerald-700 font-bold text-[11px] transition cursor-pointer"
                  title="Choose area manually"
                >
                  Change
                </button>
              )}
            </div>

            {/* Unified Customer Login Section (Merged Customer & Google Auth into One Section) */}
            {customerUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800 shadow-2xs">
                {customerUser.photoURL ? (
                  <img
                    src={customerUser.photoURL}
                    alt={customerUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px]">
                    {customerUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="font-bold text-emerald-950 text-xs max-w-[120px] truncate leading-tight">
                    {customerUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold leading-none flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                    <span>5.0 Booker Trust</span>
                  </span>
                </div>
                <button
                  onClick={handleCustomerSignOut}
                  className="ml-1 p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  id="btn-customer-login-merged"
                  onClick={() => setIsCustomerAuthModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer group"
                  title="Customer Login (Google or Mobile / Email)"
                >
                  <User className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
                  <span>Customer Login</span>
                  <div className="flex items-center gap-1 pl-2 border-l border-emerald-500/60 text-[11px] font-medium text-emerald-100">
                    <GoogleIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Google</span>
                  </div>
                </button>
              </div>
            )}

            {/* Switch to Worker */}
            <button
              onClick={onSwitchToWorker}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition"
            >
              <span>
                {lang === 'hi'
                  ? 'कारीगर पोर्टल →'
                  : lang === 'mr'
                  ? 'कामगार पोर्टल →'
                  : lang === 'te'
                  ? 'కార్మిక పోర్టల్ →'
                  : "I'm a Worker →"}
              </span>
            </button>

            {/* Multi-Language Selector */}
            <div className="relative flex items-center">
              <Globe2 className="w-3.5 h-3.5 text-emerald-600 absolute left-2 pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => {
                  if (onSelectLang) {
                    onSelectLang(e.target.value as Language);
                  } else {
                    onToggleLang();
                  }
                }}
                className="pl-7 pr-2 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer focus:outline-emerald-600"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Location & Action Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold mb-3">
              <MapPin className="w-3.5 h-3.5 text-rose-300" />
              <span>
                {lang === 'hi'
                  ? 'आपका स्थान:'
                  : lang === 'mr'
                  ? 'तुमचे स्थान:'
                  : lang === 'te'
                  ? 'మీ స్థానం:'
                  : 'Your Detected Location:'}{' '}
                <strong>{location.area || 'N.R. Peta'}, {location.city || 'Kurnool'}</strong> • GPS: {location.lat.toFixed(5)}° N, {location.lng.toFixed(5)}° E {location.accuracy ? `(±${location.accuracy}m accuracy)` : ''}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
              {lang === 'hi'
                ? 'निकटवर्ती सत्यापित कुशल कारीगर बुक करें'
                : lang === 'mr'
                ? 'तुमच्या जवळील प्रमाणित कुशल कारागीर बुक करा'
                : lang === 'te'
                ? 'మీ సమీపంలో ధృవీకరించిన నిపుణులైన కార్మికులను బుక్ చేయండి'
                : 'Book Verified Skilled Artisans Near You'}
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              {lang === 'hi'
                ? 'सहकार सेवा पर प्रत्येक कारीगर प्रमाणित एवं पृष्ठभूमि सत्यापित है।'
                : lang === 'mr'
                ? 'सहकार सेवा वरील प्रत्येक कारागीर ट्रेड-प्रमाणित व पडताळणी केलेला आहे.'
                : lang === 'te'
                ? 'సహకార సేవా లోని ప్రతి కార్మికుడు ధృవీకరించబడిన మరియు రక్షణ గలవారు.'
                : 'Every artisan on Sahakar Seva is trade-certified and background-verified with direct local dispatch.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSwitchToWorker}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <HardHat className="w-4 h-4 text-teal-300" />
              <span>
                {lang === 'hi'
                  ? '+ कुशल कारीगर पंजीकृत करें'
                  : lang === 'mr'
                  ? '+ कुशल कामगार नोंदणी'
                  : lang === 'te'
                  ? '+ నైపుణ్య కార్మికుడి నమోదు'
                  : '+ Register Skilled Worker'}
              </span>
            </button>

            <button
              id="btn-emergency-sos-top"
              onClick={() => handleOpenBooking(undefined, true)}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-900/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
              <span>
                {lang === 'hi'
                  ? 'आपातकालीन एसओएस (15 मि. सेवा)'
                  : lang === 'mr'
                  ? 'तातडीची मदत (१५ मिनिटे SLA)'
                  : lang === 'te'
                  ? 'అత్యవసర SOS (15 నిమి SLA)'
                  : 'Emergency SOS (15m SLA)'}
              </span>
            </button>

            <button
              id="btn-book-standard-top"
              onClick={() => handleOpenBooking()}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>
                {lang === 'hi'
                  ? '+ सेवा अनुरोध दर्ज करें'
                  : lang === 'mr'
                  ? '+ सेवा विनंती नोंदवा'
                  : lang === 'te'
                  ? '+ సేవా అభ్యర్థన నమోదు'
                  : '+ Post Service Request'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* Success Alert Banner */}
        {bookingSuccessMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{bookingSuccessMsg}</span>
            </div>
            <button
              onClick={() => setBookingSuccessMsg(null)}
              className="text-xs text-emerald-800 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Toggle Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('find')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
                activeTab === 'find'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {lang === 'hi'
                ? `उपलब्ध सत्यापित कारीगर (${workersWithDistance.length})`
                : lang === 'mr'
                ? `उपलब्ध प्रमाणित कारागीर (${workersWithDistance.length})`
                : lang === 'te'
                ? `లభ్యమయ్యే ధృవీకరించిన కార్మికులు (${workersWithDistance.length})`
                : `Available Verified Artisans (${workersWithDistance.length})`}
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'radar'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? 'लाइव रडार मानचित्र'
                  : lang === 'mr'
                  ? 'थेट रडार नकाशा'
                  : lang === 'te'
                  ? 'రియల్ టైమ్ రాడార్ మ్యాప్'
                  : 'Real-Time Radar Map'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
            <button
              onClick={() => setActiveTab('my_bookings')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'my_bookings'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>
                {lang === 'hi'
                  ? 'मेरी बुकिंग ऑर्डर'
                  : lang === 'mr'
                  ? 'माझे बुकिंग ऑर्डर्स'
                  : lang === 'te'
                  ? 'నా బుకింగ్ ఆర్డర్లు'
                  : 'My Booking Orders'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-200 text-slate-800">
                {bookings.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Connected to SQLite Database • Real Live Records
          </div>
        </div>

        {/* TAB 1: FIND ARTISANS */}
        {activeTab === 'find' && (
          <div>
            {/* Category & Verification Filter Pills */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {SERVICE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${cat.isEmergency ? 'text-rose-500' : 'text-emerald-600'}`} />
                      <span>{getCategoryName(cat.id, cat.name, lang)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Verified Only Toggle */}
              <button
                type="button"
                onClick={() => setVerifiedOnlyFilter((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  verifiedOnlyFilter
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${verifiedOnlyFilter ? 'text-white' : 'text-emerald-600'}`} />
                <span>
                  {lang === 'hi'
                    ? 'केवल सत्यापित कारीगर'
                    : lang === 'mr'
                    ? 'फक्त प्रमाणित कारागीर'
                    : lang === 'te'
                    ? 'ధృవీకరించిన వారు మాత్రమే'
                    : 'Verified Artisans Only'}
                </span>
                {verifiedOnlyFilter && (
                  <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {lang === 'hi' ? 'सक्रिय' : lang === 'mr' ? 'सक्रिय' : lang === 'te' ? 'క్రియాశీలం' : 'Active'}
                  </span>
                )}
              </button>
            </div>

            {/* Workers Grid */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">Loading verified artisans from database...</div>
            ) : workersWithDistance.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-4">
                  <HardHat className="w-6 h-6 text-teal-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">No skilled workers registered in this category yet</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Pre-existing mock data has been cleared. When you register a skilled worker, their profile, visit rate, contact, and all the specific work they can do will appear right here on this booking page.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={onSwitchToWorker}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <HardHat className="w-4 h-4" />
                    <span>+ Register a Skilled Worker</span>
                  </button>
                  <button
                    onClick={() => handleOpenBooking()}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    + Post Open Job Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workersWithDistance.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg">
                            {w.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-slate-900 text-base">{w.name}</h4>
                              {w.verification_status === 'verified' && (
                                <span title="Federation Verified Artisan">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{w.primary_skill}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-slate-900 text-base">₹{w.hourly_rate}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {lang === 'hi'
                              ? 'मानक विज़िट'
                              : lang === 'mr'
                              ? 'मानक भेट'
                              : lang === 'te'
                              ? 'ప్రామాణిక రుసుము'
                              : 'Standard Visit'}
                          </div>
                        </div>
                      </div>

                      {/* Distance and Location Banner */}
                      <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>
                            <strong>{w.calculatedDistanceKm} km</strong>{' '}
                            {lang === 'hi'
                              ? 'दूरी पर'
                              : lang === 'mr'
                              ? 'अंतरावर'
                              : lang === 'te'
                              ? 'దూరంలో'
                              : 'from you'}{' '}
                            ({w.area})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>ETA: ~{w.estimatedEtaMinutes} min</span>
                        </div>
                      </div>

                      {/* Contact & Credentials */}
                      <div className="mb-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{w.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{w.cert_title || 'Cooperative Certified Artisan'}</span>
                        </div>
                        {/* Clickable Rating and Reviews trigger */}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedWorkerForReviews({
                              id: w.id,
                              name: w.name,
                              skill: w.primary_skill,
                              avatar: w.avatar,
                              isVerified: w.verification_status === 'verified',
                            })
                          }
                          className="flex items-center gap-2 text-slate-700 hover:text-amber-800 transition cursor-pointer group text-left w-full"
                          title="Click to view verified customer ratings and feedback"
                        >
                          <div className="flex items-center gap-1 bg-amber-50 group-hover:bg-amber-100 border border-amber-200/70 px-2 py-0.5 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span className="font-bold text-slate-800 text-xs">{w.rating || 5.0}</span>
                          </div>
                          <span className="text-xs text-slate-500 group-hover:underline">
                            ({w.completed_jobs_count || 0} jobs • <strong>View Reviews</strong>)
                          </span>
                        </button>
                      </div>

                      {/* WORK HE CAN DO SECTION */}
                      <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-teal-600" />
                            <span>
                              {lang === 'hi'
                                ? 'उपलब्ध कार्य सेवाएँ:'
                                : lang === 'mr'
                                ? 'उपलब्ध कार्य सेवा:'
                                : lang === 'te'
                                ? 'చేయగల పనులు:'
                                : 'Work He Can Do:'}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {w.skills?.length || 0}{' '}
                            {lang === 'hi'
                              ? 'सेवाएँ'
                              : lang === 'mr'
                              ? 'सेवा'
                              : lang === 'te'
                              ? 'సేవలు'
                              : 'services'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {w.skills && w.skills.length > 0 ? (
                            w.skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[11px] font-medium"
                              >
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{s}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              {lang === 'hi'
                                ? `सामान्य ${w.primary_skill} मरम्मत एवं फिटिंग`
                                : lang === 'mr'
                                ? `सामान्य ${w.primary_skill} दुरुस्ती व फिटिंग`
                                : lang === 'te'
                                ? `సాధారణ ${w.primary_skill} మరమ్మతులు`
                                : `General ${w.primary_skill} repairs & installation`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Verification & Reviews */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const mapped: WorkerProfile = {
                              id: w.id,
                              name: w.name,
                              nameHi: w.name_hi || w.name,
                              phone: w.phone,
                              email: (w as any).email || `${w.id}@sahakarseva.org`,
                              avatar: w.avatar,
                              primarySkill: w.primary_skill,
                              primarySkillHi: (w as any).primary_skill_hi || w.primary_skill,
                              skills: w.skills || [w.primary_skill],
                              societyId: w.society_id,
                              societyName: w.society_name,
                              societyNameHi: (w as any).society_name_hi || w.society_name,
                              coopMemberId: w.coop_member_id,
                              verificationStatus: w.verification_status,
                              certifications: [
                                {
                                  id: `cert-${w.id}`,
                                  workerId: w.id,
                                  title: w.cert_title || `${w.primary_skill} Trade Certificate`,
                                  issuingBody: w.issuing_body || 'National Skill Development Corporation (NSDC)',
                                  credentialNumber: w.cert_number || 'REG-AP-2026',
                                  issueDate: '2025-01-15',
                                  verificationStatus: w.verification_status,
                                  digitalSealCode: `SEAL-AP-${w.id.slice(0, 4).toUpperCase()}-COOP`,
                                  documentType: 'license',
                                },
                              ],
                              rating: w.rating || 5.0,
                              completedJobsCount: w.completed_jobs_count || 0,
                              availability: w.availability,
                              emergencyCertified: w.emergency_certified,
                              bankUpi: 'artisan@sahakarupi',
                              location: {
                                city: w.city,
                                area: w.area,
                                serviceRadiusKm: w.service_radius_km || 12,
                                coordinates: { lat: w.lat, lng: w.lng },
                              },
                              welfare: {
                                pmsbyEnrolled: true,
                                sahakarArogyaActive: true,
                                thriftDepositBalance: 0,
                                welfareFundContributionTotal: 0,
                                insurancePolicyNumber: 'PMSBY-2026-AP',
                                coverageAmount: 200000,
                              },
                            };
                            setSelectedWorkerForCredentials(mapped);
                          }}
                          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[11px] font-bold border border-slate-200 hover:border-emerald-300 transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Inspect trade diploma and digital verification seal"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {lang === 'hi'
                              ? 'प्रमाणपत्र'
                              : lang === 'mr'
                              ? 'प्रमाणपत्रे'
                              : lang === 'te'
                              ? 'ధృవపత్రాలు'
                              : 'Credentials'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedWorkerForReviews({
                              id: w.id,
                              name: w.name,
                              skill: w.primary_skill,
                              avatar: w.avatar,
                              isVerified: w.verification_status === 'verified',
                            })
                          }
                          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-[11px] font-bold border border-slate-200 hover:border-amber-300 transition flex items-center justify-center gap-1 cursor-pointer"
                          title="View community reviews, stars breakdown and feedback"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                          <span className="truncate">
                            {lang === 'hi'
                              ? `समीक्षाएँ (${w.rating || 5.0}★)`
                              : lang === 'mr'
                              ? `पुनरावलोकने (${w.rating || 5.0}★)`
                              : lang === 'te'
                              ? `సమీక్షలు (${w.rating || 5.0}★)`
                              : `Reviews (${w.rating || 5.0}★)`}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenBooking(w, false)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
                        >
                          {lang === 'hi'
                            ? 'कारीगर बुक करें'
                            : lang === 'mr'
                            ? 'कारागीर बुक करा'
                            : lang === 'te'
                            ? 'ఈ కార్మికుడిని బుక్ చేయండి'
                            : 'Book This Artisan'}
                        </button>
                        {w.emergencyCertified && (
                          <button
                            onClick={() => handleOpenBooking(w, true)}
                            title="Instant Emergency Dispatch"
                            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                          >
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: REAL-TIME RADAR MAP */}
        {activeTab === 'radar' && (
          <div className="space-y-4">
            <CustomerRealtimeRadarMap
              customerLocation={{
                lat: location.lat,
                lng: location.lng,
                area: location.area,
                city: location.city,
                displayName: location.displayName,
              }}
              workers={radarWorkers}
              onSelectWorkerToBook={(selectedWp) => {
                const matched = workers.find((w) => w.id === selectedWp.id);
                handleOpenBooking(matched || (selectedWp as any), false);
              }}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 2: MY BOOKINGS TRACKER */}
        {activeTab === 'my_bookings' && (
          <div>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  {lang === 'hi'
                    ? 'अभी तक कोई बुकिंग नहीं'
                    : lang === 'mr'
                    ? 'अद्याप कोणतीही बुकिंग नाही'
                    : lang === 'te'
                    ? 'ఇంకా ఎలాంటి బుకింగ్‌లు లేవు'
                    : 'No Bookings Placed Yet'}
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  {lang === 'hi'
                    ? 'आपने अभी कोई सेवा अनुरोध नहीं किया है। कुशल कारीगर खोजें और प्रत्यक्ष ऑर्डर दें।'
                    : lang === 'mr'
                    ? 'तुम्ही अद्याप कोणतीही सेवा मागवलेली नाही. कुशल कारागीर शोधा आणि ऑर्डर द्या.'
                    : lang === 'te'
                    ? 'మీరు ఇంకా ఎటువంటి సేవా అభ్యర్థన చేయలేదు. నిపుణులైన కార్మికుడిని కనుగొని ఆర్డర్ చేయండి.'
                    : "You haven't requested any services yet. Find a skilled worker and place a real order to see it live!"}
                </p>
                <button
                  onClick={() => setActiveTab('find')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  {lang === 'hi'
                    ? 'उपलब्ध कारीगर देखें'
                    : lang === 'mr'
                    ? 'उपलब्ध कारागीर पहा'
                    : lang === 'te'
                    ? 'లభ్యమయ్యే కార్మికులను చూడండి'
                    : 'Browse Available Workers'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {b.booking_code}
                        </span>
                        {b.isEmergency && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {lang === 'hi'
                              ? 'आपातकालीन एसओएस'
                              : lang === 'mr'
                              ? 'तातडीची मदत'
                              : lang === 'te'
                              ? 'అత్యవసర SOS'
                              : 'Emergency SOS'}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                            b.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : b.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : b.status === 'in_transit'
                              ? 'bg-teal-100 text-teal-800 border border-teal-300'
                              : b.status === 'assigned'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {lang === 'hi'
                            ? `स्थिति: ${b.status === 'completed' ? 'पूर्ण' : b.status === 'in_progress' ? 'प्रगति पर' : b.status === 'in_transit' ? 'मार्ग में' : b.status === 'assigned' ? 'आवंटित' : 'प्रतीक्षारत'}`
                            : lang === 'mr'
                            ? `स्थिती: ${b.status === 'completed' ? 'पूर्ण' : b.status === 'in_progress' ? 'सुरू आहे' : b.status === 'in_transit' ? 'मार्गावर' : b.status === 'assigned' ? 'नियुक्त' : 'प्रतीक्षेत'}`
                            : lang === 'te'
                            ? `స్థితి: ${b.status === 'completed' ? 'పూర్తయింది' : b.status === 'in_progress' ? 'పురోగతిలో ఉంది' : b.status === 'in_transit' ? 'మార్గంలో ఉంది' : b.status === 'assigned' ? 'కేటాయించబడింది' : 'వేచి ఉంది'}`
                            : `Status: ${b.status.replace('_', ' ')}`}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base mb-1">{b.title}</h4>
                      <p className="text-xs text-slate-600 mb-3">{b.description || 'General repair work requested.'}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {b.customer_address}
                        </span>
                        <span>•</span>
                        <span>
                          {lang === 'hi' ? 'सेवा' : lang === 'mr' ? 'सेवा' : lang === 'te' ? 'సేవ' : 'Service'}:{' '}
                          <strong>{b.service_category}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {lang === 'hi' ? 'आवंटित कारीगर' : lang === 'mr' ? 'नियुक्त कारागीर' : lang === 'te' ? 'కేటాయించిన కార్మికుడు' : 'Assigned'}:{' '}
                          <strong>{b.assigned_worker_name || (lang === 'hi' ? 'निकटवर्ती कारीगरों को भेजा जा रहा है...' : lang === 'mr' ? 'जवळच्या कारागिरांना पाठवत आहे...' : lang === 'te' ? 'సమీప కార్మికులకు ప్రసారం చేయబడుతోంది...' : 'Broadcasting to nearby workers...')}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right side: Pricing & Invoice */}
                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-left md:text-right min-w-[200px]">
                      <div className="text-xs text-slate-500 mb-1">
                        {lang === 'hi' ? 'कुल शुल्क' : lang === 'mr' ? 'एकूण शुल्क' : lang === 'te' ? 'మొత్తం రుసుము' : 'Total Fee'}
                      </div>
                      <div className="text-2xl font-black text-slate-900 mb-2">₹{b.pricing.totalAmount}</div>

                      <div className="text-[11px] text-slate-500 space-y-0.5 mb-4">
                        <div className="text-emerald-700 font-semibold">
                          ₹{b.pricing.workerPayout}{' '}
                          {lang === 'hi'
                            ? 'कारीगर को सीधे (90%)'
                            : lang === 'mr'
                            ? 'थेट कारागिराला (90%)'
                            : lang === 'te'
                            ? 'కార్మికుడికి నేరుగా (90%)'
                            : 'directly to Worker (90%)'}
                        </div>
                        <div>
                          ₹{b.pricing.coopWelfareFee}{' '}
                          {lang === 'hi'
                            ? 'सहकारी कल्याण कोष (7%)'
                            : lang === 'mr'
                            ? 'सहकारी कल्याण निधी (7%)'
                            : lang === 'te'
                            ? 'సహకార సంక్షేమ నిధి (7%)'
                            : 'Cooperative Welfare (7%)'}
                        </div>
                      </div>

                      {b.status === 'completed' ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => onOpenInvoice(b)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'hi'
                                ? 'आधिकारिक चालान देखें'
                                : lang === 'mr'
                                ? 'अधिकृत बीजक पहा'
                                : lang === 'te'
                                ? 'అధికారిక ఇన్‌వాయిస్ చూడండి'
                                : 'View Official Invoice'}
                            </span>
                          </button>

                          {/* Mutual Review from Artisan */}
                          {b.booker_rating && (
                            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                              <div className="flex items-center justify-between font-bold text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  <span>
                                    {lang === 'hi'
                                      ? 'कारीगर द्वारा आपकी समीक्षा:'
                                      : lang === 'mr'
                                      ? 'कारागिराने दिलेले पुनरावलोकन:'
                                      : lang === 'te'
                                      ? 'మీ గురించి కార్మికుడి అభిప్రాయం:'
                                      : 'Artisan Feedback on You:'}
                                  </span>
                                </span>
                                <span className="text-amber-800">{b.booker_rating} / 5</span>
                              </div>
                              {b.booker_review && (
                                <p className="text-[10px] text-blue-800/90 italic mt-1">"{b.booker_review}"</p>
                              )}
                            </div>
                          )}

                          {b.worker_rating || ratedBookings[b.id] ? (
                            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>
                                {lang === 'hi'
                                  ? `मूल्यांकन: ${b.worker_rating || ratedBookings[b.id]?.rating}/5 सितारे`
                                  : lang === 'mr'
                                  ? `रेटिंग: ${b.worker_rating || ratedBookings[b.id]?.rating}/5 तारे`
                                  : lang === 'te'
                                  ? `రేటింగ్: ${b.worker_rating || ratedBookings[b.id]?.rating}/5 నక్షత్రాలు`
                                  : `Rated ${b.worker_rating || ratedBookings[b.id]?.rating}/5 Stars`}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRatingBooking(b)}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition active:scale-95"
                            >
                              <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                              <span>
                                {lang === 'hi'
                                  ? 'कारीगर को रेटिंग दें (★ 1-5)'
                                  : lang === 'mr'
                                  ? 'कारागिराला रेटिंग द्या (★ 1-5)'
                                  : lang === 'te'
                                  ? 'కార్మికుడికి రేటింగ్ ఇవ్వండి (★ 1-5)'
                                  : 'Rate Artisan (★ 1-5)'}
                              </span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 text-center">
                          {b.status === 'open'
                            ? lang === 'hi'
                              ? 'कारीगर स्वीकृति की प्रतीक्षा'
                              : lang === 'mr'
                              ? 'कारागीर स्वीकृतीची प्रतीक्षा'
                              : lang === 'te'
                              ? 'కార్మికుడి అంగీకారం కోసం వేచి ఉంది'
                              : 'Awaiting Worker Acceptance'
                            : lang === 'hi'
                            ? 'कारीगर रवाना हो चुका है'
                            : lang === 'mr'
                            ? 'कारागीर निघाला आहे'
                            : lang === 'te'
                            ? 'కార్మికుడు బయలుదేరాడు'
                            : 'Artisan Dispatched'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Booking Form Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {targetWorker
                    ? (lang === 'hi'
                        ? `${targetWorker.name} को बुक करें`
                        : lang === 'mr'
                        ? `${targetWorker.name} यांना बुक करा`
                        : lang === 'te'
                        ? `${targetWorker.name} బుక్ చేయండి`
                        : `Book ${targetWorker.name}`)
                    : (lang === 'hi'
                        ? 'सहकारी सेवा अनुरोध दर्ज करें'
                        : lang === 'mr'
                        ? 'सहकारी सेवा विनंती नोंदवा'
                        : lang === 'te'
                        ? 'సహకార సేవా అభ్యర్థనను సృష్టించండి'
                        : 'Create Cooperative Service Request')}
                </h3>
                <p className="text-xs text-slate-500">
                  {targetWorker
                    ? `${targetWorker.primary_skill} • ₹${formData.amount}`
                    : (lang === 'hi'
                        ? 'निकटवर्ती सत्यापित सहकारी कारीगरों को प्रसारण'
                        : lang === 'mr'
                        ? 'जवळच्या प्रमाणित सहकारी कामगारांना पाठवा'
                        : lang === 'te'
                        ? 'సమీపంలోని ధృవీకరించిన సహకార కార్మికులకు ప్రసారం చేయండి'
                        : 'Broadcast to nearby verified cooperative workers')}
                </p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingErrorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
                <span>{bookingErrorMsg}</span>
                <button
                  type="button"
                  onClick={() => setBookingErrorMsg(null)}
                  className="text-rose-600 hover:text-rose-800 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
              {customerUser ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {customerUser.photoURL ? (
                      <img src={customerUser.photoURL} alt="" className="w-5 h-5 rounded-full object-cover border border-emerald-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="font-semibold">
                      {lang === 'hi' ? 'लॉगिन किया गया:' : lang === 'mr' ? 'लॉग इन:' : lang === 'te' ? 'లాగిన్ అయ్యారు:' : 'Signed in as'}{' '}
                      {customerUser.name} ({customerUser.email})
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    {lang === 'hi' ? 'सत्यापित' : lang === 'mr' ? 'प्रमाणित' : lang === 'te' ? 'ధృవీకరించబడింది' : 'Verified'}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {lang === 'hi' ? 'ग्राहक खाता' : lang === 'mr' ? 'ग्राहक खाते' : lang === 'te' ? 'కస్టమర్ ఖాతా' : 'Customer Account'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerAuthModalOpen(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    >
                      {lang === 'hi' ? 'ईमेल/फोन लॉगिन →' : lang === 'mr' ? 'ईमेल/फोन लॉगिन →' : lang === 'te' ? 'ఇమెయిల్/ఫోన్ లాగిన్ →' : 'Email/Phone Login →'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleCustomerSignIn}
                    disabled={isGoogleSigningIn}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                  >
                    <GoogleIcon className="w-4 h-4" />
                    <span>
                      {isGoogleSigningIn
                        ? (lang === 'hi' ? 'Google से लॉगिन हो रहा है...' : lang === 'mr' ? 'Google ने लॉगिन होत आहे...' : lang === 'te' ? 'Googleతో లాగిన్ అవుతోంది...' : 'Signing in with Google...')
                        : (lang === 'hi' ? 'Google द्वारा 1-क्लिक ऑटोफिल' : lang === 'mr' ? 'Google सह 1-क्लिक ऑटोफिल' : lang === 'te' ? 'Googleతో 1-క్లిక్ ఆటోఫిల్' : '1-Click Autofill with Google Sign-In')}
                    </span>
                  </button>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'आपका पूरा नाम' : lang === 'mr' ? 'तुमचे पूर्ण नाव' : lang === 'te' ? 'మీ పూర్తి పేరు' : 'Your Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'hi'
                    ? 'फ़ोन नंबर (कारीगर संपर्क हेतु)'
                    : lang === 'mr'
                    ? 'फोन नंबर (कामगारांच्या संपर्कासाठी)'
                    : lang === 'te'
                    ? 'ఫోన్ నంబర్ (కార్మికుడి సంప్రదింపు కోసం)'
                    : 'Phone Number (For Worker Contact)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'hi'
                    ? 'सेवा पता (जीपीएस द्वारा प्राप्त)'
                    : lang === 'mr'
                    ? 'सेवा पत्ता (GPS द्वारे शोधलेला)'
                    : lang === 'te'
                    ? 'సేవా చిరునామా (GPS ద్వారా గుర్తించబడింది)'
                    : 'Service Address (Detected from GPS)'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-sm text-slate-900"
                />
              </div>

              {/* If booked with a specific worker, let customer pick from the work he can do */}
              {targetWorker && targetWorker.skills && targetWorker.skills.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    {lang === 'hi'
                      ? `${targetWorker.name} की कार्य दक्षताओं में से सेवा चुनें:`
                      : lang === 'mr'
                      ? `${targetWorker.name} यांच्या कार्यक्षमतेतून सेवा निवडा:`
                      : lang === 'te'
                      ? `${targetWorker.name} యొక్క నైపుణ్యాల నుండి పనిని ఎంచుకోండి:`
                      : `Select work required from ${targetWorker.name}'s capabilities:`}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {targetWorker.skills.map((task) => (
                      <button
                        key={task}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            title: task,
                            description: `Customer requested ${task} service from ${targetWorker.name}.`,
                          }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                          formData.title === task
                            ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {formData.title === task && <Check className="w-3 h-3 text-white" />}
                        <span>{task}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'समस्या का शीर्षक' : lang === 'mr' ? 'समस्येचे शीर्षक' : lang === 'te' ? 'సమస్య శీర్షిక' : 'Problem Title'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'hi' ? 'विवरण एवं जानकारी' : lang === 'mr' ? 'तपशील व माहिती' : lang === 'te' ? 'వివరణ & వివరాలు' : 'Description / Details'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-sm text-slate-900"
                  placeholder={
                    lang === 'hi'
                      ? 'समस्या का विवरण दें (जैसे सिंक के नीचे पाइप लीक, बिजली का फ्यूज आदि)'
                      : lang === 'mr'
                      ? 'समस्येचे वर्णन करा (उदा. सिंकखालील पाइप गळती, फ्यूज जळणे इ.)'
                      : lang === 'te'
                      ? 'సమస్యను వివరించండి (ఉదా. పైప్ లీకేజ్, ఎలక్ట్రికల్ ఫ్యూజ్ మొదలైనవి)'
                      : 'Describe the issue (e.g. leaking pipe under sink, electrical fuse burnt, etc.)'
                  }
                />
              </div>

              {/* Transparent Payout Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
                  <span>
                    {lang === 'hi' ? 'सहकारी मानक शुल्क:' : lang === 'mr' ? 'सहकारी मानक शुल्क:' : lang === 'te' ? 'సహకార ప్రామాణిక రుసుము:' : 'Cooperative Standard Fee:'}
                  </span>
                  <span className="text-base font-black">₹{formData.amount}</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between text-emerald-900 font-semibold">
                    <span>
                      {lang === 'hi'
                        ? '• कारीगर को प्रत्यक्ष भुगतान (90%):'
                        : lang === 'mr'
                        ? '• कामगाराला थेट देयक (90%):'
                        : lang === 'te'
                        ? '• కార్మికుడికి నేరుగా చెల్లింపు (90%):'
                        : '• Net Worker Direct Payout (90%):'}
                    </span>
                    <span>₹{Math.round(formData.amount * 0.9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {lang === 'hi'
                        ? '• सहकारी कल्याण एवं बीमा कोष (7%):'
                        : lang === 'mr'
                        ? '• सहकारी कल्याण व विमा निधी (7%):'
                        : lang === 'te'
                        ? '• సహకార సంక్షేమం & బీమా నిధి (7%):'
                        : '• Cooperative Welfare & Insurance Pool (7%):'}
                    </span>
                    <span>₹{Math.round(formData.amount * 0.07)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {lang === 'hi'
                        ? '• महासंघ गैर-लाभकारी संचालन (3%):'
                        : lang === 'mr'
                        ? '• महासंघ नफाविरहित कार्यचालन (3%):'
                        : lang === 'te'
                        ? '• ఫెడరేషన్ నిర్వహణ రుసుము (3%):'
                        : '• Federation Non-Profit Operations (3%):'}
                    </span>
                    <span>₹{formData.amount - Math.round(formData.amount * 0.9) - Math.round(formData.amount * 0.07)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingBooking
                    ? (lang === 'hi' ? 'डेटाबेस में सहेजा जा रहा है...' : lang === 'mr' ? 'डेटाबेसमध्ये सेव्ह होत आहे...' : lang === 'te' ? 'డేటాబేస్‌లో భద్రపరుస్తోంది...' : 'Saving to Database...')
                    : (lang === 'hi' ? 'पुष्टि करें एवं बुकिंग करें' : lang === 'mr' ? 'पुष्टी करा व बुकिंग करा' : lang === 'te' ? 'నిర్ధారించి బుకింగ్ చేయండి' : 'Confirm & Place Booking')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Worker Rating Modal */}
      {ratingBooking && (
        <WorkerRatingModal
          isOpen={true}
          onClose={() => setRatingBooking(null)}
          bookingId={ratingBooking.id}
          bookingCode={ratingBooking.booking_code}
          workerId={ratingBooking.assigned_worker_id || ''}
          workerName={ratingBooking.assigned_worker_name || 'Cooperative Artisan'}
          onRatingSubmitted={(rating, comment) => {
            setRatedBookings((prev) => ({
              ...prev,
              [ratingBooking.id]: { rating, comment },
            }));
            loadData();
          }}
          lang={lang}
        />
      )}

      {/* Worker Credentials & Trade License Modal */}
      {selectedWorkerForCredentials && (
        <WorkerCredentialsModal
          worker={selectedWorkerForCredentials}
          isOpen={true}
          onClose={() => setSelectedWorkerForCredentials(null)}
          lang={lang}
        />
      )}

      {/* Worker Ratings & Reviews Breakdown Modal */}
      {selectedWorkerForReviews && (
        <WorkerReviewsModal
          workerId={selectedWorkerForReviews.id}
          workerName={selectedWorkerForReviews.name}
          workerSkill={selectedWorkerForReviews.skill}
          workerAvatar={selectedWorkerForReviews.avatar}
          isVerified={selectedWorkerForReviews.isVerified}
          isOpen={true}
          onClose={() => setSelectedWorkerForReviews(null)}
        />
      )}

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthModalOpen}
        onClose={() => setIsCustomerAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCustomerUser({
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.id,
          });
          setFormData((prev) => ({
            ...prev,
            name: user.name,
            phone: user.phone || prev.phone,
          }));
        }}
        lang={lang}
      />
    </div>
  );
};
