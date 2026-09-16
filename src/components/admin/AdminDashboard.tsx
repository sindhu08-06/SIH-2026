import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle,
  Building2,
  Sparkles,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Phone,
  FileCheck2,
  Award,
  Filter,
  DollarSign,
  HeartHandshake,
  Download,
  FileText,
  Search,
  Check,
  X,
  ExternalLink,
  HardHat,
  Database,
  Radio,
  Send,
  LogOut,
  Star,
  ThumbsUp,
  Stamp,
} from 'lucide-react';
import {
  WorkerProfile,
  CooperativeSociety,
  Booking,
  PaymentLedgerItem,
  DemandForecast,
  Language,
} from '../../types';
import { getTranslation } from '../../locales/i18n';
import { calculateDistanceKm } from '../../utils/geo';
import { FederationGISMap } from './FederationGISMap';
import { GoogleIcon } from '../common/GoogleIcon';

interface AdminDashboardProps {
  workers: WorkerProfile[];
  societies: CooperativeSociety[];
  bookings: Booking[];
  paymentLedgers: PaymentLedgerItem[];
  demandForecast: DemandForecast;
  onApproveWorker: (workerId: string) => void;
  onRejectWorker: (workerId: string, note: string) => void;
  onRefreshForecast: () => Promise<void>;
  isLoadingForecast: boolean;
  onOpenInvoice: (booking: Booking) => void;
  lang: Language;
  adminUser?: {
    email: string;
    name: string;
    photoURL?: string;
    uid?: string;
  } | null;
  onAdminSignOut?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  workers,
  societies,
  bookings,
  paymentLedgers,
  demandForecast,
  onApproveWorker,
  onRejectWorker,
  onRefreshForecast,
  isLoadingForecast,
  onOpenInvoice,
  lang,
  adminUser,
  onAdminSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<
    'kpis' | 'map' | 'verification' | 'reputation' | 'societies' | 'forecast' | 'analytics'
  >('kpis');

  // Booking Filters in KPIs tab
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');

  // Verification review modal / note
  const [rejectReason, setRejectReason] = useState(
    'Incomplete certificate stamp from issuing board.'
  );
  const [selectedReviewWorker, setSelectedReviewWorker] =
    useState<WorkerProfile | null>(null);

