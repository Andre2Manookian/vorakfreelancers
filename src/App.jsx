import { BrowserRouter, Routes, Route }
  from 'react-router-dom'
import { AuthProvider, useAuth } from
  './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/Toast'
import { Suspense, lazy } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from
  './components/ProtectedRoute'
import AdminRoute from
  './components/AdminRoute'
import ErrorBoundary from './components/ErrorBoundary'
import BannedScreen from './components/BannedScreen'

const Landing = lazy(() =>
  import('./pages/Landing'))
const Login = lazy(() =>
  import('./pages/Login'))
const Signup = lazy(() =>
  import('./pages/Signup'))
const ForgotPassword = lazy(() =>
  import('./pages/ForgotPassword'))
const ResetPassword = lazy(() =>
  import('./pages/ResetPassword'))
const Onboarding = lazy(() =>
  import('./pages/Onboarding'))
const Dashboard = lazy(() =>
  import('./pages/Dashboard'))
const BrowseTalent = lazy(() =>
  import('./pages/BrowseTalent'))
const TalentProfile = lazy(() =>
  import('./pages/TalentProfile'))
const BrowseJobs = lazy(() =>
  import('./pages/BrowseJobs'))
const JobDetail = lazy(() =>
  import('./pages/JobDetail'))
const PostJob = lazy(() =>
  import('./pages/PostJob'))
const BrowseServices = lazy(() =>
  import('./pages/BrowseServices'))
const ServiceDetail = lazy(() =>
  import('./pages/ServiceDetail'))
const PostService = lazy(() =>
  import('./pages/PostService'))
const Contract = lazy(() =>
  import('./pages/Contract'))
const Messages = lazy(() =>
  import('./pages/Messages'))
const Settings = lazy(() =>
  import('./pages/Settings'))
const Verification = lazy(() =>
  import('./pages/Verification'))
const Withdrawal = lazy(() =>
  import('./pages/Withdrawal'))
const About = lazy(() =>
  import('./pages/About'))
const FAQ = lazy(() =>
  import('./pages/FAQ'))
const Terms = lazy(() =>
  import('./pages/Terms'))
const Privacy = lazy(() =>
  import('./pages/Privacy'))
const Roadmap = lazy(() =>
  import('./pages/Roadmap'))
const CategoryTalent = lazy(() =>
  import('./pages/CategoryTalent'))
const NotFound = lazy(() =>
  import('./pages/NotFound'))

const AdminDashboard = lazy(() =>
  import('./admin/AdminDashboard'))
const AdminUsers = lazy(() =>
  import('./admin/AdminUsers'))
const AdminContracts = lazy(() =>
  import('./admin/AdminContracts'))
const AdminPayments = lazy(() =>
  import('./admin/AdminPayments'))
const AdminWithdrawals = lazy(() =>
  import('./admin/AdminWithdrawals'))
const AdminVerifications = lazy(() =>
  import('./admin/AdminVerifications'))
const AdminChats = lazy(() =>
  import('./admin/AdminChats'))
const AdminDisputes = lazy(() =>
  import('./admin/AdminDisputes'))
const AdminReports = lazy(() =>
  import('./admin/AdminReports'))
const AdminSettings = lazy(() =>
  import('./admin/AdminSettings'))
const AdminServices = lazy(() =>
  import('./admin/AdminServices'))
const AdminJobs = lazy(() =>
  import('./admin/AdminJobs'))

const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid var(--border)',
      borderTop: '3px solid #0F6E56',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
)

const SafePage = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)

