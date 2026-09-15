import React, { useState } from 'react';
import {
  Briefcase,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Phone,
  Sliders,
  DollarSign,
  HeartHandshake,
  Award,
  Zap,
  ExternalLink,
  Radio,
  Star,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import {
  WorkerProfile,
  Booking,
  Language,
  Certification,
  VerificationStatus,
} from '../../types';
import { getTranslation } from '../../locales/i18n';
import { calculateDistanceKm, estimateTravelTimeMinutes } from '../../utils/geo';
import { WorkerVerificationPortal } from './WorkerVerificationPortal';
import { WorkerRealtimeTelemetry } from './WorkerRealtimeTelemetry';
import { WorkerReputationPanel } from './WorkerReputationPanel';
import { BookerRatingModal } from '../common/BookerRatingModal';

interface WorkerDashboardProps {
  worker: WorkerProfile;
  bookings: Booking[];
  onUpdateWorkerGeo: (area: string, radiusKm: number) => void;
  onUploadCertification: (cert: Certification) => void;
  onAcceptBooking: (bookingId: string) => void;
  onAdvanceBookingStatus: (bookingId: string, nextStatus: any) => void;
  onOpenInvoice: (booking: Booking) => void;
  lang: Language;
  onSignOut?: () => void;
  onWorkerUpdated?: (updatedWorker: any) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  worker,
  bookings,
  onUpdateWorkerGeo,
  onUploadCertification,
  onAcceptBooking,
  onAdvanceBookingStatus,
  onOpenInvoice,
  lang,
  onSignOut,
  onWorkerUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<
    'jobs' | 'telemetry' | 'earnings' | 'geo' | 'skills' | 'verification' | 'reputation'
  >('jobs');
  const [jobFilter, setJobFilter] = useState<'all' | 'emergency' | 'active'>('all');

  // Geo form state
  const [geoArea, setGeoArea] = useState(worker?.location?.area || 'Pune Central');
  const [geoRadius, setGeoRadius] = useState(worker?.location?.serviceRadiusKm || 15);
  const [geoSuccessMsg, setGeoSuccessMsg] = useState(false);

  // Cert upload state
  const [certTitle, setCertTitle] = useState('Skill India Advanced Electrician');
  const [certIssuer, setCertIssuer] = useState('National Skill Development Corporation');
  const [certNumber, setCertNumber] = useState('NSDC-ELEC-2026-902');
  const [certType, setCertType] = useState<Certification['documentType']>('skill_india_nsdc');
  const [certSubmittedMsg, setCertSubmittedMsg] = useState(false);

  // Welfare claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [ratingBookerBooking, setRatingBookerBooking] = useState<Booking | null>(null);

  if (!worker) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
        <h3 className="font-bold text-slate-900 text-lg mb-2">No Active Worker Account</h3>
        <p className="text-xs text-slate-500 mb-6">Please register as a skilled artisan or sign in.</p>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Register / Sign In
          </button>
        )}
      </div>
    );
  }

  // Jobs relevant to worker
  const myAssignedJobs = bookings.filter((b) => b.assignedWorkerId === worker.id);
  const openJobs = bookings.filter((b) => b.status === 'open');

  // Filter logic
  let displayedJobs = [...openJobs, ...myAssignedJobs];
  if (jobFilter === 'emergency') {
    displayedJobs = displayedJobs.filter((b) => b.isEmergency);
  } else if (jobFilter === 'active') {
    displayedJobs = myAssignedJobs.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  }

  // Calculate earnings stats
  const completedJobs = bookings.filter(
    (b) => b.assignedWorkerId === worker.id && b.status === 'completed'
  );
  const totalNetEarned = completedJobs.reduce((acc, curr) => acc + curr.pricing.workerPayout, 0);
  const totalWelfareFundContributed = completedJobs.reduce(
    (acc, curr) => acc + curr.pricing.coopWelfareFee,
    0
  );
  const totalPlatformOpsFee = completedJobs.reduce(
    (acc, curr) => acc + curr.pricing.federationPlatformFee,
    0
  );

  const handleSaveGeo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkerGeo(geoArea, geoRadius);
    setGeoSuccessMsg(true);
    setTimeout(() => setGeoSuccessMsg(false), 3000);
  };

  const handleCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      title: certTitle,
      issuingBody: certIssuer,
      credentialNumber: certNumber,
      issueDate: '2026-03-01',
      verificationStatus: 'pending',
      documentType: certType,
    };
    onUploadCertification(newCert);
    setCertSubmittedMsg(true);
    setTimeout(() => setCertSubmittedMsg(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Worker Identity & Welfare Ribbon */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={worker.avatar}
                alt={worker.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  worker.availability === 'available'
                    ? 'bg-emerald-500'
                    : worker.availability === 'on_job'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={`Status: ${worker.availability}`}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  {lang !== 'en' && worker.nameHi ? worker.nameHi : worker.name}
                </h1>
                {worker.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {getTranslation(lang, 'statusVerified')}
                  </span>
                ) : worker.verificationStatus === 'under_review' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {getTranslation(lang, 'statusUnderReview')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    {getTranslation(lang, 'statusPending')}
                  </span>
                )}
                {worker.emergencyCertified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-300">
                    <Zap className="w-3 h-3 text-red-600 fill-red-600" />
                    Emergency Certified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                <span className="font-semibold text-emerald-800">{worker.primarySkill}</span> •{' '}
                {lang !== 'en' && worker.societyNameHi ? worker.societyNameHi : worker.societyName} ({worker.coopMemberId})
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {worker?.location?.area || 'Pune Central'}, {worker?.location?.city || 'Pune'} (Radius: {worker?.location?.serviceRadiusKm || 15} km)
                </span>
                <span className="font-semibold text-amber-600">★ {worker.rating} Rating</span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-700">
                  {worker.completedJobsCount} Jobs Completed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Welfare Badge Card & Actions */}
          <div className="flex flex-col gap-2">
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs max-w-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                <span>
                  {lang === 'hi'
                    ? 'सहकारी कल्याण सुरक्षा'
                    : lang === 'mr'
                    ? 'सहकारी कल्याण सुरक्षा'
                    : lang === 'te'
                    ? 'సహకార సంక్షేమ భద్రత'
                    : 'Cooperative Welfare Status'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                • PMSBY Cover: ₹5,00,000 Active
                <br />
                • Sahakar Health Card: Valid
                <br />• Thrift Fund: ₹{worker.welfare.thriftDepositBalance.toLocaleString()}
              </p>
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold self-end underline"
              >
                Sign Out / Switch Role →
              </button>
            )}
          </div>
        </div>

        {/* Verification Warning Alert if not verified */}
        {worker.verificationStatus !== 'verified' && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">
                  {worker.verificationStatus === 'under_review'
                    ? 'Credentials Under Federation Review'
                    : 'Account Verification Incomplete'}
                </span>
                <p className="text-amber-700 text-[11px]">
                  Submit your government ID & trade certificate to unlock high-voltage jobs and the verified cooperative shield.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('verification')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition cursor-pointer"
            >
              Open Verification Center →
            </button>
          </div>
        )}

        {/* Worker Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'jobs'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>{getTranslation(lang, 'tabJobBoard')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'jobs' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {openJobs.length + myAssignedJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>{getTranslation(lang, 'tabRealtimeTelemetry')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'verification'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verification Center</span>
            {worker.verificationStatus !== 'verified' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reputation')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'reputation'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Ratings & Reviews</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'reputation'
                  ? 'bg-emerald-800 text-amber-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {(worker.rating || 4.9).toFixed(1)}★
            </span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'earnings'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{getTranslation(lang, 'tabEarnings')}</span>
          </button>

          <button
            onClick={() => setActiveTab('geo')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'geo'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>{getTranslation(lang, 'tabProfile')}</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'skills'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{getTranslation(lang, 'tabCertificates')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: JOB BOARD & RADAR */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Subfilter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setJobFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  jobFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {getTranslation(lang, 'allJobs')} ({openJobs.length + myAssignedJobs.length})
              </button>
              <button
                onClick={() => setJobFilter('emergency')}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  jobFilter === 'emergency'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{getTranslation(lang, 'emergencyOnly')}</span>
              </button>
              <button
                onClick={() => setJobFilter('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  jobFilter === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {getTranslation(lang, 'myActiveJobs')} (
                {myAssignedJobs.filter((j) => j.status !== 'completed').length})
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Geo-Radar Active (within {worker?.location?.serviceRadiusKm || 15} km)</span>
            </div>
          </div>

          {/* Job Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedJobs.map((booking) => {
              const workerCoords = worker?.location?.coordinates || (worker as any)?.coordinates || { lat: 18.5204, lng: 73.8567 };
              const bookingCoords = booking?.coordinates || (booking as any)?.location?.coordinates || { lat: 18.5204, lng: 73.8567 };
              const distanceKm = calculateDistanceKm(
                workerCoords,
                bookingCoords
              );
              const travelTime = estimateTravelTimeMinutes(distanceKm);
              const isAssignedToMe = booking.assignedWorkerId === worker.id;

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between ${
                    booking.isEmergency
                      ? 'border-red-300 ring-1 ring-red-400 bg-red-50/20'
                      : isAssignedToMe
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Card Top Pill Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {booking.isEmergency ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow-xs animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            {getTranslation(lang, 'urgentTag')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                            {booking.serviceCategory}
                          </span>
                        )}

                        <span className="font-mono text-[11px] text-slate-400">
                          {booking.bookingCode}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          booking.status === 'open'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.status === 'assigned'
                            ? 'bg-amber-100 text-amber-800'
                            : booking.status === 'in_transit'
                            ? 'bg-purple-100 text-purple-800'
                            : booking.status === 'in_progress'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Job Title & Details */}
                    <div className="flex items-center justify-between text-xs pb-1 mb-1 border-b border-slate-100">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{booking.customerName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{booking.bookerRating ? `${booking.bookerRating.toFixed(1)} Booker` : '5.0★ Booker'}</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {lang !== 'en' && booking.titleHi ? booking.titleHi : booking.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{booking.description}</p>

                    {/* Geo Proximity and SLA */}
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-semibold">{booking.area}</span>
                        </span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {distanceKm} km {getTranslation(lang, 'distanceAway')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{booking.scheduledTime}</span>
                        </span>
                        <span>
                          {getTranslation(lang, 'estTravel')}: ~{travelTime}m
                        </span>
                      </div>
                    </div>

                    {/* Financial Split Preview on card */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Net Payout to Worker</span>
                        <span className="text-emerald-700 font-extrabold text-sm font-mono">
                          ₹{booking.pricing.workerPayout}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          (Gross ₹{booking.pricing.totalAmount})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Co-op Welfare (7%)</span>
                        <span className="text-slate-700 font-semibold text-xs font-mono">
                          +₹{booking.pricing.coopWelfareFee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Workflow Button */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                    {booking.status === 'open' && (
                      <button
                        onClick={() => onAcceptBooking(booking.id)}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{getTranslation(lang, 'acceptJob')}</span>
                      </button>
                    )}

                    {isAssignedToMe && booking.status === 'assigned' && (
                      <button
                        onClick={() => onAdvanceBookingStatus(booking.id, 'in_transit')}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>{getTranslation(lang, 'startTransit')}</span>
                      </button>
                    )}

                    {isAssignedToMe && booking.status === 'in_transit' && (
                      <button
                        onClick={() => onAdvanceBookingStatus(booking.id, 'in_progress')}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>{getTranslation(lang, 'startJob')}</span>
                      </button>
                    )}

                    {isAssignedToMe && booking.status === 'in_progress' && (
                      <button
                        onClick={() => {
                          onAdvanceBookingStatus(booking.id, 'completed');
                          setRatingBookerBooking(booking);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{getTranslation(lang, 'completeJob')}</span>
                      </button>
                    )}

                    {booking.status === 'completed' && (
                      <div className="w-full space-y-2">
                        <button
                          onClick={() => onOpenInvoice(booking)}
                          className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{getTranslation(lang, 'viewInvoice')}</span>
                        </button>

                        {booking.bookerRating ? (
                          <div className="py-1.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center justify-between font-medium">
                            <span>You Rated Booker:</span>
                            <span className="font-bold flex items-center gap-1 text-amber-700">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>{booking.bookerRating} / 5</span>
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRatingBookerBooking(booking)}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Rate Customer / Booker</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {displayedJobs.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium">{getTranslation(lang, 'noJobsMatch')}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust your service radius or toggle "All Requests" to see available jobs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EARNINGS & WELFARE PANEL */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Earnings KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {getTranslation(lang, 'netEarnings')}
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{totalNetEarned.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Direct UPI instant deposit
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {getTranslation(lang, 'welfareContributed')}
              </span>
              <p className="text-2xl font-black text-emerald-800 font-mono mt-1">
                ₹{(worker.welfare.welfareFundContributionTotal + totalWelfareFundContributed).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Powers medical & injury pool</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {getTranslation(lang, 'thriftBalance')}
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                ₹{worker.welfare.thriftDepositBalance.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Earning 8.2% cooperative annual dividend</p>
            </div>
          </div>

          {/* Welfare Card: Insurance & Health Scheme */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-wrap justify-between items-start gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  {getTranslation(lang, 'pmsbyTitle')}
                </span>
                <h3 className="text-xl font-black mt-2">{getTranslation(lang, 'pmsbyCover')}</h3>
                <p className="text-xs text-emerald-200 mt-1 font-mono">
                  Policy #: {worker.welfare.insurancePolicyNumber} • Cooperative Group Certificate
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-slate-300 block">Accidental Death / Disability</span>
                    <span className="font-bold text-white text-sm">₹5,00,000 Guaranteed</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block">Co-op Hospitalization Cash</span>
                    <span className="font-bold text-white text-sm">₹1,500 / Day (up to 21 days)</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 transition shadow-xs"
                >
                  {getTranslation(lang, 'fileClaim')}
                </button>
                <span className="text-[10px] text-emerald-300 text-center">
                  24/7 Co-op Helpdesk: 1800-266-COOP
                </span>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              {getTranslation(lang, 'invoicesList')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{getTranslation(lang, 'payoutNote')}</p>

            <div className="divide-y divide-slate-100">
              {completedJobs.length > 0 ? (
                completedJobs.map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{job.title}</span>
                        <span className="font-mono text-xs text-slate-400">{job.invoiceNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(job.createdAt).toLocaleDateString()} • {job.customerName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-emerald-800 text-sm font-mono block">
                          ₹{job.pricing.workerPayout}
                        </span>
                        <span className="text-[10px] text-slate-400">Net Worker Share</span>
                      </div>
                      <button
                        onClick={() => onOpenInvoice(job)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 italic">
                  Completed job invoices will automatically appear here with instant UPI settlement records.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GEOGRAPHIC PROFILE SETUP */}
      {activeTab === 'geo' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {getTranslation(lang, 'geoSetupTitle')}
            </h3>
            <p className="text-xs text-slate-500">{getTranslation(lang, 'geoSetupDesc')}</p>
          </div>

          {geoSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{getTranslation(lang, 'locationSynced')}</span>
            </div>
          )}

          <form onSubmit={handleSaveGeo} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {getTranslation(lang, 'homeBase')}
              </label>
              <input
                type="text"
                value={geoArea}
                onChange={(e) => setGeoArea(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                e.g., Shivajinagar, Kothrud, Aundh, Hadapsar, Pimpri
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getTranslation(lang, 'serviceRadius')}
                </label>
                <span className="text-xs font-bold text-emerald-700 font-mono">{geoRadius} km</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={geoRadius}
                onChange={(e) => setGeoRadius(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3 km (Neighborhood)</span>
                <span>12 km (City Zone)</span>
                <span>25 km (Greater Metro)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                {getTranslation(lang, 'currentCoordinates')}
              </span>
              <p className="font-mono text-slate-600">
                Latitude: {(worker?.location?.coordinates?.lat ?? (worker as any)?.lat ?? 18.5204).toFixed(4)}, Longitude:{' '}
                {(worker?.location?.coordinates?.lng ?? (worker as any)?.lng ?? 73.8567).toFixed(4)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simulated via Cooperative Field App GPS anchor
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md active:scale-95 transition"
            >
              {getTranslation(lang, 'updateGeo')}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SKILLS & CERTIFICATIONS UPLOAD */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Current Verified Badges */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              {getTranslation(lang, 'skillProfileTitle')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Federation verified trade licenses and government vocational qualifications
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {worker.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{cert.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          cert.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cert.verificationStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{cert.issuingBody}</p>
                    <p className="text-xs font-mono text-slate-500 mt-1">
                      Credential: {cert.credentialNumber}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload New Certification Simulator */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <UploadCloud className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-slate-900 text-base">
                {getTranslation(lang, 'uploadCertificate')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Upload ITI diplomas, wireman certificates, or safety licenses for Federation queue review.
            </p>

            {certSubmittedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-300 flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Credentials submitted to Federation Verification Queue! Admin will audit and approve.
                </span>
              </div>
            )}

            <form onSubmit={handleCertSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certification / Degree Title
                </label>
                <input
                  type="text"
                  required
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {getTranslation(lang, 'certIssuingBody')}
                  </label>
                  <input
                    type="text"
                    required
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {getTranslation(lang, 'credentialNumber')}
                  </label>
                  <input
                    type="text"
                    required
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {getTranslation(lang, 'documentType')}
                </label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as any)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="skill_india_nsdc">Skill India / NSDC Trade Certificate</option>
                  <option value="iti_diploma">Industrial Training Institute (ITI) Diploma</option>
                  <option value="wireman_license">State Electricity Board Wireman License</option>
                  <option value="safety_clearance">Occupational Health & Safety Clearance</option>
                  <option value="trade_card">Cooperative Union Master Artisan Card</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-600 font-medium">
                  {getTranslation(lang, 'uploadPrompt')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">PDF, PNG, JPG up to 10MB (Simulated)</p>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md active:scale-95 transition"
              >
                {getTranslation(lang, 'submitToQueue')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: VERIFICATION CENTER */}
      {activeTab === 'verification' && (
        <WorkerVerificationPortal
          worker={{
            ...worker,
            verification_status: worker.verificationStatus as any,
            id_proof_type: worker.certifications?.[0]?.documentType || 'Aadhaar Card',
            id_proof_number: '5492 8491 0293',
            cert_title: worker.certifications?.[0]?.title || `${worker.primarySkill} Trade Certificate`,
            cert_number: worker.certifications?.[0]?.credentialNumber || 'ITI/2026/892',
            issuing_body: worker.certifications?.[0]?.issuingBody || 'National Skill Development Corporation',
            verified_by: 'State Cooperative Technical Board',
            verified_at: '2026-02-15',
            hourly_rate: 450,
            service_radius_km: worker?.location?.serviceRadiusKm || 15,
            lat: worker?.location?.coordinates?.lat ?? (worker as any)?.lat ?? 18.5204,
            lng: worker?.location?.coordinates?.lng ?? (worker as any)?.lng ?? 73.8567,
            city: worker?.location?.city || 'Pune',
            area: worker?.location?.area || 'Pune Central',
            primary_skill: worker.primarySkill,
            skills: worker.skills,
            welfare_fund_balance: worker.welfare.welfareFundContributionTotal,
            completed_jobs_count: worker.completedJobsCount,
            emergencyCertified: worker.emergencyCertified,
          } as any}
          onWorkerUpdated={(updated) => {
            if (onWorkerUpdated) onWorkerUpdated(updated);
          }}
        />
      )}

      {/* TAB: REAL-TIME TELEMETRY & LIVE STATUS */}
      {activeTab === 'telemetry' && (
        <WorkerRealtimeTelemetry
          worker={worker}
          bookings={bookings}
          onWorkerUpdated={(updated) => {
            if (onWorkerUpdated) onWorkerUpdated(updated);
          }}
          lang={lang}
        />
      )}

      {/* TAB: RATINGS & COMMUNITY REPUTATION */}
      {activeTab === 'reputation' && (
        <WorkerReputationPanel
          worker={worker}
          bookings={bookings}
          lang={lang}
          onOpenBookerRating={(booking) => setRatingBookerBooking(booking)}
        />
      )}

      {/* Welfare Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              {lang === 'hi'
                ? 'सहकारी कल्याण दावा फॉर्म'
                : lang === 'mr'
                ? 'सहकारी कल्याण दावा अर्ज'
                : lang === 'te'
                ? 'సహకార సంక్షేమ క్లెయిమ్ ఫారమ్'
                : 'Submit Cooperative Welfare Claim'}
            </h3>
            <p className="text-xs text-slate-500">
              Direct emergency medical reimbursement or accident aid from the collective welfare pool.
            </p>

            {claimSubmitted ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">Claim Lodged: #CLM-2026-8812</p>
                <p className="text-[11px] text-emerald-700">
                  Federation Welfare Board will verify hospital voucher and credit within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimSubmitted(false);
                  }}
                  className="mt-2 px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Claim Type</label>
                  <select className="w-full p-2 border border-slate-300 rounded-lg">
                    <option>Hospitalization Cash Support (₹1,500/day)</option>
                    <option>Workplace Minor Injury Treatment Aid</option>
                    <option>Emergency Tool Replacement Grant</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hospital / Clinic Name</label>
                  <input
                    type="text"
                    defaultValue="Sancheti Hospital, Pune"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Requested Amount (₹)</label>
                  <input
                    type="number"
                    defaultValue="4500"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowClaimModal(false)}
                    className="px-3 py-2 font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setClaimSubmitted(true)}
                    className="px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Submit Claim
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booker Rating Modal */}
      {ratingBookerBooking && (
        <BookerRatingModal
          booking={ratingBookerBooking}
          isOpen={true}
          onClose={() => setRatingBookerBooking(null)}
          onRatingSubmitted={(bookingId, rating, comment) => {
            // Update local state if needed
            setRatingBookerBooking(null);
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
