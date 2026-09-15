import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Check,
  X,
  Navigation,
  Compass,
  Map as MapIcon,
  Hash,
  ListFilter,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { DetectedLocation } from '../../hooks/useLocation';
import { InteractiveMapPicker } from './InteractiveMapPicker';
import {
  KNOWN_POSTAL_CODES,
  lookupPostalCode,
  PostalCodeInfo,
} from '../../utils/postalCodes';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: DetectedLocation;
  onSelectLocation: (area: string, city: string, lat: number, lng: number) => void;
  onDetectGPS: () => void;
  isDetectingGPS: boolean;
}

type PickerTab = 'map' | 'pincode' | 'areas';

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
  onDetectGPS,
  isDetectingGPS,
}) => {
  const [activeTab, setActiveTab] = useState<PickerTab>('map');

  // Search & custom area state
  const [searchQuery, setSearchQuery] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [customCity, setCustomCity] = useState('Kurnool');

  // Postal code lookup state
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<PostalCodeInfo | null>(null);
  const [isSearchingPin, setIsSearchingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePincodeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pincodeInput.replace(/\D/g, '').trim();
    if (clean.length !== 6) {
      setPinError('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }

    setPinError(null);
    setIsSearchingPin(true);

    try {
      const res = await lookupPostalCode(clean);
      if (res) {
        setPincodeResult(res);
      } else {
        setPinError(`No location records found for PIN code ${clean}. Try a nearby area.`);
        setPincodeResult(null);
      }
    } catch {
      setPinError('Postal code lookup service encountered an error.');
    } finally {
      setIsSearchingPin(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const area = customArea.trim();
    const city = customCity.trim() || 'Kurnool';
    if (!area) return;

    let lat = 15.8281;
    let lng = 78.0373;
    const lowerCity = city.toLowerCase();
    if (lowerCity.includes('ananthapur') || lowerCity.includes('anantapur')) {
      lat = 14.6819;
      lng = 77.6006;
    } else if (lowerCity.includes('kurnool')) {
      lat = 15.8281;
      lng = 78.0373;
    } else if (lowerCity.includes('mumbai')) {
      lat = 19.076;
      lng = 72.8777;
    } else if (lowerCity.includes('pune')) {
      lat = 18.5204;
      lng = 73.8567;
    }

    onSelectLocation(area, city, lat, lng);
    onClose();
  };

  const filteredPostalCodes = KNOWN_POSTAL_CODES.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.pincode.includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.landmarks.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <Compass className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Select Your Location</h3>
              <p className="text-xs text-slate-500">
                Choose via interactive map, postal code, or regional hubs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global GPS Bar */}
        <div className="px-6 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-600">Current:</span>
            <span className="font-bold truncate text-slate-900">
              {currentLocation.area}, {currentLocation.city}
            </span>
          </div>
          <button
            onClick={() => {
              onDetectGPS();
              onClose();
            }}
            disabled={isDetectingGPS}
            className="px-3 py-1 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[11px] transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isDetectingGPS ? 'Detecting...' : 'Use Hardware GPS'}</span>
          </button>
        </div>

        {/* Navigation Tabs: Map vs Postal Code vs Area List */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === 'map'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Select on Map</span>
            </button>

            <button
              onClick={() => setActiveTab('pincode')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === 'pincode'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Postal / PIN Code</span>
            </button>

            <button
              onClick={() => setActiveTab('areas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition border-b-2 cursor-pointer ${
                activeTab === 'areas'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Area List & Search</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: INTERACTIVE MAP PICKER */}
          {activeTab === 'map' && (
            <div>
              <div className="text-xs text-slate-500 mb-3">
                Pan, zoom, and click anywhere on the street map or drag the green marker to pinpoint your exact society or colony:
              </div>
              <InteractiveMapPicker
                initialLat={currentLocation.lat}
                initialLng={currentLocation.lng}
                initialArea={currentLocation.area}
                initialCity={currentLocation.city}
                onConfirmLocation={(area, city, lat, lng) => {
                  onSelectLocation(area, city, lat, lng);
                  onClose();
                }}
              />
            </div>
          )}

          {/* TAB 2: POSTAL PIN CODE ENTRY */}
          {activeTab === 'pincode' && (
            <div className="space-y-5">
              <form onSubmit={handlePincodeSearch} className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Enter 6-Digit Postal PIN Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={pincodeInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPincodeInput(val);
                        if (val.length === 6) {
                          // Auto trigger lookup on 6th digit
                          lookupPostalCode(val).then((res) => {
                            if (res) setPincodeResult(res);
                          });
                        }
                      }}
                      placeholder="e.g. 518001 (Kurnool), 515001 (Ananthapur), 518002"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingPin || pincodeInput.length !== 6}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isSearchingPin ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Lookup PIN</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Supports all Indian Postal codes with automatic coverage geocoding.
                </p>
              </form>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {pinError}
                </div>
              )}

              {/* Resolved Postal Code Card */}
              {pincodeResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
                          <span>{pincodeResult.area}</span>
                          <span className="bg-emerald-200 text-emerald-900 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                            PIN: {pincodeResult.pincode}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-800 font-medium">
                          {pincodeResult.city}, {pincodeResult.state}
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Landmarks: {pincodeResult.landmarks}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-800">
                      Coordinates: {pincodeResult.lat.toFixed(4)}°N, {pincodeResult.lng.toFixed(4)}°E
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLocation(
                          pincodeResult.area,
                          pincodeResult.city,
                          pincodeResult.lat,
                          pincodeResult.lng
                        );
                        onClose();
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Set as Active Location</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Common Regional PIN Codes Directory */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Popular Andhra Pradesh (Kurnool & Ananthapur) PIN Codes</span>
                  <span className="text-[11px] text-slate-400">Click to select instantly</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {KNOWN_POSTAL_CODES.slice(0, 10).map((p) => (
                    <button
                      key={p.pincode}
                      type="button"
                      onClick={() => {
                        onSelectLocation(p.area, p.city, p.lat, p.lng);
                        onClose();
                      }}
                      className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition flex items-center justify-between group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                          {p.area}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {p.city}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-200 px-2 py-1 rounded-md shrink-0 ml-2">
                        {p.pincode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AREA LIST & MANUAL ENTRY */}
          {activeTab === 'areas' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search area or neighborhood (e.g. N.R. Peta, C-Camp, Clock Tower, Court Road)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Quick Hubs List */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Cooperative Service Area Hubs</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {filteredPostalCodes.length} areas available
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredPostalCodes.map((loc) => {
                    const isSelected =
                      currentLocation.area.toLowerCase().includes(loc.area.toLowerCase()) ||
                      loc.area.toLowerCase().includes(currentLocation.area.toLowerCase());

                    return (
                      <button
                        key={`${loc.area}-${loc.pincode}`}
                        onClick={() => {
                          onSelectLocation(loc.area, loc.city, loc.lat, loc.lng);
                          onClose();
                        }}
                        className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-900'
                            : 'hover:bg-slate-50 border border-transparent text-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <MapPin
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isSelected ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {loc.area},{' '}
                              <span className="font-medium text-slate-500">{loc.city}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {loc.landmarks}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            PIN: {loc.pincode}
                          </span>
                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Area Entry */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Or Type Custom Colony / Society Name
                </div>
                <form onSubmit={handleApplyCustom} className="flex gap-2">
                  <input
                    type="text"
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    placeholder="Enter colony / road / society name..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="City"
                    className="w-24 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!customArea.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Worker dispatch coverage radius extends 15 km from your selected point</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
