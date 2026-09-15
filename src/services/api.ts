export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'worker' | 'customer' | 'admin';
  createdAt: string;
}

export interface ApiWorker {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  society_id?: string;
  society_name?: string;
  coop_member_id?: string;
  primary_skill: string;
  skills: string[];
  hourly_rate: number;
  service_radius_km: number;
  lat: number;
  lng: number;
  city: string;
  area: string;
  verification_status: 'unverified' | 'under_review' | 'verified' | 'rejected';
  verification_notes?: string;
  verification_note?: string;
  verified_at?: string;
  verified_by?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  cert_title?: string;
  cert_number?: string;
  issuing_body?: string;
  skill_check_score?: number;
  skill_check_status?: 'passed' | 'failed' | 'pending';
  skill_check_completed_at?: string;
  credential_doc_type?: string;
  credential_file_name?: string;
  digital_seal_code?: string;
  certifications?: ApiCertification[];
  emergencyCertified: boolean;
  availability: 'available' | 'on_job' | 'offline';
  rating: number;
  completed_jobs_count: number;
  bank_upi?: string;
  welfare_fund_balance: number;
  location?: {
    city: string;
    area: string;
    coordinates: { lat: number; lng: number };
    serviceRadiusKm: number;
  };
}

export interface ApiCertification {
  id: string;
  worker_id: string;
  worker_name?: string;
  society_name?: string;
  primary_skill?: string;
  title: string;
  issuing_body: string;
  credential_number: string;
  issue_date: string;
  expiry_date?: string;
  document_type: string;
  file_url?: string;
  verification_status: 'pending' | 'under_review' | 'verified' | 'rejected';
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  digital_seal_code?: string;
  created_at: string;
}

export interface ApiBooking {
  id: string;
  booking_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  service_category: string;
  title: string;
  description: string;
  isEmergency: boolean;
  emergency_priority?: string;
  coordinates: { lat: number; lng: number };
  area: string;
  status: 'open' | 'assigned' | 'in_transit' | 'in_progress' | 'completed' | 'cancelled';
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  pricing: {
    totalAmount: number;
    workerPayout: number;
    coopWelfareFee: number;
    federationPlatformFee: number;
  };
  scheduled_time: string;
  created_at: string;
  completed_at?: string;
  payment_status: string;
  invoice_number: string;
  rating?: number;
  review_comment?: string;
  worker_rating?: number;
  worker_review?: string;
  worker_rating_tags?: string[];
  worker_rated_at?: string;
  booker_rating?: number;
  booker_review?: string;
  booker_rating_tags?: string[];
  booker_rated_at?: string;
}

