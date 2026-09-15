import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Lock,
  RefreshCw,
  FileText,
  FileDown,
  Info,
  Award,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Booking, Language } from '../../types';
import { api } from '../../services/api';
import { getTranslation } from '../../locales/i18n';

interface InvoiceModalProps {
  booking: Booking | null;
  onClose: () => void;
  lang: Language;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose, lang }) => {
  const bookingCode = booking?.bookingCode || (booking as any)?.booking_code || 'SAH-PUN-0001';
  const cleanCode = bookingCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const invoiceNumber = booking?.invoiceNumber || (booking as any)?.invoice_number || `INV-${bookingCode}`;
  const paymentStatus = (booking?.paymentStatus || (booking as any)?.payment_status || 'escrow_locked') as
    | 'pending'
    | 'escrow_locked'
    | 'disbursed';

  const pricing = booking?.pricing || {
    baseAmount: (booking as any)?.base_amount || (booking as any)?.total_amount || 450,
    emergencySurge: (booking as any)?.emergency_surge || 0,
    totalAmount: (booking as any)?.total_amount || 450,
    workerPayout: (booking as any)?.worker_payout || Math.round(((booking as any)?.total_amount || 450) * 0.9),
    coopWelfareFee: (booking as any)?.coop_welfare_fee || Math.round(((booking as any)?.total_amount || 450) * 0.07),
    federationPlatformFee: (booking as any)?.platform_fee || Math.round(((booking as any)?.total_amount || 450) * 0.03),
  };

  // State for Payment QR and Escrow details - always called unconditionally
  const [showPaymentQr, setShowPaymentQr] = useState<boolean>(false);
  const [includeQrOnPrint, setIncludeQrOnPrint] = useState<boolean>(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [escrowDetails, setEscrowDetails] = useState<{
    escrowWalletAddress: string;
    escrowVaultId: string;
    verificationHash: string;
    paymentStatus: 'pending' | 'escrow_locked' | 'disbursed';
    escrowTerms?: string;
  } | null>(null);
  const [isRefreshingEscrow, setIsRefreshingEscrow] = useState<boolean>(false);

  const defaultVpa = `escrow.${cleanCode}@sahakarseva.coop`;
  const defaultVaultId = `ESCR-VLT-${bookingCode}-MH`;
  const defaultHash = `SHA256-${bookingCode.replace(/-/g, '').toLowerCase()}7f8a9b109c2`;

  const upiUri = `upi://pay?pa=${defaultVpa}&pn=${encodeURIComponent(
    'Sahakar Seva Escrow Trust'
  )}&mc=5499&tr=${encodeURIComponent(bookingCode)}&tid=${encodeURIComponent(
    invoiceNumber
  )}&am=${pricing.totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Coop Escrow Deposit for ${bookingCode}`
  )}`;

  // Generate QR Code data URL
  const generateQr = async () => {
    setIsGeneratingQr(true);
    try {
      const url = await QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Fetch live escrow status from backend
  const fetchEscrowDetails = async () => {
    if (!booking) return;
    setIsRefreshingEscrow(true);
    try {
      const res = await api.getBookingEscrow(booking.id || bookingCode);
      if (res && res.success && res.escrow) {
        setEscrowDetails({
          escrowWalletAddress: res.escrow.escrowWalletAddress,
          escrowVaultId: res.escrow.escrowVaultId,
          verificationHash: res.escrow.verificationHash,
          paymentStatus: res.escrow.paymentStatus,
          escrowTerms: res.escrow.escrowTerms,
        });
      }
    } catch {
      // Fall back to local computation
      setEscrowDetails({
        escrowWalletAddress: defaultVpa,
        escrowVaultId: defaultVaultId,
        verificationHash: defaultHash,
        paymentStatus,
      });
    } finally {
      setIsRefreshingEscrow(false);
    }
  };

  // Pre-generate QR when modal opens so print always has high-res QR ready
  useEffect(() => {
    if (!booking) return;
    generateQr();
    fetchEscrowDetails();
  }, [booking?.id, bookingCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUpiUri = async () => {
    try {
      await navigator.clipboard.writeText(upiUri);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(escrowDetails?.escrowWalletAddress || defaultVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `escrow-upi-qr-${bookingCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!booking) return null;

  const currentStatus = escrowDetails?.paymentStatus || paymentStatus;
  const isCompleted = booking.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print-overlay">
      <div
        id="invoice-printable-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>{getTranslation(lang, 'invoiceTitle')}</span>
                {isCompleted && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    {getTranslation(lang, 'customerOrderStatusCompleted')}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Escrow Payment QR */}
            <button
              type="button"
              onClick={() => {
                const next = !showPaymentQr;
                setShowPaymentQr(next);
                if (next && !qrDataUrl) {
                  generateQr();
                  fetchEscrowDetails();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                showPaymentQr
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
              title="Display unique UPI QR code linked to booking escrow wallet"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {showPaymentQr
                  ? lang === 'hi'
                    ? 'QR छुपाएं'
                    : lang === 'mr'
                    ? 'QR लपवा'
                    : lang === 'te'
                    ? 'QR దాచండి'
                    : 'Hide UPI QR'
                  : lang === 'hi'
                  ? 'UPI QR देखें'
                  : lang === 'mr'
                  ? 'UPI QR पहा'
                  : lang === 'te'
                  ? 'UPI QR చూడండి'
                  : 'Generate Payment QR'}
              </span>
            </button>

            {/* Print / Save PDF Receipt Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition cursor-pointer"
              title="Print or Save as PDF physical receipt for customer"
            >
              <Printer className="w-4 h-4" />
              <span>{getTranslation(lang, 'invoicePrintBtn')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Worker Helper Notice Bar (Hidden in Print) */}
        <div className="no-print mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{getTranslation(lang, 'invoiceWorkerNoteLabel')}</strong>{' '}
              {getTranslation(lang, 'invoiceWorkerNoteDesc')}
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-950 cursor-pointer shrink-0 select-none">
            <input
              type="checkbox"
              checked={includeQrOnPrint}
              onChange={(e) => setIncludeQrOnPrint(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>{getTranslation(lang, 'invoiceIncludeQr')}</span>
          </label>
        </div>

        {/* Expandable Payment QR & Escrow Wallet Panel (Interactive Mode) */}
        {showPaymentQr && (
          <div className="no-print mx-6 sm:mx-8 mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-white tracking-wide">
                      {getTranslation(lang, 'invoiceEscrowTitle')}
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono px-2 py-0.5 rounded-full font-bold">
                      UPI 2.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Linked to Booking <span className="font-mono text-emerald-300 font-bold">#{bookingCode}</span> • Section 19 MSCS Act
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                {currentStatus === 'disbursed' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{getTranslation(lang, 'invoiceEscrowDisbursed')}</span>
                  </span>
                ) : currentStatus === 'escrow_locked' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{getTranslation(lang, 'invoiceEscrowLocked')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{getTranslation(lang, 'invoiceEscrowPending')}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={fetchEscrowDetails}
                  disabled={isRefreshingEscrow}
                  title="Refresh live escrow ledger status"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingEscrow ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* QR Code and Wallet Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center text-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-lg border-2 border-emerald-400/50 inline-block">
                  {isGeneratingQr ? (
                    <div className="w-40 h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-medium">Generating UPI QR...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`UPI Payment QR for ${bookingCode}`}
                      className="w-40 h-40 rounded-lg object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                      QR unavailable
                    </div>
                  )}

                  <div className="mt-1.5 text-[10px] font-bold text-slate-800 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sahakar Seva Escrow VPA</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyUpiUri}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                  >
                    {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy UPI Link'}</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-7 space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Escrow Value</span>
                    <span className="font-extrabold text-base text-emerald-400 font-mono">
                      ₹{pricing.totalAmount}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Virtual Escrow VPA</span>
                    <span className="font-mono text-[11px] text-white font-bold">{defaultVpa}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'hi'
                      ? 'धनराशि सहकारी एस्क्रो वॉल्ट में सुरक्षित है। काम पूरा होने पर ओटीपी सत्यापन के बाद ही कारीगर और कल्याण कोष में हस्तांतरित होती है।'
                      : lang === 'mr'
                      ? 'निधी सहकारी एस्क्रो व्हॉल्टमध्ये सुरक्षित आहे. काम पूर्ण झाल्यावर नागरिकांच्या OTP पडताळणीनंतरच कारागीर आणि कल्याण निधीमध्ये वितरित केली जाते.'
                      : lang === 'te'
                      ? 'నిధులు సహకార ఎస్క్రో వాల్ట్‌లో సురక్షితంగా ఉన్నాయి. పని పూర్తయిన తర్వాత సిటిజన్ OTP ధృవీకరణ ద్వారా మాత్రమే విడుదల చేయబడతాయి.'
                      : 'Funds are securely locked in the cooperative escrow vault. Release occurs upon citizen OTP verification.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Official Invoice & Customer Handover Receipt Body */}
        <div id="invoice-printable-area" className="p-6 sm:p-8 space-y-6 text-slate-800 text-sm">
          {/* Official Document Banner */}
          <div className="flex flex-wrap justify-between items-start gap-4 pb-5 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  सह
                </div>
                <div>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight leading-tight">
                    {getTranslation(lang, 'invoiceFederationName')}
                  </h2>
                  <p className="text-[11px] font-semibold text-emerald-800">
                    {getTranslation(lang, 'invoiceFederationSub')}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-md">
                Cooperative Bhavan, Shivaji Nagar, Pune, Maharashtra - 411005
                <br />
                <span className="font-mono text-slate-500">
                  GSTIN: 27AABCS9912C1Z8 • MSCS Act 2002 Sec 19
                </span>
              </p>
            </div>

            <div className="text-right space-y-1.5">
              <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-400 text-emerald-900 font-extrabold text-xs rounded-md uppercase tracking-wide">
                {isCompleted
                  ? getTranslation(lang, 'invoiceTitle')
                  : lang === 'hi'
                  ? 'सहकारी डिजिटल कर चालान'
                  : lang === 'mr'
                  ? 'सहकारी डिजिटल कर बीजक'
                  : lang === 'te'
                  ? 'సహకార డిజిటల్ టాక్స్ ఇన్‌వాయిస్'
                  : 'Official Cooperative Tax Invoice'}
              </div>

              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">
                  {lang === 'hi' ? 'चालान संख्या' : lang === 'mr' ? 'बीजक क्र.' : lang === 'te' ? 'ఇన్‌వాయిస్ సంఖ్య' : 'Invoice #'}:
                </span>{' '}
                <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">
                  {lang === 'hi' ? 'बुकिंग कोड' : lang === 'mr' ? 'बुकिंग कोड' : lang === 'te' ? 'బుకింగ్ కోడ్' : 'Booking #'}:
                </span>{' '}
                <span className="font-mono font-bold text-emerald-800">{bookingCode}</span>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-500">
                  {lang === 'hi' ? 'दिनांक' : lang === 'mr' ? 'तारीख' : lang === 'te' ? 'తేదీ' : 'Date'}:
                </span>{' '}
                <span className="font-medium text-slate-900">
                  {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>

              {/* Status Stamp */}
              <div className="pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    currentStatus === 'disbursed' || isCompleted
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                      : 'bg-teal-50 text-teal-900 border border-teal-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {isCompleted
                      ? lang === 'hi'
                        ? 'कार्य पूर्ण • भुगतान सत्यापित'
                        : lang === 'mr'
                        ? 'काम पूर्ण • रक्कम जमा'
                        : lang === 'te'
                        ? 'పని పూర్తయింది • చెల్లింపు నిర్ధారించబడింది'
                        : 'Job Completed & Paid in Full'
                      : getTranslation(lang, 'invoiceEscrowLocked')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Certified Worker Handover Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 avoid-break">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>{getTranslation(lang, 'invoiceCustomerDetails')}</span>
              </p>
              <p className="font-bold text-slate-900 text-sm">{booking.customerName}</p>
              <p className="text-xs text-slate-600 mt-0.5">{booking.address}</p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                <span className="text-slate-400">Phone:</span> {booking.customerPhone}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <span>{getTranslation(lang, 'invoiceWorkerDetails')}</span>
              </p>
              <p className="font-bold text-emerald-900 text-sm">
                {booking.assignedWorkerName ||
                  (lang === 'hi'
                    ? 'फेडरेशन प्रमाणित टीम'
                    : lang === 'mr'
                    ? 'महासंघ प्रमाणित टीम'
                    : lang === 'te'
                    ? 'ఫెడరేషన్ ధృవీకరించిన బృందం'
                    : 'Federation Assigned Artisan')}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                <strong>Trade:</strong> {booking.serviceCategory} • Verified Society Member
              </p>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Handover Status:</strong>{' '}
                <span className="text-emerald-700 font-semibold">
                  {isCompleted ? 'Validated on Site via Citizen OTP' : 'Work Order in Progress'}
                </span>
              </p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="avoid-break">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-xs font-bold text-slate-700 uppercase bg-slate-100/80">
                  <th className="py-2.5 px-3">{getTranslation(lang, 'invoiceServiceDesc')}</th>
                  <th className="py-2.5 px-3 text-center">{getTranslation(lang, 'invoiceCategory')}</th>
                  <th className="py-2.5 px-3 text-right">{getTranslation(lang, 'invoiceRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-900 text-sm">{booking.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{booking.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Multi-State Cooperative Certified Job Execution
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center text-xs text-slate-700 font-medium">
                    {booking.serviceCategory}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{pricing.baseAmount}
                  </td>
                </tr>

                {booking.isEmergency && (
                  <tr>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-rose-800 text-xs">
                        {lang === 'hi'
                          ? 'आपातकालीन त्वरित प्रतिक्रिया अधिभार (15 मिनट SLA)'
                          : lang === 'mr'
                          ? 'तातडीची १५ मिनिटे सेवा अधिभार (15-Min SLA)'
                          : lang === 'te'
                          ? 'అత్యవసర 15-నిమిషాల రెస్పాన్స్ ఛార్జీ'
                          : 'Emergency Priority Hazard Surge (15-Min Response SLA)'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Immediate dispatch guarantee and direct artisan risk insurance bonus
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs text-rose-700 font-bold">
                      Hazard SLA
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-800 font-bold">
                      ₹{pricing.emergencySurge}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 bg-slate-50">
                  <td colSpan={2} className="py-3 px-3 text-right font-black text-sm text-slate-900 uppercase">
                    {getTranslation(lang, 'invoiceTotalPaid')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-lg text-emerald-800">
                    ₹{pricing.totalAmount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Statutory 90/7/3 Fund Distribution Ledger */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 space-y-2 avoid-break">
            <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-emerald-200">
              <span className="text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>
                  {lang === 'hi'
                    ? 'सहकारी पारदर्शी निधि वितरण (90% कारीगर / 7% कल्याण / 3% महासंघ)'
                    : lang === 'mr'
                    ? 'सहकारी पारदर्शक निधी वाटप (९०% कारागीर / ७% कल्याण / ३% महासंघ)'
                    : lang === 'te'
                    ? 'చట్టబద్ధమైన సహకార నిధుల పంపిణీ (90 / 7 / 3 నియమం)'
                    : 'Statutory Cooperative Automated Fund Distribution (90 / 7 / 3 Rule)'}
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800">
                100% Non-Exploitative Guarantee
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {getTranslation(lang, 'invoiceSplitNetWorker')}
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">₹{pricing.workerPayout}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Direct to Bank / UPI</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {getTranslation(lang, 'invoiceSplitWelfare')}
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">₹{pricing.coopWelfareFee}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Accident & Health Cover</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">
                  {getTranslation(lang, 'invoiceSplitPlatform')}
                </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  ₹{pricing.federationPlatformFee}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Non-profit maintenance</span>
              </div>
            </div>
          </div>

          {/* Optional Embedded Scannable UPI QR for Print & Customer Verification */}
          {includeQrOnPrint && qrDataUrl && (
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between gap-4 avoid-break">
              <div className="flex items-center gap-3.5">
                <div className="p-1 bg-white rounded-lg border border-slate-300 shadow-2xs shrink-0">
                  <img
                    src={qrDataUrl}
                    alt={`Scannable QR for Booking ${bookingCode}`}
                    className="w-20 h-20 object-contain rounded"
                  />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Official Escrow Settlement UPI QR</span>
                  </p>
                  <p className="font-mono text-xs text-emerald-900 font-semibold mt-0.5">{defaultVpa}</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    Scannable via Google Pay, PhonePe, Paytm, or BHIM. Amount pre-configured to ₹{pricing.totalAmount}.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-[11px] text-slate-700 font-bold">
                  {bookingCode}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Vault ID: {defaultVaultId}</p>
              </div>
            </div>
          )}

          {/* Physical Receipt Handover & Customer Satisfaction Acknowledgment */}
          <div className="pt-2 border-t-2 border-dashed border-slate-300 space-y-3 avoid-break">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{getTranslation(lang, 'invoiceSignNotice')}</span>
              <span className="text-[11px] text-emerald-800 font-semibold">
                30-Day Cooperative Guarantee • Helpline: 1800-SAHAKAR-SEVA
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              {getTranslation(lang, 'invoiceSignInstruction')}
            </p>

            {/* Signature and Stamp Lines */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="border-t border-slate-400 pt-2 text-center">
                <p className="text-xs font-bold text-slate-800">
                  {booking.customerName}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {getTranslation(lang, 'invoiceCustomerSign')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Date: ____________________</p>
              </div>

              <div className="border-t border-slate-400 pt-2 text-center">
                <p className="text-xs font-bold text-emerald-900">
                  {booking.assignedWorkerName || 'Certified Cooperative Artisan'}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {getTranslation(lang, 'invoiceWorkerSign')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Reg ID: SAH-ART-{(booking.assignedWorkerId || '001').slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Digital Verification & Stamp footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-500 avoid-break">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-300">
                <QrCode className="w-8 h-8 text-slate-800" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-xs">Digital Verification Ledger Hash</p>
                <p className="font-mono text-[10px] text-slate-400">
                  {escrowDetails?.verificationHash || defaultHash}
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Verified by Cooperative Registrar • Decentralized Autonomous Escrow Node
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="border border-emerald-600 rounded px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-[10px] inline-block tracking-wider">
                SEAL OF COOPERATIVE INTEGRITY
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Official computer-generated co-op tax invoice & physical receipt.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !showPaymentQr;
                setShowPaymentQr(next);
                if (next && !qrDataUrl) {
                  generateQr();
                  fetchEscrowDetails();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>
                {showPaymentQr
                  ? lang === 'hi'
                    ? 'QR छुपाएं'
                    : lang === 'mr'
                    ? 'QR लपवा'
                    : lang === 'te'
                    ? 'QR దాచండి'
                    : 'Hide UPI QR'
                  : lang === 'hi'
                  ? 'भुगतान QR देखें'
                  : lang === 'mr'
                  ? 'पेमेंट QR पहा'
                  : lang === 'te'
                  ? 'పేమెంట్ QR రూపొందించండి'
                  : 'Generate Payment QR'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{getTranslation(lang, 'invoicePrintBtn')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
          >
            {getTranslation(lang, 'invoiceClose')}
          </button>
        </div>
      </div>
    </div>
  );
};
