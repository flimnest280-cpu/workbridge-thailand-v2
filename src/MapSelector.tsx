import React, { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, Compass, Globe } from 'lucide-react';
import { TranslationSet } from '../translations';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

// Read API key from Vite define or standard environment variables
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapSelectorProps {
  t: TranslationSet;
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, addressSuggestion?: string) => void;
}

export interface ThailandHub {
  nameEn: string;
  nameTh: string;
  nameMy: string;
  nameLo: string;
  nameKm: string;
  lat: number;
  lng: number;
  descriptionEn: string;
  descriptionTh: string;
  descriptionMy: string;
  descriptionLo: string;
  descriptionKm: string;
}

export const THAI_HUBS: ThailandHub[] = [
  {
    nameEn: 'Bangkok',
    nameTh: 'กรุงเทพมหานคร',
    nameMy: 'ဘန်ကောက်',
    nameLo: 'ບາງກອກ',
    nameKm: 'បាងកក',
    lat: 13.7563,
    lng: 100.5018,
    descriptionEn: 'Capital city, main manufacturing, hospitality, construction hub.',
    descriptionTh: 'เมืองหลวง ศูนย์กลางการผลิต งานบริการ และก่อสร้าง',
    descriptionMy: 'မြို့တော်၊ ကုန်ထုတ်လုပ်မှု၊ ဝန်ဆောင်မှုနှင့် ဆောက်လုပ်ရေးဗဟိုဌาန။',
    descriptionLo: 'ເມືອງຫຼວງ, ສູນກາງการຜະລິດ, ວຽກບໍລິການ ແລະ ກໍ່ສ້າງ',
    descriptionKm: 'ទីក្រុងបាងកក មជ្ឈមណ្ឌលផលិតកម្ម សេវាកម្ម និងសំណង់'
  },
  {
    nameEn: 'Samut Prakan',
    nameTh: 'สมุทรปราการ',
    nameMy: 'စမွတ်ပရာကန်',
    nameLo: 'ສະໝຸດປາການ',
    nameKm: 'សមុទ្រប្រាការ',
    lat: 13.5991,
    lng: 100.5968,
    descriptionEn: 'Major seafood processing and industrial factory district.',
    descriptionTh: 'นิคมอุตสาหกรรม และศูนย์แปรรูปอาหารทะเลขนาดใหญ่',
    descriptionMy: 'ပင်လယ်စာထုတ်လုပ်မှုနှင့် စက်မှုဇုန်နယ်မြေကြီး။',
    descriptionLo: 'ເຂດອຸດສາຫະກຳ ແລະ ສູນແປຮູບອາຫານທະເລຂະໜາດໃຫຍ່',
    descriptionKm: 'តំបន់ឧស្សាហកម្ម និងមជ្ឈមណ្ឌលកែច្នៃអាហារសមុទ្រដ៏ធំ'
  },
  {
    nameEn: 'Mae Sot, Tak',
    nameTh: 'แม่สอด (ตาก)',
    nameMy: 'မဲဆောက် (တက်)',
    nameLo: 'ແລ້ວແຕ່',
    nameKm: 'ម៉ែសត',
    lat: 16.7161,
    lng: 98.5683,
    descriptionEn: 'Border zone, garment factories, agriculture, border logistics.',
    descriptionTh: 'เขตพัฒนาเศรษฐกิจพิเศษชายแดน โรงงานสิ่งทอ เกษตรกรรม',
    descriptionMy: 'နယ်စပ်စီးပွားရေးဇုန်၊ အထည်ချုပ်စက်ရုံများ၊ စိုက်ပျိုးရေး။',
    descriptionLo: 'ເຂດເສດຖະກິດພິເສດຊາຍແດน, ໂຮงງານຕັດຫຍິບ, ກະສິກຳ',
    descriptionKm: 'តំបន់សេដ្ឋកិច្ចពិសេសព្រំដែន រោងចក្រកាត់ដេរ កសិកម្ម'
  },
  {
    nameEn: 'Chonburi',
    nameTh: 'ชลบุรี',
    nameMy: 'ချွန်ဘူရီ',
    nameLo: 'ຊົນບຸຣີ',
    nameKm: 'ឈុនបុរី',
    lat: 13.3611,
    lng: 100.9847,
    descriptionEn: 'Eastern Seaboard heavy factories, construction, and tourism.',
    descriptionTh: 'โรงงานอุตสาหกรรมหนักภาคตะวันออก ก่อสร้าง และท่องเที่ยว',
    descriptionMy: 'အရှေ့ဘက်ကမ်းရိုးတန်းစက်မှုဇုန်၊ ဆောက်လုပ်ရေးနှင့် ခရီးသွားလုပ်ငန်း။',
    descriptionLo: 'ໂຮງງານອຸດສາຫະກຳໜັກ, ການກໍ່ສ້າງ ແລະ ການທ່ອງທ່ຽວ',
    descriptionKm: 'រោងចក្រឧស្សហកម្មធុនធ្ងន់ ការដ្ឋានសំណង់ និងទេសចរណ៍'
  },
  {
    nameEn: 'Ranong',
    nameTh: 'ระนอง',
    nameMy: 'ရနောင်း',
    nameLo: 'ຣະນອງ',
    nameKm: 'រ៉ាក់ណង',
    lat: 9.9657,
    lng: 98.6348,
    descriptionEn: 'Southern border port, deep sea fisheries, rubber agriculture.',
    descriptionTh: 'ท่าเรือประมงชายแดนภาคใต้ อุตสาหกรรมแปรรูปสัตว์น้ำ ยางพารา',
    descriptionMy: 'တောင်ပိုင်းဆိပ်ကမ်းမြို့၊ ရေလုပ်ငန်းနှင့် ရာဘာစိုက်ပျိုးရေး။',
    descriptionLo: 'ທ່າເຮືອປະມົງຊายແດນພາກໃຕ້, ອຸດສາຫະກຳຢາງພາລາ',
    descriptionKm: 'កំពង់ផែនេសាទព្រំដែនភាគខាងត្បូង កសិកម្មកៅស៊ូ'
  },
  {
    nameEn: 'Chiang Mai',
    nameTh: 'เชียงใหม่',
    nameMy: 'ချင်းမိုင်',
    nameLo: 'ຊຽງໃໝ່',
    nameKm: 'ឈៀងម៉ៃ',
    lat: 18.7883,
    lng: 98.9853,
    descriptionEn: 'Northern hospitality, agricultural development, construction.',
    descriptionTh: 'ศูนย์กลางภาคเหนือ งานบริการ เกษตรกรรม และก่อสร้าง',
    descriptionMy: 'မြောက်ပိုင်းဗဟိုဌาန၊ ဝန်ဆောင်မှုလုပ်ငန်းနှင့် စိုက်ပျိုးရေး။',
    descriptionLo: 'ສູນກາງພາກເໜືອ, ວຽກບໍລິການ ແລະ ກະສິກຳ',
    descriptionKm: 'មជ្ឈមណ្ឌលភាគខាងជើង សេវាកម្ម និងកសិកម្ម'
  }
];

