import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Info,
  Lock,
  ArrowRight,
  RefreshCw,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Language } from '../../types';
import { api } from '../../services/api';

interface DynamicUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    booking_code?: string;
    bookingCode?: string;
    customer_name?: string;
    customerName?: string;
    total_amount?: number;
    amount?: number;
    pricing?: {
      totalAmount?: number;
      workerPayout?: number;
      coopWelfareFee?: number;
      federationPlatformFee?: number;
    };
    service_category?: string;
    serviceCategory?: string;
    assigned_worker_name?: string;
    assignedWorkerName?: string;
    payment_status?: string;
    paymentStatus?: string;
  };
  lang: Language;
  onPaymentConfirmed?: (updatedBooking: any) => void;
}

export const DynamicUpiQrModal: React.FC<DynamicUpiQrModalProps> = ({
  isOpen,
  onClose,
  booking,
  lang,
  onPaymentConfirmed,
}) => {
  const [customVpa, setCustomVpa] = useState<string>('');
  const [selectedPayeeType, setSelectedPayeeType] = useState<'coop_escrow' | 'custom_vpa'>('coop_escrow');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const bookingCode = booking?.bookingCode || booking?.booking_code || 'BKG-COOP-01';
  const cleanCode = bookingCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const totalAmount =
    booking?.pricing?.totalAmount ||
    booking?.total_amount ||
    booking?.amount ||
    450;

  const workerPayout = booking?.pricing?.workerPayout || Math.round(totalAmount * 0.9);
  const coopWelfareFee = booking?.pricing?.coopWelfareFee || Math.round(totalAmount * 0.07);
  const platformFee = booking?.pricing?.federationPlatformFee || Math.round(totalAmount * 0.03);

  // Cooperative Escrow VPA
  const defaultCoopVpa = `escrow.${cleanCode}@sahakarseva.coop`;
  const activeVpa = selectedPayeeType === 'custom_vpa' && customVpa.trim() ? customVpa.trim() : defaultCoopVpa;
  const payeeName = selectedPayeeType === 'custom_vpa' ? 'Sahakar Seva Artisan' : 'Sahakar Seva Escrow Trust';

  // NPCI Spec Compliant UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(activeVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&mc=5499&tr=${encodeURIComponent(bookingCode)}&am=${totalAmount.toFixed(
    2
  )}&cu=INR&tn=${encodeURIComponent(`Coop Escrow Booking ${bookingCode}`)}`;

  // Mobile Deep Links for Popular Indian UPI Apps
  const gpayUri = `gpay://upi/pay?pa=${encodeURIComponent(activeVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Booking ${bookingCode}`)}`;

  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(activeVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Booking ${bookingCode}`)}`;

  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(activeVpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Booking ${bookingCode}`)}`;

  useEffect(() => {
    if (!isOpen) {
      setPaymentSuccess(false);
      setConfirmError(null);
      setUtrNumber('');
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(upiUri, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, upiUri]);

  if (!isOpen) return null;

  const handleCopyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiUri);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(activeVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleConfirmUpiPayment = async () => {
    setIsConfirming(true);
    setConfirmError(null);
    try {
      const res = await api.payBookingEscrow(booking.id || bookingCode, {
        utrNumber: utrNumber.trim() || undefined,
        paymentMethod: 'upi_qr',
      });
      if (res.success) {
        setPaymentSuccess(true);
        if (onPaymentConfirmed) {
          onPaymentConfirmed(res.booking);
        }
      } else {
        setConfirmError('Failed to record payment confirmation. Please verify UTR.');
      }
    } catch (err: any) {
      setConfirmError(err.message || 'Payment confirmation error');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">
                  {lang === 'hi'
                    ? 'इंटरएक्टिव यूपीआई क्यूआर कोड'
                    : lang === 'mr'
                    ? 'परस्परसंवादी UPI QR कोड'
                    : lang === 'te'
                    ? 'ఇంటరాక్టివ్ UPI QR కోడ్'
                    : 'Interactive Dynamic UPI QR'}
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono px-2 py-0.5 rounded-full font-bold">
                  NPCI 2.0
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Booking <span className="font-mono text-emerald-300 font-bold">#{bookingCode}</span> • Zero Middleman Cut
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {paymentSuccess ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="font-black text-xl text-slate-900">
                  {lang === 'hi'
                    ? 'एस्क्रो सुरक्षित और लॉक!'
                    : lang === 'mr'
                    ? 'एस्क्रो सुरक्षित आणि लॉक झाले!'
                    : lang === 'te'
                    ? 'ఎస్క్రో సురక్షితంగా లాక్ చేయబడింది!'
                    : 'Escrow Successfully Locked!'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  {lang === 'hi'
                    ? '₹' + totalAmount + ' की राशि सुरक्षित रूप से सहकारी ट्रस्ट वॉल्ट में जमा हो चुकी है। काम पूरा होने पर ही कारीगर को वितरित होगी।'
                    : lang === 'mr'
                    ? '₹' + totalAmount + ' ची रक्कम सहकारी ट्रस्ट व्हॉल्टमध्ये सुरक्षित जमा झाली आहे. काम पूर्ण झाल्यावरच कारागिराला दिली जाईल.'
                    : lang === 'te'
                    ? '₹' + totalAmount + ' సహకార ట్రస్ట్ వాల్ట్‌లో సురక్షితంగా లాక్ చేయబడింది. పని పూర్తయిన తర్వాతే విడుదల చేయబడుతుంది.'
                    : `₹${totalAmount} is secured in the Cooperative Escrow Trust Vault. 90% direct payout will disburse upon artisan job completion.`}
                </p>
              </div>

              {/* Verified Breakdown Pill */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5 text-left max-w-xs mx-auto">
                <div className="flex justify-between text-slate-700">
                  <span>90% Artisan Direct:</span>
                  <strong className="font-mono text-emerald-800">₹{workerPayout}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>7% Welfare Pool:</span>
                  <strong className="font-mono text-teal-800">₹{coopWelfareFee}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>3% Platform Ops:</span>
                  <strong className="font-mono text-slate-800">₹{platformFee}</strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {lang === 'hi' ? 'बुकिंग ट्रैकर पर लौटें' : lang === 'mr' ? 'बुकिंग ट्रॅकरकडे परत जा' : lang === 'te' ? 'బుకింగ్ ట్రాకర్‌కు తిరిగి వెళ్ళండి' : 'Return to Bookings Tracker'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Payee VPA Destination Chooser */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Destination Escrow VPA:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPayeeType('coop_escrow')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        selectedPayeeType === 'coop_escrow'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Cooperative Escrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayeeType('custom_vpa')}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        selectedPayeeType === 'custom_vpa'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Custom UPI ID
                    </button>
                  </div>
                </div>

                {selectedPayeeType === 'custom_vpa' ? (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={customVpa}
                      onChange={(e) => setCustomVpa(e.target.value)}
                      placeholder="e.g. yourname@okaxis, 9876543210@paytm"
                      className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Enter any valid Indian UPI VPA to dynamically re-render the QR code for testing live payments.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-emerald-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{defaultCoopVpa}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedVpa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedVpa ? 'Copied' : 'Copy VPA'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic QR Display Card */}
              <div className="p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 rounded-3xl border border-slate-800 text-white text-center space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2.5">
                  <span className="font-medium">Total Escrow Authorize:</span>
                  <span className="font-extrabold text-lg text-emerald-400 font-mono">₹{totalAmount}</span>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-2 border-emerald-400/60">
                  {isGenerating ? (
                    <div className="w-44 h-44 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Generating QR...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`Dynamic UPI QR for ${bookingCode}`}
                      className="w-44 h-44 rounded-lg object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                      QR unavailable
                    </div>
                  )}

                  <div className="mt-2 text-[10px] font-bold text-slate-800 flex items-center justify-center gap-1 font-mono">
                    <span>Scan with Any UPI App</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                  Scan via <strong>PhonePe, Google Pay, Paytm, BHIM</strong> or any UPI-enabled Indian bank app.
                </p>

                {/* One-Tap Mobile App Intent Links */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Or Tap to Launch Installed App:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <a
                      href={gpayUri}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                      <span>GPay</span>
                    </a>
                    <a
                      href={phonepeUri}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                      <span>PhonePe</span>
                    </a>
                    <a
                      href={paytmUri}
                      className="py-2 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                      <span>Paytm</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    className="w-full py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'UPI Pay URI Copied' : 'Copy Direct UPI Pay URI'}</span>
                  </button>
                </div>
              </div>

              {/* UTR Verification & Escrow Locking Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Step 2: Confirm Payment / UTR Reference
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">12-Digit Ref</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter 12-digit UTR (or leave blank to auto-simulate)"
                    className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={isConfirming}
                    onClick={handleConfirmUpiPayment}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isConfirming ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isConfirming ? 'Verifying...' : 'Authorize Escrow'}</span>
                  </button>
                </div>

                {confirmError && (
                  <p className="text-xs text-rose-600 font-semibold">{confirmError}</p>
                )}

                <div className="text-[10px] text-slate-500 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    Upon authorizing, the funds will be marked <strong>escrow_locked</strong> in the cooperative database.
                    No money leaves the escrow until the artisan marks the service as completed.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
