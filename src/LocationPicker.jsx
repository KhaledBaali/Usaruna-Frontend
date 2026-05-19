import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Search, Navigation, MapPin, Check, Loader2, X } from 'lucide-react';

// ─── Fix Leaflet's default icon paths broken by Vite's asset hashing ──────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Map sub-components (must live inside MapContainer to access map context) ──

function ClickMarker({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 15, { duration: 1.0 });
  }, [position, map]);
  return null;
}

// ─── Nominatim helpers (OpenStreetMap free geocoding API) ─────────────────────

async function nominatimSearch(query, lang) {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=sa&accept-language=${lang}&addressdetails=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Usaruna/1.0' } });
  return res.json();
}

async function nominatimReverse(lat, lng, lang) {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Usaruna/1.0' } });
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function geocodeCity(city, lang) {
  const results = await nominatimSearch(`${city} Saudi Arabia`, lang);
  if (!results.length) return null;
  return {
    lat:     parseFloat(results[0].lat),
    lng:     parseFloat(results[0].lon),
    address: results[0].display_name,
  };
}

// ─── LOCATION PICKER ──────────────────────────────────────────────────────────
//
// Props:
//   mode           'pickup'   → readonly, geocodes sellerCity on mount
//                  'customer' → interactive, user picks their delivery location
//   sellerCity     string     used in pickup mode to show seller's city on map
//   sellerAddress  string     optional pre-set address for pickup mode
//   initialPos     { lat, lng, address } pre-set position
//   onConfirm      (loc) => void  called when user taps "confirm"
//   lang           'ar' | 'en'
//

export default function LocationPicker({
  mode          = 'customer',
  sellerCity    = '',
  sellerAddress = '',
  initialPos    = null,
  onConfirm,
  lang          = 'ar',
  mapHeight     = 220,
}) {
  const isRtl      = lang === 'ar';
  const isReadonly = mode === 'pickup';

  const [position,    setPosition]    = useState(initialPos ?? null);
  const [address,     setAddress]     = useState(initialPos?.address ?? sellerAddress ?? '');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);
  // Skip geocoding if an initialPos is already provided
  const [geocoding,   setGeocoding]   = useState(isReadonly && !!sellerCity && !initialPos);

  // ── Geocode seller city on mount (pickup mode, only when no initialPos) ──────
  useEffect(() => {
    if (!isReadonly || !sellerCity || initialPos) return;
    setGeocoding(true);
    geocodeCity(sellerCity, lang)
      .then((loc) => { if (loc) { setPosition(loc); setAddress(loc.address); } })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Map click → reverse geocode ─────────────────────────────────────────────
  const handleMapClick = useCallback(async ({ lat, lng }) => {
    if (isReadonly) return;
    setPosition({ lat, lng });
    setAddress('');
    setConfirmed(false);
    const addr = await nominatimReverse(lat, lng, lang).catch(() => '');
    setAddress(addr);
  }, [isReadonly, lang]);

  // ── Nominatim search ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const data = await nominatimSearch(query, lang);
      setResults(data.slice(0, 5));
    } catch { /* silently ignore */ } finally {
      setSearching(false);
    }
  };

  const pickResult = ({ lat, lon, display_name }) => {
    setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
    setAddress(display_name);
    setResults([]);
    setQuery('');
    setConfirmed(false);
  };

  // ── GPS geolocation ─────────────────────────────────────────────────────────
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setPosition({ lat, lng });
        setConfirmed(false);
        const addr = await nominatimReverse(lat, lng, lang).catch(() => '');
        setAddress(addr);
        setGeolocating(false);
      },
      () => setGeolocating(false),
      { timeout: 12000 }
    );
  };

  // ── Confirm ─────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!position) return;
    onConfirm?.({ ...position, address });
    setConfirmed(true);
  };

  const center = position ? [position.lat, position.lng] : [24.7136, 46.6753];
  const zoom   = position ? 14 : 5;

  // ── Loading skeleton (geocoding seller city) ────────────────────────────────
  if (geocoding) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-blue-600 bg-blue-50 rounded-2xl border border-blue-100">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm font-semibold">
          {isRtl ? 'جاري تحديد موقع الاستلام...' : 'Locating pickup point...'}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">

      {/* ── Search bar (customer mode only) ── */}
      {!isReadonly && (
        <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
          <div className="flex gap-2">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search
                size={14}
                className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={isRtl ? 'ابحث عن حيّك أو موقعك...' : 'Search your neighbourhood...'}
                dir={isRtl ? 'rtl' : 'ltr'}
                className={`w-full bg-white border border-gray-200 rounded-xl py-2.5 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
            </div>

            {/* Search button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
            >
              {searching ? <Loader2 size={13} className="animate-spin" /> : null}
              {isRtl ? 'بحث' : 'Search'}
            </button>

            {/* GPS button */}
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geolocating}
              title={isRtl ? 'استخدم موقعي الحالي' : 'Use my location'}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              {geolocating
                ? <Loader2 size={14} className="animate-spin" />
                : <Navigation size={14} />
              }
            </button>
          </div>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickResult(r)}
                  className={`w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-800 border-b border-gray-100 last:border-none transition-colors flex items-start gap-2 ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <MapPin size={12} className="text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{r.display_name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setResults([])}
                className="w-full py-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
              >
                <X size={10} />
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Map ── */}
      <div style={{ height: mapHeight }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!isReadonly && <ClickMarker onMapClick={handleMapClick} />}
          {position && <FlyTo position={position} />}
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      {/* ── Instruction tip (customer, no pin yet) ── */}
      {!isReadonly && !position && (
        <div className="p-3 bg-blue-50 border-t border-blue-100 text-center">
          <p className="text-xs text-blue-600 font-semibold">
            {isRtl
              ? '📍 انقر على الخريطة لتحديد موقعك، أو ابحث أعلاه، أو استخدم GPS'
              : '📍 Click on the map to pin your location, or search / use GPS above'
            }
          </p>
        </div>
      )}

      {/* ── Address + Confirm (customer with pin) ── */}
      {!isReadonly && position && (
        <div className="p-3 border-t border-gray-200 space-y-2.5 bg-gray-50">
          {address && (
            <div className={`flex items-start gap-2 ${isRtl ? '' : 'flex-row-reverse'}`}>
              <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed flex-1 min-w-0 line-clamp-3">
                {address}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2
              ${confirmed
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.98]'
              }`}
          >
            {confirmed
              ? <><Check size={13} /> {isRtl ? 'تم تأكيد الموقع ✓' : 'Location confirmed ✓'}</>
              : isRtl ? 'تأكيد هذا الموقع' : 'Confirm this location'
            }
          </button>
        </div>
      )}

      {/* ── Pickup address display (readonly) ── */}
      {isReadonly && address && (
        <div className="p-3 border-t border-gray-200 bg-emerald-50">
          <div className={`flex items-start gap-2 ${isRtl ? '' : 'flex-row-reverse'}`}>
            <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-emerald-700 mb-0.5">
                {isRtl ? 'عنوان نقطة الاستلام' : 'Pickup Address'}
              </p>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
