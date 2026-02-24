/**
 * ════════════════════════════════════════════════════════
 *  KRISHI ASTRA SETU — Database Seeder
 *  Fills MongoDB with 1 Admin + 3 test farmers + 6 equipment
 *  Usage: node seeds/seed.js
 * ════════════════════════════════════════════════════════
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Equipment = require('../models/Equipment');

const DEMO_PASSWORD = 'password123';

// ── Seed Users ───────────────────────────────────────────────
const USERS = [
    {
        name: { first: 'Krishi', middle: 'Astra', last: 'Admin' },
        gender: 'Male',
        dob: new Date('1985-06-15'),
        age: 39,
        mobile: '9000000001',
        email: 'admin.krishiastrasetu@gmail.com',
        aadhaarNo: '100000000001',
        address: { houseNo: '1', village: 'Nashik', postOffice: 'Nashik HO', district: 'Nashik', pinCode: '422001', state: 'Maharashtra' },
        finance: { bankName: 'SBI', branchName: 'Nashik Main', accountNo: 'SBI0000000001', ifscCode: 'SBIN0000001', upiId: 'admin@upi' },
        role: 'Admin',
        kycStatus: 'Verified',
    },
    {
        name: { first: 'Ramesh', middle: 'Kumar', last: 'Patil' },
        gender: 'Male',
        dob: new Date('1980-03-22'),
        age: 44,
        mobile: '9876543210',
        email: 'ramesh.patil@gmail.com',
        aadhaarNo: '234567890123',
        address: { houseNo: '42', village: 'Pimpalgaon Baswant', postOffice: 'Pimpalgaon', block: 'Niphad', district: 'Nashik', pinCode: '422209', state: 'Maharashtra' },
        finance: { bankName: 'Bank of Maharashtra', branchName: 'Niphad', accountNo: 'BOM1234567890', ifscCode: 'MAHB0000100', upiId: 'ramesh@bom' },
        role: 'Member',
        kycStatus: 'Verified',
    },
    {
        name: { first: 'Sunita', middle: '', last: 'Shinde' },
        gender: 'Female',
        dob: new Date('1990-11-05'),
        age: 34,
        mobile: '9812345678',
        email: 'sunita.shinde@gmail.com',
        aadhaarNo: '345678901234',
        address: { houseNo: '8', village: 'Sangamner', postOffice: 'Sangamner', block: 'Sangamner', district: 'Ahmednagar', pinCode: '422605', state: 'Maharashtra' },
        finance: { bankName: 'ICICI Bank', branchName: 'Sangamner', accountNo: 'ICICI0098765', ifscCode: 'ICIC0001234', upiId: 'sunita@icici' },
        role: 'Member',
        kycStatus: 'Verified',
    },
    {
        name: { first: 'Anil', middle: 'Ganesh', last: 'Gaware' },
        gender: 'Male',
        dob: new Date('1975-01-18'),
        age: 49,
        mobile: '9765432109',
        email: 'anil.gaware@gmail.com',
        aadhaarNo: '456789012345',
        address: { houseNo: '15', village: 'Manchar', postOffice: 'Manchar', block: 'Ambegaon', district: 'Pune', pinCode: '410503', state: 'Maharashtra' },
        finance: { bankName: 'HDFC Bank', branchName: 'Manchar', accountNo: 'HDFC0056789', ifscCode: 'HDFC0004567', upiId: 'anil@hdfc' },
        role: 'Member',
        kycStatus: 'Pending',
    },
];

// ── Seed Equipment (uses seeded user IDs) ────────────────────
const EQUIPMENT_TEMPLATES = [
    { name: 'Mahindra 575 DI', category: 'Tractor', brand: 'Mahindra', modelNo: '575 DI', priceHr: 350, priceDay: 2800, district: 'Nashik', specs: { horsePower: '42 HP', fuelType: 'Diesel', condition: 'Good' } },
    { name: 'John Deere 5050 D', category: 'Tractor', brand: 'John Deere', modelNo: '5050D', priceHr: 500, priceDay: 4000, district: 'Nashik', specs: { horsePower: '50 HP', fuelType: 'Diesel', condition: 'New' } },
    { name: 'Kubota DC-70 Pro', category: 'Harvester', brand: 'Kubota', modelNo: 'DC-70 Pro', priceHr: 800, priceDay: 6000, district: 'Ahmednagar', specs: { horsePower: '70 HP', fuelType: 'Diesel', condition: 'Good' } },
    { name: 'Universal Disc Plough', category: 'Plough', brand: 'Shaktiman', modelNo: 'DP-5', priceHr: 150, priceDay: 1200, district: 'Nashik', specs: { horsePower: 'N/A', fuelType: 'Other', condition: 'Good' } },
    { name: 'Kirloskar Drip Irrigation Set', category: 'Irrigation', brand: 'Kirloskar', modelNo: 'KDS-2000', priceHr: 120, priceDay: 900, district: 'Pune', specs: { horsePower: 'N/A', fuelType: 'Electric', condition: 'Good' } },
    { name: 'VST Rice Seeder 8-Row', category: 'Seeding Machine', brand: 'VST Tillers', modelNo: 'RS-8', priceHr: 200, priceDay: 1600, district: 'Ahmednagar', specs: { horsePower: '14 HP', fuelType: 'Diesel', condition: 'Fair' } },
];

// ── Seed Images (public placeholder farm images) ─────────────
const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1594677-95781034a87f?w=600', // tractor red
    'https://images.unsplash.com/photo-1625246333195-78d73c5c4834?w=600', // tractor green
    'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600', // harvester
    'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=600', // farm field
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600', // irrigation
    'https://images.unsplash.com/photo-1554830072-52d78d0d4c18?w=600', // seeder
];

// ════════════════════════════════════════════════════════════
async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Wipe existing seed data (by emails)
        const emails = USERS.map(u => u.email);
        await User.deleteMany({ email: { $in: emails } });
        console.log('🗑️  Cleared previous seed users');

        // Hash password
        const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

        // Insert users
        const created = await User.insertMany(USERS.map(u => ({ ...u, password: hash })));
        console.log(`✅ Created ${created.length} users`);

        // Print credentials
        console.log('\n┌─ DEMO CREDENTIALS ────────────────────────────────┐');
        created.forEach(u => {
            console.log(`│  ${u.email.padEnd(38)} / ${DEMO_PASSWORD}  (${u.role.padEnd(6)}) KYC: ${u.kycStatus}`);
        });
        console.log('└───────────────────────────────────────────────────┘\n');

        // Clear existing equipment
        await Equipment.deleteMany({});
        console.log('🗑️  Cleared previous equipment');

        // Pick two verified users as equipment owners
        const owners = created.filter(u => u.kycStatus === 'Verified' && u.role === 'Member');
        const admin = created.find(u => u.role === 'Admin');

        const equipDocs = EQUIPMENT_TEMPLATES.map((tmpl, i) => ({
            ...tmpl,
            owner: (owners[i % owners.length] || admin)._id,
            location: { village: 'Seeds Village', district: tmpl.district, state: 'Maharashtra', pinCode: '422001' },
            images: [PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]],
            isAvailable: true,
            rating: (3.5 + Math.random() * 1.5).toFixed(1),
            reviewCount: Math.floor(5 + Math.random() * 30)
        }));

        const equipment = await Equipment.insertMany(equipDocs);
        console.log(`✅ Created ${equipment.length} equipment listings`);

        console.log('\n🎉 Database seeded successfully! Start the server and go to http://localhost:5173\n');
    } catch (err) {
        console.error('❌ Seeder error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
