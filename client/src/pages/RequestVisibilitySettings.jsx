import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { requestAPI } from '../services/api';
import { MapPin, Loader, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * RequestVisibilitySettings - Donor page to control their visibility and search radius
 * Features:
 * - View current visibility radius
 * - Adjust search radius (10-500 km)
 * - View visibility information
 * - Real-time feedback
 */
export default function RequestVisibilitySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibilityInfo, setVisibilityInfo] = useState(null);
  const [radius, setRadius] = useState(50);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    loadVisibilityInfo();
  }, []);

  const loadVisibilityInfo = async () => {
    try {
      setLoading(true);
      const data = await requestAPI.getDonorVisibilityInfo();
      setVisibilityInfo(data);
      setRadius(data.radius || 50);
      setUnsavedChanges(false);
    } catch (err) {
      toast.error(err.message || 'Failed to load visibility settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    setUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      await requestAPI.updateDonorRadius({ radius });
      toast.success('Visibility settings updated successfully');
      await loadVisibilityInfo();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading your visibility settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 max-w-3xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-blue-600" />
          Request Visibility Settings
        </h1>
        <p className="text-gray-600">Control how far blood requests can find you and adjust your search radius</p>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <InfoCard
            icon={<MapPin className="w-6 h-6" />}
            title="Current Radius"
            value={`${visibilityInfo?.radius || 50} km`}
            description="Your blood request search range"
            color="blue"
          />
          <InfoCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Visible Requests"
            value={visibilityInfo?.visibleRequests || 0}
            description="Active requests within your radius"
            color="green"
          />
        </motion.div>

        {/* Radius Adjustment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Adjust Search Radius</h2>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              A larger radius helps you find more blood requests, but you may receive notifications from farther locations. Smaller radius means requests closer to you.
            </p>
          </div>

          {/* Radius Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold text-gray-900">Search Radius</label>
              <motion.div
                key={radius}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="text-2xl font-bold text-blue-600"
              >
                {radius} km
              </motion.div>
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>10 km (very close)</span>
              <span>500 km (very far)</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick presets:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[25, 50, 100, 250].map((presetRadius) => (
                <motion.button
                  key={presetRadius}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRadiusChange(presetRadius)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    radius === presetRadius
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {presetRadius} km
                </motion.button>
              ))}
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Current Settings</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Search Radius</p>
                <p className="font-semibold text-gray-900">{visibilityInfo?.radius || 50} km</p>
              </div>
              <div>
                <p className="text-gray-600">Visible Requests</p>
                <p className="font-semibold text-gray-900">{visibilityInfo?.visibleRequests || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Blood Type</p>
                <p className="font-semibold text-gray-900">{user?.bloodType || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-semibold text-gray-900">{visibilityInfo?.status || 'Active'}</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadVisibilityInfo}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              disabled={saving}
            >
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveChanges}
              disabled={!unsavedChanges || saving}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                unsavedChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>

          {unsavedChanges && (
            <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              You have unsaved changes
            </p>
          )}
        </motion.div>

        {/* About Visibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Your Visibility</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How Visibility Works</h3>
              <p>
                Your visibility radius determines how far recipients can search to find you as a blood donor. With a larger radius, your profile appears in more searches, but you may receive requests from farther locations.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Changing Your Radius</h3>
              <p>
                You can update your radius anytime. A larger radius (250-500 km) is great if you're flexible and willing to travel. A smaller radius (10-50 km) is better if you prefer requests closer to home.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Blood Type Matching</h3>
              <p>
                Only recipients searching for your blood type will find you. Your current blood type is{' '}
                <span className="font-semibold text-red-600">{user?.bloodType}</span>. Update this in your profile if
                needed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Notification Settings</h3>
              <p>
                When a blood request is found within your radius and matches your blood type, you'll receive a notification. You can choose to respond or decline.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8"
        >
          <h2 className="text-2xl font-bold text-green-900 mb-4">Tips for Maximum Impact</h2>
          <ul className="space-y-2 text-green-900">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Set a radius that matches your comfort level for travel</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Larger radius means more opportunities to save lives</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Update your availability status to get relevant requests</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Keep your profile information up to date</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({ icon, title, value, description, color }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${colorMap[color]} rounded-lg shadow-md p-6 text-white`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="opacity-30">{icon}</div>
      </div>
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-80 mt-2">{description}</p>
    </motion.div>
  );
}
