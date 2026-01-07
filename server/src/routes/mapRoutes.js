/**
 * Map Routes
 * Routes for OpenStreetMap integration and geospatial data
 */

import express from 'express';
import {
  getDonorsOnMap,
  getRequestsOnMap,
  getBloodCampsOnMap,
  getHospitalsOnMap,
  getMapSummary
} from '../controllers/mapController.js';

const router = express.Router();

/**
 * @route   GET /api/map/donors
 * @desc    Get donors on map within radius
 * @access  Public
 * @query   lat, lng, radius, bloodType, isAvailable
 */
router.get('/donors', getDonorsOnMap);

/**
 * @route   GET /api/map/requests
 * @desc    Get blood requests on map within radius
 * @access  Public
 * @query   lat, lng, radius, urgency, bloodType
 */
router.get('/requests', getRequestsOnMap);

/**
 * @route   GET /api/map/blood-camps
 * @desc    Get blood camps on map within radius
 * @access  Public
 * @query   lat, lng, radius, upcoming
 */
router.get('/blood-camps', getBloodCampsOnMap);

/**
 * @route   GET /api/map/hospitals
 * @desc    Get hospitals on map within radius
 * @access  Public
 * @query   lat, lng, radius
 */
router.get('/hospitals', getHospitalsOnMap);

/**
 * @route   GET /api/map/summary
 * @desc    Get all map data (donors, requests, camps) in one request
 * @access  Public
 * @query   lat, lng, radius
 */
router.get('/summary', getMapSummary);

export default router;
