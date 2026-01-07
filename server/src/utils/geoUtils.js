/**
 * Geospatial Utilities
 * Helper functions for geographical calculations
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} - Angle in radians
 */
const toRad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return Infinity;
  }

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

/**
 * Calculate distance between two coordinate arrays [lon, lat]
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {number} - Distance in kilometers
 */
export const calculateDistanceFromCoords = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) {
    return Infinity;
  }

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  return calculateDistance(lat1, lon1, lat2, lon2);
};

/**
 * Check if a point is within radius of another point
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} - True if within radius
 */
export const isWithinRadius = (lat1, lon1, lat2, lon2, radiusKm) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
};

/**
 * Get bounding box coordinates for a center point and radius
 * Useful for initial filtering before expensive distance calculations
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} - { minLat, maxLat, minLon, maxLon }
 */
export const getBoundingBox = (lat, lon, radiusKm) => {
  const R = 6371; // Earth's radius in km

  // Angular distance in radians
  const rad = radiusKm / R;

  const minLat = lat - (rad * 180 / Math.PI);
  const maxLat = lat + (rad * 180 / Math.PI);

  // Account for longitude varying with latitude
  const minLon = lon - (rad * 180 / Math.PI) / Math.cos(lat * Math.PI / 180);
  const maxLon = lon + (rad * 180 / Math.PI) / Math.cos(lat * Math.PI / 180);

  return {
    minLat,
    maxLat,
    minLon,
    maxLon
  };
};

/**
 * Format distance for display
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} meters`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
};
