/**
 * Map Controller
 * Handles endpoints for OpenStreetMap integration
 * Provides donor locations, hospital locations, and geospatial data
 */

import User from '../models/User.js';
import DonorProfile from '../models/DonorProfile.js';
import BloodRequest from '../models/BloodRequest.js';
import BloodCampEvent from '../models/BloodCampEvent.js';
import { calculateDistance } from '../utils/geoUtils.js';

/**
 * Get donors on map within radius
 * @route GET /api/map/donors
 * @access Public
 */
export const getDonorsOnMap = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50, // Default 50km radius
      bloodType,
      isAvailable
    } = req.query;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Build query
    const query = {
      role: 'donor',
      verificationStatus: 'verified',
      isActive: true
    };

    if (bloodType) {
      query.bloodType = bloodType;
    }

    // Find donors within radius using geospatial query
    const donors = await User.find({
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      }
    })
    .select('name bloodType location address')
    .limit(100); // Limit to 100 donors for performance

    // Get donor profiles to check availability
    const donorIds = donors.map(d => d._id);
    const profiles = await DonorProfile.find({
      user: { $in: donorIds }
    }).select('user isAvailable totalDonations lastDonationDate');

    // Create profile map for quick lookup
    const profileMap = {};
    profiles.forEach(profile => {
      profileMap[profile.user.toString()] = profile;
    });

    // Filter by availability if requested and add distance
    let donorData = donors.map(donor => {
      const profile = profileMap[donor._id.toString()];
      const distance = calculateDistance(
        latitude,
        longitude,
        donor.location.coordinates[1],
        donor.location.coordinates[0]
      );

      return {
        id: donor._id,
        name: donor.name,
        bloodType: donor.bloodType,
        location: {
          lat: donor.location.coordinates[1],
          lng: donor.location.coordinates[0]
        },
        address: donor.address,
        isAvailable: profile?.isAvailable || false,
        totalDonations: profile?.totalDonations || 0,
        distance: parseFloat(distance.toFixed(2))
      };
    });

    // Filter by availability if specified
    if (isAvailable !== undefined) {
      const availableFilter = isAvailable === 'true';
      donorData = donorData.filter(d => d.isAvailable === availableFilter);
    }

    res.status(200).json({
      success: true,
      data: {
        donors: donorData,
        count: donorData.length,
        center: { lat: latitude, lng: longitude },
        radius: radiusKm
      }
    });
  } catch (error) {
    console.error('Get donors on map error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donors for map'
    });
  }
};

/**
 * Get blood requests on map
 * @route GET /api/map/requests
 * @access Public
 */
export const getRequestsOnMap = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50,
      urgency,
      bloodType
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Build query
    const query = {
      status: { $in: ['pending', 'active'] }
    };

    if (urgency) {
      query.urgency = urgency;
    }

    if (bloodType) {
      query.bloodType = bloodType;
    }

    // Find requests within radius
    const requests = await BloodRequest.find({
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000
        }
      }
    })
    .populate('createdBy', 'name phone')
    .select('bloodType unitsNeeded urgency hospital location createdAt')
    .limit(50);

    const requestData = requests.map(req => {
      const distance = calculateDistance(
        latitude,
        longitude,
        req.location.coordinates[1],
        req.location.coordinates[0]
      );

      return {
        id: req._id,
        bloodType: req.bloodType,
        unitsNeeded: req.unitsNeeded,
        urgency: req.urgency,
        hospital: req.hospital,
        location: {
          lat: req.location.coordinates[1],
          lng: req.location.coordinates[0]
        },
        createdAt: req.createdAt,
        distance: parseFloat(distance.toFixed(2))
      };
    });

    res.status(200).json({
      success: true,
      data: {
        requests: requestData,
        count: requestData.length,
        center: { lat: latitude, lng: longitude },
        radius: radiusKm
      }
    });
  } catch (error) {
    console.error('Get requests on map error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests for map'
    });
  }
};

/**
 * Get blood camps on map
 * @route GET /api/map/blood-camps
 * @access Public
 */
