import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ShieldAlert, BookOpen, GraduationCap, Building2 } from 'lucide-react';

const Login = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ ...res.data.user, role: 'coordinator' }));
      window.location.href = '/'; 
    } catch (err) {
      setError(err.response?.data?.msg || 'Admin login failed');
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/student-login', { username: studentId, password: dob });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/student/dashboard';
    } catch (err) {
      setError(err.response?.data?.msg || 'Student login failed. Check ID and Format (DD-MM-YYYY).');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 flex items-center justify-center overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 max-w-5xl w-full mx-auto p-4 flex flex-col md:flex-row gap-8 items-center justify-center">
        
        {/* Left Branding Panel */}
        <div className="text-white hidden md:flex flex-col max-w-md w-full pr-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-extrabold tracking-tight">ExamSeat</h1>
          </div>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            The intelligent, automated seat allocation platform built for universities and institutions to streamline exam administration.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="p-2 bg-blue-500/10 rounded-lg"><BookOpen className="w-5 h-5 text-blue-400"/></div>
              <span>Timely Schedules & Maps</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><ShieldAlert className="w-5 h-5 text-emerald-400"/></div>
              <span>Secure Allocation Engine</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <div className="p-2 bg-purple-500/10 rounded-lg"><GraduationCap className="w-5 h-5 text-purple-400"/></div>
              <span>Centralized Student Portal</span>
            </div>
          </div>
        </div>

        {/* Right Login Box */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${role === 'student' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${role === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Coordinator
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {role === 'student' ? 'Welcome Back, Student' : 'Administrator Login'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {role === 'student' ? 'Log in to view your timetable and hall tickets.' : 'Access the master dashboard to manage capacity.'}
          </p>

          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm animate-pulse">
              {error}
            </div>
          )}

          {role === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email</label>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 mt-2">
                Log In
              </button>
            </form>
          ) : (
            <form onSubmit={handleStudentLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Register Number</label>
                <input 
                  type="text" required value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  placeholder="E.g. REG202345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth (Password)</label>
                <input 
                  type="text" required value={dob} onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                  placeholder="DD-MM-YYYY"
                />
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 mt-2">
                Access Portal
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
