import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { leaderboardAPI } from '../services/api';
import LiquidBackground from '../components/LiquidBackground';
import SparklesCore from '../components/SparklesCore';
import AnimatedCounter from '../components/AnimatedCounter';
import { Trophy, Droplet, Award, Crown, Medal, Users } from 'lucide-react';

const Leaderboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await leaderboardAPI.get({ limit: 50 });
      setEntries(data.data.entries || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidBackground />
        <div className="relative z-10 text-center">
          <Trophy className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  const totalDonations = entries.reduce((sum, e) => sum + (e.totalDonations || 0), 0);
  const totalPoints = entries.reduce((sum, e) => sum + (e.points || 0), 0);

  return (
    <div className="home-page-modern">
      {/* Liquid Background */}
      <LiquidBackground />

      {/* Leaderboard Entries Section */}
      <section className="features-modern" style={{ background: 'transparent', backdropFilter: 'none', paddingTop: '1rem' }}>
        <div className="container-modern">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <h2 className="section-title">
              Top <span className="text-gradient">Champions</span>
            </h2>
            <p className="section-subtitle">
              Our most dedicated blood donors
            </p>
          </motion.div>

          <div className="mt-12 flex flex-col gap-4 max-w-7xl mx-auto">
            {entries.map((entry, index) => {
              const isTop3 = index < 3;
              const rankColor =
                entry.rank === 1 ? 'from-yellow-400 to-yellow-600' :
                entry.rank === 2 ? 'from-gray-300 to-gray-500' :
                entry.rank === 3 ? 'from-orange-400 to-orange-600' :
                'from-gray-200 to-gray-400';

              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.02, boxShadow: isTop3 ? '0 20px 40px rgba(220, 38, 38, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.1)' }}
                  className={`
                    relative overflow-hidden rounded-2xl p-6
                    bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl
                    border-2 ${isTop3 ? 'border-red-200 dark:border-red-900/50' : 'border-gray-200 dark:border-slate-700'}
                    shadow-lg hover:shadow-2xl transition-all duration-300
                  `}
                >
                  {/* Top 3 Background Glow */}
                  {isTop3 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 dark:from-red-500/10 dark:to-pink-500/10" />
                  )}

                  <div className="relative flex items-center gap-5">
                    {/* Rank Badge */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rankColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      {entry.rank === 1 && <Crown className="w-7 h-7 text-white" />}
                      {entry.rank === 2 && <Medal className="w-7 h-7 text-white" />}
                      {entry.rank === 3 && <Medal className="w-7 h-7 text-white" />}
                      {entry.rank > 3 && (
                        <span className="text-white font-bold text-xl">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg ring-4 ring-white/50 dark:ring-slate-700/50">
                      {entry.donor?.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-2">
                        {entry.donor?.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold">
                          <Droplet className="w-3.5 h-3.5" />
                          {entry.donor?.bloodType}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold">
                          {entry.badge}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {entry.totalDonations}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                          Donations
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                          {entry.points}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                          Points
                        </p>
                      </div>
                    </div>

                    {/* Trophy for top 3 */}
                    {isTop3 && (
                      <Trophy className="w-8 h-8 text-yellow-500 flex-shrink-0 hidden sm:block animate-pulse" />
                    )}
                  </div>

                  {/* Stats - Mobile */}
                  <div className="sm:hidden mt-5 pt-5 border-t border-gray-200 dark:border-slate-700 flex justify-around">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {entry.totalDonations}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Donations
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        {entry.points}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Points
                      </p>
                    </div>
                    {isTop3 && (
                      <div className="flex items-center">
                        <Trophy className="w-7 h-7 text-yellow-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Leaderboard;