export const getBloodCampsOnMap = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50,
      upcoming = 'true'
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Build query for upcoming or active camps
    const query = {};
    if (upcoming === 'true') {
      query.eventDate = { $gte: new Date() };
    }

    // Find blood camps within radius
    const camps = await BloodCampEvent.find({
      ...query,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000
        }
      }
    })
    .populate('organizer', 'name email phone')
    .select('title description eventDate location address contactNumber')
    .limit(50);

    const campData = camps.map(camp => {
      const distance = calculateDistance(
        latitude,
        longitude,
        camp.location.coordinates[1],
        camp.location.coordinates[0]
      );

      return {
        id: camp._id,
        title: camp.title,
        description: camp.description,
        eventDate: camp.eventDate,
        location: {
          lat: camp.location.coordinates[1],
          lng: camp.location.coordinates[0]
        },
        address: camp.address,
        contactNumber: camp.contactNumber,
        distance: parseFloat(distance.toFixed(2))
      };
    });

    res.status(200).json({
      success: true,
      data: {
        camps: campData,
        count: campData.length,
        center: { lat: latitude, lng: longitude },
        radius: radiusKm
      }
    });
  } catch (error) {
    console.error('Get blood camps on map error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blood camps for map'
    });
  }
};

/**
 * Get hospitals with blood type data
 * @route GET /api/map/hospitals
 * @access Public
 */
export const getHospitalsOnMap = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Get unique hospitals from blood requests
    const requests = await BloodRequest.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusKm * 1000
        }
      }
    }).select('hospital location');

    // Group by hospital and calculate distances
    const hospitalMap = new Map();

    requests.forEach(req => {
      const hospital = req.hospital;
      if (!hospitalMap.has(hospital)) {
        const distance = calculateDistance(
          latitude,
          longitude,
          req.location.coordinates[1],
          req.location.coordinates[0]
        );

        hospitalMap.set(hospital, {
          name: hospital,
          location: {
            lat: req.location.coordinates[1],
            lng: req.location.coordinates[0]
          },
          distance: parseFloat(distance.toFixed(2)),
          requestCount: 1
        });
      } else {
        const existing = hospitalMap.get(hospital);
        existing.requestCount += 1;
      }
    });

    const hospitals = Array.from(hospitalMap.values());

    res.status(200).json({
      success: true,
      data: {
        hospitals,
        count: hospitals.length,
        center: { lat: latitude, lng: longitude },
        radius: radiusKm
      }
    });
  } catch (error) {
    console.error('Get hospitals on map error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hospitals for map'
    });
  }
};

/**
 * Get map summary data (all markers in one request)
 * @route GET /api/map/summary
 * @access Public
 */
export const getMapSummary = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 50
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Fetch all data in parallel
    const [donors, requests, camps] = await Promise.all([
      Donor.find({
        role: 'donor',
        verificationStatus: 'verified',
        isActive: true,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusKm * 1000
          }
        }
      })
      .select('name bloodType location')
      .limit(100),

      BloodRequest.find({
        status: { $in: ['pending', 'active'] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusKm * 1000
          }
        }
      })
      .select('bloodType urgency hospital location')
      .limit(50),

      BloodCamp.find({
        eventDate: { $gte: new Date() },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusKm * 1000
          }
        }
      })
      .select('title eventDate location')
      .limit(50)
    ]);

    res.status(200).json({
      success: true,
      data: {
        center: { lat: latitude, lng: longitude },
        radius: radiusKm,
        counts: {
          donors: donors.length,
          requests: requests.length,
          camps: camps.length
        },
        donors: donors.map(d => ({
          id: d._id,
          name: d.name,
          bloodType: d.bloodType,
          location: {
            lat: d.location.coordinates[1],
            lng: d.location.coordinates[0]
          }
        })),
        requests: requests.map(r => ({
          id: r._id,
          bloodType: r.bloodType,
          urgency: r.urgency,
          hospital: r.hospital,
          location: {
            lat: r.location.coordinates[1],
            lng: r.location.coordinates[0]
          }
        })),
        camps: camps.map(c => ({
          id: c._id,
          title: c.title,
          eventDate: c.eventDate,
          location: {
            lat: c.location.coordinates[1],
            lng: c.location.coordinates[0]
          }
        }))
      }
    });
  } catch (error) {
    console.error('Get map summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map summary'
    });
  }
};
