import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building, ClipboardList, PackagePlus, LogOut, ShieldCheck, IndianRupee } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const userName = JSON.parse(localStorage.getItem('user'))?.name || 'Coordinator';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Students', path: '/students', icon: <Users className="w-5 h-5" /> },
    { name: 'Rooms', path: '/rooms', icon: <Building className="w-5 h-5" /> },
    { name: 'Exams', path: '/exams', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Verify Payments', path: '/payments', icon: <IndianRupee className="w-5 h-5" /> },
    { name: 'Generate Seats', path: '/generate', icon: <PackagePlus className="w-5 h-5" /> },
  ];

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col font-sans h-screen sticky top-0 shadow-2xl">
      {/* Brand */}
      <div className="h-24 flex items-center px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">ExamSeat</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Admin Portal</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto w-full">
        <p className="px-4 text-xs font-semibold text-slate-500 mb-4 uppercase tracking-widest">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 shadow-inner border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Logout */}
      <div className="p-4 mx-4 mb-4 border border-slate-700/50 bg-slate-800/50 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner">
            {userName.charAt(0)}
          </div>
          <div className="truncate">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
