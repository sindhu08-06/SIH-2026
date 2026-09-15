import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface DetectedLocation {
  lat: number;
  lng: number;
  city: string;
  area: string;
  displayName: string;
  accuracy?: number; // Accuracy radius in meters
  accuracyGrade?: 'high' | 'medium' | 'approximate';
  status: 'detecting' | 'detected' | 'denied' | 'fallback';
}

const DEFAULT_LOCATION: DetectedLocation = {
  lat: 15.8281,
  lng: 78.0373,
  city: 'Kurnool',
  area: 'N.R. Peta',
  displayName: 'N.R. Peta, Kurnool, Andhra Pradesh',
  accuracy: 15,
  accuracyGrade: 'high',
  status: 'fallback',
};

export function useLocation() {
  const [location, setLocation] = useState<DetectedLocation>(() => {
    try {
      const saved = localStorage.getItem('sahakar_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          !isNaN(parsed.lat) &&
          typeof parsed.lng === 'number' &&
          !isNaN(parsed.lng)
        ) {
          return {
            ...DEFAULT_LOCATION,
            ...parsed,
            lat: parsed.lat,
            lng: parsed.lng,
          };
        }
      }
    } catch {
      // ignore parsing error
    }
    return DEFAULT_LOCATION;
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPosition = useCallback(async (pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = pos.coords;
    const grade: 'high' | 'medium' | 'approximate' =
      accuracy <= 25 ? 'high' : accuracy <= 100 ? 'medium' : 'approximate';

    try {
      const res = await api.reverseGeocode(latitude, longitude);
      const detected: DetectedLocation = {
        lat: latitude,
        lng: longitude,
        city: res.city || 'Kurnool',
        area: res.area || 'Local Area',
        displayName: res.displayName || `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`,
        accuracy: Math.round(accuracy),
        accuracyGrade: grade,
        status: 'detected',
      };
      setLocation(detected);
      localStorage.setItem('sahakar_user_location', JSON.stringify(detected));
    } catch {
      const fallback: DetectedLocation = {
        lat: latitude,
        lng: longitude,
        city: 'Detected GPS Location',
        area: `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`,
        displayName: `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E (±${Math.round(accuracy)}m)`,
        accuracy: Math.round(accuracy),
        accuracyGrade: grade,
        status: 'detected',
      };
      setLocation(fallback);
      localStorage.setItem('sahakar_user_location', JSON.stringify(fallback));
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    // Request precise real-time hardware GPS location without caching
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos);

        // If initial fix has broad accuracy (> 35m), briefly monitor to lock onto finer satellites
        if (pos.coords.accuracy > 35) {
          const watchId = navigator.geolocation.watchPosition(
            (refinedPos) => {
              if (refinedPos.coords.accuracy < pos.coords.accuracy) {
                applyPosition(refinedPos);
                if (refinedPos.coords.accuracy <= 20) {
                  navigator.geolocation.clearWatch(watchId);
                }
              }
            },
            () => {},
            {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000,
            }
          );

          // Clear watch after 8 seconds
          setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
          }, 8000);
        }
      },
      (err) => {
        setIsDetecting(false);
        setErrorMsg(
          err.code === 1
            ? 'Location access was not granted. Using default cooperative hub.'
            : 'Unable to acquire precise GPS signal. Using default cooperative hub.'
        );
        setLocation((prev) => ({ ...prev, status: 'denied' }));
      },
      {
        enableHighAccuracy: true, // Force hardware GPS chip / Wi-Fi triangulation
        timeout: 15000,           // Allow enough time for fine satellite acquisition
        maximumAge: 0,            // Strict zero-age: never use stale cached position
      }
    );
  }, [applyPosition]);

  // Attempt detection on mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const setManualLocation = (area: string, city: string, lat: number, lng: number) => {
    const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : DEFAULT_LOCATION.lat;
    const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : DEFAULT_LOCATION.lng;
    const manual: DetectedLocation = {
      lat: validLat,
      lng: validLng,
      city: city || DEFAULT_LOCATION.city,
      area: area || DEFAULT_LOCATION.area,
      displayName: `${area || DEFAULT_LOCATION.area}, ${city || DEFAULT_LOCATION.city}`,
      status: 'fallback',
    };
    setLocation(manual);
    try {
      localStorage.setItem('sahakar_user_location', JSON.stringify(manual));
    } catch {
      // ignore
    }
  };

  return {
    location,
    isDetecting,
    errorMsg,
    detectLocation,
    setManualLocation,
  };
}
