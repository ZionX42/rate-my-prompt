#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * CSP Toggle Test Script
 * Tests the CSP enable/disable functionality end-to-end
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('🧪 Testing CSP Toggle Functionality...\n');

// Test 1: Check initial CSP status
console.log('1. Testing CSP status check...');
try {
  const response = await fetch('http://localhost:3000/api/admin/csp');
  const data = await response.json();

  if (response.ok) {
    console.log('✅ CSP status endpoint working');
    console.log(`   Current status: ${data.cspEnabled ? 'ENABLED' : 'DISABLED'}`);
  } else {
    console.log('❌ CSP status endpoint failed');
    process.exit(1);
  }
} catch (error) {
  console.log("❌ Could not connect to server. Make sure it's running with: npm run dev");
  process.exit(1);
}

// Test 2: Toggle CSP off
console.log('\n2. Testing CSP disable...');
try {
  const response = await fetch('http://localhost:3000/api/admin/csp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: false }),
  });

  const data = await response.json();

  if (response.ok && !data.cspEnabled) {
    console.log('✅ CSP successfully disabled');
  } else {
    console.log('❌ Failed to disable CSP');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error disabling CSP:', error.message);
  process.exit(1);
}

// Test 3: Verify CSP is disabled in middleware
console.log('\n3. Testing middleware CSP behavior (disabled)...');
try {
  const response = await fetch('http://localhost:3000/');
  const cspHeader = response.headers.get('Content-Security-Policy');

  if (cspHeader && cspHeader.includes('default-src *')) {
    console.log('✅ CSP correctly disabled in middleware');
  } else {
    console.log('❌ CSP not properly disabled in middleware');
    console.log('   CSP Header:', cspHeader);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error testing middleware:', error.message);
  process.exit(1);
}

// Test 4: Toggle CSP back on
console.log('\n4. Testing CSP re-enable...');
try {
  const response = await fetch('http://localhost:3000/api/admin/csp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });

  const data = await response.json();

  if (response.ok && data.cspEnabled) {
    console.log('✅ CSP successfully re-enabled');
  } else {
    console.log('❌ Failed to re-enable CSP');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error re-enabling CSP:', error.message);
  process.exit(1);
}

// Test 5: Verify CSP is enabled in middleware
console.log('\n5. Testing middleware CSP behavior (enabled)...');
try {
  const response = await fetch('http://localhost:3000/');
  const cspHeader = response.headers.get('Content-Security-Policy');

  if (cspHeader && cspHeader.includes("default-src 'self'")) {
    console.log('✅ CSP correctly enabled in middleware');
  } else {
    console.log('❌ CSP not properly enabled in middleware');
    console.log('   CSP Header:', cspHeader);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error testing middleware:', error.message);
  process.exit(1);
}

// Test 6: Verify .env file is updated
console.log('\n6. Testing .env file persistence...');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('CSP_ENABLED="true"')) {
    console.log('✅ .env file correctly updated');
  } else {
    console.log('❌ .env file not properly updated');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
  process.exit(1);
}

console.log('\n🎉 All CSP toggle tests passed!');
console.log('\n📋 Summary:');
console.log('   ✅ CSP status endpoint working');
console.log('   ✅ CSP can be disabled via API');
console.log('   ✅ CSP can be re-enabled via API');
console.log('   ✅ Middleware correctly applies CSP settings');
console.log('   ✅ .env file is properly updated');
console.log('\n🔒 CSP toggle functionality is working correctly!');