export default function MapSelector({ t, initialLat, initialLng, onLocationSelect }: MapSelectorProps) {
  const [lat, setLat] = useState<number>(initialLat || 13.7563);
  const [lng, setLng] = useState<number>(initialLng || 100.5018);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeHubIndex, setActiveHubIndex] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 120, y: 150 });
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
      // Try to find a close hub
      const closestIndex = THAI_HUBS.findIndex(
        h => Math.abs(h.lat - initialLat) < 0.1 && Math.abs(h.lng - initialLng) < 0.1
      );
      if (closestIndex !== -1) {
        setActiveHubIndex(closestIndex);
        calculateOffset(THAI_HUBS[closestIndex].lat, THAI_HUBS[closestIndex].lng);
      } else {
        setActiveHubIndex(-1);
      }
    }
  }, [initialLat, initialLng]);

  // Convert map coordinates to mock canvas coordinates roughly (Thailand bounds)
  const calculateOffset = (targetLat: number, targetLng: number) => {
    const latPercent = (20.5 - targetLat) / 15.0; // 0 (North) to 1 (South)
    const lngPercent = (targetLng - 97) / 9.0; // 0 (West) to 1 (East)
    
    const x = Math.min(Math.max(lngPercent * 340, 15), 325);
    const y = Math.min(Math.max(latPercent * 250, 15), 235);
    setDragOffset({ x, y });
  };

  useEffect(() => {
    calculateOffset(lat, lng);
  }, []);

  const handleHubSelect = (index: number) => {
    const hub = THAI_HUBS[index];
    setActiveHubIndex(index);
    setLat(hub.lat);
    setLng(hub.lng);
    calculateOffset(hub.lat, hub.lng);
    onLocationSelect(hub.lat, hub.lng, `${hub.nameEn}, Thailand`);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragOffset({ x, y });

    // Back-calculate lat/lng from click offsets
    const lngPercent = x / 340;
    const latPercent = y / 250;

    const calculatedLat = parseFloat((20.5 - latPercent * 15.0).toFixed(4));
    const calculatedLng = parseFloat((97.0 + lngPercent * 9.0).toFixed(4));

    setLat(calculatedLat);
    setLng(calculatedLng);
    setActiveHubIndex(-1);
    onLocationSelect(calculatedLat, calculatedLng);
  };

  const handleRealMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const { lat: newLat, lng: newLng } = e.detail.latLng;
      setLat(newLat);
      setLng(newLng);
      setActiveHubIndex(-1);
      onLocationSelect(newLat, newLng);
    } else if (e.latLng) {
      const newLat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
      const newLng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
      setLat(newLat);
      setLng(newLng);
      setActiveHubIndex(-1);
      onLocationSelect(newLat, newLng);
    }
  };

  const performMockSearch = () => {
    const queryLower = searchQuery.toLowerCase();
    const matchedHub = THAI_HUBS.find(
      h => h.nameEn.toLowerCase().includes(queryLower) || h.nameTh.includes(queryLower)
    );

    if (matchedHub) {
      setLat(matchedHub.lat);
      setLng(matchedHub.lng);
      calculateOffset(matchedHub.lat, matchedHub.lng);
      onLocationSelect(matchedHub.lat, matchedHub.lng, `${matchedHub.nameEn}, Thailand`);
    } else {
      const randomLat = parseFloat((12.5 + Math.random() * 4).toFixed(4));
      const randomLng = parseFloat((99.5 + Math.random() * 2).toFixed(4));
      setLat(randomLat);
      setLng(randomLng);
      calculateOffset(randomLat, randomLng);
      onLocationSelect(randomLat, randomLng, `${searchQuery}, Thailand`);
    }
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    if (hasValidKey) {
      const googleObj = (window as any).google;
      if (googleObj?.maps?.Geocoder) {
        try {
          const geocoder = new googleObj.maps.Geocoder();
          geocoder.geocode({ address: searchQuery }, (results: any, status: string) => {
            setIsSearching(false);
            if (status === 'OK' && results?.[0]?.geometry?.location) {
              const loc = results[0].geometry.location;
              const newLat = loc.lat();
              const newLng = loc.lng();
              setLat(newLat);
              setLng(newLng);
              setActiveHubIndex(-1);
              onLocationSelect(newLat, newLng, results[0].formatted_address);
            } else {
              performMockSearch();
            }
          });
          return;
        } catch (err) {
          console.error("Geocoder error:", err);
        }
      }
    }

    performMockSearch();
  };

  const getLocalizedName = (hub: ThailandHub) => {
    const activeLang = document.documentElement.lang;
    if (activeLang === 'th') return hub.nameTh;
    if (activeLang === 'my') return hub.nameMy;
    if (activeLang === 'lo') return hub.nameLo;
    if (activeLang === 'km') return hub.nameKm;
    return hub.nameEn;
  };

  const getLocalizedDescription = (hub: ThailandHub) => {
    const activeLang = document.documentElement.lang;
    if (activeLang === 'th') return hub.descriptionTh;
    if (activeLang === 'my') return hub.descriptionMy;
    if (activeLang === 'lo') return hub.descriptionLo;
    if (activeLang === 'km') return hub.descriptionKm;
    return hub.descriptionEn;
  };

  return (
    <div id="google-maps-selector-container" className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
      {/* Search Header */}
      <div className="p-3 bg-white border-b border-slate-100 flex flex-col gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            id="map-search-input"
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {/* Quick Hub Chips */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {THAI_HUBS.map((hub, idx) => (
            <button
              id={`hub-chip-${idx}`}
              key={idx}
              type="button"
              onClick={() => handleHubSelect(idx)}
              className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeHubIndex === idx
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📍 {getLocalizedName(hub)}
            </button>
          ))}
        </div>
      </div>

      {/* Map display block */}
      {hasValidKey ? (
        <APIProvider apiKey={API_KEY} version="weekly">
          <div className="h-[250px] w-full relative overflow-hidden bg-slate-100">
            <Map
              center={{ lat, lng }}
              zoom={activeHubIndex !== -1 ? 9 : 12}
              onClick={handleRealMapClick}
              mapId="DEMO_MAP_ID"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <AdvancedMarker 
                position={{ lat, lng }}
                draggable={true}
                onDragEnd={(e) => {
                  if (e.latLng) {
                    const newLat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
                    const newLng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
                    setLat(newLat);
                    setLng(newLng);
                    setActiveHubIndex(-1);
                    onLocationSelect(newLat, newLng);
                  }
                }}
              >
                <Pin background="#ea4335" glyphColor="#fff" />
              </AdvancedMarker>
            </Map>
            
            {/* Coordinates overlay for real map */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-slate-100 flex items-center justify-between shadow-xs pointer-events-auto z-10">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-800">
                    {activeHubIndex !== -1 ? THAI_HUBS[activeHubIndex].nameEn : 'Selected Coordinates'}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                  </div>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded">
                Live Google Map
              </span>
            </div>
          </div>
        </APIProvider>
      ) : (
        /* Fallback Mock Map Canvas Visualizer */
        <div 
          id="mock-map-canvas"
          className="relative h-[250px] overflow-hidden cursor-crosshair bg-sky-100 select-none"
          onClick={handleMapClick}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }} />

          {/* Thailand Mainland Mock Shape representation */}
          <div className="absolute left-[80px] top-[20px] w-[180px] h-[210px] bg-emerald-50 rounded-[40%_50%_30%_60%] border-2 border-emerald-200/50 flex items-center justify-center pointer-events-none">
            <div className="text-[10px] font-bold text-emerald-800/20 rotate-45 flex flex-col items-center">
              <Compass className="w-8 h-8 opacity-20 mb-1" />
              THAILAND
            </div>
          </div>

          <div className="absolute left-[30px] top-[170px] text-[8px] font-semibold text-sky-800/40 tracking-wider rotate-12 pointer-events-none">
            ANDAMAN SEA
          </div>
          <div className="absolute right-[40px] top-[190px] text-[8px] font-semibold text-sky-800/40 tracking-wider pointer-events-none">
            GULF OF THAILAND
          </div>

          {/* Cities representation */}
          {THAI_HUBS.map((hub, idx) => {
            const latP = (20.5 - hub.lat) / 15.0;
            const lngP = (hub.lng - 97) / 9.0;
            const x = lngP * 340;
            const y = latP * 250;

            return (
              <div 
                key={idx}
                className="absolute w-1.5 h-1.5 bg-slate-400 rounded-full border border-white flex items-center justify-center pointer-events-none"
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                <span className="absolute left-3 text-[8px] text-slate-500 font-medium whitespace-nowrap bg-white/75 px-1 rounded-sm border border-slate-100">
                  {hub.nameEn}
                </span>
              </div>
            );
          })}

          {/* Dynamic Drag Pin Marker */}
          <div 
            id="mock-map-draggable-pin"
            className="absolute -ml-3.5 -mt-7 flex flex-col items-center transition-all duration-300 pointer-events-none z-10"
            style={{ left: `${dragOffset.x}px`, top: `${dragOffset.y}px` }}
          >
            <div className="bg-red-600 text-white rounded-full p-1.5 shadow-md border-2 border-white animate-bounce">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="w-1.5 h-1.5 bg-black/40 rounded-full blur-xs mt-0.5" />
          </div>

          {/* Active Selected Location Floating Card */}
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-slate-100 flex items-center justify-between shadow-xs pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-800">
                  {activeHubIndex !== -1 ? THAI_HUBS[activeHubIndex].nameEn : 'Selected Coordinates'}
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  Lat: {lat}, Lng: {lng}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 text-amber-700 text-[9px] font-semibold px-2 py-0.5 rounded">
              Simulator Pin
            </div>
          </div>
        </div>
      )}

      {/* Help / Instructions banner if API key is not configured yet */}
      {!hasValidKey && (
        <div className="p-3 bg-amber-50/75 border-t border-amber-100 text-[10px] text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <span>💡</span> Get Real-Time Google Maps Integration!
          </p>
          <p className="leading-relaxed">
            To see live Google Maps with real pin drops and real address search: Add your <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> in <strong>Settings</strong> (⚙️ gear icon, top-right corner) → <strong>Secrets</strong>.
          </p>
        </div>
      )}

      {/* Informational Sub-panel */}
      {activeHubIndex !== -1 && (
        <div className="p-3 bg-blue-50/60 border-t border-blue-50 text-[10px] text-slate-600 flex gap-1.5 items-start">
          <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-900">
              {getLocalizedName(THAI_HUBS[activeHubIndex])}:{' '}
            </span>
            {getLocalizedDescription(THAI_HUBS[activeHubIndex])}
          </div>
        </div>
      )}
    </div>
  );
}
