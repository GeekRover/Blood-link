import validator from 'validator';
import { BLOOD_TYPES, MIN_AGE, MAX_AGE } from '../config/constants.js';

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  // Bangladesh phone format: +8801XXXXXXXXX or 01XXXXXXXXX
  const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate blood type
 */
export const isValidBloodType = (bloodType) => {
  return BLOOD_TYPES.includes(bloodType);
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0
  });
};

/**
 * Validate date of birth and check age eligibility
 */
export const isValidAge = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age >= MIN_AGE && age <= MAX_AGE;
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (longitude, latitude) => {
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return validator.escape(input);
};

/**
 * Validate date is in future
 */
export const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Validate units required
 */
export const isValidUnits = (units) => {
  return Number.isInteger(units) && units >= 1 && units <= 10;
};

export default {
  isValidEmail,
  isValidPhone,
  isValidBloodType,
  isStrongPassword,
  isValidAge,
  isValidCoordinates,
  sanitizeInput,
  isFutureDate,
  isValidUnits
};
