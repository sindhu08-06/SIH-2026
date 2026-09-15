import { Coordinates, WorkerProfile, Booking } from '../types';

/**
 * Calculates great-circle distance between two points in kilometers (Haversine formula)
 * Robust against null, undefined, or malformed coordinate objects
 */
export function calculateDistanceKm(
  coord1?: Partial<Coordinates> | null,
  coord2?: Partial<Coordinates> | null
): number {
  const lat1 = typeof coord1?.lat === 'number' && !isNaN(coord1.lat) ? coord1.lat : 18.5204;
  const lng1 = typeof coord1?.lng === 'number' && !isNaN(coord1.lng) ? coord1.lng : 73.8567;
  const lat2 = typeof coord2?.lat === 'number' && !isNaN(coord2.lat) ? coord2.lat : 18.5204;
  const lng2 = typeof coord2?.lng === 'number' && !isNaN(coord2.lng) ? coord2.lng : 73.8567;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal point
}

/**
 * Estimates travel time assuming urban cooperative average speed (22 km/h + 3 min dispatch overhead)
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  const travelMins = Math.round((distanceKm / 22) * 60) + 3;
  return Math.max(5, travelMins);
}

export interface GeoMatchResult {
  worker: WorkerProfile;
  distanceKm: number;
  travelMinutes: number;
  matchScore: number; // 0 - 100
  isWithinRadius: boolean;
}

/**
 * Match open customer booking with qualified nearby workers based on distance, skills, and emergency certification
 */
export function matchWorkersForBooking(
  booking: Booking,
  workers: WorkerProfile[]
): GeoMatchResult[] {
  if (!booking || !Array.isArray(workers)) return [];

  const bookingCoords: Coordinates =
    booking.coordinates ||
    (booking as any).location?.coordinates || {
      lat: (booking as any).lat || 18.5204,
      lng: (booking as any).lng || 73.8567,
    };

  const results: GeoMatchResult[] = [];

  for (const worker of workers) {
    if (!worker) continue;

    const workerCategory = worker.primarySkill || '';
    const bookingCategory = booking.serviceCategory || '';

    // Skill match check
    const hasCategoryMatch =
      !bookingCategory ||
      bookingCategory === 'all' ||
      workerCategory.toLowerCase().includes(bookingCategory.toLowerCase()) ||
      bookingCategory.toLowerCase().includes(workerCategory.toLowerCase()) ||
      Boolean(worker.skills && worker.skills.some((s) => s.toLowerCase().includes(bookingCategory.toLowerCase())));

    if (!hasCategoryMatch) continue;

    const workerCoords: Coordinates =
      worker.location?.coordinates ||
      (worker as any).coordinates || {
        lat: (worker as any).lat || (worker.location as any)?.lat || 18.5204,
        lng: (worker as any).lng || (worker.location as any)?.lng || 73.8567,
      };

    const distance = calculateDistanceKm(workerCoords, bookingCoords);
    const serviceRadius = worker.location?.serviceRadiusKm || 15;
    const isWithinRadius = distance <= serviceRadius;
    const travelTime = estimateTravelTimeMinutes(distance);

    // Scoring logic:
    // Base 50 points
    let score = 50;

    // Distance factor (closer is higher)
    const distancePenalty = Math.min(40, distance * 2.5);
    score += 40 - distancePenalty;

    // Verification bonus
    if (worker.verificationStatus === 'verified') score += 10;

    // Availability bonus
    if (worker.availability === 'available') score += 10;
    else if (worker.availability === 'on_job') score -= 15;

    // Emergency certification bonus
    if (booking.isEmergency && worker.emergencyCertified) {
      score += 15;
    }

    // Rating factor
    score += ((worker.rating || 4.5) - 4.0) * 10;

    results.push({
      worker,
      distanceKm: distance,
      travelMinutes: travelTime,
      matchScore: Math.min(100, Math.max(10, Math.round(score))),
      isWithinRadius,
    });
  }

  // Sort by highest match score, then shortest distance
  return results.sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm);
}
