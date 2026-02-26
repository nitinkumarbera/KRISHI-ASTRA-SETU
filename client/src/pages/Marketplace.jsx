import { useState, useEffect, useRef } from 'react';
import {
    Search, Filter, Map as MapIcon, Grid, Sliders,
    X, RefreshCw, ChevronDown, ChevronRight, MapPin
} from 'lucide-react';
import EquipmentCard from '../components/EquipmentCard';
import { useLanguage } from '../context/LanguageContext';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ── Hierarchical India location data ──────────────────────────
// Covers all Indian states with their districts and talukas/sub-districts
const INDIA_LOCATION = {
    'Andhra Pradesh': {
        'Visakhapatnam': ['Visakhapatnam (City)', 'Bheemunipatnam', 'Anakapalle', 'Paderu', 'Narsipatnam'],
        'Krishna': ['Vijayawada', 'Machilipatnam', 'Gudivada', 'Nuzvid', 'Tiruvuru'],
        'Guntur': ['Guntur', 'Tenali', 'Narasaraopet', 'Palnadu', 'Sattenapalle'],
        'East Godavari': ['Kakinada', 'Rajahmundry', 'Amalapuram', 'Peddapuram', 'Samalkot'],
    },
    'Assam': {
        'Kamrup Metro': ['Guwahati', 'Dispur', 'Azara', 'Sonapur'],
        'Dibrugarh': ['Dibrugarh', 'Moran', 'Naharkatia', 'Duliajan'],
    },
    'Bihar': {
        'Patna': ['Patna City', 'Danapur', 'Fatuha', 'Bakhtiyarpur', 'Masaurhi'],
        'Gaya': ['Gaya', 'Bodh Gaya', 'Sherghati', 'Wazirganj', 'Atri'],
        'Muzaffarpur': ['Muzaffarpur', 'Kanti', 'Motipur', 'Sitamadhi', 'Sheohar'],
    },
    'Chhattisgarh': {
        'Raipur': ['Raipur', 'Abhanpur', 'Arang', 'Dharsiwa', 'Tilda-Neura'],
        'Bilaspur': ['Bilaspur', 'Masturi', 'Takhatpur', 'Beltara', 'Kota'],
    },
    'Delhi': {
        'Central Delhi': ['Connaught Place', 'Karol Bagh', 'Paharganj'],
        'South Delhi': ['Hauz Khas', 'Greater Kailash', 'Lajpat Nagar', 'Saket'],
        'North Delhi': ['Civil Lines', 'Burari', 'Alipur', 'Narela'],
    },
    'Gujarat': {
        'Ahmedabad': ['Ahmedabad City', 'Daskroi', 'Detroj-Rampura', 'Dholka', 'Sanand'],
        'Surat': ['Surat City', 'Bardoli', 'Mandvi', 'Olpad', 'Palsana'],
        'Vadodara': ['Vadodara City', 'Waghodiya', 'Dabhoi', 'Padra', 'Karjan'],
        'Rajkot': ['Rajkot City', 'Jetpur', 'Gondal', 'Upleta', 'Jasdan'],
    },
    'Haryana': {
        'Gurugram': ['Gurugram', 'Farukhnagar', 'Pataudi', 'Sohna', 'Badshahpur'],
        'Faridabad': ['Faridabad', 'Ballabhgarh', 'Tigaon', 'Badkhal'],
        'Hisar': ['Hisar', 'Hansi', 'Barwala', 'Narnaund', 'Uklana'],
        'Ambala': ['Ambala City', 'Ambala Cantonment', 'Barara', 'Naraingarh', 'Mullana'],
    },
    'Himachal Pradesh': {
        'Shimla': ['Shimla', 'Rampur', 'Rohru', 'Chopal', 'Theog'],
        'Kangra': ['Kangra', 'Dharamsala', 'Palampur', 'Nurpur', 'Baijnath'],
    },
    'Jharkhand': {
        'Ranchi': ['Ranchi', 'Bundu', 'Tamar', 'Angara', 'Kanke'],
        'Dhanbad': ['Dhanbad', 'Topchanchi', 'Baghmara', 'Tundi', 'Govindpur'],
    },
    'Karnataka': {
        'Bengaluru Urban': ['Bengaluru', 'Anekal', 'Bengaluru South', 'Bengaluru North', 'Dasarahalli'],
        'Mysuru': ['Mysuru', 'Hunsur', 'Nanjangud', 'T Narasipura', 'H D Kote'],
        'Belagavi': ['Belagavi', 'Gokak', 'Ramdurg', 'Bailhongal', 'Athani'],
    },
    'Kerala': {
        'Thiruvananthapuram': ['Thiruvananthapuram', 'Nedumangad', 'Varkala', 'Neyyattinkara', 'Chirayinkeezhu'],
        'Ernakulam': ['Ernakulam', 'Kothamangalam', 'Muvattupuzha', 'Paravur', 'Aluva'],
        'Kozhikode': ['Kozhikode', 'Vatakara', 'Koduvally', 'Koyilandy', 'Quilandy'],
    },
    'Madhya Pradesh': {
        'Indore': ['Indore', 'Depalpur', 'Mhow', 'Sanwer', 'Hatod'],
        'Bhopal': ['Bhopal', 'Berasia', 'Huzur', 'Phanda', 'Sehore'],
        'Jabalpur': ['Jabalpur', 'Patan', 'Sihora', 'Bargi', 'Panagar'],
        'Gwalior': ['Gwalior', 'Bhind', 'Morena', 'Shivpuri', 'Guna'],
    },
    'Maharashtra': {
        'Nashik': ['Nashik', 'Sinnar', 'Igatpuri', 'Dindori', 'Niphad', 'Yeola', 'Surgana', 'Peint', 'Trimbakeshwar', 'Malegaon', 'Deola', 'Nandgaon', 'Chandwad', 'Baglan', 'Kalwan'],
        'Pune': ['Pune City', 'Haveli', 'Mulshi', 'Maval', 'Bhor', 'Velhe', 'Junnar', 'Ambegaon', 'Khed', 'Shirur', 'Daund', 'Indapur', 'Baramati', 'Purandar'],
        'Mumbai City': ['Kurla', 'Andheri', 'Borivali', 'Goregaon', 'Malad', 'Kandivali', 'Dahisar', 'Chembur', 'Mankhurd', 'Ghatkopar', 'Bhandup', 'Mulund'],
        'Mumbai Suburban': ['Andheri', 'Borivali', 'Kandivali', 'Malad', 'Goregaon', 'Jogeshwari', 'Vile Parle', 'Santacruz', 'Bandra'],
        'Thane': ['Thane', 'Kalyan', 'Ulhasnagar', 'Bhiwandi', 'Ambarnath', 'Murbad', 'Shahapur', 'Vasai-Virar', 'Palghar'],
        'Aurangabad': ['Aurangabad', 'Paithan', 'Gangapur', 'Phulambri', 'Khuldabad', 'Kannad', 'Soegaon', 'Sillod', 'Vaijapur'],
        'Kolhapur': ['Kolhapur', 'Panhala', 'Karveer', 'Hatkanangle', 'Gadhinglaj', 'Chandgad', 'Ajra', 'Bavda', 'Radhanagari'],
        'Sangli': ['Sangli', 'Miraj', 'Kupwad', 'Walwa', 'Shirala', 'Tasgaon', 'Kavate Mahankal', 'Jat', 'Atpadi', 'Khanapur'],
        'Solapur': ['Solapur North', 'Solapur South', 'Akkalkot', 'Barshi', 'Pandharpur', 'Mangalvedhe', 'Karmala', 'Madha', 'Malshiras', 'Mohol', 'North Solapur', 'South Solapur'],
        'Ahmednagar': ['Ahmednagar', 'Karjat', 'Jamkhed', 'Kopargaon', 'Rahata', 'Sangamner', 'Akole', 'Shevgaon', 'Rahuri', 'Parner', 'Shrigonda', 'Patoda', 'Newasa'],
        'Satara': ['Satara', 'Karad', 'Wai', 'Patan', 'Mahabaleshwar', 'Javali', 'Khandala', 'Khatav', 'Koregaon', 'Man', 'Phaltan'],
        'Raigad': ['Alibag', 'Panvel', 'Pen', 'Uran', 'Karjat', 'Khalapur', 'Murud', 'Roha', 'Mahad', 'Mangaon', 'Poladpur', 'Mhasla', 'Shriwardhan', 'Tala'],
        'Dhule': ['Dhule', 'Sakri', 'Shirpur', 'Sindkheda'],
        'Nandurbar': ['Nandurbar', 'Shahada', 'Akkalkuwa', 'Akrani', 'Taloda', 'Nawapur'],
        'Jalgaon': ['Jalgaon', 'Amalner', 'Chalisgaon', 'Chopda', 'Bhusawal', 'Muktainagar', 'Erandol', 'Bhadgaon', 'Pachora', 'Yawal', 'Jamner', 'Dharangaon', 'Raver', 'Parola'],
        'Buldhana': ['Buldhana', 'Khamgaon', 'Malkapur', 'Shegaon', 'Mehkar', 'Sangrampur', 'Lonar', 'Motala', 'Nandura', 'Jalgaon-Jamod', 'Chikhli', 'Deulgaon Raja', 'Sindkhed Raja'],
        'Akola': ['Akola', 'Akot', 'Balapur', 'Murtijapur', 'Patur', 'Murtizapur', 'Telhara', 'Barshitakli'],
        'Washim': ['Washim', 'Karanja', 'Manora', 'Malegaon', 'Risod', 'Mangrulpir'],
        'Amravati': ['Amravati', 'Achalpur', 'Daryapur', 'Chandur  Bazar', 'Chandur Railway', 'Morshi', 'Warud', 'Anjangaon', 'Bhatkuli', 'Chikhaldara', 'Dharni', 'Nandgaon Khandeshwar', 'Tirora'],
        'Yavatmal': ['Yavatmal', 'Umarkhed', 'Wani', 'Babhulgaon', 'Darwha', 'Ghatanji', 'Kalamb', 'Kelapur', 'Mahagaon', 'Maregaon', 'Ner', 'Pusad', 'Ralegaon', 'Zari-Jamni'],
        'Wardha': ['Wardha', 'Arvi', 'Hinganghat', 'Samudrapur', 'Deoli', 'Seloo', 'Arvi', 'Ashti', 'Karanja'],
        'Nagpur': ['Nagpur City', 'Nagpur Rural', 'Kamptee', 'Hingna', 'Umred', 'Parseoni', 'Ramtek', 'Mouda', 'Bhiwapur', 'Katol', 'Kalmeshwar', 'Savner', 'Narkhed', 'Mauda'],
        'Bhandara': ['Bhandara', 'Tumsar', 'Mohadi', 'Sakoli', 'Lakhani', 'Lakhandur', 'Pauni'],
        'Gondia': ['Gondia', 'Amgaon', 'Arjuni-Morgaon', 'Deori', 'Goregaon', 'Saleksa', 'Sadak-Arjuni', 'Tirora'],
        'Chandrapur': ['Chandrapur', 'Bhadravati', 'Warora', 'Rajura', 'Ballarpur', 'Gondpipri', 'Mul', 'Nagbhid', 'Pombhurna', 'Sindewahi', 'Chimur', 'Jivati', 'Korpana', 'Brahmpuri', 'Sawali'],
        'Gadchiroli': ['Gadchiroli', 'Armori', 'Aheri', 'Bhamragad', 'Chamorshi', 'Desaiganj', 'Dhanora', 'Etapalli', 'Korchi', 'Kurkheda', 'Mulchera', 'Sironcha'],
        'Osmanabad': ['Osmanabad', 'Tuljapur', 'Lohara', 'Omerga', 'Paranda', 'Bhoom', 'Kalamb', 'Washi'],
        'Latur': ['Latur', 'Udgir', 'Nilanga', 'Deoni', 'Chakur', 'Ausa', 'Renapur', 'Ahmedpur', 'Shirur Anantpal', 'Jalkot'],
        'Nanded': ['Nanded', 'Mukhed', 'Bhokar', 'Biloli', 'Deglur', 'Dharmabad', 'Hadgaon', 'Himayatnagar', 'Kandhar', 'Kinwat', 'Loha', 'Mahoor', 'Mudkhed', 'Naigaon', 'Umri'],
        'Hingoli': ['Hingoli', 'Basmath', 'Sengaon', 'Aundha Nagnath', 'Kalamnuri'],
        'Parbhani': ['Parbhani', 'Gangakhed', 'Jintur', 'Manwath', 'Palam', 'Pathri', 'Purna', 'Selu', 'Sonpeth'],
        'Jalna': ['Jalna', 'Ambad', 'Badnapur', 'Bhokardan', 'Ghansavangi', 'Jafrabad', 'Mantha', 'Partur'],
        'Beed': ['Beed', 'Ashti', 'Ambajogai', 'Dharur', 'Georai', 'Kaij', 'Majalgaon', 'Patoda', 'Shirur Kasar', 'Wadwani'],
        'Ratnagiri': ['Ratnagiri', 'Rajapur', 'Lanja', 'Dapoli', 'Mandangad', 'Chiplun', 'Guhagar', 'Khed', 'Sangameshwar'],
        'Sindhudurg': ['Kudal', 'Kankavli', 'Malvan', 'Sawantwadi', 'Devgad', 'Dodamarg', 'Vaibhavwadi', 'Vengurla'],
    },
    'Manipur': { 'Imphal West': ['Imphal', 'Lamphel', 'Patsoi'], 'Imphal East': ['Heingang', 'Jiribam', 'Keirengang'] },
    'Meghalaya': { 'East Khasi Hills': ['Shillong', 'Cherrapunji', 'Pynursla', 'Mawkyrwat'], },
    'Odisha': {
        'Bhubaneswar (Khorda)': ['Bhubaneswar', 'Bhubaneswar North', 'Bhubaneswar South', 'Jatni', 'Khorda'],
        'Cuttack': ['Cuttack', 'Athagarh', 'Baramba', 'Banki', 'Tigiria'],
        'Puri': ['Puri', 'Nimapara', 'Kakatpur', 'Pipili', 'Brahmagiri'],
    },
    'Punjab': {
        'Ludhiana': ['Ludhiana', 'Khanna', 'Raikot', 'Jagraon', 'Samrala', 'Payal'],
        'Amritsar': ['Amritsar', 'Ajnala', 'Attari', 'Baba Bakala', 'Jandiala Guru'],
        'Jalandhar': ['Jalandhar', 'Phillaur', 'Nakodar', 'Shahkot', 'Kartarpur'],
        'Patiala': ['Patiala', 'Nabha', 'Rajpura', 'Sanour', 'Fatehgarh Churian'],
    },
    'Rajasthan': {
        'Jaipur': ['Jaipur', 'Sanganer', 'Amer', 'Chaksu', 'Bassi', 'Madhorajpura', 'Kotputli', 'Viratnagar'],
        'Jodhpur': ['Jodhpur', 'Phalodi', 'Osian', 'Bhopalgarh', 'Shergarh'],
        'Udaipur': ['Udaipur', 'Mavli', 'Vallabhnagar', 'Kherwara', 'Salumbar'],
    },
    'Tamil Nadu': {
        'Chennai': ['Chennai', 'Ambattur', 'Tiruvottiyur', 'Sholinganallur', 'Perungudi'],
        'Coimbatore': ['Coimbatore', 'Pollachi', 'Mettupalayam', 'Anamalai', 'Valparai'],
        'Madurai': ['Madurai', 'Thiruppuvanam', 'Melur', 'Peraiyur', 'Usilampatti'],
        'Salem': ['Salem', 'Attur', 'Mettur', 'Omalur', 'Yercaud'],
    },
    'Telangana': {
        'Hyderabad': ['Hyderabad', 'Secunderabad', 'Uppal', 'LB Nagar', 'Malkajgiri'],
        'Rangareddy': ['Rangareddy', 'Chevella', 'Tandur', 'Vikarabad', 'Pargi'],
        'Warangal': ['Warangal', 'Hanamkonda', 'Narsampet', 'Parkal', 'Bhupalpally'],
    },
    'Uttar Pradesh': {
        'Lucknow': ['Lucknow', 'Mohanlalganj', 'Bakshi Ka Talab', 'Malihabad', 'Sarojini Nagar'],
        'Kanpur': ['Kanpur', 'Ghatampur', 'Bilhaur', 'Bhitargaon', 'Kalyanpur'],
        'Agra': ['Agra', 'Kheragarh', 'Fatehabad', 'Bah', 'Etmadpur'],
        'Varanasi': ['Varanasi', 'Pindra', 'Cholapur', 'Arajiline', 'Sewapuri'],
        'Prayagraj': ['Prayagraj', 'Phulpur', 'Soraon', 'Meja', 'Handia', 'Karchana'],
    },
    'Uttarakhand': {
        'Dehradun': ['Dehradun', 'Rishikesh', 'Haridwar', 'Vikasnagar', 'Chakrata'],
        'Nainital': ['Nainital', 'Haldwani', 'Bhimtal', 'Ramnagar', 'Bazpur'],
    },
    'West Bengal': {
        'Kolkata': ['Kolkata', 'Jadavpur', 'Behala', 'Kasba', 'Tollygunge'],
        'Howrah': ['Howrah', 'Uluberia', 'Bally', 'Amta', 'Udaynarayanpur'],
        'Murshidabad': ['Murshidabad', 'Jiaganj', 'Berhampore', 'Domkal', 'Raninagar'],
        'Nadia': ['Krishnanagar', 'Ranaghat', 'Kalyani', 'Chakdaha', 'Shantipur'],
    },
};

