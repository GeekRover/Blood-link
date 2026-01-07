/**
 * Manual Test for Donation History Immutability
 * Run with: node src/tests/donationImmutabilityManualTest.js
 *
 * Tests the immutability logic without requiring database connection
 */

import mongoose from 'mongoose';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const pass = (msg) => console.log(`${colors.green}✓ PASS${colors.reset}: ${msg}`);
const fail = (msg) => console.log(`${colors.red}✗ FAIL${colors.reset}: ${msg}`);
const section = (msg) => console.log(`\n${colors.blue}══════ ${msg} ══════${colors.reset}`);

let testsPassed = 0;
let testsFailed = 0;

function assertEqual(actual, expected, testName) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    pass(testName);
    testsPassed++;
  } else {
    fail(`${testName}\n   Expected: ${expectedStr}\n   Actual: ${actualStr}`);
    testsFailed++;
  }
}

function assertTrue(actual, testName) {
  if (actual === true) {
    pass(testName);
    testsPassed++;
  } else {
    fail(`${testName}\n   Expected: true\n   Actual: ${actual}`);
    testsFailed++;
  }
}

function assertFalse(actual, testName) {
  if (actual === false) {
    pass(testName);
    testsPassed++;
  } else {
    fail(`${testName}\n   Expected: false\n   Actual: ${actual}`);
    testsFailed++;
  }
}

console.log('\n🩸 BloodLink Donation History Immutability - Manual Tests\n');

// ============================================================
section('Immutability Rules Tests');
// ============================================================

// Import the model schema to test static methods
import DonationHistory from '../models/DonationHistory.js';

// Test getImmutabilityRules static method
const rules = DonationHistory.getImmutabilityRules();

assertEqual(
  rules.alwaysImmutable,
  ['donor', 'donationDate', 'bloodType'],
  'Always immutable fields are correct'
);

assertEqual(
  rules.postVerificationImmutable.includes('unitsProvided'),
  true,
  'unitsProvided is post-verification immutable'
);

assertEqual(
  rules.postVerificationImmutable.includes('healthCheckBefore'),
  true,
  'healthCheckBefore is post-verification immutable'
);

// ============================================================
section('Validate Update - Unlocked Donation');
// ============================================================

// Create mock donation (unlocked)
const unlockedDonation = {
  _id: new mongoose.Types.ObjectId(),
  donor: new mongoose.Types.ObjectId(),
  donationDate: new Date(),
  bloodType: 'O-',
  unitsProvided: 1,
  isLocked: false,
  lockedAt: null,
  lockedReason: null
};

// Test updating allowed fields on unlocked donation
let validation = DonationHistory.validateUpdate(unlockedDonation, {
  notes: 'Updated notes',
  complications: 'None'
}, false);

assertTrue(validation.allowed, 'Can update notes/complications on unlocked donation');
assertEqual(validation.errors.length, 0, 'No errors for allowed updates');

// Test trying to change always-immutable field
validation = DonationHistory.validateUpdate(unlockedDonation, {
  donor: new mongoose.Types.ObjectId()
}, false);

assertFalse(validation.allowed, 'Cannot change donor field (always immutable)');
assertTrue(validation.errors.length > 0, 'Error returned for donor change attempt');
assertEqual(validation.errors[0].field, 'donor', 'Error is for donor field');

// Test trying to change donationDate
validation = DonationHistory.validateUpdate(unlockedDonation, {
  donationDate: new Date()
}, false);

assertFalse(validation.allowed, 'Cannot change donationDate (always immutable)');

// Test trying to change bloodType
validation = DonationHistory.validateUpdate(unlockedDonation, {
  bloodType: 'A+'
}, false);

assertFalse(validation.allowed, 'Cannot change bloodType (always immutable)');

// ============================================================
section('Validate Update - Locked Donation (No Override)');
// ============================================================

// Create mock locked donation
const lockedDonation = {
  _id: new mongoose.Types.ObjectId(),
  donor: new mongoose.Types.ObjectId(),
  donationDate: new Date(),
  bloodType: 'O-',
  unitsProvided: 1,
  isLocked: true,
  lockedAt: new Date(),
  lockedReason: 'verified'
};

// Test updating post-verification immutable field without override
validation = DonationHistory.validateUpdate(lockedDonation, {
  unitsProvided: 2
}, false);

assertFalse(validation.allowed, 'Cannot change unitsProvided on locked donation without override');
assertTrue(
  validation.errors.some(e => e.field === 'unitsProvided'),
  'Error is for unitsProvided field'
);

// Test updating notes (allowed even on locked donation)
validation = DonationHistory.validateUpdate(lockedDonation, {
  notes: 'Updated notes'
}, false);

assertTrue(validation.allowed, 'Can update notes on locked donation');

// ============================================================
section('Validate Update - Admin Override');
// ============================================================

// Test updating post-verification immutable field WITH override
validation = DonationHistory.validateUpdate(lockedDonation, {
  unitsProvided: 2
}, true); // isAdminOverride = true

assertTrue(validation.allowed, 'Can change unitsProvided with admin override');
assertTrue(
  validation.warnings.some(w => w.field === 'unitsProvided'),
  'Warning returned for admin override'
);

// Test updating healthCheckBefore with admin override
validation = DonationHistory.validateUpdate(lockedDonation, {
  healthCheckBefore: { bloodPressure: '120/80' }
}, true);

assertTrue(validation.allowed, 'Can change healthCheckBefore with admin override');

// Test that even admin cannot change always-immutable fields
validation = DonationHistory.validateUpdate(lockedDonation, {
  donor: new mongoose.Types.ObjectId()
}, true);

assertFalse(validation.allowed, 'Admin cannot change donor field (always immutable)');
assertEqual(validation.errors[0].field, 'donor', 'Error is for donor field');

// Test admin cannot change bloodType
validation = DonationHistory.validateUpdate(lockedDonation, {
  bloodType: 'A+'
}, true);

assertFalse(validation.allowed, 'Admin cannot change bloodType (always immutable)');

// ============================================================
section('Mixed Updates');
// ============================================================

// Test multiple updates at once (mix of allowed and disallowed)
validation = DonationHistory.validateUpdate(lockedDonation, {
  notes: 'New notes',        // Always allowed
  unitsProvided: 2,          // Requires override
  donor: new mongoose.Types.ObjectId()  // Never allowed
}, false);

assertFalse(validation.allowed, 'Mixed updates with disallowed fields fails');
assertTrue(
  validation.errors.some(e => e.field === 'donor'),
  'Error includes donor field'
);
assertTrue(
  validation.errors.some(e => e.field === 'unitsProvided'),
  'Error includes unitsProvided field'
);

// Test with admin override (only always-immutable should fail)
validation = DonationHistory.validateUpdate(lockedDonation, {
  notes: 'New notes',
  unitsProvided: 2,
  donor: new mongoose.Types.ObjectId()
}, true);

assertFalse(validation.allowed, 'Mixed updates with always-immutable fails even with override');
assertEqual(validation.errors.length, 1, 'Only one error (for donor)');
assertEqual(validation.errors[0].field, 'donor', 'Error is for donor field');
assertTrue(
  validation.warnings.some(w => w.field === 'unitsProvided'),
  'Warning for unitsProvided (allowed with override)'
);

// ============================================================
// Summary
// ============================================================

console.log('\n' + '═'.repeat(50));
console.log(`\n${colors.yellow}Test Summary:${colors.reset}`);
console.log(`  ${colors.green}Passed: ${testsPassed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${testsFailed}${colors.reset}`);
console.log(`  Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}✗ Some tests failed!${colors.reset}\n`);
  process.exit(1);
}
