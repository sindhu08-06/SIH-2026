import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Layers, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { KNOWN_POSTAL_CODES } from '../../utils/postalCodes';

interface InteractiveMapPickerProps {
  initialLat: number;
  initialLng: number;
  initialArea: string;
  initialCity: string;
  onConfirmLocation: (area: string, city: string, lat: number, lng: number) => void;
}

// Find closest landmark or area name from known regional points
function getClosestLocationName(lat: number, lng: number): { area: string; city: string; distanceKm: number } {
  let closest = { area: 'N.R. Peta Hub', city: 'Kurnool', distanceKm: 9999 };

  for (const item of KNOWN_POSTAL_CODES) {
    const dLat = (item.lat - lat) * 111;
    const dLng = (item.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < closest.distanceKm) {
      closest = {
        area: item.area,
        city: item.city,
        distanceKm: Math.round(dist * 10) / 10,
      };
    }
  }

  return closest;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  initialLat,
  initialLng,
  initialArea,
  initialCity,
  onConfirmLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [selectedPos, setSelectedPos] = useState({
    lat: initialLat || 15.8281,
    lng: initialLng || 78.0373,
  });

  const [locationTitle, setLocationTitle] = useState(initialArea || 'N.R. Peta');
  const [locationCity, setLocationCity] = useState(initialCity || 'Kurnool');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Reverse geocode via OpenStreetMap Nominatim with local fallback
  const updateAddressFromCoords = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    const closest = getClosestLocationName(lat, lng);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const areaName =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.road ||
          addr.village ||
          closest.area;
        const cityName = addr.city || addr.town || addr.county || closest.city;

        setLocationTitle(areaName);
        setLocationCity(cityName);
        setIsReverseGeocoding(false);
        return;
      }
    } catch {
      // Ignore network abort or throttle, use closest landmark
    }

    setLocationTitle(closest.area);
    setLocationCity(closest.city);
    setIsReverseGeocoding(false);
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Custom SVG Pin Icon
    const customPinIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; width: 42px; height: 42px; transform: translate(-21px, -42px); cursor: grab;">
          <div style="width: 42px; height: 42px; background: #059669; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 8px 16px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
          <div style="position: absolute; bottom: -8px; left: 13px; width: 16px; height: 6px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px);"></div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 42],
    });

    const startLat = initialLat || 18.5204;
    const startLng = initialLng || 73.8567;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 14,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Initial marker
    const marker = L.marker([startLat, startLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Marker drag handler
    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setSelectedPos({ lat: pos.lat, lng: pos.lng });
      updateAddressFromCoords(pos.lat, pos.lng);
    });

    // Map click handler (click anywhere to place pin)
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setSelectedPos({ lat, lng });
      updateAddressFromCoords(lat, lng);
    });

    // Invalidate size to ensure crisp rendering inside dialog
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
    };
  }, []);

  const panToPreset = (lat: number, lng: number, area: string, city: string) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1 });
    markerRef.current.setLatLng([lat, lng]);
    setSelectedPos({ lat, lng });
    setLocationTitle(area);
    setLocationCity(city);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Quick City & Landmark Jump Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Quick Jump:
        </span>
        <button
          type="button"
          onClick={() => panToPreset(15.8281, 78.0373, 'N.R. Peta / Raj Vihar', 'Kurnool')}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold shrink-0 transition"
        >
          Kurnool Raj Vihar
        </button>
        <button
          type="button"
          onClick={() => panToPreset(15.8150, 78.0280, 'C-Camp (GPREC)', 'Kurnool')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shrink-0 transition"
        >
          Kurnool C-Camp
        </button>
        <button
          type="button"
          onClick={() => panToPreset(14.6819, 77.6006, 'Clock Tower Center', 'Ananthapur')}
          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-semibold shrink-0 transition"
        >
          Ananthapur Clock Tower
        </button>
        <button
          type="button"
          onClick={() => panToPreset(14.6738, 77.5950, 'Court Road / Housing Board', 'Ananthapur')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shrink-0 transition"
        >
          Ananthapur Court Rd
        </button>
        <button
          type="button"
          onClick={() => panToPreset(15.8010, 78.0190, 'Kallur Industrial Estate', 'Kurnool')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shrink-0 transition"
        >
          Kurnool Kallur
        </button>
        <button
          type="button"
          onClick={() => panToPreset(14.6540, 77.6110, 'JNTU Campus', 'Ananthapur')}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold shrink-0 transition"
        >
          Ananthapur JNTU
        </button>
      </div>

      {/* Map Display Container */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instructions & Zoom Buttons */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-md border border-slate-700/50 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Click anywhere or drag the green pin to position</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-200 shadow-md flex items-center justify-center transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Location Details Strip & Confirm CTA */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <span>{locationTitle}</span>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded font-semibold">
                {locationCity}
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 font-mono mt-0.5 truncate">
              Coordinates: {selectedPos.lat.toFixed(4)}°N, {selectedPos.lng.toFixed(4)}°E
              {isReverseGeocoding && ' (resolving name...)'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirmLocation(locationTitle, locationCity, selectedPos.lat, selectedPos.lng)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Confirm This Map Location</span>
        </button>
      </div>
    </div>
  );
};
