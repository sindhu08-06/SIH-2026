import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Clock,
  Zap,
  Battery,
  Wrench,
  Truck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { WorkerProfile, Booking, Language } from '../../types';
import { api } from '../../services/api';
import { calculateDistanceKm } from '../../utils/geo';

interface WorkerRealtimeTelemetryProps {
  worker: WorkerProfile;
  bookings: Booking[];
  onWorkerUpdated: (updated: any) => void;
  lang: Language;
}

const COMMON_TOOLS = [
  'Digital Multimeter',
  'Pipe Wrench & Threader',
  'Insulated Safety Ladder',
  'Impact Drill & Masonry Bits',
  'Gas Leak Detector',
  'Pressure Gauge',
  'Submersible Dewatering Pump',
  'Laser Level Tool',
  'Concealed Wire Detector',
  'Safety Harness & PPE Kit',
];

export const WorkerRealtimeTelemetry: React.FC<WorkerRealtimeTelemetryProps> = ({
  worker,
  bookings,
  onWorkerUpdated,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const jobsLayerRef = useRef<L.LayerGroup | null>(null);

  const initialLat = worker.location?.coordinates?.lat || worker.location?.lat || 18.5204;
  const initialLng = worker.location?.coordinates?.lng || worker.location?.lng || 73.8567;

  // Realtime state
  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [currentArea, setCurrentArea] = useState<string>(worker.location?.area || 'Shivajinagar, Pune');
  const [currentCity, setCurrentCity] = useState<string>(worker.location?.city || 'Pune');
  const [availability, setAvailability] = useState<'available' | 'on_job' | 'offline'>(
    (worker.availability as any) || 'available'
  );
  const [hourlyRate, setHourlyRate] = useState<number>(worker.hourlyRate || 350);
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(
    worker.location?.serviceRadiusKm || 12
  );
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'Digital Multimeter',
    'Insulated Safety Ladder',
    'Impact Drill & Masonry Bits',
  ]);
  const [vehicleType, setVehicleType] = useState<string>('Motorbike (Two-Wheeler)');

  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Jobs Layer Group
    const jobsLayer = L.layerGroup().addTo(map);
    jobsLayerRef.current = jobsLayer;

    // Worker Marker
    const workerIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black">
          ⚡
        </div>
      </div>
    `;
    const icon = L.divIcon({
      className: 'custom-worker-live-icon',
      html: workerIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([currentLat, currentLng], { icon }).addTo(map);
    marker.bindPopup(`<strong>${worker.name} (Live Position)</strong><br/>${currentArea}`);
    markerRef.current = marker;

    // Service Radius Circle
    const circle = L.circle([currentLat, currentLng], {
      radius: serviceRadiusKm * 1000,
      color: '#10b981',
      fillColor: '#34d399',
      fillOpacity: 0.12,
      weight: 1.5,
    }).addTo(map);
    radiusCircleRef.current = circle;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map pin and radius when coordinates or radius change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([currentLat, currentLng]);
      markerRef.current.setPopupContent(`<strong>${worker.name} (Live Position)</strong><br/>${currentArea}`);
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([currentLat, currentLng]);
      radiusCircleRef.current.setRadius(serviceRadiusKm * 1000);
    }
    mapInstanceRef.current.panTo([currentLat, currentLng]);
  }, [currentLat, currentLng, serviceRadiusKm, currentArea, worker.name]);

  // Render open bookings inside worker's radar
  useEffect(() => {
    const jobsLayer = jobsLayerRef.current;
    if (!jobsLayer) return;

    jobsLayer.clearLayers();

    const openJobs = bookings.filter((b) => b.status === 'open' || b.assignedWorkerId === worker.id);

    openJobs.forEach((job) => {
      const jLat = job.coordinates?.lat;
      const jLng = job.coordinates?.lng;
      if (!jLat || !jLng) return;

      const isEmergency = job.isEmergency;
      const dist = calculateDistanceKm(
        { lat: currentLat, lng: currentLng },
        { lat: jLat, lng: jLng }
      );

      const jobIconHtml = `
        <div class="w-6 h-6 rounded-full ${
          isEmergency ? 'bg-rose-600 animate-bounce' : 'bg-blue-600'
        } border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
          ${isEmergency ? 'SOS' : '🛠'}
        </div>
      `;

      const jIcon = L.divIcon({
        className: 'custom-job-marker',
        html: jobIconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const jMarker = L.marker([jLat, jLng], { icon: jIcon });
      jMarker.bindPopup(`
        <div style="font-size: 11px; padding: 2px;">
          <strong>${job.title}</strong> (${dist.toFixed(1)} km away)<br/>
          <span style="color: #059669; font-weight: bold;">₹${job.pricing?.totalAmount || 450}</span>
          • ${job.area}
        </div>
      `);
      jMarker.addTo(jobsLayer);
    });
  }, [bookings, currentLat, currentLng, worker.id]);

  // Acquire Live GPS from Hardware Device
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      setStatusMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsLocating(true);
    setStatusMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLat(latitude);
        setCurrentLng(longitude);

        try {
          const rev = await api.reverseGeocode(latitude, longitude);
          if (rev && rev.displayName) {
            setCurrentArea(rev.area || rev.displayName);
            setCurrentCity(rev.city || 'Pune');
          }
        } catch {
          setCurrentArea(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
        }

        setIsLocating(false);
        setStatusMsg({
          type: 'success',
          text: `Live GPS fix locked: ${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E (±${Math.round(
            position.coords.accuracy
          )}m)`,
        });
      },
      (err) => {
        setIsLocating(false);
        setStatusMsg({
          type: 'error',
          text: `GPS lock error: ${err.message || 'Please grant browser location permissions.'}`,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  // Save telemetry to backend
  const handleSaveTelemetry = async () => {
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await api.updateWorkerRealtime(worker.id, {
        lat: currentLat,
        lng: currentLng,
        area: currentArea,
        city: currentCity,
        serviceRadiusKm,
        availability,
        hourlyRate,
      });

      if (res && res.worker) {
        onWorkerUpdated(res.worker);
        setStatusMsg({
          type: 'success',
          text: 'Real-time telemetry & GPS broadcast updated on cooperative network!',
        });
      }
    } catch (err: any) {
      console.error('Save telemetry error:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update telemetry.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Cooperative Live Dispatch Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">Worker Real-Time Data & Radar</h2>
          <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl">
            Broadcast your active GPS coordinates, real-time availability, hourly rate, and kit
            readiness directly to the cooperative dispatch board and nearby customer radar.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Grid Layout: Controls & Real-Time Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Telemetry controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Live Availability Selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>1. Live Dispatch Status</span>
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  availability === 'available'
                    ? 'bg-emerald-500 animate-ping'
                    : availability === 'on_job'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAvailability('available')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 border transition cursor-pointer ${
                  availability === 'available'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Available</span>
                <span className="text-[9px] font-normal text-slate-500">Ready for jobs</span>
              </button>

              <button
                type="button"
                onClick={() => setAvailability('on_job')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 border transition cursor-pointer ${
                  availability === 'on_job'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>On Job</span>
                <span className="text-[9px] font-normal text-slate-500">Currently busy</span>
              </button>

              <button
                type="button"
                onClick={() => setAvailability('offline')}
                className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold flex flex-col items-center gap-1 border transition cursor-pointer ${
                  availability === 'offline'
                    ? 'bg-slate-200 border-slate-500 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Offline</span>
                <span className="text-[9px] font-normal text-slate-500">Rest period</span>
              </button>
            </div>
          </div>

          {/* 2. Real-Time GPS Synchronization */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>2. Real-Time GPS Pin</span>
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Current Operating Area / Landmark
                </label>
                <input
                  type="text"
                  value={currentArea}
                  onChange={(e) => setCurrentArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-900 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span>Lat: </span>
                  <strong className="text-slate-800">{currentLat.toFixed(5)}°N</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span>Lng: </span>
                  <strong className="text-slate-800">{currentLng.toFixed(5)}°E</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAcquireGps}
                disabled={isLocating}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Syncing Hardware GPS...' : 'Acquire Current Hardware GPS'}</span>
              </button>
            </div>
          </div>

          {/* 3. Hourly Rate & Service Radius */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              3. Rate & Service Radius
            </h4>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Live Hourly Rate</span>
                <span className="text-emerald-700 font-extrabold">₹{hourlyRate}/hr</span>
              </div>
              <input
                type="range"
                min={200}
                max={1200}
                step={25}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹200/hr</span>
                <span>₹700/hr</span>
                <span>₹1200/hr</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Service Coverage Radius</span>
                <span className="text-blue-700 font-extrabold">{serviceRadiusKm} km</span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3 km (Local)</span>
                <span>15 km (City Zone)</span>
                <span>30 km (District)</span>
              </div>
            </div>
          </div>

          {/* 4. Equipment & Vehicle */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              4. Tools in Hand & Vehicle
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Transport Mode
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-900 focus:outline-emerald-600"
              >
                <option value="Motorbike (Two-Wheeler)">Motorbike / Scooter (Fast Transit)</option>
                <option value="Service Van (Four-Wheeler)">Service Van (Heavy Equipment)</option>
                <option value="Bicycle">Bicycle (Local Neighborhood)</option>
                <option value="Public Transit / Walking">Metro / Public Transit</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2">
                Select Active Tools Ready in Your Kit:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TOOLS.map((tool) => {
                  const active = selectedTools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {tool}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Broadcast button */}
          <button
            type="button"
            onClick={handleSaveTelemetry}
            disabled={isSaving}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Radio className="w-4 h-4" />
            <span>
              {isSaving ? 'Broadcasting Telemetry...' : 'Broadcast Live Data to Federation'}
            </span>
          </button>
        </div>

        {/* Right Column: Live Radar Map (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col h-[680px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Interactive Live Radar & Job Dispatch</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Green circle indicates your {serviceRadiusKm} km coverage radius
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {bookings.filter((b) => b.status === 'open').length} Open Jobs in Network
            </div>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-200">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-sm z-10 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span>You (Live GPS)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                <span>Customer Job</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
                <span>Emergency SOS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
