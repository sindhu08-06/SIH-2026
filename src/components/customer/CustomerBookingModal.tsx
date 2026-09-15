import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Booking, WorkerProfile, Language, Coordinates } from '../../types';
import { getTranslation, getCategoryLocalized } from '../../locales/i18n';
import { matchWorkersForBooking } from '../../utils/geo';

interface CustomerBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerProfile[];
  onCreateBooking: (newBooking: Booking) => void;
  lang: Language;
}

// Preset Andhra Pradesh (Kurnool & Ananthapur) booking coordinates for easy testing
const AREA_PRESETS: { area: string; address: string; coords: Coordinates }[] = [
  {
    area: 'N.R. Peta',
    address: 'Flat 204, Raghavendra Nilayam, N.R. Peta, Near Raj Vihar, Kurnool, AP 518001',
    coords: { lat: 15.8281, lng: 78.0373 },
  },
  {
    area: 'C-Camp Centre',
    address: 'Plot 12, Teachers Colony, C-Camp Centre, Near GPREC, Kurnool, AP 518002',
    coords: { lat: 15.8150, lng: 78.0280 },
  },
  {
    area: 'Clock Tower Center',
    address: '18/4, Subhash Road, Near Clock Tower, Ananthapur, AP 515001',
    coords: { lat: 14.6819, lng: 77.6006 },
  },
  {
    area: 'Court Road / Housing Board',
    address: 'Door No. 3-45, Phase 2, Housing Board Colony, Ananthapur, AP 515002',
    coords: { lat: 14.6738, lng: 77.5950 },
  },
  {
    area: 'Kallur Industrial Corridor',
    address: 'Plot 84, Industrial Area, Kallur, Kurnool, AP 518004',
    coords: { lat: 15.8010, lng: 78.0190 },
  },
  {
    area: 'JNTU / Arts College',
    address: 'Staff Quarters, Near JNTU Engineering College, Ananthapur, AP 515003',
    coords: { lat: 14.6540, lng: 77.6110 },
  },
];

const SERVICE_CATEGORIES = [
  { name: 'Electrical', nameHi: 'विद्युत कार्य (इलेक्ट्रीशियन)', base: 600, surge: 250 },
  { name: 'Plumbing', nameHi: 'नलकारी (प्लंबर)', base: 550, surge: 250 },
  { name: 'Appliance Repair', nameHi: 'घरेलू उपकरण मरम्मत', base: 700, surge: 300 },
  { name: 'Facility & Deep Cleaning', nameHi: 'गहरी सफाई व स्वच्छता', base: 1200, surge: 400 },
  { name: 'Solar & Inverter', nameHi: 'सोलर एवं इन्वर्टर', base: 850, surge: 300 },
];

