import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, Filter, Map as MapIcon, Grid, Sliders, ChevronDown,
    ChevronUp, MapPin, Star, Calendar, ArrowRight, X, Info, RefreshCw
} from 'lucide-react';
import EquipmentCard from '../components/EquipmentCard';
import { useLanguage } from '../context/LanguageContext';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ── Translated Categories ───────────────────────────────────
const GET_CATEGORIES = (t) => [
    { id: 'tractor', label: t('categories.tractor') },
    { id: 'harvester', label: t('categories.harvester') },
    { id: 'rotavator', label: t('categories.rotavator') },
    { id: 'seeddrill', label: t('categories.seeddrill') },
    { id: 'jcb', label: t('categories.jcb') },
    { id: 'pump_diesel', label: t('categories.pump_diesel') },
    { id: 'drone', label: t('categories.drone') },
];

export default function Marketplace() {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState(5000);
    const [selectedCats, setSelectedCats] = useState([]);
    const [distance, setDistance] = useState('25');
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    const CATEGORIES = GET_CATEGORIES(t);

    // ── Live Data State ───────────────────────────────────────
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [mapsReady, setMapsReady] = useState(!!window.google?.maps);

    const mapRef = useRef(null);
    const googleMap = useRef(null);
    const markers = useRef([]);

    // ── Load Google Maps Script once ──────────────────────────
    useEffect(() => {
        if (window.google?.maps) { setMapsReady(true); return; }
        if (document.getElementById('gmap-script')) return;
        window.__initGoogleMap = () => setMapsReady(true);
        const script = document.createElement('script');
        script.id = 'gmap-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&callback=__initGoogleMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        return () => { /* script persists intentionally */ };
    }, []);

    // ── Fetch Logic ──────────────────────────────────────────
    const fetchItems = async () => {
        setLoading(true);
        setError('');
        try {
            // Build query params
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCats.length > 0) params.append('category', selectedCats.join(','));
            params.append('maxPrice', priceRange);
            // params.append('distance', distance); // backend needs lat/lng for distance

            const res = await fetch(`http://localhost:5000/api/equipment/search?${params.toString()}`);
            const data = await res.json();

            if (res.ok) {
                setItems(data.data || []);
            } else {
                setError(data.message || 'Failed to load equipment.');
            }
        } catch {
            setError('Network error. Is the server running?');
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchItems(), 400); // Debounce search
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCats, priceRange]);

    const filteredItems = items; // Backend does the filtering now



    // ── Map Initialisation & Geocoded Markers ─────────────────
    useEffect(() => {
        if (viewMode !== 'map' || !mapsReady || !mapRef.current) return;

        // Initialise map centred on Nashik District, Maharashtra
        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 19.9975, lng: 73.7898 },
            zoom: 10,
            mapTypeControl: false,
            streetViewControl: false,
            styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
            ],
        });
        googleMap.current = map;

        // Clear old markers
        markers.current.forEach(m => m.setMap(null));
        markers.current = [];

        if (!filteredItems.length) return;

        const geocoder = new window.google.maps.Geocoder();

        filteredItems.forEach(item => {
            const address = [
                item.location?.village,
                item.location?.district,
                item.location?.state || 'Maharashtra',
                'India'
            ].filter(Boolean).join(', ');

            geocoder.geocode({ address }, (results, status) => {
                if (status !== 'OK' || !results[0]) return;
                const pos = results[0].geometry.location;

                const marker = new window.google.maps.Marker({
                    position: pos,
                    map,
                    title: item.name,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                    },
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding:10px;font-family:'Inter',sans-serif;min-width:180px">
                            <h3 style="margin:0 0 4px;font-weight:800;color:#111827;font-size:15px">${item.name}</h3>
                            <p style="margin:0 0 6px;font-size:12px;color:#6B7280">${item.location?.village || ''}, ${item.location?.district || ''}</p>
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                                <span style="font-weight:800;color:#2E7D32;font-size:14px">₹${item.priceHr}/hr</span>
                                <button onclick="window.location.href='/booking/${item._id}'" style="background:#2E7D32;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">Book Now</button>
                            </div>
                        </div>`,
                });

                marker.addListener('click', () => infoWindow.open(map, marker));
                markers.current.push(marker);
            });
        });
    }, [viewMode, mapsReady, filteredItems]);


    const toggleCat = (id) => {
        setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Sticky Search Header ─────────────────────────── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder={t('marketplace.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = '#2E7D32'}
                            onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                        />
                    </div>

                    <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '10px', padding: '4px' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? '#2E7D32' : '#6B7280', boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                        >
                            <Grid size={16} /> {t('marketplace.grid_view')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('map')}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: viewMode === 'map' ? '#fff' : 'transparent', color: viewMode === 'map' ? '#2E7D32' : '#6B7280', boxShadow: viewMode === 'map' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                        >
                            <MapIcon size={16} /> {t('marketplace.map_view')}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 84px)' }}>

                {/* ── Left Sidebar (Filters) ─────────────────────── */}
                <aside style={{ width: isFilterOpen ? '320px' : '0', overflow: 'hidden', transition: 'width 0.3s ease', background: '#fff', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', minWidth: '320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={20} color="#2E7D32" /> {t('marketplace.filters_title')}
                            </h2>
                            <button type="button" onClick={() => { setSelectedCats([]); setPriceRange(5000); }} style={{ background: 'none', border: 'none', color: '#2E7D32', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{t('marketplace.reset_all')}</button>
                        </div>

                        {/* Category Filter */}
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '16px' }}>{t('marketplace.filter_category')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {CATEGORIES.map(cat => (
                                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#4B5563', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCats.includes(cat.id)}
                                            onChange={() => toggleCat(cat.id)}
                                            style={{ width: '18px', height: '18px', accentColor: '#2E7D32', cursor: 'pointer' }}
                                        />
                                        {cat.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>{t('marketplace.filter_max_price')}</h3>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#2E7D32' }}>₹{priceRange}/hr</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="5000"
                                step="100"
                                value={priceRange}
                                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: '#2E7D32', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#9CA3AF' }}>
                                <span>₹100</span>
                                <span>₹5,000+</span>
                            </div>
                        </div>

                        {/* Distance Filter */}
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>{t('marketplace.filter_distance')}</h3>
                            <select
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', background: '#fff' }}
                            >
                                <option value="5">{t('marketplace.distance_within').replace('{km}', '5')}</option>
                                <option value="10">{t('marketplace.distance_within').replace('{km}', '10')}</option>
                                <option value="25">{t('marketplace.distance_within').replace('{km}', '25')}</option>
                                <option value="50">{t('marketplace.distance_within').replace('{km}', '50')}</option>
                            </select>
                        </div>
                    </div>
                </aside>

                {/* ── Main Content Area ─────────────────────────── */}
                <main style={{ flex: 1, padding: '24px', position: 'relative' }}>

                    {/* Results Counter */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <p style={{ fontSize: '14px', color: '#6B7280' }}>
                            {t('marketplace.showing_results')
                                .replace('{count}', filteredItems.length)
                                .replace('{location}', 'Nashik District')}
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
                            <RefreshCw size={40} color="#2E7D32" className="animate-spin" />
                            <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>{t('marketplace.fetching_data')}</p>
                        </div>
                    ) : error ? (
                        <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
                            <X size={40} color="#B91C1C" style={{ margin: '0 auto 12px' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#B91C1C' }}>{t('marketplace.error_loading')}</h3>
                            <p style={{ fontSize: '14px', color: '#991B1B' }}>{error}</p>
                            <button onClick={fetchItems} style={{ marginTop: '16px', background: '#B91C1C', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>{t('marketplace.try_again')}</button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        filteredItems.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {filteredItems.map(item => (
                                    <EquipmentCard
                                        key={item._id}
                                        id={item._id}
                                        name={item.name}
                                        category={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                        priceHr={item.priceHr}
                                        location={`${item.location?.village}, ${item.location?.district}`}
                                        rating={item.rating || 4.5}
                                        reviews={item.reviewCount || 0}
                                        verified={item.verified !== false}
                                        image={item.images?.[0]}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌾</div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{t('marketplace.no_results')}</h3>
                                <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '320px', margin: '0 auto' }}>
                                    {t('marketplace.adjust_filters')}
                                </p>
                            </div>
                        )
                    ) : (
                        <div style={{ width: '100%', height: 'calc(100vh - 160px)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative' }}>
                            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                            {!mapsReady && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                    <RefreshCw size={32} color="#2E7D32" className="animate-spin" />
                                    <p style={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>Loading Google Maps…</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Float Toggle Button for Mobile Filter */}
            <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ position: 'fixed', bottom: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '999px', background: '#111827', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 50 }}
            >
                <Sliders size={18} /> {isFilterOpen ? t('marketplace.hide_filters') : t('marketplace.show_filters')}
            </button>
        </div>
    );
}
