import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rooms from './pages/Rooms';
import Exams from './pages/Exams';
import Generate from './pages/Generate';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import PaymentTracking from './pages/PaymentTracking';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) return <Navigate to="/login" />;
  
  const user = JSON.parse(userStr);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return user.role === 'student' ? <Navigate to="/student/dashboard" /> : <Navigate to="/" />;
  }
  
  return children;
};

const AuthGate = () => {
  const userStr = localStorage.getItem('user');
  if(userStr) {
    const user = JSON.parse(userStr);
    if(user.role === 'student') return <Navigate to="/student/dashboard" />;
    return <Navigate to="/" />;
  }
  return <Login />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname !== '/login' && !location.pathname.startsWith('/student');

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      {isAdminRoute && <Sidebar />}
      <div className="flex-1 flex flex-col relative overflow-hidden h-screen">
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<AuthGate />} />
          
          {/* Admin Routes */}
          <Route path="/" element={<PrivateRoute allowedRoles={['coordinator']}><Dashboard /></PrivateRoute>} />
          <Route path="/students" element={<PrivateRoute allowedRoles={['coordinator']}><Students /></PrivateRoute>} />
          <Route path="/rooms" element={<PrivateRoute allowedRoles={['coordinator']}><Rooms /></PrivateRoute>} />
          <Route path="/exams" element={<PrivateRoute allowedRoles={['coordinator']}><Exams /></PrivateRoute>} />
          <Route path="/generate" element={<PrivateRoute allowedRoles={['coordinator']}><Generate /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute allowedRoles={['coordinator']}><PaymentTracking /></PrivateRoute>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
