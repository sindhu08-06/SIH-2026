import React, { useState } from 'react';
import {
  MapPin,
  HardHat,
  CalendarCheck,
  ArrowRight,
  RefreshCw,
  Edit3,
  SlidersHorizontal,
  Globe2,
} from 'lucide-react';
import { DetectedLocation } from '../../hooks/useLocation';
import { Language } from '../../types';
import { getTranslation } from '../../locales/i18n';

interface LandingPageProps {
  lang: Language;
  onToggleLang: () => void;
  onSelectLang?: (lang: Language) => void;
  onSelectRole: (role: 'worker' | 'customer' | 'admin') => void;
  location: DetectedLocation;
  isDetectingLocation: boolean;
  onDetectLocation: () => void;
  onOpenLocationPicker?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  onToggleLang,
  onSelectLang,
  onSelectRole,
  location,
  isDetectingLocation,
  onDetectLocation,
  onOpenLocationPicker,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Top utilities strip */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-end">
        <div className="flex items-center gap-2 ml-auto text-xs">
          {/* Manual Location selection quick button */}
          {onOpenLocationPicker && (
            <button
              onClick={onOpenLocationPicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 font-medium transition shadow-2xs cursor-pointer"
              title="Select your area manually"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{location.area || getTranslation(lang, 'landingChangeLocation')}</span>
            </button>
          )}

          {/* Admin link */}
          <button
            onClick={() => onSelectRole('admin')}
            className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
          >
            {getTranslation(lang, 'roleAdmin')}
          </button>

          {/* Multi-Language selector */}
          <div className="relative flex items-center">
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 pointer-events-none" />
            <select
              value={lang}
              onChange={(e) => {
                if (onSelectLang) {
                  onSelectLang(e.target.value as Language);
                } else {
                  onToggleLang();
                }
              }}
              className="pl-8 pr-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs cursor-pointer focus:outline-emerald-600"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Centered Website Logo & Role Selection */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
        
        {/* CENTERED LOGO & WEBSITE BRANDING (Middle of the Website) */}
        <div className="flex flex-col items-center justify-center text-center mb-10 w-full">
          {/* Centered Cooperative Emblem */}
          <div className="relative mb-5 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white flex items-center justify-center font-black text-5xl sm:text-6xl shadow-2xl shadow-emerald-700/30 border-2 border-emerald-300/40 transform group-hover:scale-105 transition-transform duration-300">
              <span className="tracking-tighter">{getTranslation(lang, 'landingLogoText')}</span>
            </div>
          </div>

          {/* Centered Website Name */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight font-display mb-2">
            {getTranslation(lang, 'landingTitle')}
          </h1>

          {/* Centered Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 font-semibold max-w-2xl mb-6">
            {getTranslation(lang, 'landingSubtitle')}
          </p>

          {/* Centered Identified High-Precision GPS Location */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs w-full max-w-3xl mb-8">
            {/* High Precision GPS Location Chip with manual selection option */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-700">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="text-left">
                <div>
                  <strong className="text-slate-900">{getTranslation(lang, 'landingLocationLabel')}</strong>{' '}
                  <span className="font-semibold text-slate-800">
                    {isDetectingLocation
                      ? getTranslation(lang, 'landingAcquiringGps')
                      : location.displayName || `${location.area}, ${location.city}`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>GPS: {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E</span>
                  {location.accuracy && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      ±{location.accuracy}m accuracy
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  id="btn-detect-gps-landing"
                  onClick={onDetectLocation}
                  disabled={isDetectingLocation}
                  title="Refresh high-accuracy GPS position"
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer text-slate-500 hover:text-slate-900"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
                {onOpenLocationPicker && (
                  <button
                    onClick={onOpenLocationPicker}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                    title="Choose from list or enter location manually"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{getTranslation(lang, 'landingChangeLocation')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Centered Role Selection Prompt Header */}
          <div className="w-full max-w-xl text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1.5">
              {getTranslation(lang, 'landingRolePromptTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {getTranslation(lang, 'landingRolePromptDesc')}
            </p>
          </div>
        </div>

        {/* The Two Main Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          {/* Card 1: Customer / Booking Person */}
          <div
            id="role-card-customer"
            onClick={() => onSelectRole('customer')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 hover:border-emerald-600 shadow-sm hover:shadow-xl hover:shadow-emerald-600/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-6 right-6">
              <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-800 mb-5 shadow-2xs">
                <CalendarCheck className="w-7 h-7 text-emerald-700" />
              </div>

              <div className="mb-2 inline-block px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {getTranslation(lang, 'landingRoleCustomerBadge')}
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-emerald-800 transition-colors">
                {getTranslation(lang, 'landingRoleCustomerTitle')}
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {getTranslation(lang, 'landingRoleCustomerDesc')}
              </p>
            </div>

            <button
              id="btn-select-customer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('customer');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
            >
              <span>{getTranslation(lang, 'landingRoleCustomerBtn')}</span>
            </button>
          </div>

          {/* Card 2: Worker / Service Artisan */}
          <div
            id="role-card-worker"
            onClick={() => onSelectRole('worker')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 hover:border-teal-600 shadow-sm hover:shadow-xl hover:shadow-teal-600/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="absolute top-6 right-6">
              <span className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-100/80 border border-teal-200 flex items-center justify-center text-teal-800 mb-5 shadow-2xs">
                <HardHat className="w-7 h-7 text-teal-700" />
              </div>

              <div className="mb-2 inline-block px-2.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                {getTranslation(lang, 'landingRoleWorkerBadge')}
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-teal-800 transition-colors">
                {getTranslation(lang, 'landingRoleWorkerTitle')}
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {getTranslation(lang, 'landingRoleWorkerDesc')}
              </p>
            </div>

            <button
              id="btn-select-worker"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRole('worker');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 active:scale-98 text-white font-bold text-sm sm:text-base shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition"
            >
              <span>{getTranslation(lang, 'landingRoleWorkerBtn')}</span>
            </button>
          </div>
        </div>

        {/* Federation Admin Access */}
        <div className="flex items-center justify-center text-xs py-2">
          <button
            id="link-admin-federation"
            onClick={() => onSelectRole('admin')}
            className="text-slate-600 hover:text-slate-900 font-semibold underline underline-offset-2 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>{getTranslation(lang, 'landingAdminBoardLink')}</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-black flex items-center justify-center text-[10px]">
              {getTranslation(lang, 'landingLogoText')}
            </span>
            <span className="font-bold text-slate-800">{getTranslation(lang, 'landingTitle')}</span>
            <span>• {getTranslation(lang, 'landingSubtitle')}</span>
          </div>
          <div className="text-slate-500 mx-auto sm:mx-0">
            <span>{getTranslation(lang, 'landingOfficialRegistry')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