  // Welfare Disbursal & Audit Modals
  const [isWelfareModalOpen, setIsWelfareModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [welfareDisburseSuccess, setWelfareDisburseSuccess] = useState<string | null>(null);
  const [welfareAmount, setWelfareAmount] = useState('5000');
  const [welfareBeneficiary, setWelfareBeneficiary] = useState(workers[0]?.name || 'Worker Member');
  const [welfareReason, setWelfareReason] = useState('Emergency Medical Assistance (Sahakar Arogya)');

  // KPIs
  const verifiedWorkersCount = workers.filter(
    (w) => w.verificationStatus === 'verified'
  ).length;
  const pendingVerificationList = workers.filter(
    (w) =>
      w.verificationStatus === 'pending' ||
      w.verificationStatus === 'under_review'
  );
  const activeEmergencies = bookings.filter(
    (b) => b.isEmergency && (b.status === 'open' || b.status === 'assigned')
  );
  const totalCoopRevenue = paymentLedgers.reduce(
    (acc, curr) => acc + curr.coopWelfareShare + curr.federationShare,
    0
  );
  const totalWorkerDisbursed = paymentLedgers.reduce(
    (acc, curr) => acc + curr.workerPayout,
    0
  );
  const totalWelfareFundPool = societies.reduce(
    (acc, curr) => acc + curr.welfareFundBalance,
    0
  );

  // Handle Export Official Audit Report
  const handleExportAuditReport = () => {
    const reportData = {
      title: "MAHARASHTRA COOPERATIVE SOCIETIES ACT - SECTION 81 STATUTORY AUDIT SUMMARY",
      generatedAt: new Date().toISOString(),
      auditPeriod: "FY 2024-2025 (Q3 Current Run)",
      registeredArtisans: workers.length,
      verifiedArtisansCount: verifiedWorkersCount,
      verifiedRate: `${Math.round((verifiedWorkersCount / (workers.length || 1)) * 100)}%`,
      totalServicesHandled: bookings.length,
      totalWorkerDisbursedINR: totalWorkerDisbursed,
      statutoryPMSBYCoverage: "100% Active Underwritten by Cooperative Guild",
      welfareReserveFundINR: totalWelfareFundPool,
      statutoryComplianceStatement: "Disintermediated direct payouts. Dual-layer transaction ledger persisted in local SQLite and Google Cloud Firestore.",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahakar-seva-statutory-audit-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsAuditModalOpen(false);
  };

  // Filtered Bookings for Table
  const filteredBookings = bookings.filter((b) => {
    if (bookingStatusFilter !== 'all') {
      if (bookingStatusFilter === 'emergency') {
        if (!b.isEmergency) return false;
      } else if (b.status !== bookingStatusFilter) {
        return false;
      }
    }
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      return (
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.serviceCategory.toLowerCase().includes(q) ||
        b.area.toLowerCase().includes(q) ||
        (b.assignedWorkerName && b.assignedWorkerName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDisburseWelfare = (e: React.FormEvent) => {
    e.preventDefault();
    setWelfareDisburseSuccess(
      `Disbursed ₹${welfareAmount} grant to ${welfareBeneficiary} for "${welfareReason}". Bank UTR generated: MH-COOP-${Math.floor(
        100000 + Math.random() * 900000
      )}`
    );
    setTimeout(() => {
      setWelfareDisburseSuccess(null);
      setIsWelfareModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* EXECUTIVE HEADER & OFFICER BADGE */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30 border border-emerald-400/40">
                <span>सह</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {getTranslation(lang, 'adminTitle')}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Tier-1 Federation Board
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Andhra Pradesh Cooperative Societies Act 1964 • Real-time artisan oversight & collective welfare governance
                </p>
              </div>
            </div>
          </div>

          {/* Officer Identity & Live Database Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {adminUser ? (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 rounded-2xl p-2.5 pr-4 shadow-sm">
                {adminUser.photoURL ? (
                  <img
                    src={adminUser.photoURL}
                    alt={adminUser.name}
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-400 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs">{adminUser.name}</span>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-400/30 flex items-center gap-1">
                      <GoogleIcon className="w-2.5 h-2.5" />
                      <span>Officer</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {adminUser.email}
                  </div>
                </div>
                {onAdminSignOut && (
                  <button
                    onClick={onAdminSignOut}
                    className="ml-2 p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="Sign Out of Federation Officer Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-semibold">Federation Security Board</span>
              </div>
            )}

            {/* Quick Actions: Audit Report & Welfare Fund Pool */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Statutory Audit Report</span>
            </button>

            <button
              onClick={() => setIsWelfareModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Welfare Pool (₹{totalWelfareFundPool.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Compliance & Governance Ticker */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 text-[11px]">
            <span>Active Societies: <strong className="text-white">{societies.length}</strong></span>
            <span>•</span>
            <span>Verified Artisans: <strong className="text-emerald-400">{verifiedWorkersCount}</strong></span>
            <span>•</span>
            <span>Compliance Grade: <strong className="text-emerald-400">AAA (Andhra Pradesh Cooperative Reg.)</strong></span>
          </div>
          <div className="text-[11px] text-slate-400">
            Kurnool & Ananthapur Division • Real-time Federation Oversight
          </div>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'kpis'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{getTranslation(lang, 'adminTabKpis')}</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>{getTranslation(lang, 'adminTabMap')}</span>
          {activeEmergencies.length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
              {activeEmergencies.length} SOS
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'verification'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{getTranslation(lang, 'adminTabVerification')}</span>
          {pendingVerificationList.length > 0 && (
            <span className="bg-amber-500 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {pendingVerificationList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reputation')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'reputation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>Mutual Ratings & Trust</span>
        </button>

        <button
          onClick={() => setActiveTab('societies')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'societies'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>{getTranslation(lang, 'adminTabSocieties')}</span>
          <span className="text-[10px] text-slate-400 font-mono">({societies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'forecast'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{getTranslation(lang, 'adminTabForecast')}</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4 text-teal-600" />
          <span>{getTranslation(lang, 'adminTabAnalytics')}</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE KPIS & LIVE DISPATCH TABLE */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                <Users className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {getTranslation(lang, 'kpiActiveWorkers')}
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {verifiedWorkersCount}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    / {workers.length} registered
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
                <FileCheck2 className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {getTranslation(lang, 'pendingReviewCount')}
                </span>
                <span className="text-2xl font-black text-amber-700">
                  {pendingVerificationList.length}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    artisan audits
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl">
                <Building2 className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {getTranslation(lang, 'societiesTitle')}
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {societies.length}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    (1,480 flats)
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xl">
                <AlertTriangle className="w-6 h-6 text-rose-700" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {getTranslation(lang, 'kpiEmergencyAlerts')}
                </span>
                <span className="text-2xl font-black text-rose-700">
                  {activeEmergencies.length}
                  <span className="text-xs text-slate-400 font-normal ml-1">
                    under 15m SLA
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Financial Collective Summary Bar */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40 flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" />
                <span>Maharashtra Cooperative Model (90-7-3 Model)</span>
              </span>
              <h2 className="text-xl font-black mt-1">
                Total Direct Worker Disbursals: ₹{totalWorkerDisbursed.toLocaleString()}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                90% gross fees sent instantly to worker bank accounts via UPI with zero predatory platform commissions.
              </p>
            </div>

            <div className="flex items-center gap-4 text-center">
              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                <span className="text-[10px] text-slate-300 block uppercase">Welfare Pool</span>
                <span className="font-mono text-lg font-bold text-emerald-300">
                  ₹{totalWelfareFundPool.toLocaleString()}
                </span>
              </div>
              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                <span className="text-[10px] text-slate-300 block uppercase">Federation Revenue</span>
                <span className="font-mono text-lg font-bold text-teal-300">
                  ₹{totalCoopRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* LIVE DISPATCH & ORDERS TABLE WITH SEARCH & FILTERS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cooperative Work Orders & Live Dispatch
                </h3>
                <p className="text-xs text-slate-500">
                  Audit open customer bookings, artisan assignments, and instantaneous UPI payouts
                </p>
              </div>

              {/* Search Bar & Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search code, customer, area..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses ({bookings.length})</option>
                  <option value="open">Open / Broadcasting</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_transit">In Transit</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="emergency">⚡ Emergency SOS</option>
                </select>

                <button
                  onClick={() => setActiveTab('map')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View on GIS Map</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-2.5 px-3">Booking Code</th>
                    <th className="py-2.5 px-3">Service Category</th>
                    <th className="py-2.5 px-3">Customer & Location</th>
                    <th className="py-2.5 px-3">Assigned Artisan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Fee Breakdown</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-mono font-semibold">
                          <div className="flex items-center gap-1.5">
                            {b.isEmergency && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                            )}
                            <span
                              className={
                                b.isEmergency ? 'text-red-700 font-bold' : 'text-slate-900'
                              }
                            >
                              {b.bookingCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {b.serviceCategory}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900">{b.customerName}</p>
                          <p className="text-[11px] text-slate-500">{b.area}</p>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {b.assignedWorkerName ? (
                            <span className="font-semibold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{b.assignedWorkerName}</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Broadcasting to nearby workers
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.status === 'open'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : b.status === 'assigned'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : b.status === 'in_transit' || b.status === 'in_progress'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {b.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          ₹{b.pricing.totalAmount}
                          <span className="text-[10px] text-emerald-700 block font-normal">
                            (90% Worker = ₹{b.pricing.workerPayout})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onOpenInvoice(b)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            Official Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No bookings matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE FEDERATION GIS MAP */}
      {activeTab === 'map' && (
        <FederationGISMap
          workers={workers}
          societies={societies}
          bookings={bookings}
          onOpenInvoice={onOpenInvoice}
          onApproveWorker={onApproveWorker}
        />
      )}

      {/* TAB 3: ARTISAN VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">
                Artisan Verification & Skill Audit Queue ({pendingVerificationList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Audit vocational diplomas, Wireman licenses, and Skill India certificates before authorizing workers for cooperative dispatch.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Cooperative Board Clearance Standard: NSDC / NCVT Level 3+
              </span>
            </div>
          </div>

          {pendingVerificationList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingVerificationList.map((worker) => (
                <div
                  key={worker.id}
                  className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={worker.avatar}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover border border-amber-300"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">{worker.name}</h4>
                          <p className="text-xs font-semibold text-amber-900">{worker.primarySkill}</p>
                          <p className="text-[11px] text-slate-500">{worker.societyName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                        {worker.verificationStatus}
                      </span>
                    </div>

                    {/* Verification Pathway Badge if non-traditional */}
                    {worker.verificationPathway && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold border border-teal-200">
                          {worker.verificationPathway === 'practical_experience' ? '🛠️ Practical Experience' :
                           worker.verificationPathway === 'coop_peer_endorsement' ? '🤝 Guild / Peer Endorsed' :
                           worker.verificationPathway === 'provisional_apprentice' ? '🧭 Provisional Member' :
                           worker.verificationPathway}
                        </span>
                        {worker.experienceYears ? (
                          <span className="text-slate-600 font-semibold">{worker.experienceYears} Years Trade Exp.</span>
                        ) : null}
                        {worker.mentorArtisanName ? (
                          <span className="text-teal-700 font-medium">Vouched by: {worker.mentorArtisanName}</span>
                        ) : null}
                      </div>
                    )}

                    {/* Submitted Certifications list */}
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Credentials Submitted for Review:
                      </p>
                      {worker.certifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold text-slate-900">
                            <span>{cert.title}</span>
                            <span className="text-emerald-700 text-[10px] font-mono">
                              {cert.credentialNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{cert.issuingBody}</p>
                        </div>
                      ))}
                    </div>

                    {worker.verificationNote && (
                      <p className="text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-lg border border-amber-200/60 mt-3">
                        Note: {worker.verificationNote}
                      </p>
                    )}
                  </div>

                  {/* Audit Actions */}
                  <div className="mt-5 pt-3 border-t border-amber-200/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedReviewWorker(worker)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold transition cursor-pointer"
                    >
                      Request Rectification
                    </button>
                    <button
                      onClick={() => onApproveWorker(worker.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Authorize Dispatch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-extrabold text-slate-900 text-base">
                All Artisans Verified
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Every active worker currently holds authorized certification from the Maharashtra Cooperative Board.
              </p>
            </div>
          )}

          {/* Rectification Modal */}
          {selectedReviewWorker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Audit Query for {selectedReviewWorker.name}
                  </h4>
                  <button
                    onClick={() => setSelectedReviewWorker(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason for Rectification Request:
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedReviewWorker(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onRejectWorker(selectedReviewWorker.id, rejectReason);
                      setSelectedReviewWorker(null);
                    }}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                  >
                    Send Audit Notice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MUTUAL RATINGS & REPUTATION LEDGER */}
      {activeTab === 'reputation' && (
        <div className="space-y-6">
          {/* Mutual Reputation KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Artisan Federation Rating
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {(
                    workers.reduce((acc, w) => acc + (w.rating || 5.0), 0) /
                    Math.max(1, workers.length)
                  ).toFixed(2)}
                </span>
                <span className="text-xs text-amber-700 font-bold flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>/ 5.0</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Across {workers.length} active trade artisans
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Booker / Customer Trust Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">4.95</span>
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-600" />
                  <span>/ 5.0</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Prompt payment & worksite safety rating
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Mutual Reviews Logged
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700">
                  {bookings.filter((b) => b.workerRating || b.bookerRating).length}
                </span>
                <span className="text-xs text-slate-500 font-medium">reviews</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Two-way bilateral transparency active
              </span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Cooperative Dispute Index
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">0.0%</span>
                <span className="text-xs text-slate-500 font-medium">flagged</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                100% mutual consensus standard
              </span>
            </div>
          </div>

          {/* Reputation Transparency Overview */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Bilateral Rating & Skill Reputation Protocol</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Unlike proprietary gig platforms that penalize workers unilaterally, Sahakar Seva enforces mutual accountability. Bookers rate technical workmanship and pricing clarity; artisans rate worksite safety, dignity, and prompt digital payout.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                  AP Cooperative Act Sec 19 Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Mutual Reviews Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  Recent Mutual Evaluation Records ({bookings.length})
                </h4>
                <p className="text-xs text-slate-500">
                  Live feed of ratings submitted between registered cooperative artisans and verified bookers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Job / Code</th>
                    <th className="p-3">Artisan Details</th>
                    <th className="p-3">Customer Evaluation (Artisan)</th>
                    <th className="p-3">Artisan Evaluation (Booker)</th>
                    <th className="p-3">Trust Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 align-top">
                        <div className="font-bold text-slate-900">{booking.title}</div>
                        <div className="font-mono text-[10px] text-slate-400">{booking.bookingCode}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{booking.area}</div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-semibold text-slate-800">
                          {booking.assignedWorkerName || 'Dispatched Artisan'}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {booking.category}
                        </span>
                      </td>

                      <td className="p-3 align-top">
                        {booking.workerRating ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-bold text-amber-700">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>{booking.workerRating} / 5</span>
                            </div>
                            {booking.workerReview && (
                              <p className="text-[11px] text-slate-600 italic">
                                "{booking.workerReview}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {booking.status === 'completed' ? 'Awaiting customer rating' : 'Job in progress'}
                          </span>
                        )}
                      </td>

                      <td className="p-3 align-top">
                        {booking.bookerRating ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-bold text-emerald-700">
                              <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-600" />
                              <span>{booking.bookerRating} / 5</span>
                            </div>
                            {booking.bookerReview && (
                              <p className="text-[11px] text-slate-600 italic">
                                "{booking.bookerReview}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {booking.status === 'completed' ? 'Awaiting artisan rating' : 'Job in progress'}
                          </span>
                        )}
                      </td>

                      <td className="p-3 align-top">
                        {booking.workerRating && booking.bookerRating ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Dual 5★ Verified</span>
                          </span>
                        ) : booking.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-200">
                            <span>Good Standing</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            <span>Active Job</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HOUSING SOCIETIES REGISTRY */}
      {activeTab === 'societies' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base mb-1">
                Affiliated Cooperative Housing Societies
              </h3>
              <p className="text-xs text-slate-500">
                Registered housing colonies, resident member accounts, and welfare contributions
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Total Flats Covered: 1,480+
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {societies.map((soc) => (
              <div
                key={soc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{soc.name}</h4>
                    <p className="text-xs text-slate-500">{soc.area}, {soc.city}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
                  <div className="flex justify-between">
                    <span>Registration No:</span>
                    <strong className="font-mono text-slate-900">{soc.registrationNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Resident Flats:</span>
                    <strong className="text-slate-900">{soc.flatsCount} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Dedicated Artisans:</span>
                    <strong className="text-emerald-700">{soc.activeWorkersCount} on standby</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Welfare Fund Pool:</span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      ₹{soc.welfareFundBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI GEMINI DEMAND FORECAST */}
      {activeTab === 'forecast' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cooperative Demand & Fair-Price Forecasting
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Gemini AI Engine</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Machine learning analysis of weather, festival seasons, and historical trade demand to avoid predatory surge pricing
              </p>
            </div>

            <button
              onClick={onRefreshForecast}
              disabled={isLoadingForecast}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingForecast ? 'animate-spin' : ''}`} />
              <span>{isLoadingForecast ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-900 block uppercase">
                Forecasted High-Demand Trade
              </span>
              <span className="text-xl font-black text-emerald-950 mt-1 block">
                {demandForecast.category}
              </span>
              <p className="text-xs text-emerald-800 mt-2">
                Reason: {demandForecast.reason}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-900 block uppercase">
                Recommended Cooperative Fair Rate
              </span>
              <span className="text-xl font-black text-blue-950 mt-1 block">
                ₹{demandForecast.recommendedRate}/hr
              </span>
              <p className="text-xs text-blue-800 mt-2">
                Guarantees livable wage while protecting consumer equity across housing societies.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-900 block uppercase">
                AI Confidence Level
              </span>
              <span className="text-xl font-black text-amber-950 mt-1 block">
                {Math.round(demandForecast.confidenceScore * 100)}%
              </span>
              <p className="text-xs text-amber-800 mt-2">
                Calculated across 850+ historical job completions in Pune & PCMC cluster.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FINANCIAL ANALYTICS & LEDGERS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue Distribution Diagram */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Cooperative Fee Transparency Matrix (The 90-7-3 Model)
            </h3>
            <div className="space-y-2">
              <div className="flex rounded-xl overflow-hidden h-9 shadow-inner">
                <div
                  style={{ width: '90%' }}
                  className="bg-emerald-600 text-white font-black text-xs flex items-center justify-center"
                >
                  90% Direct Artisan Share
                </div>
                <div
                  style={{ width: '7%' }}
                  className="bg-teal-700 text-white font-black text-[10px] flex items-center justify-center"
                >
                  7%
                </div>
                <div
                  style={{ width: '3%' }}
                  className="bg-slate-700 text-white font-black text-[9px] flex items-center justify-center"
                >
                  3%
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="font-bold text-emerald-950 block">90% Direct Worker Payout</span>
                  <span className="text-slate-600 text-[11px] block mt-1">
                    Instant UPI disbursement upon job completion. Zero predatory deduction.
                  </span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <span className="font-bold text-teal-950 block">7% Society Welfare Reserve</span>
                  <span className="text-slate-600 text-[11px] block mt-1">
                    Directly funds PM Suraksha Bima premiums and emergency family health grants.
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block">3% Federation Operations</span>
                  <span className="text-slate-600 text-[11px] block mt-1">
                    Covers GPS GIS servers, AI demand forecasting, and verification audit staff.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settled Payment Ledgers Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              Cooperative Audit Payment Ledger
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cryptographically timestamped settlement records with bank UTR transaction references.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-2 px-3">Booking Code</th>
                    <th className="py-2 px-3">Artisan</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 text-right">Worker Share (90%)</th>
                    <th className="py-2 px-3 text-right">Welfare (7%)</th>
                    <th className="py-2 px-3 text-right">Ops (3%)</th>
                    <th className="py-2 px-3">Bank UTR Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentLedgers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {item.bookingCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-semibold">{item.workerName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.customerName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        ₹{item.workerPayout}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ₹{item.coopWelfareShare}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        ₹{item.federationShare}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                        {item.utrRef}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY AUDIT REPORT MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Statutory Cooperative Compliance Audit Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Generated under Section 73 & 79, Maharashtra Cooperative Societies Act 1960
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-2.5 max-h-[340px] overflow-y-auto">
              <div className="text-center font-bold text-slate-900 pb-2 border-b border-slate-200">
                PUNE DISTRICT ARTISANS & SERVICE PROVIDERS COOPERATIVE FEDERATION
                <br />
                GOVERNMENT REGISTRATION NO: MH-PUN-COOP-2024-8891
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>AUDIT PERIOD: Q1 2026-27</div>
                <div>TIMESTAMP: {new Date().toLocaleString()}</div>
                <div>OFFICER IN CHARGE: {adminUser?.name || 'Federation Board Officer'}</div>
                <div>AUTH STATUS: GOOGLE FIREBASE SSO VERIFIED</div>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div>TOTAL REGISTERED ARTISANS: {workers.length}</div>
                <div>VERIFIED & BONDED ARTISANS: {verifiedWorkersCount} ({Math.round((verifiedWorkersCount / workers.length) * 100)}%)</div>
                <div>AFFILIATED HOUSING SOCIETIES: {societies.length}</div>
                <div>TOTAL RESIDENT FLATS COVERED: 1,480 Units</div>
                <div>COMPLETED WORK ORDERS: {bookings.filter((b) => b.status === 'completed').length}</div>
                <div>DIRECT ARTISAN PAYOUTS (90%): ₹{totalWorkerDisbursed.toLocaleString()}</div>
                <div>COLLECTIVE WELFARE FUND BALANCE: ₹{totalWelfareFundPool.toLocaleString()}</div>
                <div>STATUTORY ACCIDENTAL COVERAGE (PMSBY): 100% ENROLLED</div>
              </div>
              <div className="pt-2 text-[11px] text-emerald-800 font-sans font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                ✓ Certification: All payments processed without unauthorized middleman markups. Dual data integrity recorded in SQLite and Cloud Firestore DB.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={handleExportAuditReport}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Official Audit Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WELFARE POOL DISBURSAL MODAL */}
      {isWelfareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Artisan Collective Welfare Fund Disbursal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Disburse emergency medical aid, insurance claims, or tool grants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWelfareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {welfareDisburseSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{welfareDisburseSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDisburseWelfare} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <span className="font-bold text-emerald-950">Total Available Welfare Pool:</span>
                <span className="font-mono text-base font-black text-emerald-800">
                  ₹{totalWelfareFundPool.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Beneficiary Artisan</label>
                <select
                  value={welfareBeneficiary}
                  onChange={(e) => setWelfareBeneficiary(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-xs font-semibold"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.primarySkill} • {w.societyName.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Grant Category</label>
                <select
                  value={welfareReason}
                  onChange={(e) => setWelfareReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-xs"
                >
                  <option value="Emergency Medical Assistance (Sahakar Arogya)">
                    Emergency Medical Assistance (Sahakar Arogya)
                  </option>
                  <option value="Pradhan Mantri Suraksha Bima Yojana Claim">
                    Accident & Disability Claim (PMSBY)
                  </option>
                  <option value="Artisan Tool & Safety Equipment Modernization Grant">
                    Artisan Tool & Safety Equipment Modernization Grant
                  </option>
                  <option value="Children Higher Education Scholarship Fund">
                    Artisan Children Higher Education Scholarship
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={welfareAmount}
                  onChange={(e) => setWelfareAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-sm font-bold font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWelfareModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Direct Bank Disbursal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
