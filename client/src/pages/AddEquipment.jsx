import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, ChevronLeft, Check, MapPin, Camera, Upload,
    X, Leaf, IndianRupee, Info, AlertCircle, RefreshCw,
    Navigation, Package
} from 'lucide-react';

// ── Google Maps API Key (from client/.env) ─────────────────
const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (!GMAP_KEY) console.warn("VITE_GOOGLE_MAPS_API_KEY is missing! Restart your dev server after adding it to .env");

// ── Trilingual Category List ─────────────────────────────────
// Format: English | हिंदी | मराठी
const CATEGORIES = [
    // ── Heavy Machinery ──
    {
        group: 'Heavy Machinery / भारी मशीनरी / जड यंत्रसामग्री', items: [
            { v: 'tractor', en: 'Tractor', hi: 'ट्रैक्टर', mr: 'ट्रॅक्टर', icon: '🚜' },
            { v: 'harvester', en: 'Combine Harvester', hi: 'कम्बाइन हार्वेस्टर', mr: 'एकत्रित हार्वेस्टर', icon: '🌾' },
            { v: 'thresher', en: 'Thresher', hi: 'थ्रेशर', mr: 'मळणी यंत्र', icon: '⚙️' },
            { v: 'jcb', en: 'JCB / Excavator', hi: 'जेसीबी', mr: 'जेसीबी', icon: '🏗️' },
        ]
    },
    // ── Tractor Attachments ──
    {
        group: 'Tractor Attachments / ट्रैक्टर अटैचमेंट / ट्रॅक्टर जोडणी', items: [
            { v: 'rotavator', en: 'Rotavator / Tiller', hi: 'रोटावेटर', mr: 'रोटाव्हेटर', icon: '🔄' },
            { v: 'plough', en: 'Disc Plough', hi: 'डिस्क हल', mr: 'डिस्क नांगर', icon: '🔧' },
            { v: 'cultivator', en: 'Cultivator', hi: 'कल्टीवेटर', mr: 'कल्टीव्हेटर', icon: '↔️' },
            { v: 'seeddrill', en: 'Seed Drill', hi: 'सीड ड्रिल', mr: 'बी ड्रिल', icon: '🌱' },
            { v: 'ridger', en: 'Ridger / Bund Former', hi: 'रिजर', mr: 'रिजर', icon: '〰️' },
            { v: 'harrow', en: 'Disc Harrow', hi: 'डिस्क हैरो', mr: 'डिस्क हॅरो', icon: '⚙️' },
            { v: 'trailer', en: 'Tractor Trailer', hi: 'ट्रैक्टर ट्रेलर', mr: 'ट्रॅक्टर ट्रेलर', icon: '🚛' },
            { v: 'loader', en: 'Front Loader / Dozer', hi: 'फ्रंट लोडर', mr: 'फ्रंट लोडर', icon: '🏔️' },
        ]
    },
    // ── Irrigation ──
    {
        group: 'Irrigation / सिंचाई / सिंचन', items: [
            { v: 'pump_diesel', en: 'Diesel Water Pump', hi: 'डीजल पंप', mr: 'डिझेल पंप', icon: '🚿' },
            { v: 'pump_electric', en: 'Electric Water Pump', hi: 'इलेक्ट्रिक पंप', mr: 'इलेक्ट्रिक पंप', icon: '⚡' },
            { v: 'drip_kit', en: 'Drip Irrigation Kit', hi: 'ड्रिप किट', mr: 'ड्रिप किट', icon: '💧' },
            { v: 'sprinkler', en: 'Sprinkler Set', hi: 'स्प्रिंकलर', mr: 'स्प्रिंकलर', icon: '🌧️' },
        ]
    },
    // ── Spraying ──
    {
        group: 'Spraying / छिड़काव / फवारणी', items: [
            { v: 'sprayer_tractor', en: 'Tractor Sprayer', hi: 'ट्रैक्टर स्प्रेयर', mr: 'ट्रॅक्टर फवारयंत्र', icon: '💦' },
            { v: 'sprayer_back', en: 'Knapsack Sprayer', hi: 'बैकपैक स्प्रेयर', mr: 'पाठीवरील फवारयंत्र', icon: '🎒' },
            { v: 'sprayer_power', en: 'Power Sprayer (Petrol)', hi: 'पावर स्प्रेयर', mr: 'पॉवर फवारयंत्र', icon: '⛽' },
            { v: 'drone', en: 'Drone Sprayer', hi: 'ड्रोन स्प्रेयर', mr: 'ड्रोन फवारयंत्र', icon: '🚁' },
        ]
    },
    // ── Small & Hand Tools ──
    {
        group: 'Small & Hand Tools / छोटे उपकरण / लहान साधने', items: [
            { v: 'weeder', en: 'Paddy Weeder', hi: 'निराई यंत्र', mr: 'खुरपणी यंत्र', icon: '🌿' },
            { v: 'chaff_cutter', en: 'Chaff Cutter', hi: 'चारा कटर', mr: 'कुट्टी यंत्र', icon: '✂️' },
            { v: 'groundnut', en: 'Groundnut Digger', hi: 'मूंगफली खोदक', mr: 'शेंगदाणा खोदक', icon: '🥜' },
            { v: 'maize_shell', en: 'Maize Sheller', hi: 'मक्का शेलर', mr: 'मक्का शेलर', icon: '🌽' },
            { v: 'winnower', en: 'Winnower / Aspirator', hi: 'ओसावन यंत्र', mr: 'उफनणी यंत्र', icon: '💨' },
            { v: 'rice_mill', en: 'Mini Rice Mill', hi: 'मिनी राइस मिल', mr: 'मिनी राइस मिल', icon: '🍚' },
            { v: 'oil_press', en: 'Oil Expeller', hi: 'तेल प्रेस', mr: 'तेल प्रेस', icon: '🫒' },
            { v: 'generator', en: 'Generator / Genset', hi: 'जनरेटर', mr: 'जनरेटर', icon: '🔋' },
            { v: 'brush_cutter', en: 'Brush Cutter', hi: 'ब्रश कटर', mr: 'ब्रश कटर', icon: '🌳' },
            { v: 'reaper', en: 'Reaper / Mini Harvester', hi: 'मिनी हार्वेस्टर', mr: 'मिनी हार्वेस्टर', icon: '🔪' },
            { v: 'transplanter', en: 'Paddy Transplanter', hi: 'धान रोपाई यंत्र', mr: 'भात रुजणी यंत्र', icon: '🌾' },
            { v: 'seedsort', en: 'Seed Sorter / Grader', hi: 'बीज ग्रेडर', mr: 'बी ग्रेडर', icon: '📦' },
            { v: 'fert_spread', en: 'Fertilizer Spreader', hi: 'खाद प्रसारक', mr: 'खत पसरवणी', icon: '🌱' },
            { v: 'other', en: 'Other Equipment', hi: 'अन्य उपकरण', mr: 'इतर उपकरण', icon: '🔩' },
        ]
    },
];

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const ALL_ITEMS = CATEGORIES.flatMap(g => g.items);
const STEPS = ['Basic Info', 'Pricing', 'Address', 'Geo Photos'];

