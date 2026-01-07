import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { eventAPI } from '../services/api';
import LiquidBackground from '../components/LiquidBackground';
import { Calendar, Clock, MapPin, Users, ArrowRight, CalendarCheck } from 'lucide-react';

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventAPI.getAll();
      setEvents(data.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId, eventTitle) => {
    try {
      await eventAPI.register(eventId);
      toast.success(`Successfully registered for "${eventTitle}"!`, { icon: '✅' });
      fetchEvents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register for event';
      toast.error(errorMessage, { icon: '❌' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidBackground />
        <div className="relative z-10 text-center">
          <CalendarCheck className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600 dark:text-gray-300 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-modern">
      {/* Liquid Background */}
      <LiquidBackground />

      {/* Events Section */}
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
              Blood Camp <span className="text-gradient">Events</span>
            </h2>
            <p className="section-subtitle">
              Join us in saving lives at upcoming blood donation camps
            </p>
          </motion.div>

          <div className="mt-12 flex flex-col gap-8 max-w-7xl mx-auto px-4">
            {events.map((event, index) => (
              <motion.article
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl" style={{ padding: '2.5rem' }}>
                  <div className="flex flex-col justify-between">
                    <div>
                      {/* Event Status Badge */}
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-xs font-bold mb-4" style={{ padding: '0.5rem 1rem' }}>
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Upcoming Event
                      </span>

                      {/* Title */}
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-6">
                        {event.description || 'Join us for this blood donation camp and help save lives in your community.'}
                      </p>

                      {/* Event Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Date</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Time</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {event.startTime} - {event.endTime}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Venue</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {event.venue?.name || 'TBA'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                            <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Registration</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {event.registeredDonors?.length || 0} / {event.expectedDonors} Donors
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button - Right Aligned */}
                    <div className="flex justify-end" style={{ paddingTop: '1rem' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRegisterEvent(event._id, event.title)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 dark:bg-red-600 text-white font-semibold text-sm hover:bg-red-700 dark:hover:bg-red-700 transition-all duration-300 group/btn"
                        style={{ padding: '0.75rem 1.5rem' }}
                      >
                        <span>Register Now</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-16"
            >
              <CalendarCheck className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for upcoming blood donation camps!
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;
