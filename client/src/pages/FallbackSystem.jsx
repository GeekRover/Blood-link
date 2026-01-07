import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { fallbackAPI, requestAPI } from '../services/api';
import { AlertCircle, MapPin, RefreshCw, Zap, TrendingUp, Clock } from 'lucide-react';

/**
 * FallbackSystem - Admin page for managing unmatched blood requests
 * Features:
 * - View all unmatched requests
 * - Trigger system-wide fallback processing
 * - Process individual requests
 * - View facility suggestions
 * - Statistics on unmatched requests
 */
export default function FallbackSystem() {
  const { user } = useAuth();
  const [unmatchedRequests, setUnmatchedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [systemProcessing, setSystemProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [showFacilities, setShowFacilities] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    urgent: 0,
    normal: 0
  });

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  // Load unmatched requests
  useEffect(() => {
    fetchUnmatchedRequests();
  }, []);

  const fetchUnmatchedRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fallbackAPI.getUnmatched();
      setUnmatchedRequests(data.data || []);

      // Calculate stats
      const statsData = {
        total: data.data?.length || 0,
        critical: data.data?.filter(r => r.urgency === 'critical').length || 0,
        urgent: data.data?.filter(r => r.urgency === 'urgent').length || 0,
        normal: data.data?.filter(r => r.urgency === 'normal').length || 0
      };
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load unmatched requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSystemFallback = async () => {
    if (!window.confirm('Run fallback system for ALL unmatched requests? This will expand search radius and notify donors.')) {
      return;
    }

    try {
      setSystemProcessing(true);
      setError(null);
      await fallbackAPI.runSystemFallback();
      setSuccess('Fallback system processed successfully. Checking for unmatched requests...');

      // Refresh the list
      setTimeout(() => {
        fetchUnmatchedRequests();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to run fallback system');
      console.error(err);
    } finally {
      setSystemProcessing(false);
    }
  };

  const handleProcessSingleRequest = async (requestId) => {
    if (!window.confirm('Process fallback for this request? This will expand radius and notify donors.')) {
      return;
    }

    try {
      setError(null);
      await fallbackAPI.processSingleFallback(requestId);
      setSuccess('Request processed successfully');

      setTimeout(() => {
        fetchUnmatchedRequests();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to process request');
      console.error(err);
    }
  };

  const handleViewFacilities = async (requestId) => {
    try {
      setError(null);
      setSelectedRequest(requestId);
      const data = await fallbackAPI.suggestFacilities(requestId);
      setFacilities(data.facilities || []);
      setShowFacilities(true);
    } catch (err) {
      setError(err.message || 'Failed to load facilities');
      console.error(err);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'urgent':
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600" />
          Fallback System
        </h1>
        <p className="text-gray-600">Manage unmatched blood requests and trigger fallback mechanisms</p>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard label="Total Unmatched" value={stats.total} color="blue" />
        <StatCard label="Critical" value={stats.critical} color="red" />
        <StatCard label="Urgent" value={stats.urgent} color="orange" />
        <StatCard label="Normal" value={stats.normal} color="yellow" />
      </motion.div>

      {/* System Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            System Actions
          </h2>
          <p className="text-gray-600 mb-4">
            Run the fallback system to automatically expand search radius, notify donors, and suggest facilities for all unmatched requests.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunSystemFallback}
            disabled={systemProcessing || unmatchedRequests.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {systemProcessing ? 'Processing...' : `Run Fallback System (${unmatchedRequests.length} requests)`}
          </motion.button>
        </div>
      </motion.div>

      {/* Unmatched Requests List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Unmatched Requests</h2>
          <p className="text-gray-600 text-sm mt-1">Requests without matched donors</p>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin">
              <RefreshCw className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 mt-2">Loading requests...</p>
          </div>
        ) : unmatchedRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No unmatched requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Request ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Blood Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {unmatchedRequests.map((request, idx) => (
                    <motion.tr
                      key={request._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm text-gray-900">{request._id.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-gray-900">{request.patientName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          {request.bloodType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 w-fit ${getUrgencyColor(request.urgency)}`}>
                          {getUrgencyIcon(request.urgency)}
                          {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 text-sm">{request.hospital}</td>
                      <td className="px-6 py-4 space-x-2 flex">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleProcessSingleRequest(request._id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Process
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewFacilities(request._id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Facilities
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Facilities Modal */}
      <AnimatePresence>
        {showFacilities && (
          <FacilitiesModal
            facilities={facilities}
            onClose={() => setShowFacilities(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Statistics Card Component
function StatCard({ label, value, color }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-lg shadow-md p-6 text-white`}>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

// Facilities Modal Component
function FacilitiesModal({ facilities, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto"
      >
        <div className="sticky top-0 bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Suggested Facilities</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {facilities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No facilities found nearby</p>
          ) : (
            facilities.map((facility, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <h4 className="font-semibold text-gray-900">{facility.name}</h4>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {facility.location}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Distance: <span className="font-semibold">{facility.distance?.toFixed(1)} km</span>
                </p>
                {facility.availableBloodTypes && (
                  <p className="text-sm text-gray-600 mt-1">
                    Blood Types: <span className="font-semibold">{facility.availableBloodTypes.join(', ')}</span>
                  </p>
                )}
                {facility.contact && (
                  <p className="text-sm text-gray-600 mt-1">
                    Contact: <span className="font-semibold">{facility.contact}</span>
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
