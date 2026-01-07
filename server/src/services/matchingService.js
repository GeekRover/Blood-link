import DonorProfile from '../models/DonorProfile.js';
import { DEFAULT_SEARCH_RADIUS_KM } from '../config/constants.js';
import { checkDonationEligibility as checkDonorEligibility } from './frequencyChecker.js';


/**
* Blood type compatibility matrix
* Defines which blood types can donate to which recipients
*/
const COMPATIBILITY_MATRIX = {
 'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
 'O+': ['O+', 'A+', 'B+', 'AB+'],
 'A-': ['A-', 'A+', 'AB-', 'AB+'],
 'A+': ['A+', 'AB+'],
 'B-': ['B-', 'B+', 'AB-', 'AB+'],
 'B+': ['B+', 'AB+'],
 'AB-': ['AB-', 'AB+'],
 'AB+': ['AB+']
};


/**
* Find compatible donors near a location
* @param {object} options - Search parameters
* @returns {Promise<Array>} - Array of compatible donors
*/
export const findCompatibleDonors = async ({
 bloodType,
 location, // { type: 'Point', coordinates: [lng, lat] }
 radius = DEFAULT_SEARCH_RADIUS_KM,
 urgency = 'normal',
 limit = 50
}) => {
 try {
   // Get compatible blood types
   const compatibleTypes = getCompatibleDonorTypes(bloodType);


   // Build query
   const query = {
     bloodType: { $in: compatibleTypes },
     isAvailable: true,
     isActive: true,
     verificationStatus: 'verified'
   };


   // Find donors within radius
   const donors = await DonorProfile.find({
     ...query,
     location: {
       $near: {
         $geometry: location,
         $maxDistance: radius * 1000 // Convert km to meters
       }
     }
   })
     .limit(limit)
     .select('-password')
     .lean();


   // Filter by eligibility - check against verified donation history and availability schedule
   const eligibilityChecks = await Promise.all(
     donors.map(async (donor) => {
       const eligibility = await checkDonorEligibility(donor._id);

       // Get full donor document to check time-based availability schedule
       const donorDoc = await DonorProfile.findById(donor._id);
       const isAvailable = donorDoc ? donorDoc.isAvailableAt(new Date()) : donor.isAvailable;

       return {
         donor,
         eligible: eligibility.eligible && isAvailable
       };
     })
   );


   const eligibleDonors = eligibilityChecks
     .filter(item => item.eligible)
     .map(item => item.donor);


   // Sort by priority
   return prioritizeDonors(eligibleDonors, urgency, location);
 } catch (error) {
   console.error('Error finding compatible donors:', error);
   throw error;
 }
};


/**
* Get blood types that can donate to the requested type
* @param {string} recipientBloodType - Blood type needed
* @returns {Array} - Compatible donor blood types
*/
const getCompatibleDonorTypes = (recipientBloodType) => {
 const compatible = [];


 for (const [donorType, canDonateTo] of Object.entries(COMPATIBILITY_MATRIX)) {
   if (canDonateTo.includes(recipientBloodType)) {
     compatible.push(donorType);
   }
 }


 return compatible;
};


/**
* Prioritize donors based on various factors
* @param {Array} donors - List of eligible donors
* @param {string} urgency - Request urgency level
* @param {object} location - Request location
* @returns {Array} - Sorted donors
*/
const prioritizeDonors = (donors, urgency, location) => {
 return donors.sort((a, b) => {
   // Calculate scores
   const scoreA = calculateDonorScore(a, urgency, location);
   const scoreB = calculateDonorScore(b, urgency, location);


   return scoreB - scoreA; // Higher score first
 });
};


/**
* Calculate donor priority score
*/
const calculateDonorScore = (donor, urgency, requestLocation) => {
 let score = 100;


 // Distance factor (closer is better)
 const distance = calculateDistance(
   donor.location.coordinates,
   requestLocation.coordinates
 );
 score -= distance * 0.5; // Deduct points based on distance


 // Donation history (more donations = higher priority)
 score += (donor.totalDonations || 0) * 5;


 // Notification preferences
 if (urgency === 'critical' && donor.preferences?.urgentOnly === false) {
   score -= 20;
 }


 // Exact blood type match bonus
 if (donor.bloodType === requestLocation.bloodType) {
   score += 10;
 }


 // Recent activity bonus
 if (donor.lastLogin) {
   const daysSinceLogin = Math.floor(
     (Date.now() - new Date(donor.lastLogin).getTime()) / (1000 * 60 * 60 * 24)
   );
   if (daysSinceLogin < 7) score += 15;
   else if (daysSinceLogin < 30) score += 5;
 }


 return Math.max(0, score);
};


/**
* Calculate distance between two points (Haversine formula)
* @param {Array} coord1 - [longitude, latitude]
* @param {Array} coord2 - [longitude, latitude]
* @returns {number} - Distance in kilometers
*/
const calculateDistance = (coord1, coord2) => {
 const [lon1, lat1] = coord1;
 const [lon2, lat2] = coord2;


 const R = 6371; // Earth's radius in km
 const dLat = toRad(lat2 - lat1);
 const dLon = toRad(lon2 - lon1);


 const a =
   Math.sin(dLat / 2) * Math.sin(dLat / 2) +
   Math.cos(toRad(lat1)) *
     Math.cos(toRad(lat2)) *
     Math.sin(dLon / 2) *
     Math.sin(dLon / 2);


 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 return R * c;
};


const toRad = (degrees) => {
 return (degrees * Math.PI) / 180;
};


/**
* Check blood type compatibility
* @param {string} donorType - Donor blood type
* @param {string} recipientType - Recipient blood type
* @returns {boolean} - Compatibility status
*/
export const checkCompatibility = (donorType, recipientType) => {
 return COMPATIBILITY_MATRIX[donorType]?.includes(recipientType) || false;
};


export default {
 findCompatibleDonors,
 checkCompatibility,
 getCompatibleDonorTypes
};



