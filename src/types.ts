export type Language = 'en' | 'hi' | 'mr' | 'te';

export type UserRole = 'worker' | 'admin' | 'customer';

export type VerificationStatus = 'verified' | 'under_review' | 'pending' | 'rejected';

export type WorkerAvailability = 'available' | 'on_job' | 'offline';

export type EmergencyPriority = 'normal' | 'high' | 'critical';

export type BookingStatus = 'open' | 'assigned' | 'in_transit' | 'in_progress' | 'completed' | 'cancelled';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Certification {
  id: string;
  workerId?: string;
  workerName?: string;
  societyName?: string;
  title: string;
  issuingBody: string;
  credentialNumber: string;
  issueDate: string;
  expiryDate?: string;
  verificationStatus: VerificationStatus;
  documentType: 'license' | 'iti_diploma' | 'skill_india_nsdc' | 'wireman_license' | 'safety_clearance' | 'trade_card' | 'practical_experience' | 'coop_peer_endorsement' | 'provisional_apprentice' | 'other';
  fileUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  digitalSealCode?: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  nameHi: string;
  phone: string;
  email: string;
  avatar: string;
  societyId: string;
  societyName: string;
  societyNameHi: string;
  coopMemberId: string;
  primarySkill: string;
  primarySkillHi: string;
  skills: string[];
  certifications: Certification[];
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  skillCheckScore?: number;
  skillCheckStatus?: 'passed' | 'failed' | 'pending';
  skillCheckCompletedAt?: string;
  digitalSealCode?: string;
  idProofType?: string;
  idProofNumber?: string;
  credentialDocType?: string;
  verificationPathway?: 'traditional_credentials' | 'practical_experience' | 'coop_peer_endorsement' | 'provisional_apprentice';
  mentorArtisanName?: string;
  experienceYears?: number;
  location: {
    city: string;
    area: string;
    coordinates: Coordinates;
    serviceRadiusKm: number;
  };
  availability: WorkerAvailability;
  emergencyCertified: boolean;
  rating: number;
  completedJobsCount: number;
  bankUpi: string;
  welfare: {
    pmsbyEnrolled: boolean;
    sahakarArogyaActive: boolean;
    thriftDepositBalance: number;
    welfareFundContributionTotal: number;
    insurancePolicyNumber: string;
    coverageAmount: number;
  };
}

export interface CooperativeSociety {
  id: string;
  name: string;
  nameHi: string;
  registrationNumber: string;
  federationId: string;
  district: string;
  address: string;
  coordinates: Coordinates;
  establishedYear: number;
  presidentName: string;
  contactPhone: string;
  activeWorkersCount: number;
  totalBookingsHandled: number;
  welfareFundBalance: number;
  primarySectors: string[];
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  coordinates: Coordinates;
  bookerRating?: number;
  bookerRatingsCount?: number;
  bookerCompletedJobs?: number;
  bookerBadges?: string[];
}

export interface BookingPricing {
  baseAmount: number;
  emergencySurge: number;
  totalAmount: number;
  workerPayout: number; // 90%
  coopWelfareFee: number; // 7%
  federationPlatformFee: number; // 3%
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceCategory: string;
  serviceCategoryHi: string;
  title: string;
  titleHi: string;
  description: string;
  isEmergency: boolean;
  emergencyPriority: EmergencyPriority;
  address: string;
  area: string;
  coordinates: Coordinates;
  status: BookingStatus;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  createdAt: string;
  scheduledTime: string;
  completedAt?: string;
  pricing: BookingPricing;
  invoiceNumber: string;
  paymentStatus: 'pending' | 'escrow_locked' | 'disbursed';
  rating?: number;
  reviewComment?: string;
  workerRating?: number;
  workerReview?: string;
  workerRatingTags?: string[];
  workerRatedAt?: string;
  bookerRating?: number;
  bookerReview?: string;
  bookerRatingTags?: string[];
  bookerRatedAt?: string;
}

export interface PaymentLedgerItem {
  id: string;
  bookingId: string;
  bookingCode: string;
  timestamp: string;
  customerName: string;
  workerName: string;
  grossAmount: number;
  workerPayout: number;
  coopWelfareShare: number;
  federationShare: number;
  status: 'settled' | 'processing' | 'escrow';
  utrRef: string;
}

export interface DemandZoneForecast {
  zoneName: string;
  riskLevel: 'Normal' | 'Moderate' | 'High' | 'Critical';
  expectedIncrease: string;
  primaryCategory: string;
  rationale: string;
}

export interface WorkerAllocationRecommendation {
  society: string;
  action: string;
  expectedImpact: string;
}

export interface DemandForecast {
  summary: string;
  projectedDemandSpikePercentage: number;
  highDemandZones: DemandZoneForecast[];
  recommendedWorkerAllocations: WorkerAllocationRecommendation[];
  welfareAdvisory: string;
  generatedAt: string;
  source: string;
}