const EMPTY = {
    category: '', brand: '', model: '', year: '', quantity: 1,
    rentHour: '', rentDay: '', rentSeason: '', horsepower: '', description: '',
    houseNo: '', village: '', postOffice: '', gpWard: '', block: '',
    policeStation: '', landmark: '', district: '', state: 'Maharashtra', pinCode: '',
    images: [],
};

// ── Shared UI helpers ────────────────────────────────────────
const iStyle = (err = false) => ({
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: `1.5px solid ${err ? '#EF4444' : '#E5E7EB'}`,
    fontSize: '14px', outline: 'none', background: '#FAFAFA',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .18s',
});
const fg = e => { e.target.style.borderColor = '#2E7D32'; e.target.style.background = '#fff'; };
const bg = (e, err) => { e.target.style.borderColor = err ? '#EF4444' : '#E5E7EB'; e.target.style.background = '#FAFAFA'; };

function Fld({ label, required, hint, error, children }) {
    return (
        <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                {label}{required && <span style={{ color: '#DC2626' }}> *</span>}
                {hint && <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '11px', marginLeft: '5px' }}>({hint})</span>}
            </label>
            {children}
            {error && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <AlertCircle size={12} color="#DC2626" /><span style={{ fontSize: '12px', color: '#DC2626' }}>{error}</span>
            </div>}
        </div>
    );
}