function BanGate({ children }) {
  const { bannedProfile } = useAuth()
  if (bannedProfile) return <BannedScreen profile={bannedProfile} />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <BanGate>
                <Routes>
                  <Route path="/" element={
                    <SafePage><Navbar /><Landing /><Footer /></SafePage>
                  } />
                  <Route path="/login" element={
                    <SafePage><Navbar /><Login /></SafePage>
                  } />
                  <Route path="/signup" element={
                    <SafePage><Navbar /><Signup /></SafePage>
                  } />
                  <Route path="/forgot-password" element={
                    <SafePage><Navbar /><ForgotPassword /></SafePage>
                  } />
                  <Route path="/reset-password" element={
                    <SafePage><Navbar /><ResetPassword /></SafePage>
                  } />
                  <Route path="/auth/callback" element={
                    <SafePage><Navbar /><ResetPassword /></SafePage>
                  } />
                  <Route path="/auth/confirm" element={
                    <SafePage><Navbar /><ResetPassword /></SafePage>
                  } />
                  <Route path="/talent" element={
                    <SafePage><Navbar /><BrowseTalent /><Footer /></SafePage>
                  } />
                  <Route path="/talent/:id" element={
                    <SafePage><Navbar /><TalentProfile /><Footer /></SafePage>
                  } />
                  <Route path="/talent/web-development" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/graphic-design" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/video-editing" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/digital-marketing" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/translation" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/mobile-apps" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/accounting" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/talent/content-writing" element={<SafePage><Navbar /><CategoryTalent /><Footer /></SafePage>} />
                  <Route path="/jobs" element={
                    <SafePage><Navbar /><BrowseJobs /><Footer /></SafePage>
                  } />
                  <Route path="/jobs/:id" element={
                    <SafePage><Navbar /><JobDetail /><Footer /></SafePage>
                  } />
                  <Route path="/services" element={
                    <SafePage><Navbar /><BrowseServices /><Footer /></SafePage>
                  } />
                  <Route path="/services/:id" element={
                    <SafePage><Navbar /><ServiceDetail /><Footer /></SafePage>
                  } />
                  <Route path="/about" element={
                    <SafePage><Navbar /><About /><Footer /></SafePage>
                  } />
                  <Route path="/faq" element={
                    <SafePage><Navbar /><FAQ /><Footer /></SafePage>
                  } />
                  <Route path="/terms" element={
                    <SafePage><Navbar /><Terms /><Footer /></SafePage>
                  } />
                  <Route path="/privacy" element={
                    <SafePage><Navbar /><Privacy /><Footer /></SafePage>
                  } />
                  <Route path="/roadmap" element={
                    <SafePage><Navbar /><Roadmap /><Footer /></SafePage>
                  } />

                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Onboarding /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Dashboard /><Footer /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/contracts/:id" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Contract /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Messages /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/post-job" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><PostJob /><Footer /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/post-service" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><PostService /><Footer /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Settings /><Footer /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/verify" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Verification /><Footer /></SafePage>
                    </ProtectedRoute>
                  } />
                  <Route path="/withdrawal" element={
                    <ProtectedRoute>
                      <SafePage><Navbar /><Withdrawal /><Footer /></SafePage>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin" element={
                    <AdminRoute>
                      <SafePage><AdminDashboard /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/users" element={
                    <AdminRoute>
                      <SafePage><AdminUsers /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/contracts" element={
                    <AdminRoute>
                      <SafePage><AdminContracts /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/payments" element={
                    <AdminRoute>
                      <SafePage><AdminPayments /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/withdrawals" element={
                    <AdminRoute>
                      <SafePage><AdminWithdrawals /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/verifications"
                    element={
                      <AdminRoute>
                        <SafePage><AdminVerifications /></SafePage>
                      </AdminRoute>
                    } />
                  <Route path="/admin/chats" element={
                    <AdminRoute>
                      <SafePage><AdminChats /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/disputes" element={
                    <AdminRoute>
                      <SafePage><AdminDisputes /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <AdminRoute>
                      <SafePage><AdminReports /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <AdminRoute>
                      <SafePage><AdminSettings /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/services" element={
                    <AdminRoute>
                      <SafePage><AdminServices /></SafePage>
                    </AdminRoute>
                  } />
                  <Route path="/admin/jobs" element={
                    <AdminRoute>
                      <SafePage><AdminJobs /></SafePage>
                    </AdminRoute>
                  } />

                  <Route path="*" element={
                    <SafePage><Navbar /><NotFound /></SafePage>
                  } />
                </Routes>
              </BanGate>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
