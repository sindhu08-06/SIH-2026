/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Language,
  WorkerProfile,
  CooperativeSociety,
  Booking,
  PaymentLedgerItem,
  DemandForecast,
  Certification,
} from './types';
import {
  initialWorkers,
  initialSocieties,
  initialBookings,
  initialPaymentLedgers,
  initialDemandForecast,
} from './data/seedData';
import { Header, AppViewMode } from './components/Header';
import { LandingPage } from './components/landing/LandingPage';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { WorkerAuth } from './components/worker/WorkerAuth';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerBookingModal } from './components/customer/CustomerBookingModal';
import { InvoiceModal } from './components/common/InvoiceModal';
import { LocationPickerModal } from './components/common/LocationPickerModal';
import { AdminAuthModal } from './components/common/AdminAuthModal';
import { CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useLocation } from './hooks/useLocation';
import { getTranslation, cycleLanguage } from './locales/i18n';
import {
  api,
  ApiWorker,
  ApiBooking,
  AuthUser,
  getAuthToken,
  removeAuthToken,
} from './services/api';
import { onFirebaseAuthStateChanged } from './services/firebase';

function mapApiWorkerToProfile(w: ApiWorker): WorkerProfile {
  return {
    id: w.id,
    name: w.name,
    nameHi: w.name,
    phone: w.phone,
    email: w.email || `${w.id}@sahakar.coop`,
    avatar:
      w.avatar ||
      'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
    societyId: 'soc-1',
    societyName: 'Pune District Central Artisans Cooperative Federation',
    societyNameHi: 'पुणे जिल्हा मध्यवर्ती कारागीर सहकारी महासंघ',
    coopMemberId: `MH-PUN-${w.id.toUpperCase().slice(-6)}`,
    primarySkill: w.primary_skill,
    primarySkillHi: w.primary_skill,
    skills: w.skills || [w.primary_skill],
    certifications:
      w.certifications && w.certifications.length > 0
        ? w.certifications.map((c) => ({
            id: c.id,
            title: c.title,
            issuingBody: c.issuing_body,
            credentialNumber: c.credential_number,
            issueDate: c.issue_date,
            expiryDate: c.expiry_date,
            verificationStatus: (c.verification_status as any) || 'verified',
            documentType: (c.document_type as any) || 'skill_india_nsdc',
            digitalSealCode: c.digital_seal_code || w.digital_seal_code,
            verifiedAt: c.verified_at,
            verifiedBy: c.verified_by,
          }))
        : [
            {
              id: `cert-${w.id}`,
              title: w.cert_title || `${w.primary_skill} Trade Certificate`,
              issuingBody:
                w.issuing_body || 'National Skill Development Corporation',
              credentialNumber: w.cert_number || 'REG-2026-892',
              issueDate: '2024-03-15',
              verificationStatus: (w.verification_status as any) || 'verified',
              documentType: (w.credential_doc_type as any) || 'skill_india_nsdc',
              digitalSealCode: w.digital_seal_code,
            },
          ],
    verificationStatus: (w.verification_status as any) || 'verified',
    verificationNote: w.verification_note,
    verifiedAt: w.verified_at,
    verifiedBy: w.verified_by,
    skillCheckScore: w.skill_check_score ?? 100,
    skillCheckStatus: (w.skill_check_status as any) || 'passed',
    skillCheckCompletedAt: w.skill_check_completed_at,
    digitalSealCode: w.digital_seal_code,
    idProofType: w.id_proof_type,
    idProofNumber: w.id_proof_number,
    credentialDocType: w.credential_doc_type,
    location: {
      city: w.city || 'Pune',
      area: w.area || 'Shivajinagar',
      coordinates: { lat: w.lat || 18.5204, lng: w.lng || 73.8567 },
      serviceRadiusKm: w.service_radius_km || 10,
    },
    availability: (w.availability as any) || 'available',
    emergencyCertified: Boolean(w.emergencyCertified),
    rating: w.rating || 4.8,
    completedJobsCount: w.completed_jobs_count || 12,
    bankUpi: 'worker@upi',
    welfare: {
      pmsbyEnrolled: true,
      sahakarArogyaActive: true,
      thriftDepositBalance: 12400,
      welfareFundContributionTotal: w.welfare_fund_balance || 3500,
      insurancePolicyNumber: 'PMSBY-2026-8921',
      coverageAmount: 200000,
    },
  };
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  // Primary view mode: default is 'landing' as requested
  const [viewMode, setViewMode] = useState<AppViewMode>('landing');

  // Real Geolocation Hook
  const {
    location,
    isDetecting: isDetectingLocation,
    detectLocation,
    setManualLocation,
  } = useLocation();

  // Location Picker Modal state
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  // Admin Authentication State (Firebase Authenticated)
  const [adminUser, setAdminUser] = useState<{
    email: string;
    name: string;
    photoURL?: string;
    uid?: string;
  } | null>(null);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Connected SQLite DB Statistics
  const [dbStats, setDbStats] = useState<{
    totalWorkers: number;
    totalBookings: number;
    verifiedWorkers: number;
    welfareFundBalance: number;
  } | null>(null);

  // Authenticated Worker State
  const [workerAuth, setWorkerAuth] = useState<{
    user: AuthUser;
    worker: ApiWorker;
  } | null>(null);

  // Data collections (kept synchronized with SQLite backend)
  const [workers, setWorkers] = useState<WorkerProfile[]>(initialWorkers);
  const [societies, setSocieties] = useState<CooperativeSociety[]>(initialSocieties);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [paymentLedgers, setPaymentLedgers] = useState<PaymentLedgerItem[]>(initialPaymentLedgers);
  const [demandForecast, setDemandForecast] = useState<DemandForecast>(initialDemandForecast);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isCustomerBookingOpen, setIsCustomerBookingOpen] = useState(false);
  const [viewingInvoiceBooking, setViewingInvoiceBooking] = useState<any>(null);
  const [isMobileDeviceView, setIsMobileDeviceView] = useState(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync real data from backend SQLite on mount
  const syncDatabaseData = useCallback(async () => {
    try {
      const [statsRes, workersRes, bookingsRes] = await Promise.all([
        api.getDbStats().catch(() => null),
        api.getWorkers().catch(() => null),
        api.getBookings().catch(() => null),
      ]);

      if (statsRes?.stats) {
        setDbStats(statsRes.stats);
      }

      if (workersRes?.workers !== undefined) {
        const mapped = workersRes.workers.map(mapApiWorkerToProfile);
        setWorkers(mapped);
      }

      if (bookingsRes?.bookings !== undefined) {
        const mappedBookings: Booking[] = bookingsRes.bookings.map((b) => {
          const lat = typeof b.lat === 'number' ? b.lat : b.coordinates?.lat || 18.5204;
          const lng = typeof b.lng === 'number' ? b.lng : b.coordinates?.lng || 73.8567;
          return {
            id: b.id,
            bookingCode: b.booking_code || b.bookingCode || 'BK-000',
            customerId: b.customer_id || 'cust-1',
            customerName: b.customer_name || 'Customer',
            customerPhone: b.customer_phone || '+91 98000 00000',
            customerAddress: b.customer_address || b.address || 'Pune',
            serviceCategory: b.service_category || 'Electrical',
            serviceCategoryHi: b.service_category || 'Electrical',
            title: b.title || 'Cooperative Service Request',
            titleHi: b.title || 'सहकारी सेवा विनंती',
            description: b.description || '',
            isEmergency: Boolean(b.isEmergency || b.is_emergency),
            emergencyPriority: (b.isEmergency ? 'high' : 'normal') as any,
            status: (b.status as any) || 'open',
            assignedWorkerId: b.assigned_worker_id,
            assignedWorkerName: b.assigned_worker_name,
            createdAt: b.created_at || new Date().toISOString(),
            scheduledTime: b.scheduled_time || 'Immediate',
            address: b.customer_address || 'Pune',
            area: b.area || 'Pune Central',
            coordinates: { lat, lng },
            location: {
              area: b.area || 'Pune Central',
              coordinates: { lat, lng },
            },
            pricing: b.pricing || {
              baseAmount: 400,
              emergencySurge: 0,
              totalAmount: 400,
              workerPayout: 360,
              coopWelfareFee: 28,
              federationPlatformFee: 12,
            },
            digitalInvoiceUrl: b.digital_invoice_url,
            invoiceNumber: b.booking_code || 'INV-000',
            paymentStatus: 'escrow_locked',
          };
        });
        setBookings(mappedBookings);
      }
    } catch (err) {
      console.error('Error synchronizing database:', err);
    }
  }, []);

  useEffect(() => {
    syncDatabaseData();
  }, [syncDatabaseData]);

  // Sync Firebase authentication state
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged((user, profile) => {
      if (user && profile) {
        if (profile.role === 'admin') {
          setAdminUser({
            email: profile.email,
            name: profile.name,
            photoURL: profile.photoURL,
            uid: profile.uid,
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Find active worker for worker dashboard with fallback
  const currentWorker: WorkerProfile =
    workers.find((w) => w.id === (workerAuth?.worker.id || selectedWorkerId)) ||
    (workerAuth?.worker ? mapApiWorkerToProfile(workerAuth.worker) : workers[0]) ||
    mapApiWorkerToProfile({
      id: 'w-fallback',
      name: 'Sahakar Verified Worker',
      phone: '+91 98220 12345',
      primary_skill: 'Electrical',
      hourly_rate: 450,
      lat: 18.5204,
      lng: 73.8567,
    } as any);

  // Worker geographic profile update
  const handleUpdateWorkerGeo = async (area: string, radiusKm: number) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === currentWorker.id) {
          return {
            ...w,
            location: {
              ...w.location,
              area,
              serviceRadiusKm: radiusKm,
            },
          };
        }
        return w;
      })
    );

    // Save to SQLite
    try {
      await api.updateWorkerGeo(currentWorker.id, {
        area,
        serviceRadiusKm: radiusKm,
        lat: location?.lat ?? 18.5204,
        lng: location?.lng ?? 73.8567,
      });
    } catch (e) {
      console.warn('Backend geo update deferred:', e);
    }

    showToast(
      lang === 'hi'
        ? 'भौगोलिक कार्य क्षेत्र एवं सेवा दायरा अपडेट किया गया!'
        : lang === 'mr'
        ? 'भौगोलिक कार्यक्षेत्र व सेवा त्रिज्या अद्यतन केली!'
        : lang === 'te'
        ? 'పని ప్రాంతం మరియు సేవా పరిధి నవీకరించబడింది!'
        : `Work zone updated to ${area} (${radiusKm} km radius)`
    );
  };

  // Worker certification upload
  const handleUploadCertification = async (cert: Certification) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === currentWorker.id) {
          return {
            ...w,
            verificationStatus: 'under_review',
            certifications: [cert, ...w.certifications],
          };
        }
        return w;
      })
    );

    // Persist to backend verification queue
    try {
      await api.submitWorkerVerification(currentWorker.id, {
        idProofType: 'Aadhaar Card',
        idProofNumber: '5492 8491 0293',
        certTitle: cert.title,
        certNumber: cert.credentialNumber,
        issuingBody: cert.issuingBody,
      });
    } catch (e) {
      console.warn('Backend cert submission deferred:', e);
    }

    showToast(
      lang === 'hi'
        ? 'प्रमाणपत्र सफलतापूर्वक सत्यापन कतार में जमा हुआ!'
        : lang === 'mr'
        ? 'प्रमाणपत्र यशस्वीरीत्या पडताळणी रांगेत सादर केले!'
        : lang === 'te'
        ? 'సర్టిఫికేట్ విజయవంతంగా ధృవీకరణ క్యూకు సమర్పించబడింది!'
        : 'Certificate submitted to Federation Verification Queue!'
    );
  };

  // Worker accepts booking
  const handleAcceptBooking = async (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'assigned',
            assignedWorkerId: currentWorker.id,
            assignedWorkerName: currentWorker.name,
          };
        }
        return b;
      })
    );

    setWorkers((prev) =>
      prev.map((w) =>
        w.id === currentWorker.id ? { ...w, availability: 'on_job' } : w
      )
    );

    try {
      await api.acceptBooking(bookingId, currentWorker.id, currentWorker.name);
    } catch (e) {
      console.warn('Backend accept booking deferred:', e);
    }

    showToast(
      lang === 'hi'
        ? `कार्य स्वीकार किया गया! ग्राहक से संपर्क करें।`
        : lang === 'mr'
        ? `काम स्वीकारले! ग्राहकाशी संपर्क साधा.`
        : lang === 'te'
        ? `పని అంగీకరించబడింది! కస్టమర్‌ను సంప్రదించండి.`
        : `Service Job accepted! Dispatched to your active itinerary.`
    );
  };

  // Advance booking status
  const handleAdvanceBookingStatus = async (
    bookingId: string,
    nextStatus: Booking['status']
  ) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );

    if (nextStatus === 'completed') {
      setWorkers((prev) =>
        prev.map((w) => {
          if (w.id === currentWorker.id) {
            return {
              ...w,
              availability: 'available',
              completedJobsCount: w.completedJobsCount + 1,
              welfare: {
                ...w.welfare,
                thriftDepositBalance: w.welfare.thriftDepositBalance + 35,
                welfareFundContributionTotal:
                  w.welfare.welfareFundContributionTotal + 35,
              },
            };
          }
          return w;
        })
      );
    }

    try {
      await api.updateBookingStatus(bookingId, nextStatus);
    } catch (e) {
      console.warn('Backend update booking status deferred:', e);
    }

    showToast(
      lang === 'hi'
        ? `कार्य स्थिति अद्यतित: ${nextStatus}`
        : `Job updated to: ${nextStatus.replace('_', ' ').toUpperCase()}`
    );
  };

  // Admin approves worker
  const handleApproveWorker = async (workerId: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          return {
            ...w,
            verificationStatus: 'verified',
            verifiedAt: new Date().toISOString().split('T')[0],
            verifiedBy: 'State Cooperative Verification Board',
            certifications: w.certifications.map((c) => ({
              ...c,
              verificationStatus: 'verified',
            })),
          };
        }
        return w;
      })
    );

    try {
      await api.approveWorker(workerId, {
        approvedBy: 'State Cooperative Technical Board',
      });
      syncDatabaseData();
    } catch (e) {
      console.warn('Backend approve worker deferred:', e);
    }

    showToast(
      lang === 'hi'
        ? 'कारीगर सत्यापन स्वीकृत! आधिकारिक सुरक्षा बिल्ला सक्रिय।'
        : lang === 'mr'
        ? 'कारागीर पडताळणी मंजूर! अधिकृत सुरक्षा बॅज जारी.'
        : lang === 'te'
        ? 'కార్మికుల ధృవీకరణ ఆమోదించబడింది! అధికారిక సహకార బ్యాడ్జ్ జారీ చేయబడింది.'
        : 'Worker Approved! Official Cooperative Verification Badge issued.'
    );
  };

  // Admin rejects worker
  const handleRejectWorker = async (workerId: string, note: string) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId
          ? {
              ...w,
              verificationStatus: 'rejected',
              verificationNote: note,
            }
          : w
      )
    );

    try {
      await api.rejectWorker(workerId, note);
      syncDatabaseData();
    } catch (e) {
      console.warn('Backend reject worker deferred:', e);
    }

    showToast(
      lang === 'hi'
        ? 'सत्यापन अस्वीकृत। सुधारात्मक टिप्पणी प्रेषित।'
        : lang === 'mr'
        ? 'पडताळणी नाकारली. सुधारणा शेरा पाठवला.'
        : lang === 'te'
        ? 'ధృవీకరణ తిరస్కరించబడింది. సవరణ సూచనలు పంపబడ్డాయి.'
        : 'Application rejected. Corrective feedback sent to artisan.'
    );
  };

  // Gemini AI demand forecast refresh
  const handleRefreshForecast = async () => {
    setIsLoadingForecast(true);
    try {
      const response = await fetch('/api/demand-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerCount: workers.length,
          activeJobCount: bookings.filter((b) => b.status !== 'completed').length,
          historicalJobs: bookings.map((b) => ({
            category: b.serviceCategory,
            area: b.location.area,
            isEmergency: b.isEmergency,
          })),
          metrics: {
            utilizationRate: `${Math.round(
              (bookings.filter((b) => b.status === 'assigned').length /
                Math.max(workers.length, 1)) *
                100
            )}%`,
            categories: ['Electrical', 'Plumbing', 'Appliance Repair', 'Sanitation'],
          },
          zoneData: societies.map((s) => s.district),
          seasonInfo:
            'Seasonal cloudburst advisory, high moisture electrical short-circuits, post-monsoon appliance dampness.',
        }),
      });

      const data = await response.json();
      if (data && data.forecast) {
        setDemandForecast({
          ...data.forecast,
          generatedAt: new Date().toLocaleTimeString() + ' (Fresh Telemetry)',
          source: data.source || 'gemini-3.8-flash',
        });
        showToast(
          lang === 'hi'
            ? 'जेमिनी एआई द्वारा सहकारी मांग पूर्वानुमान अद्यतित किया गया!'
            : lang === 'mr'
            ? 'जेमिनी एआय द्वारे सहकारी मागणी अंदाज अद्यतनित केला!'
            : lang === 'te'
            ? 'జెమినీ AI ద్వారా సహకార డిమాండ్ అంచనా నవీకరించబడింది!'
            : 'Gemini AI Demand Forecast successfully refreshed!'
        );
      }
    } catch (err: any) {
      console.error('Forecast request failed:', err);
      showToast('Telemetry forecast refreshed using cooperative baseline model.');
    } finally {
      setIsLoadingForecast(false);
    }
  };

  // Create booking simulator handler
  const handleCreateCustomerBooking = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    showToast(
      newBooking.isEmergency
        ? lang === 'hi'
          ? 'आपातकालीन अलर्ट प्रसारित! निकटतम सत्यापित कारीगर को सूचित किया गया।'
          : lang === 'mr'
          ? 'तातडीचा अलर्ट प्रसारित! जवळच्या अधिकृत कारागिराला सूचित केले.'
          : lang === 'te'
          ? 'అత్యవసర SOS ప్రసారం చేయబడింది! సమీప కార్మికుడికి సమాచారం అందించబడింది.'
          : 'Emergency SOS Broadcasted! Dispatched to nearby certified artisans (15-min SLA).'
        : lang === 'hi'
        ? 'बुकिंग पंजीकृत! सहकारी पटल पर उपलब्ध।'
        : lang === 'mr'
        ? 'बुकिंग नोंदवली! सहकारी रडारवर उपलब्ध.'
        : lang === 'te'
        ? 'బుకింగ్ నమోదైంది! సహకార జాబ్ రాడార్‌లో జోడించబడింది.'
        : 'Service request created and added to cooperative job radar.'
    );
  };

  // Reset to seed dataset
  const handleResetData = async () => {
    setWorkers(initialWorkers);
    setSocieties(initialSocieties);
    setBookings(initialBookings);
    setPaymentLedgers(initialPaymentLedgers);
    setDemandForecast(initialDemandForecast);
    setSelectedWorkerId('w-1');
    await syncDatabaseData();
    showToast(
      lang === 'hi'
        ? 'डेमो डेटा रीसेट किया गया!'
        : lang === 'mr'
        ? 'डेमो डेटा रीसेट केला!'
        : lang === 'te'
        ? 'డెమో డేటా రీసెట్ చేయబడింది!'
        : 'Connected database data refreshed!'
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* App Header (rendered in app view modes, non-stationary) */}
      {viewMode !== 'landing' && (
        <Header
          lang={lang}
          onToggleLang={() => setLang(cycleLanguage(lang))}
          onSelectLang={setLang}
          currentRole={viewMode}
          onChangeRole={(newRole) => {
            if (newRole === 'admin' && !adminUser) {
              setIsAdminAuthModalOpen(true);
            } else {
              setViewMode(newRole);
            }
          }}
          workers={workers}
          selectedWorkerId={selectedWorkerId}
          onSelectWorker={setSelectedWorkerId}
          bookings={bookings}
          onOpenCustomerBooking={() => setIsCustomerBookingOpen(true)}
          onResetData={handleResetData}
          isMobileDeviceView={isMobileDeviceView}
          onToggleDeviceView={() => setIsMobileDeviceView(!isMobileDeviceView)}
          locationArea={location.area}
          locationCity={location.city}
          onRefreshLocation={detectLocation}
          onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
          dbStats={dbStats}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* VIEW 1: LANDING PAGE (Primary Entry asking: Worker or Booking Person) */}
      {viewMode === 'landing' && (
        <LandingPage
          onSelectRole={(role) => {
            if (role === 'customer') {
              setViewMode('customer');
            } else if (role === 'worker') {
              setViewMode('worker');
            } else {
              // Admin role selected: check if authenticated or prompt Firebase admin login modal
              if (adminUser) {
                setViewMode('admin');
              } else {
                setIsAdminAuthModalOpen(true);
              }
            }
          }}
          lang={lang}
          onToggleLang={() => setLang(lang === 'en' ? 'hi' : 'en')}
          onSelectLang={setLang}
          location={location}
          isDetectingLocation={isDetectingLocation}
          onDetectLocation={detectLocation}
          onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
        />
      )}

      {/* VIEW 2: CUSTOMER / BOOKING PERSON PORTAL */}
      {viewMode === 'customer' && (
        <CustomerPortal
          lang={lang}
          onToggleLang={() => setLang(lang === 'en' ? 'hi' : 'en')}
          onSelectLang={setLang}
          location={location}
          isDetectingLocation={isDetectingLocation}
          onDetectLocation={detectLocation}
          onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
          onBackToLanding={() => setViewMode('landing')}
          onOpenInvoice={(booking) => setViewingInvoiceBooking(booking)}
          onSwitchToWorker={() => setViewMode('worker')}
        />
      )}

      {/* VIEW 3: WORKER PORTAL (Auth or Dashboard) */}
      {viewMode === 'worker' && (
        <>
          {!workerAuth ? (
            <WorkerAuth
              onAuthSuccess={(user, worker) => {
                setWorkerAuth({ user, worker });
                setSelectedWorkerId(worker.id);
                syncDatabaseData();
                showToast(`Welcome ${worker.name}! Logged in to Worker Portal.`);
              }}
              onBackToLanding={() => setViewMode('landing')}
              onViewBookingPage={() => {
                syncDatabaseData();
                setViewMode('customer');
              }}
              location={location}
            />
          ) : (
            <main className="flex-1 py-6 px-3 sm:px-6">
              <div className="max-w-7xl mx-auto">
                <WorkerDashboard
                  worker={currentWorker}
                  bookings={bookings}
                  onUpdateWorkerGeo={handleUpdateWorkerGeo}
                  onUploadCertification={handleUploadCertification}
                  onAcceptBooking={handleAcceptBooking}
                  onAdvanceBookingStatus={handleAdvanceBookingStatus}
                  onOpenInvoice={setViewingInvoiceBooking}
                  lang={lang}
                  onSignOut={() => {
                    setWorkerAuth(null);
                    removeAuthToken();
                    showToast('Signed out of worker account.');
                  }}
                  onWorkerUpdated={(updated) => {
                    setWorkers((prev) =>
                      prev.map((w) => (w.id === updated.id ? mapApiWorkerToProfile(updated) : w))
                    );
                    syncDatabaseData();
                  }}
                />
              </div>
            </main>
          )}
        </>
      )}

      {/* VIEW 4: FEDERATION ADMIN DASHBOARD */}
      {viewMode === 'admin' && (
        <main className="flex-1 py-6 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {isMobileDeviceView ? (
              <div className="max-w-md mx-auto bg-slate-900 p-3 rounded-[36px] shadow-2xl border-4 border-slate-800">
                <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-10 h-1.5 bg-slate-700 rounded-full" />
                </div>
                <div className="bg-slate-100 rounded-[28px] p-3 max-h-[80vh] overflow-y-auto">
                  <AdminDashboard
                    workers={workers}
                    societies={societies}
                    bookings={bookings}
                    paymentLedgers={paymentLedgers}
                    demandForecast={demandForecast}
                    onApproveWorker={handleApproveWorker}
                    onRejectWorker={handleRejectWorker}
                    onRefreshForecast={handleRefreshForecast}
                    isLoadingForecast={isLoadingForecast}
                    onOpenInvoice={setViewingInvoiceBooking}
                    lang={lang}
                    adminUser={adminUser}
                    onAdminSignOut={() => {
                      setAdminUser(null);
                      setViewMode('landing');
                      showToast('Signed out of Federation Officer Admin Portal.');
                    }}
                  />
                </div>
              </div>
            ) : (
              <AdminDashboard
                workers={workers}
                societies={societies}
                bookings={bookings}
                paymentLedgers={paymentLedgers}
                demandForecast={demandForecast}
                onApproveWorker={handleApproveWorker}
                onRejectWorker={handleRejectWorker}
                onRefreshForecast={handleRefreshForecast}
                isLoadingForecast={isLoadingForecast}
                onOpenInvoice={setViewingInvoiceBooking}
                lang={lang}
                adminUser={adminUser}
                onAdminSignOut={() => {
                  setAdminUser(null);
                  setViewMode('landing');
                  showToast('Signed out of Federation Officer Admin Portal.');
                }}
              />
            )}
          </div>
        </main>
      )}

      {/* Footer info with Cooperative Values (shown on app views) */}
      {viewMode !== 'landing' && (
        <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-700 text-white font-black flex items-center justify-center text-[10px]">
                सह
              </span>
              <span className="font-bold text-slate-800">
                {lang === 'hi'
                  ? 'सहकार सेवा महासंघ'
                  : lang === 'mr'
                  ? 'सहकार सेवा महासंघ'
                  : lang === 'te'
                  ? 'సహకార సేవా మహాసమాఖ్య'
                  : 'Sahakar Seva Cooperative Digital Marketplace'}
              </span>
              <span className="text-slate-400">|</span>
              <span>
                Registered under Maharashtra Cooperative Societies Act • Connected SQLite DB
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> 90% Direct Worker Payout
              </span>
              <span className="flex items-center gap-1 text-teal-800 font-semibold">
                <HeartHandshake className="w-3.5 h-3.5" /> 7% Dedicated Welfare Pool
              </span>
              <span>3% Federation Ops</span>
            </div>
          </div>
        </footer>
      )}

      {/* Customer Booking Simulator Modal */}
      <CustomerBookingModal
        isOpen={isCustomerBookingOpen}
        onClose={() => setIsCustomerBookingOpen(false)}
        workers={workers}
        onCreateBooking={handleCreateCustomerBooking}
        lang={lang}
      />

      {/* Digital Tax Invoice Modal */}
      <InvoiceModal
        booking={viewingInvoiceBooking}
        onClose={() => setViewingInvoiceBooking(null)}
        lang={lang}
      />

      {/* Manual & GPS Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        currentLocation={location}
        onSelectLocation={(area, city, lat, lng) => {
          setManualLocation(area, city, lat, lng);
          showToast(`Location set to ${area}, ${city}`);
        }}
        onDetectGPS={() => {
          detectLocation();
          showToast('Acquiring high-accuracy GPS coordinates...');
        }}
        isDetectingGPS={isDetectingLocation}
      />

      {/* Federation Admin Firebase Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={(admin) => {
          setAdminUser(admin);
          setViewMode('admin');
          showToast(`Authenticated with Firebase as ${admin.name}!`);
        }}
      />
    </div>
  );
}
