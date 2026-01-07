/**
 * Manual Test for Request Visibility Controls
 * Run with: node src/tests/visibilityManualTest.js
 *
 * Tests the visibility service functions without requiring database connection
 */

import {
  getCompatibleRecipientTypes,
  checkRequestVisibility
} from '../services/requestVisibilityService.js';

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

console.log('\n🩸 BloodLink Request Visibility Controls - Manual Tests\n');

// ============================================================
section('Blood Type Compatibility Tests');
// ============================================================

// O- Universal Donor Tests
assertEqual(
  getCompatibleRecipientTypes('O-'),
  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O- (universal donor) can donate to all blood types'
);

// O+ Tests
assertEqual(
  getCompatibleRecipientTypes('O+'),
  ['O+', 'A+', 'B+', 'AB+'],
  'O+ can donate to O+, A+, B+, AB+'
);

// A- Tests
assertEqual(
  getCompatibleRecipientTypes('A-'),
  ['A-', 'A+', 'AB-', 'AB+'],
  'A- can donate to A-, A+, AB-, AB+'
);

// A+ Tests
assertEqual(
  getCompatibleRecipientTypes('A+'),
  ['A+', 'AB+'],
  'A+ can donate to A+, AB+'
);

// B- Tests
assertEqual(
  getCompatibleRecipientTypes('B-'),
  ['B-', 'B+', 'AB-', 'AB+'],
  'B- can donate to B-, B+, AB-, AB+'
);

// B+ Tests
assertEqual(
  getCompatibleRecipientTypes('B+'),
  ['B+', 'AB+'],
  'B+ can donate to B+, AB+'
);

// AB- Tests
assertEqual(
  getCompatibleRecipientTypes('AB-'),
  ['AB-', 'AB+'],
  'AB- can donate to AB-, AB+'
);

// AB+ Tests (universal recipient, can only donate to AB+)
assertEqual(
  getCompatibleRecipientTypes('AB+'),
  ['AB+'],
  'AB+ can only donate to AB+'
);

// Invalid blood type
assertEqual(
  getCompatibleRecipientTypes('X+'),
  [],
  'Invalid blood type returns empty array'
);

// ============================================================
section('Visibility Check - Blood Type Filtering');
// ============================================================

// Mock donor with O- blood type
const oNegDonor = {
  _id: 'donor123',
  bloodType: 'O-',
  location: { coordinates: [90.4125, 23.8103] }, // Dhaka
  availabilityRadius: 50
};

// Mock donor with AB+ blood type
const abPosDonor = {
  _id: 'donor456',
  bloodType: 'AB+',
  location: { coordinates: [90.4125, 23.8103] },
  availabilityRadius: 50
};

// Request for A+ blood nearby
const aPosRequestNearby = {
  _id: 'req1',
  bloodType: 'A+',
  hospital: { location: { coordinates: [90.4200, 23.8150] } }, // ~1km away
  urgency: 'normal',
  matchedDonors: []
};

// Test O- can see A+ request
let result = checkRequestVisibility(aPosRequestNearby, oNegDonor);
assertTrue(result.visible, 'O- donor can see A+ request (compatible)');
assertEqual(result.reason, 'within_criteria', 'Reason is within_criteria');

// Test AB+ cannot see A+ request
result = checkRequestVisibility(aPosRequestNearby, abPosDonor);
assertFalse(result.visible, 'AB+ donor cannot see A+ request (incompatible)');
assertEqual(result.reason, 'blood_type_incompatible', 'Reason is blood_type_incompatible');

// ============================================================
section('Visibility Check - Distance Filtering');
// ============================================================

// Request far away (Chittagong, ~250km from Dhaka)
const farAwayRequest = {
  _id: 'req2',
  bloodType: 'A+',
  hospital: { location: { coordinates: [91.8325, 22.3569] } }, // Chittagong
  urgency: 'normal',
  matchedDonors: []
};

result = checkRequestVisibility(farAwayRequest, oNegDonor);
assertFalse(result.visible, 'Request outside radius is hidden');
assertEqual(result.reason, 'outside_radius', 'Reason is outside_radius');
assertTrue(result.distance > 50, `Distance (${result.distance}km) > 50km radius`);

// ============================================================
section('Visibility Check - Critical/Urgent Bypass');
// ============================================================

// Critical request far away
const criticalFarRequest = {
  _id: 'req3',
  bloodType: 'A+',
  hospital: { location: { coordinates: [91.8325, 22.3569] } },
  urgency: 'critical',
  matchedDonors: []
};

result = checkRequestVisibility(criticalFarRequest, oNegDonor);
assertTrue(result.visible, 'Critical request visible despite being outside radius');
assertEqual(result.reason, 'critical_urgent_bypass', 'Reason is critical_urgent_bypass');

// Urgent request far away
const urgentFarRequest = {
  _id: 'req4',
  bloodType: 'A+',
  hospital: { location: { coordinates: [91.8325, 22.3569] } },
  urgency: 'urgent',
  matchedDonors: []
};

result = checkRequestVisibility(urgentFarRequest, oNegDonor);
assertTrue(result.visible, 'Urgent request visible despite being outside radius');
assertEqual(result.reason, 'critical_urgent_bypass', 'Reason is critical_urgent_bypass');

// Critical request with incompatible blood type should still be hidden
const criticalIncompatibleRequest = {
  _id: 'req5',
  bloodType: 'A+',
  hospital: { location: { coordinates: [91.8325, 22.3569] } },
  urgency: 'critical',
  matchedDonors: []
};

result = checkRequestVisibility(criticalIncompatibleRequest, abPosDonor);
assertFalse(result.visible, 'Critical request with incompatible blood type is still hidden');
assertEqual(result.reason, 'blood_type_incompatible', 'Blood type check happens before distance');

// ============================================================
section('Visibility Check - Already Matched Bypass');
// ============================================================

// Request where donor is already matched (even if incompatible)
const matchedRequest = {
  _id: 'req6',
  bloodType: 'B+', // AB+ cannot normally donate to B+
  hospital: { location: { coordinates: [91.8325, 22.3569] } }, // Far away
  urgency: 'normal',
  matchedDonors: [{ donor: 'donor456' }] // AB+ donor is matched
};

result = checkRequestVisibility(matchedRequest, abPosDonor);
assertTrue(result.visible, 'Already matched donor can see request regardless of compatibility');
assertEqual(result.reason, 'already_matched', 'Reason is already_matched');

// ============================================================
section('Distance Calculation Verification');
// ============================================================

// Very close request (~1km)
const veryCloseRequest = {
  _id: 'req7',
  bloodType: 'O+',
  hospital: { location: { coordinates: [90.4130, 23.8108] } }, // ~0.5km
  urgency: 'normal',
  matchedDonors: []
};

result = checkRequestVisibility(veryCloseRequest, oNegDonor);
assertTrue(result.visible, 'Very close request is visible');
assertTrue(result.distance < 1, `Distance (${result.distance}km) < 1km`);

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
