import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/useAuth";
import { DarkModeProvider } from "./context/DarkModeContext";
import { ChatProvider } from "./context/ChatContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageTransition from "./components/PageTransition";
import ScrollToTop from "./components/ScrollToTop";
import "./styles/app.css";
import "./styles/navbar.css";
import "./styles/homepage.css";
import "./styles/footer.css";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DonorSearch from "./pages/DonorSearch";
import BloodRequests from "./pages/BloodRequests";
import DonationHistory from "./pages/DonationHistory";
import MatchedRequests from "./pages/MatchedRequests";
import Chat from "./pages/Chat";
import Leaderboard from "./pages/Leaderboard";
import Blog from "./pages/Blog";
import Events from "./pages/Events";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import AvailabilitySettings from "./pages/AvailabilitySettings";
import AdminDashboard from "./pages/AdminDashboard";
import AnalyticsDashboard from "./pages/Analytics/AnalyticsDashboard";
import UserVerification from "./pages/UserVerification";
import DonationVerification from "./pages/DonationVerification";
import BadgeManagement from "./pages/BadgeManagement";
import AuditLogs from "./pages/AuditLogs";
import SystemConfiguration from "./pages/SystemConfiguration";
import QRCodeScanner from "./pages/QRCodeScanner";
import FallbackSystem from "./pages/FallbackSystem";
import ChatModeration from "./pages/ChatModeration";
import ReviewModeration from "./pages/ReviewModeration";
import DonationImmutability from "./pages/DonationImmutability";
import RequestVisibilitySettings from "./pages/RequestVisibilitySettings";
import DigitalCardAdmin from "./pages/DigitalCardAdmin";
import AdminBlogManager from "./pages/AdminBlogManager";
import BlogArticle from "./pages/BlogArticle";
import AdminEventManager from "./pages/AdminEventManager";
import RecordDonation from "./pages/RecordDonation";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          }
        />
        <Route
          path="/register"
          element={
            <PageTransition>
              <Register />
            </PageTransition>
          }
        />
        <Route
          path="/blog"
          element={
            <PageTransition>
              <Blog />
            </PageTransition>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <PageTransition>
              <BlogArticle />
            </PageTransition>
          }
        />
        <Route
          path="/events"
          element={
            <PageTransition>
              <Events />
            </PageTransition>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PageTransition>
              <Leaderboard />
            </PageTransition>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/search-donors"
          element={
            <PrivateRoute>
              <PageTransition>
                <DonorSearch />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <PrivateRoute>
              <PageTransition>
                <BloodRequests />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/matched-requests"
          element={
            <PrivateRoute>
              <PageTransition>
                <MatchedRequests />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/donations"
          element={
            <PrivateRoute>
              <PageTransition>
                <DonationHistory />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/record-donation"
          element={
            <PrivateRoute>
              <PageTransition>
                <RecordDonation />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <PageTransition>
                <Chat />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <PrivateRoute>
              <PageTransition>
                <EditProfile />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <PrivateRoute>
              <PageTransition>
                <AvailabilitySettings />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/visibility-settings"
          element={
            <PrivateRoute>
              <PageTransition>
                <RequestVisibilitySettings />
              </PageTransition>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PageTransition>
                <AdminDashboard />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <PageTransition>
                <AnalyticsDashboard />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <AdminRoute>
              <PageTransition>
                <UserVerification />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/donations"
          element={
            <AdminRoute>
              <PageTransition>
                <DonationVerification />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/badges"
          element={
            <AdminRoute>
              <PageTransition>
                <BadgeManagement />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute>
              <PageTransition>
                <AuditLogs />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <AdminRoute>
              <PageTransition>
                <SystemConfiguration />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/fallback"
          element={
            <AdminRoute>
              <PageTransition>
                <FallbackSystem />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/chat-moderation"
          element={
            <AdminRoute>
              <PageTransition>
                <ChatModeration />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/review-moderation"
          element={
            <AdminRoute>
              <PageTransition>
                <ReviewModeration />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/donation-immutability"
          element={
            <AdminRoute>
              <PageTransition>
                <DonationImmutability />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/digital-cards"
          element={
            <AdminRoute>
              <PageTransition>
                <DigitalCardAdmin />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/scan-qr"
          element={
            <AdminRoute>
              <PageTransition>
                <QRCodeScanner />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/blogs"
          element={
            <AdminRoute>
              <PageTransition>
                <AdminBlogManager />
              </PageTransition>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminRoute>
              <PageTransition>
                <AdminEventManager />
              </PageTransition>
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
        <ChatProvider>
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
              position="bottom-center"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: "12px",
                  fontFamily: "inherit",
                },
                success: {
                  iconTheme: {
                    primary: "#dc2626",
                    secondary: "#fff",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#dc2626",
                    secondary: "#fff",
                  },
                },
                loading: {
                  iconTheme: {
                    primary: "#dc2626",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </div>
        </Router>
        </ChatProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