const TOKEN_KEY = 'sahakar_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const removeAuthToken = clearAuthToken;

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const api = {
  getDbStats: () => fetchJson<{ success: boolean; database: string; stats: any }>('/api/db/stats'),

  register: (payload: any) =>
    fetchJson<{ success: boolean; token: string; user: AuthUser; worker?: ApiWorker }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (identifier: string, password: string) =>
    fetchJson<{ success: boolean; token: string; user: AuthUser; worker?: ApiWorker }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  getMe: () =>
    fetchJson<{ success: boolean; user: AuthUser; worker?: ApiWorker }>('/api/auth/me'),

  getWorkers: (params?: { category?: string; verifiedOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.verifiedOnly) q.set('verifiedOnly', 'true');
    return fetchJson<{ workers: ApiWorker[] }>(`/api/workers?${q.toString()}`);
  },

  getWorkerById: (id: string) => fetchJson<{ worker: ApiWorker }>(`/api/workers/${id}`),

  createWorker: (payload: any) =>
    fetchJson<{ success: boolean; worker: ApiWorker }>('/api/workers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitWorkerVerification: (workerId: string, payload: any) =>
    fetchJson<{ success: boolean; message: string; worker: ApiWorker }>(`/api/workers/${workerId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approveWorker: (workerId: string, payload?: { approvedBy?: string; notes?: string }) =>
    fetchJson<{ success: boolean; worker: ApiWorker }>(`/api/workers/${workerId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    }),

  rejectWorker: (workerId: string, reason?: string) =>
    fetchJson<{ success: boolean; worker: ApiWorker }>(`/api/workers/${workerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  updateWorkerGeo: (workerId: string, payload: { area?: string; city?: string; lat?: number; lng?: number; serviceRadiusKm?: number }) =>
    fetchJson<{ success: boolean; worker: ApiWorker }>(`/api/workers/${workerId}/geo`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateWorkerRealtime: (
    workerId: string,
    payload: {
      area?: string;
      city?: string;
      lat?: number;
      lng?: number;
      serviceRadiusKm?: number;
      availability?: 'available' | 'on_job' | 'offline';
      hourlyRate?: number;
    }
  ) =>
    fetchJson<{ success: boolean; worker: ApiWorker }>(`/api/workers/${workerId}/realtime`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getBookings: (filters?: { customerId?: string; workerId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (filters?.customerId) q.set('customerId', filters.customerId);
    if (filters?.workerId) q.set('workerId', filters.workerId);
    if (filters?.status) q.set('status', filters.status);
    return fetchJson<{ bookings: ApiBooking[] }>(`/api/bookings?${q.toString()}`);
  },

  createBooking: (payload: any) =>
    fetchJson<{ success: boolean; booking: ApiBooking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  acceptBooking: (bookingId: string, workerId: string, workerName: string) =>
    fetchJson<{ success: boolean; booking: ApiBooking }>(`/api/bookings/${bookingId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ workerId, workerName }),
    }),

  updateBookingStatus: (bookingId: string, status: string) =>
    fetchJson<{ success: boolean; booking: ApiBooking }>(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  rateBooking: (bookingId: string, payload: { rating: number; reviewComment?: string; tags?: string[] }) =>
    fetchJson<{ success: boolean; booking: ApiBooking; newWorkerRating: number; message: string }>(
      `/api/bookings/${bookingId}/rate`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  rateWorker: (bookingId: string, payload: { rating: number; reviewComment?: string; tags?: string[] }) =>
    fetchJson<{ success: boolean; booking: ApiBooking; newWorkerRating: number; message: string }>(
      `/api/bookings/${bookingId}/rate-worker`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  rateBooker: (bookingId: string, payload: { rating: number; reviewComment?: string; tags?: string[] }) =>
    fetchJson<{ success: boolean; booking: ApiBooking; newBookerRating: number; message: string }>(
      `/api/bookings/${bookingId}/rate-booker`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Worker Reputation & Feedback Profile
  getWorkerRatings: (workerId: string) =>
    fetchJson<{
      success: boolean;
      workerId: string;
      workerName: string;
      primarySkill: string;
      averageRating: number;
      ratingsCount: number;
      positivePercentage: number;
      ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
      topTags: { name: string; count: number }[];
      reviews: {
        id: string;
        bookingCode: string;
        customerName: string;
        customerArea: string;
        serviceCategory: string;
        rating: number;
        reviewComment: string;
        tags: string[];
        date: string;
      }[];
    }>(`/api/workers/${workerId}/ratings`),

  // Worker 4-Tier Verification Profile
  getWorkerVerificationProfile: (workerId: string) =>
    fetchJson<{
      success: boolean;
      profile: {
        workerId: string;
        workerName: string;
        verificationStatus: 'unverified' | 'under_review' | 'verified' | 'rejected';
        verificationNotes: string;
        verifiedAt: string | null;
        verifiedBy: string | null;
        digitalSealCode: string;
        tiers: {
          tierId: number;
          name: string;
          status: 'pending' | 'under_review' | 'verified' | 'rejected';
          documentType: string;
          documentNumber: string;
          issuingBody?: string;
          description: string;
          verifiedAt: string | null;
        }[];
        certifications: ApiCertification[];
      };
    }>(`/api/workers/${workerId}/verification-profile`),

  // Certifications Verification System
  getCertifications: (filters?: { workerId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (filters?.workerId) q.set('workerId', filters.workerId);
    if (filters?.status) q.set('status', filters.status);
    return fetchJson<{ success: boolean; certifications: ApiCertification[] }>(`/api/certifications?${q.toString()}`);
  },

  addCertification: (payload: {
    workerId: string;
    title: string;
    issuingBody: string;
    credentialNumber: string;
    issueDate: string;
    expiryDate?: string;
    documentType?: string;
    fileUrl?: string;
  }) =>
    fetchJson<{ success: boolean; certification: ApiCertification; message: string }>('/api/certifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyCertification: (
    certId: string,
    payload?: { verifiedBy?: string; notes?: string }
  ) =>
    fetchJson<{ success: boolean; certification: ApiCertification; workerVerified: boolean; message: string }>(
      `/api/certifications/${certId}/verify`,
      {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      }
    ),

  rejectCertification: (certId: string, payload: { reason: string }) =>
    fetchJson<{ success: boolean; certification: ApiCertification; message: string }>(
      `/api/certifications/${certId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  deleteCertification: (certId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/certifications/${certId}`, {
      method: 'DELETE',
    }),

  reverseGeocode: (lat: number, lng: number) =>
    fetchJson<{
      success: boolean;
      coordinates: { lat: number; lng: number };
      area: string;
      city: string;
      state: string;
      displayName: string;
    }>(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`),

  // Skill Check Assessment Submission
  submitSkillCheck: (workerId: string, payload: { trade: string; score: number; total: number; percentage: number }) =>
    fetchJson<{ success: boolean; worker: ApiWorker; message: string }>(`/api/workers/${workerId}/skill-check`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Escrow Wallet & UPI Payment status
  getBookingEscrow: (bookingIdOrCode: string) =>
    fetchJson<{
      success: boolean;
      escrow: {
        bookingId: string;
        bookingCode: string;
        invoiceNumber: string;
        paymentStatus: 'pending' | 'escrow_locked' | 'disbursed';
        escrowWalletAddress: string;
        escrowVaultId: string;
        totalAmount: number;
        breakdown: {
          workerPayout: number;
          coopWelfareFee: number;
          platformFee: number;
        };
        upiUri: string;
        assignedWorkerName?: string;
        customerName?: string;
        createdAt?: string;
        completedAt?: string;
        verificationHash: string;
        escrowTerms: string;
      };
    }>(`/api/bookings/${encodeURIComponent(bookingIdOrCode)}/escrow`),
};