export const CustomerBookingModal: React.FC<CustomerBookingModalProps> = ({
  isOpen,
  onClose,
  workers,
  onCreateBooking,
  lang,
}) => {
  const [customerName, setCustomerName] = useState('Ananya Sen');
  const [customerPhone, setCustomerPhone] = useState('+91 98224 81092');
  const [selectedCategory, setSelectedCategory] = useState(SERVICE_CATEGORIES[0].name);
  const [isEmergency, setIsEmergency] = useState(true);
  const [selectedAreaIdx, setSelectedAreaIdx] = useState(0);
  const [customAddress, setCustomAddress] = useState(AREA_PRESETS[0].address);
  const [title, setTitle] = useState('Dangerous sparks in main electrical switchboard');
  const [description, setDescription] = useState(
    'Smoke coming from central meter box, kitchen appliances tripped. Need immediate certified wireman inspection.'
  );

  if (!isOpen) return null;

  const currentCategoryData =
    SERVICE_CATEGORIES.find((c) => c.name === selectedCategory) || SERVICE_CATEGORIES[0];
  const selectedAreaObj = AREA_PRESETS[selectedAreaIdx];

  const basePrice = currentCategoryData.base;
  const emergencySurge = isEmergency ? currentCategoryData.surge : 0;
  const totalAmount = basePrice + emergencySurge;
  const workerPayout = Math.round(totalAmount * 0.9);
  const coopWelfareFee = Math.round(totalAmount * 0.07 * 10) / 10;
  const federationFee = Math.round(totalAmount * 0.03 * 10) / 10;

  // Mock temporary booking for previewing geo-matches
  const tempBooking: Booking = {
    id: 'temp',
    bookingCode: 'PREVIEW',
    customerId: 'cust-demo',
    customerName,
    customerPhone,
    serviceCategory: selectedCategory,
    serviceCategoryHi: currentCategoryData.nameHi,
    title,
    titleHi: title,
    description,
    isEmergency,
    emergencyPriority: isEmergency ? 'critical' : 'normal',
    address: customAddress,
    area: selectedAreaObj.area,
    coordinates: selectedAreaObj.coords,
    status: 'open',
    createdAt: new Date().toISOString(),
    scheduledTime: isEmergency ? 'Immediate (15-Min SLA)' : 'Within 2 Hours',
    pricing: {
      baseAmount: basePrice,
      emergencySurge,
      totalAmount,
      workerPayout,
      coopWelfareFee,
      federationPlatformFee: federationFee,
    },
    invoiceNumber: 'INV-TEMP',
    paymentStatus: 'escrow_locked',
  };

  const matchedWorkers = matchWorkersForBooking(tempBooking, workers);

  const handleSelectArea = (idx: number) => {
    setSelectedAreaIdx(idx);
    setCustomAddress(AREA_PRESETS[idx].address);
  };

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    if (catName === 'Plumbing') {
      setTitle(
        isEmergency
          ? 'Burst main line flooding utility balcony'
          : 'Kitchen drain pipe blockage and leak'
      );
    } else if (catName === 'Electrical') {
      setTitle(
        isEmergency
          ? 'Dangerous sparks in main electrical switchboard'
          : 'Ceiling fan regulator and light point repair'
      );
    } else {
      setTitle(`${catName} service request`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `b-${Date.now()}`;
    const code = isEmergency
      ? `SS-EMG-${Math.floor(1000 + Math.random() * 9000)}`
      : `SS-REG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      ...tempBooking,
      id: newId,
      bookingCode: code,
      createdAt: new Date().toISOString(),
      invoiceNumber: `INV-SS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentStatus: 'escrow_locked',
    };

    onCreateBooking(newBooking);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {getTranslation(lang, 'newBookingModalTitle')}
              </h3>
              <p className="text-xs text-slate-500">{getTranslation(lang, 'customerSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Emergency Toggle Pill */}
          <div
            onClick={() => setIsEmergency(!isEmergency)}
            className={`cursor-pointer rounded-xl p-3.5 border-2 transition flex items-start gap-3 ${
              isEmergency
                ? 'bg-red-50 border-red-400 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isEmergency ? 'bg-red-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold text-sm ${isEmergency ? 'text-red-900' : 'text-slate-800'}`}
                >
                  {getTranslation(lang, 'isEmergencyToggle')}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isEmergency ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isEmergency ? '15-Min SLA ON' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{getTranslation(lang, 'emergencyHelp')}</p>
            </div>
          </div>

          {/* Service Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {getTranslation(lang, 'selectService')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`p-2.5 text-xs text-left rounded-xl border transition ${
                    selectedCategory === cat.name
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-semibold">{getCategoryLocalized(cat.name, lang)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Base: ₹{cat.base}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {getTranslation(lang, 'customerFormFieldTitle')}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {getTranslation(lang, 'customerFormFieldDesc')}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Location / Area Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {getTranslation(lang, 'serviceAddress')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {AREA_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={preset.area}
                  onClick={() => handleSelectArea(idx)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                    selectedAreaIdx === idx
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3 h-3 inline mr-1 text-emerald-500" />
                  {preset.area}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Geo-Matching Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {getTranslation(lang, 'matchedWorkersNearby')} ({matchedWorkers.length})
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Distance-Ranked</span>
            </div>

            {matchedWorkers.length > 0 ? (
              <div className="space-y-2">
                {matchedWorkers.slice(0, 2).map((match) => (
                  <div
                    key={match.worker.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={match.worker.avatar}
                        alt={match.worker.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-300"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {lang !== 'en' && match.worker.nameHi ? match.worker.nameHi : match.worker.name}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                            ★ {match.worker.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {match.worker.societyName.split(' ')[0]} •{' '}
                          {match.worker.primarySkill}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700 text-xs font-mono">
                        {match.distanceKm} km {getTranslation(lang, 'distanceAway')}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> ~{match.travelMinutes}{' '}
                        {lang === 'hi' ? 'मिनट' : lang === 'mr' ? 'मिनिटे' : lang === 'te' ? 'నిమిషాలు' : 'mins'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {lang === 'hi'
                  ? 'आपके चयनित कौशल/त्रिज्या में कोई कारीगर ऑनलाइन नहीं है।'
                  : lang === 'mr'
                  ? 'तुमच्या निवडलेल्या कौशल्यासाठी कोणताही कारागीर ऑनलाइन नाही.'
                  : lang === 'te'
                  ? 'మీరు ఎంచుకున్న నైపుణ్యం/పరిధిలో ఏ కార్మికుడూ ఆన్‌లైన్‌లో లేరు.'
                  : 'No certified workers currently matching in this trade/radius.'}
              </p>
            )}
          </div>

          {/* Fund Split Breakdown Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{getTranslation(lang, 'customerFormEstimatedPrice')}</span>
              <span className="font-mono text-base text-emerald-900">₹{totalAmount}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-slate-500 block">{getTranslation(lang, 'invoiceSplitNetWorker')}</span>
                <span className="font-bold text-slate-900 font-mono">₹{workerPayout}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-slate-500 block">{getTranslation(lang, 'invoiceSplitWelfare')}</span>
                <span className="font-bold text-slate-900 font-mono">₹{coopWelfareFee}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-200">
                <span className="text-slate-500 block">{getTranslation(lang, 'invoiceSplitPlatform')}</span>
                <span className="font-bold text-slate-900 font-mono">₹{federationFee}</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {getTranslation(lang, 'customerCancel')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 active:scale-95 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{getTranslation(lang, 'confirmBooking')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
