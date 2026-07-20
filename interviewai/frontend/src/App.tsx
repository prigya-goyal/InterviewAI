import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import ProblemList from '@/pages/problems/ProblemList';
import ProblemDetail from '@/pages/problems/ProblemDetail';
import AIInterview from '@/pages/interview/AIInterview';
import InterviewResults from '@/pages/interview/InterviewResults';
import Profile from '@/pages/Profile';
import Companies from '@/pages/companies/Companies';
import CompanyDetail from '@/pages/companies/CompanyDetail';
import Contests from '@/pages/contests/Contests';
import ContestDetail from '@/pages/contests/ContestDetail';
import Analytics from '@/pages/Analytics';
import Roadmap from '@/pages/Roadmap';
import Leaderboard from '@/pages/Leaderboard';
import AdminPanel from '@/pages/admin/AdminPanel';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#161C27', color: '#E7ECF3', border: '1px solid #232B38', fontSize: '13px' },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected — wrapped individually so each keeps the shared Layout */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            <Route path="/problems" element={<ProtectedRoute><ProblemList /></ProtectedRoute>} />
            <Route path="/problems/:slug" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />

            <Route path="/interview" element={<ProtectedRoute><AIInterview /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<ProtectedRoute><AIInterview /></ProtectedRoute>} />
            <Route path="/interview/:id/results" element={<ProtectedRoute><InterviewResults /></ProtectedRoute>} />

            <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/companies/:slug" element={<ProtectedRoute><CompanyDetail /></ProtectedRoute>} />

            <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
            <Route path="/contests/:slug" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />

            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
