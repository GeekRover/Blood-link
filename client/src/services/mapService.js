import api from './api';

/**
 * Map Service
 * API calls for OpenStreetMap integration
 */

/**
 * Get donors on map within radius
 * @param {Object} params - { lat, lng, radius, bloodType, isAvailable }
 * @returns {Promise} - Donors data
 */
export const getDonorsOnMap = async (params) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.lat) queryParams.append('lat', params.lat);
    if (params.lng) queryParams.append('lng', params.lng);
    if (params.radius) queryParams.append('radius', params.radius);
    if (params.bloodType) queryParams.append('bloodType', params.bloodType);
    if (params.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable);

    const response = await api.get(`/map/donors?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get donors on map error:', error);
    throw error.response?.data || { error: 'Failed to fetch donors for map' };
  }
};

/**
 * Get blood requests on map within radius
 * @param {Object} params - { lat, lng, radius, urgency, bloodType }
 * @returns {Promise} - Requests data
 */
export const getRequestsOnMap = async (params) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.lat) queryParams.append('lat', params.lat);
    if (params.lng) queryParams.append('lng', params.lng);
    if (params.radius) queryParams.append('radius', params.radius);
    if (params.urgency) queryParams.append('urgency', params.urgency);
    if (params.bloodType) queryParams.append('bloodType', params.bloodType);

    const response = await api.get(`/map/requests?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get requests on map error:', error);
    throw error.response?.data || { error: 'Failed to fetch requests for map' };
  }
};

/**
 * Get blood camps on map within radius
 * @param {Object} params - { lat, lng, radius, upcoming }
 * @returns {Promise} - Blood camps data
 */
export const getBloodCampsOnMap = async (params) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.lat) queryParams.append('lat', params.lat);
    if (params.lng) queryParams.append('lng', params.lng);
    if (params.radius) queryParams.append('radius', params.radius);
    if (params.upcoming !== undefined) queryParams.append('upcoming', params.upcoming);

    const response = await api.get(`/map/blood-camps?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get blood camps on map error:', error);
    throw error.response?.data || { error: 'Failed to fetch blood camps for map' };
  }
};

/**
 * Get hospitals on map within radius
 * @param {Object} params - { lat, lng, radius }
 * @returns {Promise} - Hospitals data
 */
export const getHospitalsOnMap = async (params) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.lat) queryParams.append('lat', params.lat);
    if (params.lng) queryParams.append('lng', params.lng);
    if (params.radius) queryParams.append('radius', params.radius);

    const response = await api.get(`/map/hospitals?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get hospitals on map error:', error);
    throw error.response?.data || { error: 'Failed to fetch hospitals for map' };
  }
};

/**
 * Get all map data in one request (donors, requests, camps)
 * @param {Object} params - { lat, lng, radius }
 * @returns {Promise} - All map data
 */
export const getMapSummary = async (params) => {
  try {
    const queryParams = new URLSearchParams();

    if (params.lat) queryParams.append('lat', params.lat);
    if (params.lng) queryParams.append('lng', params.lng);
    if (params.radius) queryParams.append('radius', params.radius);

    const response = await api.get(`/map/summary?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Get map summary error:', error);
    throw error.response?.data || { error: 'Failed to fetch map summary' };
  }
};

export default {
  getDonorsOnMap,
  getRequestsOnMap,
  getBloodCampsOnMap,
  getHospitalsOnMap,
  getMapSummary
};
