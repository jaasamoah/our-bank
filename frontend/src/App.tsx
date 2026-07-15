import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Transfer from './pages/Transfer'
import Cards from './pages/Cards'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

import AdminLogin from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import AdminUsers from './admin/pages/Users'
import AdminAccounts from './admin/pages/AdminAccounts'
import AdminTransactions from './admin/pages/AdminTransactions'
import AdminCards from './admin/pages/AdminCards'
import AdminLoans from './admin/pages/Loans'
import AdminKYC from './admin/pages/KYC'
import AdminNotifications from './admin/pages/Notifications'
import AdminFXRates from './admin/pages/FXRates'
import AdminAuditLogs from './admin/pages/AuditLogs'
import AdminProtectedRoute from './admin/components/AdminProtectedRoute'
import { AdminAuthProvider } from './admin/context/AdminAuthContext'

import './index.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
              {/* Customer routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
              <Route path="/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
              <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
              <Route path="/admin/accounts" element={<AdminProtectedRoute><AdminAccounts /></AdminProtectedRoute>} />
              <Route path="/admin/transactions" element={<AdminProtectedRoute><AdminTransactions /></AdminProtectedRoute>} />
              <Route path="/admin/cards" element={<AdminProtectedRoute><AdminCards /></AdminProtectedRoute>} />
              <Route path="/admin/loans" element={<AdminProtectedRoute><AdminLoans /></AdminProtectedRoute>} />
              <Route path="/admin/kyc" element={<AdminProtectedRoute><AdminKYC /></AdminProtectedRoute>} />
              <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>} />
              <Route path="/admin/fx-rates" element={<AdminProtectedRoute><AdminFXRates /></AdminProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<AdminProtectedRoute><AdminAuditLogs /></AdminProtectedRoute>} />
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App