// ── Google Maps loader hook ─────────────────────────────────
function useGoogleMaps() {
    const [loaded, setLoaded] = useState(!!window.google?.maps);
    useEffect(() => {
        if (window.google?.maps) { setLoaded(true); return; }
        let s = document.getElementById('gmap-script');
        if (s) {
            // Script exists but maybe not loaded yet
            s.addEventListener('load', () => setLoaded(true));
            return;
        }
        s = document.createElement('script');
        s.id = 'gmap-script';
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}`;
        s.async = true;
        s.onload = () => setLoaded(true);
        document.head.appendChild(s);
    }, []);
    return loaded;
}

// ── Google Map Picker (satellite hybrid, draggable pin) ───────
function GoogleMapPicker({ lat, lng, label, onPin }) {
    const divRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const mapsReady = useGoogleMaps();

    useEffect(() => {
        if (!mapsReady || !divRef.current) return;
        const center = { lat, lng };
        const map = new window.google.maps.Map(divRef.current, {
            center, zoom: 14,
            mapTypeId: 'hybrid',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });
        mapRef.current = map;
        const marker = new window.google.maps.Marker({
            position: center, map, draggable: true,
            animation: window.google.maps.Animation.DROP,
        });
        markerRef.current = marker;

        function geocodeAndPin(latLng) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: latLng }, (results, status) => {
                const addr = status === 'OK' && results[0]
                    ? results[0].formatted_address : `${latLng.lat()}, ${latLng.lng()}`;
                onPin(latLng.lat(), latLng.lng(), addr);
            });
        }
        map.addListener('click', e => { marker.setPosition(e.latLng); geocodeAndPin(e.latLng); });
        marker.addListener('dragend', e => geocodeAndPin(e.latLng));
    }, [mapsReady]);

    // Keep map centred when parent lat/lng changes
    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        const pos = new window.google.maps.LatLng(lat, lng);
        mapRef.current.panTo(pos);
        markerRef.current.setPosition(pos);
    }, [lat, lng]);

    return (
        <div>
            {!mapsReady && (
                <div style={{ height: '280px', borderRadius: '14px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '13px' }}>
                    🗺️ Loading Google Maps...
                </div>
            )}
            <div ref={divRef} style={{ width: '100%', height: mapsReady ? '280px' : '0', borderRadius: '14px', overflow: 'hidden', border: '2px solid #A5D6A7' }} />
            {label && (
                <div style={{ marginTop: '8px', background: '#F0FDF4', borderRadius: '9px', padding: '8px 12px', fontSize: '12px', color: '#15803D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #BBF7D0' }}>
                    <MapPin size={13} /> {label}
                </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {[{ l: 'Latitude', v: lat }, { l: 'Longitude', v: lng }].map(c => (
                    <div key={c.l} style={{ flex: 1, background: '#F9FAFB', borderRadius: '9px', padding: '9px 12px', border: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>{c.l}</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#2E7D32', fontFamily: 'monospace' }}>{Number(c.v).toFixed(6)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ step }) {
    const pct = Math.round((step / STEPS.length) * 100);
    return (
        <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                {STEPS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === STEPS.length - 1 ? 'flex-end' : 'center', flex: 1 }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: i < step ? '#2E7D32' : i === step ? '#8BC34A' : '#E5E7EB',
                            color: i <= step ? '#fff' : '#9CA3AF',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 700, marginBottom: '4px',
                            border: i === step ? '3px solid #2E7D32' : 'none', transition: 'all .25s',
                        }}>{i < step ? <Check size={14} /> : i + 1}</div>
                        <span style={{ fontSize: '10px', fontWeight: i === step ? 700 : 500, color: i === step ? '#2E7D32' : '#9CA3AF', textAlign: 'center', whiteSpace: 'nowrap' }}>{s}</span>
                    </div>
                ))}
            </div>
            <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#2E7D32,#8BC34A)', borderRadius: '999px', transition: 'width .35s ease' }} />
            </div>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '5px', textAlign: 'right', fontWeight: 600 }}>{pct}% complete</p>
        </div>
    );
}

// ── STEP 1: Basic Info ───────────────────────────────────────
function Step1({ form, setForm, errors }) {
    const up = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const years = Array.from({ length: 30 }, (_, i) => 2025 - i);
    const [search, setSearch] = useState('');
    const sel = ALL_ITEMS.find(i => i.v === form.category);

    const filtered = search
        ? ALL_ITEMS.filter(i => `${i.en} ${i.hi} ${i.mr}`.toLowerCase().includes(search.toLowerCase()))
        : null;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '22px' }}>🚜</span>
                </div>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', fontFamily: "'Poppins',sans-serif" }}>Basic Equipment Info</h3>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Category shown in English · हिंदी · मराठी</p>
                </div>
            </div>

            {/* Category search */}
            <Fld label="Equipment Category / श्रेणी / श्रेणी" required error={errors.category}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search: tractor / ट्रैक्टर / ट्रॅक्टर..."
                    style={{ ...iStyle(), marginBottom: '8px' }} onFocus={fg} onBlur={e => bg(e, false)} />
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1.5px solid #E5E7EB', borderRadius: '10px', background: '#fff' }}>
                    {(filtered || CATEGORIES).map((groupOrItem, gi) => {
                        if (filtered) {
                            const i = groupOrItem;
                            return (
                                <div key={i.v} onClick={() => { up('category', i.v); setSearch(''); }}
                                    style={{
                                        padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                        background: form.category === i.v ? '#F0FDF4' : '#fff', borderBottom: '1px solid #F3F4F6',
                                        borderLeft: form.category === i.v ? '3px solid #2E7D32' : '3px solid transparent'
                                    }}>
                                    <span style={{ fontSize: '18px' }}>{i.icon}</span>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{i.en}</p>
                                        <p style={{ fontSize: '11px', color: '#6B7280' }}>{i.hi} · {i.mr}</p>
                                    </div>
                                    {form.category === i.v && <Check size={14} color="#2E7D32" style={{ marginLeft: 'auto' }} />}
                                </div>
                            );
                        }
                        return (
                            <div key={groupOrItem.group}>
                                <div style={{ padding: '7px 14px', background: '#F9FAFB', fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB' }}>
                                    {groupOrItem.group}
                                </div>
                                {groupOrItem.items.map(i => (
                                    <div key={i.v} onClick={() => up('category', i.v)}
                                        style={{
                                            padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                            background: form.category === i.v ? '#F0FDF4' : '#fff', borderBottom: '1px solid #F9FAFB',
                                            borderLeft: form.category === i.v ? '3px solid #2E7D32' : '3px solid transparent', transition: 'background .12s'
                                        }}>
                                        <span style={{ fontSize: '18px' }}>{i.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{i.en}</p>
                                            <p style={{ fontSize: '11px', color: '#6B7280' }}>{i.hi} · {i.mr}</p>
                                        </div>
                                        {form.category === i.v && <Check size={14} color="#2E7D32" />}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
                {sel && <div style={{ marginTop: '8px', background: '#F0FDF4', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #BBF7D0' }}>
                    <span style={{ fontSize: '16px' }}>{sel.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>Selected: {sel.en} · {sel.hi} · {sel.mr}</span>
                </div>}
                {/* custom name field — only for "Other Equipment" */}
                {form.category === 'other' && (
                    <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                            Tool / Equipment Name <span style={{ color: '#DC2626' }}>*</span>
                            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '11px', marginLeft: '5px' }}>(write exact name in English / हिंदी / मराठी)</span>
                        </label>
                        <input
                            value={form.otherName || ''}
                            onChange={e => up('otherName', e.target.value)}
                            placeholder="e.g. Sugarcane Harvester / गन्ना हार्वेस्टर / ऊस तोडणी यंत्र"
                            style={{
                                width: '100%', padding: '11px 14px', borderRadius: '10px', boxSizing: 'border-box',
                                border: '2px solid #F59E0B', fontSize: '14px', outline: 'none',
                                background: '#FFFBEB', fontFamily: 'inherit',
                            }}
                            onFocus={e => { e.target.style.borderColor = '#D97706'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.background = '#FFFBEB'; }}
                        />
                        {errors.otherName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <AlertCircle size={12} color="#DC2626" />
                                <span style={{ fontSize: '12px', color: '#DC2626' }}>{errors.otherName}</span>
                            </div>
                        )}
                    </div>
                )}
            </Fld>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Fld label="Brand / Manufacturer" required error={errors.brand}>
                    <input value={form.brand} onChange={e => up('brand', e.target.value)}
                        placeholder="e.g. Mahindra / महिंद्रा"
                        style={iStyle(!!errors.brand)} onFocus={fg} onBlur={e => bg(e, !!errors.brand)} />
                </Fld>
                <Fld label="Model Name" required error={errors.model}>
                    <input value={form.model} onChange={e => up('model', e.target.value)}
                        placeholder="e.g. Arjun 605 DI"
                        style={iStyle(!!errors.model)} onFocus={fg} onBlur={e => bg(e, !!errors.model)} />
                </Fld>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Fld label="Year of Manufacture" required error={errors.year}>
                    <select value={form.year} onChange={e => up('year', e.target.value)}
                        style={iStyle(!!errors.year)} onFocus={fg} onBlur={e => bg(e, !!errors.year)}>
                        <option value="">-- Select year --</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </Fld>
                <Fld label="Quantity Available / संख्या" required error={errors.quantity}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', background: '#FAFAFA' }}>
                        <button type="button" onClick={() => up('quantity', Math.max(1, form.quantity - 1))}
                            style={{ width: '44px', height: '44px', border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#374151', fontWeight: 700 }}>−</button>
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 800, color: '#111827' }}>{form.quantity}</div>
                        <button type="button" onClick={() => up('quantity', form.quantity + 1)}
                            style={{ width: '44px', height: '44px', border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#2E7D32', fontWeight: 700 }}>+</button>
                    </div>
                </Fld>
            </div>
        </div>
    );
}

// ── STEP 2: Pricing ──────────────────────────────────────────
function Step2({ form, setForm, errors }) {
    const up = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IndianRupee size={20} color="#D97706" />
                </div>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', fontFamily: "'Poppins',sans-serif" }}>Pricing & Specifications</h3>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Set competitive rates — price cannot be ₹0</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                {[
                    { k: 'rentHour', label: 'Rent / Hour', ph: 'e.g. 120', err: errors.rentHour },
                    { k: 'rentDay', label: 'Rent / Day', ph: 'e.g. 800', err: errors.rentDay },
                    { k: 'rentSeason', label: 'Rent / Season', ph: 'optional', err: null },
                ].map(r => (
                    <Fld key={r.k} label={r.label} required={r.k !== 'rentSeason'} hint="₹" error={r.err}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#6B7280', fontWeight: 700 }}>₹</span>
                            <input type="number" min="0" value={form[r.k]} onChange={e => up(r.k, e.target.value)}
                                placeholder={r.ph}
                                style={{ ...iStyle(!!r.err), paddingLeft: '28px' }}
                                onFocus={fg} onBlur={e => bg(e, !!r.err)} />
                        </div>
                    </Fld>
                ))}
            </div>

            <Fld label="Horsepower / Engine Specs" hint="HP / KW">
                <input value={form.horsepower} onChange={e => up('horsepower', e.target.value)}
                    placeholder="e.g. 50 HP, 4-cylinder diesel / 50 अश्वशक्ति"
                    style={iStyle()} onFocus={fg} onBlur={e => bg(e, false)} />
            </Fld>

            <Fld label="Description / विवरण / वर्णन" required hint="min 50 chars" error={errors.description}>
                <textarea value={form.description} onChange={e => up('description', e.target.value)}
                    rows={4} placeholder="Describe condition, features, suitable crops, availability..."
                    style={{ ...iStyle(!!errors.description), resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={fg} onBlur={e => bg(e, !!errors.description)} />
                <div style={{ textAlign: 'right', fontSize: '11px', color: form.description.length >= 50 ? '#16A34A' : '#9CA3AF', marginTop: '3px', fontWeight: 600 }}>
                    {form.description.length}/50 min characters
                </div>
            </Fld>

            <div style={{ background: '#FFF7ED', borderRadius: '12px', padding: '12px 16px', border: '1px solid #FED7AA', display: 'flex', gap: '10px' }}>
                <Info size={15} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.65 }}>
                    <strong>Tip:</strong> Avg tractor rent in MH: ₹100–₹200/hr. Chaff cutter: ₹30–₹50/hr. Sprayer: ₹20–₹40/hr.
                    Competitive pricing gets 3× more requests.
                </p>
            </div>
        </div>
    );
}

// ── STEP 3: Address ──────────────────────────────────────────
function Step3({ form, setForm, errors }) {
    const up = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const [detecting, setDetecting] = useState(false);

    const [mapLat, setMapLat] = useState(19.9975);
    const [mapLng, setMapLng] = useState(73.7898);
    const [mapLabel, setMapLabel] = useState('');

    async function autoDetect() {
        if (!window.google?.maps) { alert('Google Maps service is loading, please wait...'); return; }
        setDetecting(true);
        try {
            const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true }));
            const { latitude: lat, longitude: lng } = pos.coords;

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const comps = results[0].address_components;
                    const get = t => comps.find(c => c.types.includes(t))?.long_name || '';
                    setMapLat(lat); setMapLng(lng);
                    setMapLabel(results[0].formatted_address);
                    setForm(f => ({
                        ...f,
                        village: get('locality') || get('sublocality') || get('administrative_area_level_3'),
                        district: get('administrative_area_level_2'),
                        state: get('administrative_area_level_1') || 'Maharashtra',
                        pinCode: get('postal_code'),
                        postOffice: get('sublocality_level_1') || get('locality'),
                        _lat: lat, _lng: lng,
                    }));
                } else {
                    alert('Google could not find address for this point. Please fill manually.');
                }
                setDetecting(false);
            });
        } catch (e) {
            alert('Location permission denied or unavailable.');
            setDetecting(false);
        }
    }

    function handleMapPin(lat, lng, addr) {
        setMapLat(lat); setMapLng(lng); setMapLabel(addr);
        const parts = addr.split(',');
        up('village', parts[0]?.trim() || '');
        up('_lat', lat); up('_lng', lng);
    }

    const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} color="#2563EB" />
                </div>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', fontFamily: "'Poppins',sans-serif" }}>Equipment Location / पता</h3>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Full Indian postal address where equipment is kept</p>
                </div>
            </div>

            {/* Auto-detect button */}
            <button type="button" onClick={autoDetect} disabled={detecting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '13px', padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #BFDBFE', cursor: detecting ? 'not-allowed' : 'pointer', marginBottom: '20px', transition: 'all .18s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}>
                <Navigation size={15} />{detecting ? 'Detecting...' : 'Auto-detect My Location (GPS)'}
            </button>

            <Fld label="House / Premise / Farm No." required error={errors.houseNo}>
                <input value={form.houseNo} onChange={e => up('houseNo', e.target.value)}
                    placeholder="e.g. Plot 12, Shivaji Farm"
                    style={iStyle(!!errors.houseNo)} onFocus={fg} onBlur={e => bg(e, !!errors.houseNo)} />
            </Fld>

            <Fld label="Landmark" hint="nearby place">
                <input value={form.landmark} onChange={e => up('landmark', e.target.value)}
                    placeholder="e.g. Near Gram Panchayat Office / ग्राम पंचायत के पास"
                    style={iStyle()} onFocus={fg} onBlur={e => bg(e, false)} />
            </Fld>

            <div style={row2}>
                <Fld label="Village / Town / City" required error={errors.village}>
                    <input value={form.village} onChange={e => up('village', e.target.value)}
                        placeholder="e.g. Ozar / ओझर"
                        style={iStyle(!!errors.village)} onFocus={fg} onBlur={e => bg(e, !!errors.village)} />
                </Fld>
                <Fld label="Post Office" required error={errors.postOffice}>
                    <input value={form.postOffice} onChange={e => up('postOffice', e.target.value)}
                        placeholder="e.g. Ozar PO"
                        style={iStyle(!!errors.postOffice)} onFocus={fg} onBlur={e => bg(e, !!errors.postOffice)} />
                </Fld>
            </div>

            <div style={row2}>
                <Fld label="GP / Ward No.">
                    <input value={form.gpWard} onChange={e => up('gpWard', e.target.value)}
                        placeholder="e.g. Ward 4 / वार्ड 4"
                        style={iStyle()} onFocus={fg} onBlur={e => bg(e, false)} />
                </Fld>
                <Fld label="Block / Taluka" required error={errors.block}>
                    <input value={form.block} onChange={e => up('block', e.target.value)}
                        placeholder="e.g. Niphad / निफाड"
                        style={iStyle(!!errors.block)} onFocus={fg} onBlur={e => bg(e, !!errors.block)} />
                </Fld>
            </div>

            <div style={row2}>
                <Fld label="Police Station">
                    <input value={form.policeStation} onChange={e => up('policeStation', e.target.value)}
                        placeholder="e.g. Ozar PS"
                        style={iStyle()} onFocus={fg} onBlur={e => bg(e, false)} />
                </Fld>
                <Fld label="District / जिला" required error={errors.district}>
                    <input value={form.district} onChange={e => up('district', e.target.value)}
                        placeholder="e.g. Nashik / नाशिक"
                        style={iStyle(!!errors.district)} onFocus={fg} onBlur={e => bg(e, !!errors.district)} />
                </Fld>
            </div>

            <div style={row2}>
                <Fld label="State / राज्य">
                    <select value={form.state} onChange={e => up('state', e.target.value)}
                        style={iStyle()} onFocus={fg} onBlur={e => bg(e, false)}>
                        <option value="">-- Select State --</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </Fld>
                <Fld label="PIN Code" required error={errors.pinCode}>
                    <input type="text" maxLength={6} value={form.pinCode} onChange={e => up('pinCode', e.target.value.replace(/\D/, ''))}
                        placeholder="e.g. 422207"
                        style={iStyle(!!errors.pinCode)} onFocus={fg} onBlur={e => bg(e, !!errors.pinCode)} />
                </Fld>
            </div>

            {/* Google Maps picker */}
            <Fld label="Pin Location on Map" hint="click map or drag pin">
                <GoogleMapPicker
                    lat={mapLat} lng={mapLng} label={mapLabel}
                    onPin={handleMapPin}
                />
            </Fld>
        </div>
    );
}

// ── GEO-TAGGED CAMERA ────────────────────────────────────────
// Captures photo from device camera and overlays GPS info
// exactly like the GPS Map Camera app (lat, long, address, time)
function GeoTagCamera({ onCapture, fallbackAddress }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [streaming, setStreaming] = useState(false);
    const [gpsInfo, setGpsInfo] = useState(null);
    const [addrText, setAddrText] = useState('Fetching location...');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [captured, setCaptured] = useState([]);
    const [capturing, setCapturing] = useState(false);

    async function startCamera() {
        setLoading(true); setError('');
        try {
            // 1. Get GPS
            const pos = await new Promise((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 }));
            const { latitude: lat, longitude: lng, accuracy } = pos.coords;
            setGpsInfo({ lat, lng, accuracy });

            // 2. Reverse-geocode via SDK (Bypasses CORS)
            if (window.google?.maps) {
                const geoc = new window.google.maps.Geocoder();
                geoc.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const full = results[0].formatted_address;
                        const parts = full.split(',');
                        const line1 = parts.slice(0, 2).join(',').trim();
                        const line2 = parts.slice(2).join(',').trim();
                        setAddrText(full);
                        setGpsInfo(g => ({ ...g, line1: line1 || 'Location Found', line2 }));
                    } else {
                        // Use the address from Step 3 if API fails
                        const full = fallbackAddress || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
                        const parts = full.split(',');
                        setAddrText(full);
                        setGpsInfo(g => ({
                            ...g,
                            line1: parts[0]?.trim() || 'Address Fallback',
                            line2: parts.slice(1).join(',').trim() || 'Billing/API restriction active'
                        }));
                    }
                });
            } else {
                const full = fallbackAddress || `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                setAddrText(full);
                setGpsInfo(g => ({ ...g, line1: full.split(',')[0], line2: 'SDK not loaded' }));
            }

            // 3. Start video stream (back camera on mobile)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await new Promise(r => videoRef.current.addEventListener('loadedmetadata', r, { once: true }));
            videoRef.current.play();
            setStreaming(true);
        } catch (e) {
            setError(e.name === 'NotAllowedError'
                ? 'Camera / Location permission denied. Please allow access and try again.'
                : `Error: ${e.message}`);
        }
        setLoading(false);
    }

    function stopCamera() {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setStreaming(false);
    }

    useEffect(() => () => stopCamera(), []);

    async function capturePhoto() {
        if (!streaming || !gpsInfo || capturing) return;
        setCapturing(true);
        try {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const W = video.videoWidth || 1280;
            const H = video.videoHeight || 720;
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');

            // ── Draw video frame ──
            ctx.drawImage(video, 0, 0, W, H);

            // ── GPS Overlay (bottom strip) ────────────────────────
            const OH = 150;           // overlay height
            const OY = H - OH;        // overlay top y
            const THUMB = 130;          // map thumbnail width

            // Dark semi-transparent bg
            ctx.fillStyle = 'rgba(15,15,15,0.72)';
            ctx.fillRect(0, OY, W, OH);

            // ── Map Thumbnail (left) — real Google Static Map ──────
            await new Promise(resolve => {
                const mapImg = new Image();
                const staticUrl =
                    `https://maps.googleapis.com/maps/api/staticmap` +
                    `?center=${gpsInfo.lat},${gpsInfo.lng}&zoom=15&size=${THUMB}x${OH}` +
                    `&maptype=hybrid&markers=color:red|${gpsInfo.lat},${gpsInfo.lng}&key=${GMAP_KEY}`;
                mapImg.crossOrigin = 'anonymous';
                const timeout = setTimeout(() => {
                    ctx.fillStyle = '#33691e'; ctx.fillRect(0, OY, THUMB, OH);
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
                    for (let i = 0; i < THUMB; i += 20) { ctx.beginPath(); ctx.moveTo(i, OY); ctx.lineTo(i, OY + OH); ctx.stroke(); }
                    for (let i = 0; i < OH; i += 20) { ctx.beginPath(); ctx.moveTo(0, OY + i); ctx.lineTo(THUMB, OY + i); ctx.stroke(); }
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
                    ctx.fillText('N', THUMB / 2, OY + 15);
                    ctx.fillStyle = '#f44336'; ctx.beginPath(); ctx.moveTo(THUMB / 2, OY + 20); ctx.lineTo(THUMB / 2 - 5, OY + 35); ctx.lineTo(THUMB / 2 + 5, OY + 35); ctx.fill();
                    resolve();
                }, 1500);
                mapImg.onload = () => { clearTimeout(timeout); ctx.drawImage(mapImg, 0, OY, THUMB, OH); resolve(); };
                mapImg.onerror = () => {
                    clearTimeout(timeout);
                    // Fallback: draw stylised map with grid and compass
                    ctx.fillStyle = '#33691e'; ctx.fillRect(0, OY, THUMB, OH);
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
                    for (let i = 0; i < THUMB; i += 20) { ctx.beginPath(); ctx.moveTo(i, OY); ctx.lineTo(i, OY + OH); ctx.stroke(); }
                    for (let i = 0; i < OH; i += 20) { ctx.beginPath(); ctx.moveTo(0, OY + i); ctx.lineTo(THUMB, OY + i); ctx.stroke(); }
                    // Simple compass
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
                    ctx.fillText('N', THUMB / 2, OY + 15);
                    ctx.fillStyle = '#f44336'; ctx.beginPath(); ctx.moveTo(THUMB / 2, OY + 20); ctx.lineTo(THUMB / 2 - 5, OY + 35); ctx.lineTo(THUMB / 2 + 5, OY + 35); ctx.fill();
                    resolve();
                };
                mapImg.src = staticUrl;
            });

            // ── "GPS Map Camera" label (top-right of overlay) ──
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            const labelW = 230, labelH = 28, labelX = W - labelW - 8, labelY = OY + 6;
            roundRect(ctx, labelX, labelY, labelW, labelH, 8);
            ctx.fillStyle = '#4FC3F7'; ctx.font = `bold ${Math.round(W / 55)}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText('📍 GPS Map Camera', labelX + 8, labelY + 18);

            // ── Main text (right of thumbnail) ──
            const TX = THUMB + 20;
            const now = new Date();
            const dateStr = now.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }) + ' GMT+05:30';

            const FS_ADDR = Math.round(W / 36);   // ~35px - nice and big
            const FS_SUB = Math.round(W / 58);   // small details

            // Cardinal Directions
            const latDir = gpsInfo.lat >= 0 ? 'N' : 'S';
            const lngDir = gpsInfo.lng >= 0 ? 'E' : 'W';
            const latVal = Math.abs(gpsInfo.lat).toFixed(6);
            const lngVal = Math.abs(gpsInfo.lng).toFixed(6);

            // 1. Address Line 1
            ctx.fillStyle = '#FFFFFF'; ctx.font = `bold ${FS_ADDR}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(trimText(ctx, gpsInfo.line1 || 'Address Pending', W - TX - 10), TX, OY + FS_ADDR + 8);

            // 2. Address Line 2
            ctx.fillStyle = '#E5E7EB'; ctx.font = `${FS_SUB}px Arial`;
            ctx.fillText(trimText(ctx, gpsInfo.line2 || addrText, W - TX - 10), TX, OY + FS_ADDR + FS_SUB + 15);

            // 3. Coordinate Line (Lime Green)
            ctx.fillStyle = '#A3E635'; ctx.font = `bold ${FS_SUB}px Arial`;
            ctx.fillText(`${latVal}° ${latDir}, ${lngVal}° ${lngDir}`, TX, OY + FS_ADDR + FS_SUB * 2 + 30);

            // 4. Timestamp
            ctx.fillStyle = '#D1D5DB'; ctx.font = `${FS_SUB}px Arial`;
            ctx.fillText(dateStr, TX, OY + OH - 12);

            // Separator line
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(THUMB, OY); ctx.lineTo(THUMB, OY + OH); ctx.stroke();

            // Convert to file
            canvas.toBlob(blob => {
                if (!blob) { setCapturing(false); throw new Error("Canvas blob creation failed"); }
                const file = new File([blob], `geo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                const url = canvas.toDataURL('image/jpeg', 0.92);
                const newImg = { file, url, lat: gpsInfo.lat, lng: gpsInfo.lng, address: addrText, timestamp: Date.now() };
                setCaptured(c => [...c, newImg]);
                onCapture(newImg);
                setCapturing(false);
            }, 'image/jpeg', 0.92);
        } catch (e) {
            console.error("Capture Error:", e);
            setError(`Capture failed: ${e.message}`);
            setCapturing(false);
        }
    }

    return (
        <div>
            {/* Status bar */}
            {gpsInfo && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#15803D', fontWeight: 600 }}>
                    📍 GPS Ready: {gpsInfo.lat.toFixed(5)}, {gpsInfo.lng.toFixed(5)}
                    {gpsInfo.accuracy && ` · Accuracy ±${Math.round(gpsInfo.accuracy)}m`}
                </div>
            )}
            {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#DC2626', fontWeight: 600 }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Camera preview */}
            <div style={{ position: 'relative', background: '#111', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px', minHeight: streaming ? 'auto' : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: '100%', display: streaming ? 'block' : 'none', borderRadius: '14px' }} />
                {!streaming && (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                        <Camera size={48} color="#4B5563" style={{ marginBottom: '12px' }} />
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>Camera is off</p>
                        <p style={{ fontSize: '12px', marginTop: '4px' }}>Click Start below to open the geo-tagged camera</p>
                    </div>
                )}
                {/* Canvas (hidden, used for rendering) */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {!streaming ? (
                    <button type="button" onClick={startCamera} disabled={loading}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            background: loading ? '#6B7280' : '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '14px',
                            padding: '13px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
                        }}>
                        <Camera size={18} />{loading ? 'Starting Camera + GPS...' : 'Start Geo-Tag Camera'}
                    </button>
                ) : (
                    <>
                        <button type="button" onClick={capturePhoto} disabled={capturing}
                            style={{
                                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                background: capturing ? '#9CA3AF' : '#DC2626', color: '#fff', fontWeight: 800, fontSize: '15px',
                                padding: '13px', borderRadius: '12px', border: 'none', cursor: capturing ? 'not-allowed' : 'pointer'
                            }}>
                            {capturing ? <RefreshCw size={18} className="animate-spin" /> : '📷'}
                            {capturing ? 'Processing Photos...' : 'Capture & Geo-Tag'}
                        </button>
                        <button type="button" onClick={stopCamera}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '13px',
                                padding: '13px', borderRadius: '12px', border: 'none', cursor: 'pointer'
                            }}>
                            <X size={16} /> Stop
                        </button>
                    </>
                )}
            </div>

            {/* Captured photos */}
            {captured.length > 0 && (
                <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                        📸 Geo-Tagged Photos ({captured.length})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                        {captured.map((img, i) => (
                            <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid #BBF7D0' }}>
                                <img src={img.url} alt="" style={{ width: '100%', display: 'block' }} />
                                <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', color: '#A3E635', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                                    ✓ GPS Tagged
                                </div>
                                <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '3px 7px', borderRadius: '5px' }}>
                                    {img.lat.toFixed(4)}, {img.lng.toFixed(4)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// STEP 4: Geo-Tagged Images
function Step4({ form, setForm, errors }) {
    function addCaptured(img) {
        setForm(f => ({ ...f, images: [...f.images, img] }));
    }
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={20} color="#E11D48" />
                </div>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', fontFamily: "'Poppins',sans-serif" }}>Geo-Tagged Images 🔑 MVP</h3>
                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Photos must be taken via this camera to embed GPS data</p>
                </div>
            </div>

            {/* Info box */}
            <div style={{ background: '#FFF7ED', borderRadius: '12px', padding: '14px 16px', border: '1px solid #FED7AA', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <Info size={15} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#92400E', lineHeight: 1.75 }}>
                    <strong>How it works:</strong> Click <em>Start Geo-Tag Camera</em> → your device camera opens → GPS coordinates are fetched → click
                    <em> Capture & Geo-Tag</em> → the photo is saved with location, lat/long, and timestamp stamped on it (exactly like GPS Map Camera™).
                    This data is stored in the database as a GeoJSON point for "nearest equipment" search.
                </div>
            </div>

            <GeoTagCamera
                onCapture={addCaptured}
                fallbackAddress={`${form.houseNo}, ${form.village}, ${form.block}, ${form.district}`}
            />

            {errors.images && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                    <AlertCircle size={14} color="#DC2626" />
                    <span style={{ fontSize: '13px', color: '#DC2626', fontWeight: 600 }}>{errors.images}</span>
                </div>
            )}
        </div>
    );
}

// ── Utilities ────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.fill();
}
function trimText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 0 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
}

// ── Validation ───────────────────────────────────────────────
function validate(step, form) {
    const e = {};
    if (step === 0) {
        if (!form.category) e.category = 'Please select a category.';
        if (form.category === 'other' && (!form.otherName || !form.otherName.trim())) {
            e.otherName = 'Please enter the name of the equipment.';
        }
        if (!form.brand.trim()) e.brand = 'Brand is required.';
        if (!form.model.trim()) e.model = 'Model name is required.';
        if (!form.year) e.year = 'Select manufacture year.';
    }
    if (step === 1) {
        if (!form.rentHour || Number(form.rentHour) <= 0) e.rentHour = 'Must be > ₹0.';
        if (!form.rentDay || Number(form.rentDay) <= 0) e.rentDay = 'Must be > ₹0.';
        if (form.description.trim().length < 50) e.description = 'Minimum 50 characters.';
    }
    if (step === 2) {
        if (!form.houseNo.trim()) e.houseNo = 'Required.';
        if (!form.village.trim()) e.village = 'Required.';
        if (!form.postOffice.trim()) e.postOffice = 'Required.';
        if (!form.block.trim()) e.block = 'Required.';
        if (!form.district.trim()) e.district = 'Required.';
        if (!form.pinCode || form.pinCode.length !== 6) e.pinCode = 'Enter valid 6-digit PIN.';
    }
    if (step === 3) {
        if (form.images.length < 1) e.images = 'Please capture at least 1 geo-tagged photo.';
    }
    return e;
}

// ── Main ─────────────────────────────────────────────────────
export default function AddEquipment() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    function next() {
        const errs = validate(step, form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({}); setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function back() { setErrors({}); setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate(step, form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setLoading(true);
        setApiError('');

        try {
            const token = localStorage.getItem('kas_token');
            if (!token) { setApiError('You must be logged in to list equipment.'); setLoading(false); return; }

            const fd = new FormData();
            // ── Text fields ───────────────────────────────────────
            fd.append('category', form.category);
            fd.append('otherName', form.otherName || '');
            fd.append('brand', form.brand);
            fd.append('model', form.model);
            fd.append('year', form.year);
            fd.append('condition', form.condition || 'Good');
            fd.append('horsePower', form.horsePower || '');
            fd.append('fuelType', form.fuelType || 'Diesel');
            fd.append('description', form.description);
            fd.append('priceHr', form.rentHour);
            fd.append('priceDay', form.rentDay);
            fd.append('priceSeason', form.rentSeason || '');
            fd.append('houseNo', form.houseNo);
            fd.append('village', form.village);
            fd.append('postOffice', form.postOffice);
            fd.append('block', form.block || '');
            fd.append('district', form.district);
            fd.append('pinCode', form.pinCode);
            fd.append('state', form.state || 'Maharashtra');
            fd.append('lat', form._lat || 20.0);
            fd.append('lng', form._lng || 73.8);
            fd.append('locLabel', form._locLabel || '');

            // ── Image Blobs (geo-tagged) ──────────────────────────
            form.images.forEach((img, i) => {
                if (img.file) fd.append(`equipment_image_${i}`, img.file, `photo_${i}.jpg`);
            });

            const res = await fetch('http://localhost:5000/api/equipment/add', {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: fd,
            });
            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
            } else {
                setApiError(data.message || 'Failed to list equipment. Please try again.');
            }
        } catch {
            setApiError('Network error. Is the server running on port 5000?');
        }
        setLoading(false);
    }

    const sel = ALL_ITEMS.find(i => i.v === form.category);

    if (submitted) return (
        <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#F0FDF4', border: '3px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Check size={36} color="#16A34A" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins',sans-serif", marginBottom: '10px' }}>Equipment Listed! 🎉</h2>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.7, marginBottom: '16px' }}>
                    <strong>{form.brand} {form.model}</strong> ({sel?.en}) has been submitted with <strong>{form.images.length} geo-tagged photo(s)</strong>.
                </p>
                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '28px', textAlign: 'left' }}>
                    {[
                        { l: 'Category', v: sel ? `${sel.icon} ${sel.en} · ${sel.hi} · ${sel.mr}` : '—' },
                        { l: 'Quantity', v: `${form.quantity} unit(s)` },
                        { l: 'Rent/Hour', v: `₹${form.rentHour}` },
                        { l: 'Rent/Day', v: `₹${form.rentDay}` },
                        { l: 'Location', v: `${form.village}, ${form.district} – ${form.pinCode}` },
                    ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: '1px solid #F3F4F6' }}>
                            <span style={{ color: '#9CA3AF', fontWeight: 600 }}>{r.l}</span>
                            <span style={{ color: '#111827', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{r.v}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setSubmitted(false); setForm(EMPTY); setStep(0); }}
                        style={{ flex: 1, background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '14px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                        + List Another
                    </button>
                    <button onClick={() => navigate('/')}
                        style={{ flex: 1, background: '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '14px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Inter',sans-serif" }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', padding: '28px 24px' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Leaf size={24} color="#8BC34A" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: "'Poppins',sans-serif", lineHeight: 1 }}>
                            List Your Equipment / अपना उपकरण सूचीबद्ध करें
                        </h1>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Krishi Astra Setu · Earn from idle machinery</p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 16px 80px' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                        <ProgressBar step={step} />
                        {step === 0 && <Step1 form={form} setForm={setForm} errors={errors} />}
                        {step === 1 && <Step2 form={form} setForm={setForm} errors={errors} />}
                        {step === 2 && <Step3 form={form} setForm={setForm} errors={errors} />}
                        {step === 3 && <Step4 form={form} setForm={setForm} errors={errors} />}

                        {/* API Error banner */}
                        {apiError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 0', padding: '12px 16px', background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '10px', color: '#B91C1C', fontSize: '13px', fontWeight: 600 }}>
                                <AlertCircle size={16} /> {apiError}
                            </div>
                        )}

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
                            {step > 0 && (
                                <button type="button" onClick={back}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '14px', padding: '13px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                                    <ChevronLeft size={18} /> Back
                                </button>
                            )}
                            <div style={{ flex: 1 }} />
                            {step < STEPS.length - 1 ? (
                                <button type="button" onClick={next}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2E7D32', color: '#fff', fontWeight: 700, fontSize: '14px', padding: '13px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                                    Next <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="submit" disabled={loading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: loading ? '#6B7280' : '#2E7D32', color: '#fff', fontWeight: 800, fontSize: '15px', padding: '13px 32px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                                    {loading ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                                    {loading ? 'Uploading…' : 'List Equipment'}
                                </button>
                            )}
                        </div>

                    </div>
                </form>

                <div style={{ marginTop: '14px', background: '#FFF7ED', borderRadius: '12px', padding: '12px 16px', border: '1px solid #FED7AA', display: 'flex', gap: '10px' }}>
                    <Info size={14} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '11.5px', color: '#92400E', lineHeight: 1.7 }}>
                        <strong>Backend Integration:</strong> Geo-tagged images → Cloudinary with GPS EXIF &nbsp;•&nbsp;
                        Equipment data → MongoDB <code>Equipment</code> collection &nbsp;•&nbsp;
                        Location → <code>{"{ type:'Point', coordinates:[lng,lat] }"}</code> GeoJSON for nearest-search.
                    </p>
                </div>
            </div>
        </div>
    );
}
