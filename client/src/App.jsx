import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { DarkModeProvider } from './context/DarkModeContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import './styles/app.css';
import './styles/navbar.css';
import './styles/homepage.css';
import './styles/footer.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonorSearch from './pages/DonorSearch';
import BloodRequests from './pages/BloodRequests';
import DonationHistory from './pages/DonationHistory';
import Chat from './pages/Chat';
import Leaderboard from './pages/Leaderboard';
import Blog from './pages/Blog';
import Events from './pages/Events';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PageTransition><Dashboard /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/search-donors"
          element={
            <PrivateRoute>
              <PageTransition><DonorSearch /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <PrivateRoute>
              <PageTransition><BloodRequests /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/donations"
          element={
            <PrivateRoute>
              <PageTransition><DonationHistory /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <PageTransition><Chat /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <PageTransition><Profile /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PrivateRoute>
              <PageTransition><EditProfile /></PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PageTransition><AdminDashboard /></PageTransition>
            </AdminRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <Router future={{ v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="app">
            <Navbar />
            <main className="main-content">
              <AnimatedRoutes />
            </main>
            <Footer />

          {/* React Hot Toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: 'inherit',
              },
              success: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fff',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
