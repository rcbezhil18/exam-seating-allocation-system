import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Building, ClipboardList, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${color.bg}`} />
    
    <div className="flex justify-between items-start relative z-10">
      <div>
        <h3 className="text-4xl font-black text-slate-800 tracking-tight">{value}</h3>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4">{title}</p>
        
        {trend && (
           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend.positive ? '' : 'rotate-180'}`} />
              {trend.value}% vs last month
           </span>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${color.iconBg}`}>
        <Icon className={`w-6 h-6 ${color.icon}`} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ students: 0, rooms: 0, exams: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, rooms, exams] = await Promise.all([
          api.get('/students'),
          api.get('/rooms'),
          api.get('/exams')
        ]);
        setStats({
          students: students.data.length,
          rooms: rooms.data.length,
          exams: exams.data.length
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
     <div className="p-8 h-full flex justify-center items-center">
       <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
     </div>
  );

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-2 font-medium">Real-time metrics for your institution's examination infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard 
          title="Total Students" 
          value={stats.students} 
          icon={Users} 
          color={{ bg: 'bg-blue-500', iconBg: 'bg-blue-50', icon: 'text-blue-600' }}
          trend={{ positive: true, value: 12.5 }}
        />
        <StatCard 
          title="Active Rooms" 
          value={stats.rooms} 
          icon={Building} 
          color={{ bg: 'bg-emerald-500', iconBg: 'bg-emerald-50', icon: 'text-emerald-600' }}
          trend={{ positive: true, value: 3.2 }}
        />
        <StatCard 
          title="Upcoming Exams" 
          value={stats.exams} 
          icon={ClipboardList} 
          color={{ bg: 'bg-indigo-500', iconBg: 'bg-indigo-50', icon: 'text-indigo-600' }}
        />
      </div>

      <div className="mt-12 bg-slate-900 rounded-3xl shadow-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Setup Guide</h2>
              <div className="space-y-4">
                {[
                  { title: "Upload Students Roster", desc: "Navigate to students to upload registry data.", no: 1},
                  { title: "Configure Halls", desc: "Set rows and columns capacity in the Rooms tab.", no: 2},
                  { title: "Schedule an Exam", desc: "Create new exams specifying date and subjects.", no: 3},
                  { title: "Generate Seats", desc: "Run the algorithm to securely distribute students.", no: 4}
                ].map((step, i) => (
                   <div key={i} className="flex gap-4 items-start">
                     <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs shrink-0 mt-0.5">{step.no}</span>
                     <div>
                       <h4 className="text-white font-semibold text-sm">{step.title}</h4>
                       <p className="text-slate-400 text-xs mt-0.5">{step.desc}</p>
                     </div>
                   </div>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/> Student Portal Active
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Students can now log in using their <strong>Register Number</strong> as their username, and their <strong>Date of Birth (DD-MM-YYYY)</strong> as their password.
                </p>
                <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-white/5">
                   <p className="text-xs font-mono text-slate-400">&lt;Access Control enforcing strict data isolation /&gt;</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
