/**
 * Quick API test — runs with: node seeds/test-admin.js
 * Tests: login → admin stats → admin users list
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const http = require('http');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost', port: 5000,
            path, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = http.request(options, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost', port: 5000,
            path, method: 'GET',
            headers: { 'x-auth-token': token }
        };
        const req = http.request(options, res => {
            let raw = '';
            res.on('data', d => raw += d);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('=== Krishi Astra Setu API Test ===\n');

    // 1. Login
    const login = await post('/api/auth/login', {
        email: 'admin.krishiastrasetu@gmail.com',
        password: 'password123'
    });
    console.log('1. Login status:', login.status);
    console.log('   success:', login.body.success);
    console.log('   role:', login.body.user?.role);
    console.log('   token:', login.body.token ? '✅ present' : '❌ MISSING');

    if (!login.body.token) {
        console.log('   FULL RESPONSE:', JSON.stringify(login.body, null, 2));
        return;
    }
    const token = login.body.token;

    // 2. Admin stats
    const stats = await get('/api/admin/stats', token);
    console.log('\n2. Admin stats status:', stats.status);
    console.log('   data:', JSON.stringify(stats.body));

    // 3. All users
    const users = await get('/api/admin/users', token);
    console.log('\n3. Admin users status:', users.status);
    console.log('   count:', users.body.data?.length ?? '❌ no data field');
    if (users.body.data?.length > 0) {
        users.body.data.forEach(u => {
            console.log(`   - ${u.email || '(no email)'} | role:${u.role} | kyc:${u.kycStatus}`);
        });
    }

    // 4. Pending users
    const pending = await get('/api/admin/users?status=Pending', token);
    console.log('\n4. Pending users status:', pending.status);
    console.log('   count:', pending.body.data?.length ?? '❌ no data field');
}

main().catch(err => console.error('Test error:', err.message));
