import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  HardHat,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Zap,
  ZoomIn,
  ZoomOut,
  CalendarCheck,
} from 'lucide-react';
import { WorkerProfile, Language } from '../../types';
import { calculateDistanceKm, estimateTravelTimeMinutes } from '../../utils/geo';
import { DetectedLocation } from '../../hooks/useLocation';

interface CustomerRealtimeRadarMapProps {
  workers: WorkerProfile[];
  customerLocation: DetectedLocation;
  onSelectWorkerToBook: (worker: WorkerProfile) => void;
  lang: Language;
}

export const CustomerRealtimeRadarMap: React.FC<CustomerRealtimeRadarMapProps> = ({
  workers,
  customerLocation,
  onSelectWorkerToBook,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [selectedTradeFilter, setSelectedTradeFilter] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const lat = customerLocation.lat || 18.5204;
    const lng = customerLocation.lng || 73.8567;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when customer location changes
  useEffect(() => {
    if (mapInstanceRef.current && customerLocation.lat && customerLocation.lng) {
      mapInstanceRef.current.panTo([customerLocation.lat, customerLocation.lng]);
    }
  }, [customerLocation.lat, customerLocation.lng]);

  // Update Markers & Connecting Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Remove existing route line if any
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const cLat = customerLocation.lat || 18.5204;
    const cLng = customerLocation.lng || 73.8567;

    // 1. Customer Location Marker (Pulsing Radar Pin)
    const customerIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
          📍
        </div>
      </div>
    `;

    const customerIcon = L.divIcon({
      className: 'custom-customer-radar-icon',
      html: customerIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const customerMarker = L.marker([cLat, cLng], { icon: customerIcon });
    customerMarker.bindPopup(`
      <div style="font-family: system-ui; font-size: 12px; padding: 2px;">
        <strong style="color: #1e3a8a;">📍 Your Current Location</strong>
        <div style="color: #64748b; font-size: 11px;">${customerLocation.displayName || customerLocation.area}</div>
        <div style="color: #059669; font-weight: bold; font-size: 10px; margin-top: 2px;">Live GPS Lock (±${customerLocation.accuracy || 15}m)</div>
      </div>
    `);
    customerMarker.addTo(layerGroup);

    // Accuracy Circle around customer
    if (customerLocation.accuracy) {
      L.circle([cLat, cLng], {
        radius: Math.min(customerLocation.accuracy, 150),
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(layerGroup);
    }

    // 2. Filter Workers
    const filteredWorkers = workers.filter((w) => {
      if (availableOnly && w.availability === 'offline') return false;
      if (selectedTradeFilter !== 'all' && !w.primarySkill.toLowerCase().includes(selectedTradeFilter.toLowerCase())) {
        return false;
      }
      return true;
    });

    // 3. Worker Markers
    filteredWorkers.forEach((worker) => {
      const wLat = worker.location?.coordinates?.lat || worker.location?.lat;
      const wLng = worker.location?.coordinates?.lng || worker.location?.lng;
      if (!wLat || !wLng) return;

      const isAvailable = worker.availability === 'available';
      const isOnJob = worker.availability === 'on_job';

      const distanceKm = calculateDistanceKm(
        { lat: cLat, lng: cLng },
        { lat: wLat, lng: wLng }
      );
      const etaMins = estimateTravelTimeMinutes(distanceKm);

      const statusColor = isAvailable ? '#10b981' : isOnJob ? '#f59e0b' : '#94a3b8';
      const isSelected = selectedWorker?.id === worker.id;

      const markerHtml = `
        <div class="relative cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div style="background-color: ${statusColor};" class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs">
            ${worker.emergencyCertified ? '⚡' : '🛠️'}
          </div>
          <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-800">
            ★
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-worker-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([wLat, wLng], { icon });

      marker.on('click', () => {
        setSelectedWorker(worker);
      });

      marker.bindPopup(`
        <div style="font-family: system-ui; font-size: 12px; min-width: 180px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">${worker.name}</strong>
            <span style="background: #fef3c7; color: #92400e; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 6px;">★ ${worker.rating.toFixed(1)}</span>
          </div>
          <div style="color: #047857; font-weight: 600; font-size: 11px;">${worker.primarySkill}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${worker.societyName || 'Cooperative Guild'}</div>
          
          <div style="margin-top: 6px; padding: 6px; background: #f8fafc; border-radius: 6px; font-size: 11px;">
            <div>📍 <strong>${distanceKm.toFixed(1)} km</strong> away (ETA: ~${etaMins} mins)</div>
            <div style="color: #059669; font-weight: bold; margin-top: 2px;">₹${worker.hourlyRate || 350}/hr direct co-op rate</div>
          </div>
        </div>
      `);

      marker.addTo(layerGroup);
    });

    // 4. Draw Connecting Route Line to Selected Worker
    if (selectedWorker) {
      const swLat = selectedWorker.location?.coordinates?.lat || selectedWorker.location?.lat;
      const swLng = selectedWorker.location?.coordinates?.lng || selectedWorker.location?.lng;

      if (swLat && swLng) {
        const polyline = L.polyline(
          [
            [cLat, cLng],
            [swLat, swLng],
          ],
          {
            color: '#10b981',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.85,
          }
        ).addTo(map);

        routeLineRef.current = polyline;
      }
    }
  }, [workers, customerLocation, selectedWorker, selectedTradeFilter, availableOnly]);

  const trades = ['all', 'Electrical', 'Plumbing', 'Appliance Repair', 'Carpentry', 'Masonry'];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px] relative">
      {/* Map Header & Filter Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <span>Live Artisan Radar Map</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time GPS
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Showing live locations of verified cooperative workers near you
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          {/* Trade Filter */}
          <select
            value={selectedTradeFilter}
            onChange={(e) => setSelectedTradeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs focus:outline-emerald-600"
          >
            {trades.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Trades' : t}
              </option>
            ))}
          </select>

          {/* Available only toggle */}
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              availableOnly
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Available Now
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div className="flex-1 relative w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Floating Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 shadow-sm">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (customerLocation.lat && customerLocation.lng) {
                mapInstanceRef.current?.setView([customerLocation.lat, customerLocation.lng], 14);
              }
            }}
            className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
            title="Center on My Location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected Worker Floating Card */}
        {selectedWorker && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  {selectedWorker.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">{selectedWorker.name}</h5>
                  <div className="text-xs text-emerald-700 font-semibold">{selectedWorker.primarySkill}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900 text-xs font-black">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{selectedWorker.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Travel stats */}
            {customerLocation.lat && customerLocation.lng && (() => {
              const dist = calculateDistanceKm(
                { lat: customerLocation.lat, lng: customerLocation.lng },
                {
                  lat: selectedWorker.location?.coordinates?.lat || selectedWorker.location?.lat || 18.52,
                  lng: selectedWorker.location?.coordinates?.lng || selectedWorker.location?.lng || 73.85,
                }
              );
              return (
                <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Distance</span>
                    <strong className="text-slate-900 font-extrabold">
                      {dist.toFixed(1)} km
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block">Est. Arrival</span>
                    <strong className="text-emerald-700 font-extrabold">
                      ~{estimateTravelTimeMinutes(dist)} mins
                    </strong>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWorker(null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectWorkerToBook(selectedWorker);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Book This Artisan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
