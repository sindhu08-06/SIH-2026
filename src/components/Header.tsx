import React from 'react';
import {
  Users,
  ShieldCheck,
  Globe2,
  AlertTriangle,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Smartphone,
  Laptop,
  Home,
  MapPin,
  Database,
  CalendarCheck,
} from 'lucide-react';
import { Language, WorkerProfile, Booking } from '../types';
import { getTranslation, getEmergencyBannerText } from '../locales/i18n';

export type AppViewMode = 'landing' | 'customer' | 'worker' | 'admin';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onSelectLang?: (lang: Language) => void;
  currentRole: AppViewMode;
  onChangeRole: (role: AppViewMode) => void;
  workers: WorkerProfile[];
  selectedWorkerId: string;
  onSelectWorker: (id: string) => void;
  bookings: Booking[];
  onOpenCustomerBooking: () => void;
  onResetData: () => void;
  isMobileDeviceView: boolean;
  onToggleDeviceView: () => void;
  locationArea?: string;
  locationCity?: string;
  onRefreshLocation?: () => void;
  onOpenLocationPicker?: () => void;
  dbStats?: { totalWorkers: number; totalBookings: number } | null;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onSelectLang,
  currentRole,
  onChangeRole,
  workers,
  selectedWorkerId,
  onSelectWorker,
  bookings,
  onOpenCustomerBooking,
  onResetData,
  isMobileDeviceView,
  onToggleDeviceView,
  locationArea,
  locationCity,
  onRefreshLocation,
  onOpenLocationPicker,
  dbStats,
}) => {
  const activeEmergencies = bookings.filter(
    (b) => b.isEmergency && (b.status === 'open' || b.status === 'assigned')
  );

  return (
    <header className="bg-white border-b border-slate-200 shadow-2xs">
      {/* Emergency ticker banner if emergencies exist */}
      {activeEmergencies.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {getEmergencyBannerText(activeEmergencies.length, lang)}
            </span>
            <span className="hidden md:inline-block bg-white/20 rounded px-2 py-0.5 text-[11px]">
              {activeEmergencies[0].title}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Navigation / Role Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="role-btn-landing"
            onClick={() => onChangeRole('landing')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              currentRole === 'landing'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Return to Welcome & Role Selection"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'होम' : lang === 'mr' ? 'मुख्य' : lang === 'te' ? 'హోమ్' : 'Home'}</span>
          </button>

          <button
            id="role-btn-customer"
            onClick={() => onChangeRole('customer')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              currentRole === 'customer'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">
              {lang === 'hi' ? 'सेवा बुक करें' : lang === 'mr' ? 'सेवा बुक करा' : lang === 'te' ? 'సేవ బుక్ చేయండి' : 'Book a Worker'}
            </span>
            <span className="sm:hidden">
              {lang === 'hi' ? 'बुकिंग' : lang === 'mr' ? 'बुकिंग' : lang === 'te' ? 'బుక్' : 'Book'}
            </span>
          </button>

          <button
            id="role-btn-worker"
            onClick={() => onChangeRole('worker')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              currentRole === 'worker'
                ? 'bg-white text-teal-800 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">
              {lang === 'hi' ? 'कारीगर पोर्टल' : lang === 'mr' ? 'कामगार पोर्टल' : lang === 'te' ? 'కార్మిక పోర్టల్' : 'Worker Portal'}
            </span>
            <span className="sm:hidden">
              {lang === 'hi' ? 'कारीगर' : lang === 'mr' ? 'कामगार' : lang === 'te' ? 'కార్మికుడు' : 'Worker'}
            </span>
          </button>

          <button
            id="role-btn-admin"
            onClick={() => onChangeRole('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              currentRole === 'admin'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'प्रशासन' : lang === 'mr' ? 'प्रशासन' : lang === 'te' ? 'అడ్మిన్' : 'Admin'}</span>
          </button>
        </div>

        {/* MIDDLE OF WEBSITE: CENTERED BRAND LOGO & WEBSITE NAME */}
        <div
          onClick={() => onChangeRole('landing')}
          className="flex items-center justify-center gap-2.5 cursor-pointer group order-first sm:order-none mx-auto sm:mx-0"
          title="Return to Home Screen"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20 border border-emerald-400/30 group-hover:scale-105 transition-transform">
            <span className="tracking-tighter">सह</span>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-slate-900 font-display">
                {getTranslation(lang, 'brandName')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden md:block">
              {getTranslation(lang, 'brandTagline')}
            </p>
          </div>
        </div>

        {/* Right Side: Action Controls & Status */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Middle location & database pill */}
          <div className="hidden lg:flex items-center gap-1.5">
            <div
              onClick={onOpenLocationPicker || onRefreshLocation}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 cursor-pointer transition"
              title="Click to select or change location manually"
            >
              <MapPin className="w-3 h-3 text-rose-500" />
              <span className="font-semibold text-slate-800">{locationArea || 'N.R. Peta'}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 rounded">Edit</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <Database className="w-3 h-3 text-emerald-600" />
              <span className="font-bold">SQLite</span>
            </div>
          </div>

          {/* Mobile vs Desktop View simulator toggle */}
          <button
            id="btn-toggle-device-view"
            onClick={onToggleDeviceView}
            title={isMobileDeviceView ? 'Switch to Full Desktop View' : 'Simulate Mobile Field View'}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            {isMobileDeviceView ? (
              <>
                <Laptop className="w-3.5 h-3.5 text-slate-600" />
                <span>Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                <span>Mobile</span>
              </>
            )}
          </button>

          {/* Multi-Language Selector */}
          <div className="relative flex items-center">
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 absolute left-2 pointer-events-none" />
            <select
              id="select-language"
              value={lang}
              onChange={(e) => {
                if (onSelectLang) {
                  onSelectLang(e.target.value as Language);
                } else {
                  onToggleLang();
                }
              }}
              className="pl-7 pr-2 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition cursor-pointer focus:outline-emerald-600"
              title="Select Language / भाषा चुनें"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          {/* Reset Seed Data */}
          <button
            id="btn-reset-demo-data"
            onClick={onResetData}
            title="Reset to default seeded demo dataset"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