const ALL_STATES = Object.keys(INDIA_LOCATION).sort();

const CATEGORIES = [
    { id: 'tractor', icon: '🚜', en: 'Tractor', hi: 'ट्रैक्टर', mr: 'ट्रॅक्टर' },
    { id: 'harvester', icon: '🌾', en: 'Harvester', hi: 'कंबाइन हार्वेस्टर', mr: 'हार्वेस्टर' },
    { id: 'rotavator', icon: '🔄', en: 'Rotavator', hi: 'रोटावेटर', mr: 'रोटाव्हेटर' },
    { id: 'seeddrill', icon: '🌱', en: 'Seed Drill', hi: 'सीड ड्रिल', mr: 'बियाणे ड्रिल' },
    { id: 'jcb', icon: '🏗️', en: 'JCB / Excavator', hi: 'जेसीबी / खुदाई मशीन', mr: 'जेसीबी / खोदण्याचे यंत्र' },
    { id: 'pump_diesel', icon: '🚿', en: 'Diesel Pump', hi: 'डीज़ल पंप', mr: 'डिझेल पंप' },
    { id: 'drone', icon: '🚁', en: 'Drone Sprayer', hi: 'ड्रोन स्प्रेयर', mr: 'ड्रोन फवारणी' },
    { id: 'sprayer_back', icon: '🎒', en: 'Knapsack Sprayer', hi: 'नैपसैक स्प्रेयर', mr: 'पाठीवरचा फवारा' },
    { id: 'thresher', icon: '⚙️', en: 'Thresher', hi: 'थ्रेशर', mr: 'मळणी यंत्र' },
    { id: 'chaff_cutter', icon: '✂️', en: 'Chaff Cutter', hi: 'चारा काटने वाली मशीन', mr: 'वैरण कापणी यंत्र' },
    { id: 'cultivator', icon: '↔️', en: 'Cultivator', hi: 'कल्टीवेटर', mr: 'कल्टिव्हेटर' },
    { id: 'plough', icon: '🔧', en: 'Disc Plough', hi: 'डिस्क हल', mr: 'डिस्क नांगर' },
];


