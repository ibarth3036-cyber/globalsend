import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Navbar, DbBanner } from './components/Navbar'
import { BottomNav } from './components/BottomNav'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { TawkTo } from './components/TawkTo'
import { useAuth } from './contexts/AuthContext'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { PublicTracking } from './pages/PublicTracking'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Transfer } from './pages/Transfer'
import { Deposit } from './pages/Deposit'
import { ParcelTracker } from './pages/ParcelTracker'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { ProfilePage } from './pages/Profile'
import { Notifications } from './pages/Notifications'
import { AdminDashboard } from './pages/Admin/AdminDashboard'
import { AdminUsers } from './pages/Admin/AdminUsers'
import { AdminTransactions } from './pages/Admin/AdminTransactions'
import { AdminTracking } from './pages/Admin/AdminTracking'
import { AdminCompanyAccounts } from './pages/Admin/AdminCompanyAccounts'
import { InfoPage } from './pages/info/InfoPage'
import './App.css'

function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/transfer') ||
    pathname.startsWith('/deposit') || pathname.startsWith('/track') ||
    pathname.startsWith('/history') || pathname.startsWith('/settings') ||
    pathname.startsWith('/profile') || pathname.startsWith('/admin') ||
    pathname.startsWith('/notifications') || pathname.startsWith('/admin/accounts')

  return (
    <div className="app">
      <TawkTo />
      <DbBanner />
      <Navbar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/track/:code" element={<PublicTracking />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<InfoPage slug="about" />} />
          <Route path="/careers" element={<InfoPage slug="careers" />} />
          <Route path="/contact" element={<InfoPage slug="contact" />} />
          <Route path="/shipping" element={<InfoPage slug="shipping" />} />
          <Route path="/quote" element={<InfoPage slug="quote" />} />
          <Route path="/help" element={<InfoPage slug="help" />} />
          <Route path="/faq" element={<InfoPage slug="faq" />} />
          <Route path="/claim" element={<InfoPage slug="claim" />} />
          <Route path="/mobile-app" element={<InfoPage slug="mobile-app" />} />
          <Route path="/developers" element={<InfoPage slug="developers" />} />
          <Route path="/supply-chain" element={<InfoPage slug="supply-chain" />} />
          <Route path="/terms" element={<InfoPage slug="terms" />} />
          <Route path="/privacy" element={<InfoPage slug="privacy" />} />
          <Route path="/fraud-prevention" element={<InfoPage slug="fraud-prevention" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
          <Route path="/track" element={<ProtectedRoute><ParcelTracker /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
          <Route path="/admin/tracking" element={<AdminRoute><AdminTracking /></AdminRoute>} />
          <Route path="/admin/accounts" element={<AdminRoute><AdminCompanyAccounts /></AdminRoute>} />
        </Routes>
      </div>
      {user && isDashboard && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
