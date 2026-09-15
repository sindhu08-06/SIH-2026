import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  HardHat,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { WorkerProfile, CooperativeSociety, Booking } from '../../types';

interface FederationGISMapProps {
  workers: WorkerProfile[];
  societies: CooperativeSociety[];
  bookings: Booking[];
  onOpenInvoice?: (booking: Booking) => void;
  onApproveWorker?: (workerId: string) => void;
}

export const FederationGISMap: React.FC<FederationGISMapProps> = ({
  workers,
  societies,
  bookings,
  onOpenInvoice,
  onApproveWorker,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [showWorkers, setShowWorkers] = useState(true);
  const [showSocieties, setShowSocieties] = useState(true);
  const [showJobs, setShowJobs] = useState(true);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'worker' | 'society' | 'booking';
    data: any;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Andhra Pradesh (Kurnool Hub)
    const map = L.map(mapContainerRef.current, {
      center: [15.8281, 78.0373],
      zoom: 11,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

  // Update Markers when data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    // 1. Worker Markers
    if (showWorkers) {
      const filteredWorkers = workers.filter((w) => {
        if (emergencyOnly && !w.emergencyCertified) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            w.name.toLowerCase().includes(q) ||
            w.primarySkill.toLowerCase().includes(q) ||
            w.area.toLowerCase().includes(q)
          );
        }
        return true;
      });

      filteredWorkers.forEach((w) => {
        const wLat = w.location?.coordinates?.lat ?? (w.location as any)?.lat ?? (w as any).lat;
        const wLng = w.location?.coordinates?.lng ?? (w.location as any)?.lng ?? (w as any).lng;
        if (typeof wLat !== 'number' || typeof wLng !== 'number' || isNaN(wLat) || isNaN(wLng)) return;

        const isVerified = w.verificationStatus === 'verified';
        const customIcon = L.divIcon({
          className: 'custom-gis-marker',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${isVerified ? '#059669' : '#d97706'};
              border: 2.5px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              👷
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([wLat, wLng], { icon: customIcon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'worker', data: w });
        });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px 4px;">
            <strong>${w.name}</strong> (${w.primarySkill})<br/>
            <span style="color: ${isVerified ? '#059669' : '#d97706'}; font-weight: bold;">
              ${isVerified ? '✓ Verified Artisan' : 'Pending Verification'}
            </span>
          </div>
        `);

        marker.addTo(layerGroup);
        bounds.push([wLat, wLng]);
      });
    }

    // 2. Society Markers
    if (showSocieties && !emergencyOnly) {
      societies.forEach((s) => {
        const sLat = s.coordinates?.lat ?? (s as any).location?.coordinates?.lat ?? (s as any).location?.lat ?? (s as any).lat;
        const sLng = s.coordinates?.lng ?? (s as any).location?.coordinates?.lng ?? (s as any).location?.lng ?? (s as any).lng;
        if (typeof sLat !== 'number' || typeof sLng !== 'number' || isNaN(sLat) || isNaN(sLng)) return;

        const customIcon = L.divIcon({
          className: 'custom-gis-society',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 8px;
              background: #2563eb;
              border: 2.5px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              🏢
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([sLat, sLng], { icon: customIcon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'society', data: s });
        });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>${s.name}</strong><br/>
            <span>${s.area || ''} • ${s.flatsCount || s.activeWorkersCount || 0} Units</span>
          </div>
        `);

        marker.addTo(layerGroup);
        bounds.push([sLat, sLng]);
      });
    }

    // 3. Active Bookings & Emergencies
    if (showJobs) {
      bookings.forEach((b) => {
        const bLat = b.coordinates?.lat ?? (b as any).location?.coordinates?.lat ?? (b as any).location?.lat ?? (b as any).lat;
        const bLng = b.coordinates?.lng ?? (b as any).location?.coordinates?.lng ?? (b as any).location?.lng ?? (b as any).lng;
        if (typeof bLat !== 'number' || typeof bLng !== 'number' || isNaN(bLat) || isNaN(bLng)) return;
        if (emergencyOnly && !b.isEmergency) return;

        const isEmergency = b.isEmergency;
        const customIcon = L.divIcon({
          className: 'custom-gis-booking',
          html: `
            <div style="
              width: ${isEmergency ? '36px' : '28px'};
              height: ${isEmergency ? '36px' : '28px'};
              border-radius: 50%;
              background: ${isEmergency ? '#dc2626' : '#d97706'};
              border: 2.5px solid white;
              box-shadow: 0 0 12px ${isEmergency ? 'rgba(220,38,38,0.7)' : 'rgba(0,0,0,0.3)'};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
              font-weight: bold;
              cursor: pointer;
              transform: translate(-50%, -50%);
              animation: ${isEmergency ? 'pulse 1.5s infinite' : 'none'};
            ">
              ${isEmergency ? '⚡' : '📋'}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([bLat, bLng], { icon: customIcon });
        marker.on('click', () => {
          setSelectedEntity({ type: 'booking', data: b });
        });

        marker.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong>${b.bookingCode}</strong> - ${b.serviceCategory}<br/>
            <span>${b.customerName} (${b.area})</span><br/>
            <span style="color: ${isEmergency ? '#dc2626' : '#2563eb'}; font-weight: bold;">
              ${isEmergency ? 'EMERGENCY SOS' : b.status.toUpperCase()}
            </span>
          </div>
        `);

        marker.addTo(layerGroup);
        bounds.push([bLat, bLng]);
      });
    }

    // Fit map bounds if markers exist
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 13 });
    }
  }, [workers, societies, bookings, showWorkers, showSocieties, showJobs, emergencyOnly, searchQuery]);

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const handleCenterKurnool = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([15.8281, 78.0373], 12);
    }
  };

  const handleCenterAnanthapur = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([14.6819, 77.6006], 12);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* GIS Controls Header */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Cooperative Federation Real-Time GIS Radar</span>
            </h3>
            <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold font-mono">
              GPS LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive OpenStreetMap plotting registered artisans, housing societies, and live booking dispatch zones
          </p>
        </div>

        {/* Search within map */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artisan or area..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 w-44 sm:w-56"
            />
          </div>
          <button
            onClick={handleCenterKurnool}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-emerald-300 font-semibold transition cursor-pointer"
            title="Recenter to Kurnool Hub"
          >
            Kurnool
          </button>
          <button
            onClick={handleCenterAnanthapur}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-blue-300 font-semibold transition cursor-pointer"
            title="Recenter to Ananthapur Hub"
          >
            Ananthapur
          </button>
        </div>
      </div>

      {/* Layer Filter Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Map Layers:</span>
          </span>

          <button
            type="button"
            onClick={() => setShowWorkers(!showWorkers)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              showWorkers
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <span>👷 Artisans</span>
            <span className="font-mono text-[11px] bg-white/80 px-1 rounded">
              {workers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowSocieties(!showSocieties)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              showSocieties
                ? 'bg-blue-100 text-blue-900 border-blue-300'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <span>🏢 Societies</span>
            <span className="font-mono text-[11px] bg-white/80 px-1 rounded">
              {societies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowJobs(!showJobs)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              showJobs
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <span>📋 Active Orders</span>
            <span className="font-mono text-[11px] bg-white/80 px-1 rounded">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              emergencyOnly
                ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <span>⚡ SOS Emergencies Only</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(1)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Canvas with Inspector Drawer */}
      <div className="relative h-[480px] w-full bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Entity Details Floating Card */}
        {selectedEntity && (
          <div className="absolute top-4 right-4 z-1000 max-w-sm w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {selectedEntity.type === 'worker' && '👷'}
                  {selectedEntity.type === 'society' && '🏢'}
                  {selectedEntity.type === 'booking' && '📋'}
                </span>
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  {selectedEntity.type === 'worker' && 'Artisan Details'}
                  {selectedEntity.type === 'society' && 'Housing Society'}
                  {selectedEntity.type === 'booking' && 'Active Dispatch Job'}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Worker View */}
            {selectedEntity.type === 'worker' && (
              <div className="space-y-2 text-xs">
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedEntity.data.name}
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span>Trade: <strong>{selectedEntity.data.primarySkill}</strong></span>
                  <span>•</span>
                  <span>₹{selectedEntity.data.hourlyRate}/hr</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-[11px]">
                  Area: <strong>{selectedEntity.data.area}</strong>
                  <br />
                  Certificate: <strong>{selectedEntity.data.certificationTitle || 'Cooperative Certified'}</strong>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {selectedEntity.data.verificationStatus === 'verified' ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ✓ Fully Verified
                    </span>
                  ) : (
                    onApproveWorker && (
                      <button
                        onClick={() => onApproveWorker(selectedEntity.data.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer transition"
                      >
                        Approve Worker
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Society View */}
            {selectedEntity.type === 'society' && (
              <div className="space-y-2 text-xs">
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedEntity.data.name}
                </div>
                <div className="text-slate-500">
                  {selectedEntity.data.area}, {selectedEntity.data.city} • {selectedEntity.data.flatsCount} Flats
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-mono text-xs">
                  Welfare Balance: <strong>₹{selectedEntity.data.welfareFundBalance?.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {/* Booking View */}
            {selectedEntity.type === 'booking' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">
                    {selectedEntity.data.bookingCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      selectedEntity.data.isEmergency ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedEntity.data.isEmergency ? '⚡ Emergency SOS' : selectedEntity.data.status}
                  </span>
                </div>
                <div className="font-bold text-slate-800">
                  {selectedEntity.data.title || selectedEntity.data.serviceCategory}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Customer: <strong>{selectedEntity.data.customerName}</strong> ({selectedEntity.data.area})
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span>Gross Total:</span>
                  <strong className="font-mono text-slate-900">₹{selectedEntity.data.pricing?.totalAmount}</strong>
                </div>
                {onOpenInvoice && (
                  <button
                    onClick={() => onOpenInvoice(selectedEntity.data)}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer transition mt-2"
                  >
                    View Official Invoice
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span>Verified Artisan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span>Pending Artisan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
            <span>Cooperative Housing Society</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse inline-block" />
            <span>Emergency 24x7 Job</span>
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Click any pin on the map to inspect credentials or invoice
        </span>
      </div>
    </div>
  );
};