// ── Collapsible section header ─────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #F3F4F6', paddingBottom: '20px' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', marginBottom: open ? '12px' : 0 }}
            >
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
                {open ? <ChevronDown size={16} color="#6B7280" /> : <ChevronRight size={16} color="#6B7280" />}
            </button>
            {open && children}
        </div>
    );
}

export default function Marketplace() {
    const { t, language } = useLanguage();
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState(5000);
    const [selectedCats, setSelectedCats] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    // ── Hierarchical location state ─────────────────────────────
    const [selState, setSelState] = useState('');  // empty = show ALL states by default
    const [selDistrict, setSelDistrict] = useState('');
    const [selTaluka, setSelTaluka] = useState('');
    const [selVillage, setSelVillage] = useState('');
    const [distance, setDistance] = useState('25');

    // Derived option lists
    const districtOptions = selState && INDIA_LOCATION[selState]
        ? Object.keys(INDIA_LOCATION[selState]).sort()
        : [];
    const talukaOptions = selState && selDistrict && INDIA_LOCATION[selState]?.[selDistrict]
        ? INDIA_LOCATION[selState][selDistrict]
        : [];

    // ── Live Data State ───────────────────────────────────────
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [mapsReady, setMapsReady] = useState(!!window.google?.maps);
    const mapRef = useRef(null);
    const googleMap = useRef(null);
    const markers = useRef([]);

    // ── Load Google Maps script ────────────────────────────────
    useEffect(() => {
        if (window.google?.maps) { setMapsReady(true); return; }
        if (document.getElementById('gmap-script')) return;
        window.__initGoogleMap = () => setMapsReady(true);
        const script = document.createElement('script');
        script.id = 'gmap-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&callback=__initGoogleMap`;
        script.async = true; script.defer = true;
        document.head.appendChild(script);
    }, []);

    // ── Fetch equipments ──────────────────────────────────────
    const fetchItems = async () => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCats.length > 0) params.append('category', selectedCats.join(','));
            // Only filter by price when user dragged the slider below max
            if (priceRange < 5000) params.append('maxPrice', priceRange);
            // Only filter by district/taluka/village when user has actively selected them.
            // selState alone only populates the district dropdown — it shouldn't filter results.
            if (selDistrict) {
                params.append('district', selDistrict);
                if (selState) params.append('state', selState);  // send state only alongside district
            }
            if (selTaluka) params.append('taluka', selTaluka);
            if (selVillage.trim()) params.append('village', selVillage.trim());

            const res = await fetch(`http://localhost:5000/api/equipment/search?${params.toString()}`);
            const data = await res.json();
            if (res.ok) setItems(data.data || []);
            else setError(data.message || 'Failed to load equipment.');
        } catch {
            setError('Network error. Is the server running?');
        }
        setLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchItems(), 400);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCats, priceRange, selState, selDistrict, selTaluka, selVillage]);

    // ── Map initialization ────────────────────────────────────
    useEffect(() => {
        if (viewMode !== 'map' || !mapsReady || !mapRef.current) return;

        // Center on selected district/state or default Maharashtra
        const centerPoint = selDistrict
            ? { lat: 19.9975, lng: 73.7898 }  // will be updated by geocode
            : { lat: 19.7515, lng: 75.7139 };  // Maharashtra centre

        const map = new window.google.maps.Map(mapRef.current, {
            center: centerPoint, zoom: selDistrict ? 11 : 8,
            mapTypeControl: false, streetViewControl: false,
            styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
        });
        googleMap.current = map;

        // Geocode selected district to centre map
        if (selDistrict) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: `${selDistrict} District, ${selState}, India` }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    map.setCenter(results[0].geometry.location);
                }
            });
        }

        markers.current.forEach(m => m.setMap(null));
        markers.current = [];

        if (!items.length) return;
        const geocoder = new window.google.maps.Geocoder();
        items.forEach(item => {
            const address = [item.location?.village, item.location?.district, item.location?.state || 'Maharashtra', 'India'].filter(Boolean).join(', ');
            geocoder.geocode({ address }, (results, status) => {
                if (status !== 'OK' || !results[0]) return;
                const marker = new window.google.maps.Marker({
                    position: results[0].geometry.location, map,
                    title: item.name,
                    icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(40, 40) },
                });
                const iw = new window.google.maps.InfoWindow({
                    content: `<div style="padding:10px;font-family:'Inter',sans-serif;min-width:180px"><h3 style="margin:0 0 4px;font-weight:800;color:#111827;font-size:15px">${item.name}</h3><p style="margin:0 0 6px;font-size:12px;color:#6B7280">${item.location?.village || ''}, ${item.location?.district || ''}</p><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-weight:800;color:#2E7D32;font-size:14px">₹${item.priceHr}/hr</span><button onclick="window.location.href='/booking/${item._id}'" style="background:#2E7D32;color:#fff;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">Book Now</button></div></div>`,
                });
                marker.addListener('click', () => iw.open(map, marker));
                markers.current.push(marker);
            });
        });
    }, [viewMode, mapsReady, items, selDistrict, selState]);

    // ── Helpers ───────────────────────────────────────────────
    const toggleCat = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    const handleStateChange = (s) => { setSelState(s); setSelDistrict(''); setSelTaluka(''); setSelVillage(''); };
    const handleDistrictChange = (d) => { setSelDistrict(d); setSelTaluka(''); setSelVillage(''); };
    const handleTalukaChange = (ta) => { setSelTaluka(ta); setSelVillage(''); };

    const resetAll = () => {
        setSelectedCats([]); setPriceRange(5000);
        setSelState(''); setSelDistrict(''); setSelTaluka(''); setSelVillage('');
    };

    // Build the location label for the results header
    const locationLabel = [selVillage, selTaluka, selDistrict, selState].filter(Boolean).join(', ') || 'All India';

    // ── Styles ────────────────────────────────────────────────
    const selStyle = {
        width: '100%', padding: '9px 12px', borderRadius: '9px',
        border: '1.5px solid #E5E7EB', fontSize: '13px', outline: 'none',
        background: '#FAFAFA', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'border-color 0.2s', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        paddingRight: '30px',
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Sticky Search Header ───────────────────────── */}
            <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '260px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search tractors, harvesters, villages…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = '#2E7D32'}
                            onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                        />
                    </div>

                    {/* Location breadcrumb pill */}
                    {(selDistrict || selState !== 'Maharashtra') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '999px', padding: '6px 14px', fontSize: '13px', color: '#15803D', fontWeight: 600 }}>
                            <MapPin size={14} />
                            {locationLabel}
                            <button type="button" onClick={resetAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0 0 0 4px', display: 'flex' }}>
                                <X size={13} />
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '10px', padding: '4px' }}>
                        {[['grid', <Grid size={16} />, 'Grid'], ['map', <MapIcon size={16} />, 'Map']].map(([mode, icon, label]) => (
                            <button key={mode} type="button" onClick={() => setViewMode(mode)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: viewMode === mode ? '#fff' : 'transparent', color: viewMode === mode ? '#2E7D32' : '#6B7280', boxShadow: viewMode === mode ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                                {icon} {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', minHeight: 'calc(100vh - 84px)' }}>

                {/* ── Left Sidebar ───────────────────────────── */}
                <aside style={{ width: isFilterOpen ? '300px' : '0', overflow: 'hidden', transition: 'width 0.3s ease', background: '#fff', borderRight: '1px solid #E5E7EB', flexShrink: 0 }}>
                    <div style={{ padding: '20px', minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <Filter size={18} color="#2E7D32" /> Filters
                            </h2>
                            <button type="button" onClick={resetAll} style={{ background: 'none', border: 'none', color: '#2E7D32', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                Reset All
                            </button>
                        </div>

                        {/* ── LOCATION SECTION ─────────────────── */}
                        <FilterSection title="📍 Location" defaultOpen={true}>
                            {/* State */}
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>State</label>
                                <select value={selState} onChange={e => handleStateChange(e.target.value)} style={selStyle}
                                    onFocus={e => e.target.style.borderColor = '#2E7D32'}
                                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}>
                                    <option value="">-- All States --</option>
                                    {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* District */}
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>District</label>
                                <select value={selDistrict} onChange={e => handleDistrictChange(e.target.value)} style={{ ...selStyle, opacity: districtOptions.length ? 1 : 0.5 }}
                                    disabled={!districtOptions.length}
                                    onFocus={e => e.target.style.borderColor = '#2E7D32'}
                                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}>
                                    <option value="">-- All Districts --</option>
                                    {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Taluka / Sub-district */}
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Taluka / Sub-district</label>
                                <select value={selTaluka} onChange={e => handleTalukaChange(e.target.value)} style={{ ...selStyle, opacity: talukaOptions.length ? 1 : 0.5 }}
                                    disabled={!talukaOptions.length}
                                    onFocus={e => e.target.style.borderColor = '#2E7D32'}
                                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}>
                                    <option value="">-- All Talukas --</option>
                                    {talukaOptions.map(ta => <option key={ta} value={ta}>{ta}</option>)}
                                </select>
                            </div>

                            {/* Village / City search */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }}>Village / City</label>
                                <input
                                    type="text"
                                    placeholder="Type village or city…"
                                    value={selVillage}
                                    onChange={e => setSelVillage(e.target.value)}
                                    style={{ ...selStyle, backgroundImage: 'none', paddingRight: '12px' }}
                                    onFocus={e => e.target.style.borderColor = '#2E7D32'}
                                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                                />
                            </div>

                        </FilterSection>

                        {/* ── CATEGORY SECTION ───────────────────── */}
                        <FilterSection title="🚜 Category" defaultOpen={true}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', maxHeight: '260px', overflowY: 'auto' }}>
                                {CATEGORIES.map(cat => (
                                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#4B5563', cursor: 'pointer', padding: '5px 8px', borderRadius: '8px', background: selectedCats.includes(cat.id) ? '#F0FDF4' : 'transparent', transition: 'background 0.15s' }}>
                                        <input type="checkbox" checked={selectedCats.includes(cat.id)} onChange={() => toggleCat(cat.id)}
                                            style={{ width: '16px', height: '16px', accentColor: '#2E7D32', cursor: 'pointer' }} />
                                        <span>{cat.icon} {cat[language] || cat.en}</span>
                                    </label>
                                ))}
                            </div>
                        </FilterSection>

                        {/* ── PRICE SECTION ──────────────────────── */}
                        <FilterSection title="💰 Max Price / Hour" defaultOpen={true}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>₹100</span>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#2E7D32' }}>₹{priceRange.toLocaleString()}/hr</span>
                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>₹5,000+</span>
                            </div>
                            <input type="range" min="100" max="5000" step="100" value={priceRange}
                                onChange={e => setPriceRange(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: '#2E7D32', cursor: 'pointer' }} />
                        </FilterSection>
                    </div>
                </aside>

                {/* ── Main Content ───────────────────────────── */}
                <main style={{ flex: 1, padding: '24px', position: 'relative', overflow: 'auto' }}>

                    {/* Results Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                                <strong style={{ color: '#111827' }}>{loading ? '…' : items.length}</strong> available tools in{' '}
                                <strong style={{ color: '#2E7D32' }}>{locationLabel}</strong>
                            </p>
                        </div>
                        {/* Active filter pills */}
                        {selectedCats.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {selectedCats.map(c => {
                                    const cat = CATEGORIES.find(x => x.id === c);
                                    return (
                                        <span key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '999px', padding: '3px 10px', fontSize: '12px', color: '#15803D', fontWeight: 600 }}>
                                            {cat?.icon} {cat ? (cat[language] || cat.en) : c}
                                            <button type="button" onClick={() => toggleCat(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex' }}><X size={11} /></button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
                            <RefreshCw size={40} color="#2E7D32" className="animate-spin" />
                            <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: 600 }}>Fetching equipment…</p>
                        </div>
                    ) : error ? (
                        <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
                            <X size={40} color="#B91C1C" style={{ margin: '0 auto 12px' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#B91C1C' }}>Error loading equipment</h3>
                            <p style={{ fontSize: '14px', color: '#991B1B' }}>{error}</p>
                            <button onClick={fetchItems} style={{ marginTop: '16px', background: '#B91C1C', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Try Again</button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        items.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {items.map(item => (
                                    <EquipmentCard
                                        key={item._id}
                                        id={item._id}
                                        name={item.name}
                                        category={item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Equipment'}
                                        priceHr={item.priceHr}
                                        location={[item.location?.village, item.location?.district].filter(Boolean).join(', ')}
                                        rating={item.rating || 0}
                                        reviews={item.reviewCount || 0}
                                        verified={item.verified !== false}
                                        images={item.images || []}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌾</div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>No equipment found in this area yet</h3>
                                <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '320px', margin: '0 auto' }}>
                                    Try adjusting your filters or searching for a different village.
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

            {/* ── Floating Filter Toggle ──────────────────────── */}
            <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{ position: 'fixed', bottom: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '999px', background: '#111827', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 50, fontWeight: 700, fontSize: '14px' }}
            >
                <Sliders size={18} /> {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
        </div>
    );
}
