import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, MapPin, CreditCard, LogOut, FileCheck, ScanLine, CheckCircle2, UploadCloud, Lock, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [feeStatus, setFeeStatus] = useState(user.payment_status || 'NOT_PAID');
  const [processing, setProcessing] = useState(false);
  const [txId, setTxId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const checkData = async () => {
      try {
        // Fetch fresh user data to reflect admin verification instantly
        const userRes = await api.get('/students/me');
        const freshUser = userRes.data;
        setUser(freshUser);
        setFeeStatus(freshUser.payment_status || 'NOT_PAID');
        localStorage.setItem('user', JSON.stringify(freshUser));

        // Fetch allocations
        const res = await api.get('/allocations/student/me');
        setAllocations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!txId) return alert("Please provide a Transaction ID.");
    
    setProcessing(true);
    try {
      const res = await api.post('/students/pay', { transaction_id: txId });
      
      setFeeStatus('PENDING');
      const updatedUser = { ...user, payment_status: 'PENDING' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowQRModal(false);
    } catch(err) {
      console.error(err);
      alert('Failed to submit payment details.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      <div className="bg-blue-600 pb-24 pt-8 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Portal</h1>
            <p className="text-blue-200 mt-1">Hello, {user.name} ({user.roll_no})</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-md"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 -mt-16 space-y-8 pb-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 flex items-center justify-between border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Scheduled Exams</p>
              <h2 className="text-4xl font-black text-slate-800">{allocations.length}</h2>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 flex items-center justify-between border border-slate-100">
            <div className="w-full">
              <p className="text-sm font-semibold text-slate-400 mb-1">Exam Fee Status</p>
              <div className="flex items-center gap-3">
                 <h2 className="text-4xl font-black text-slate-800">₹{user.fee_amount || '0.00'}</h2>
                 {feeStatus === 'VERIFIED' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Payment Completed</span>}
                 {feeStatus === 'PENDING' && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase rounded-full tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Waiting for admin verification</span>}
                 {feeStatus === 'NOT_PAID' && <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold uppercase rounded-full tracking-wider">NOT PAID</span>}
              </div>
              
              {feeStatus === 'NOT_PAID' && (
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-slate-300"
                >
                  <ScanLine className="w-4 h-4" /> Pay Now
                </button>
              )}
              {feeStatus === 'PENDING' && (
                 <div className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-2 rounded-lg text-sm font-bold border border-slate-200 cursor-not-allowed">
                    <Lock className="w-4 h-4"/> Payment Under Review by Admin
                 </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3 bg-white">
             <FileCheck className="w-6 h-6 text-blue-600" />
             <h3 className="text-xl font-bold text-slate-800">My Exam Timetable & Seating</h3>
          </div>
          
          {loading ? (
             <div className="p-8 text-center text-slate-400 animate-pulse">Loading schedule...</div>
          ) : allocations.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-600">No Exams Scheduled</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">Check back later when the coordinator publishes the seating arrangement.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allocations.map((a, idx) => (
                <div key={idx} className="p-8 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="mb-4 md:mb-0">
                    <h4 className="text-xl font-bold text-slate-800">{a.exam_name}</h4>
                    <p className="text-slate-500 flex items-center gap-2 mt-2 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" /> 
                      {new Date(a.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100 flex flex-col items-end min-w-[140px]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Room</span>
                      <span className="text-lg font-black text-blue-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {a.room_no}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">{a.building}</span>
                    </div>
                    
                    <div className="bg-slate-50 px-6 py-4 rounded-xl border border-slate-100 flex flex-col items-end min-w-[140px]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Seat Pos</span>
                      <span className="text-lg font-black text-rose-500">R{a.seat_row}-C{a.seat_col}</span>
                      <span className="text-xs text-slate-500 mt-1">Confirmed</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            <div className="bg-slate-900 p-6 text-center">
              <h3 className="text-xl font-bold text-white">Complete Payment</h3>
              <p className="text-slate-400 text-sm mt-1">Scan QR Code with any UPI App and enter Transaction ID</p>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="w-full flex flex-col md:flex-row gap-6 mb-8">
                 <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl p-2 flex items-center justify-center bg-slate-50">
                   <img src="/payment-qr.png" alt="Payment QR" className="max-w-[160px] object-contain rounded-xl" onError={(e) => {
                     e.target.onerror = null; 
                     e.target.src = "https://via.placeholder.com/150?text=Scan+Me";
                   }}/>
                 </div>
                 <div className="flex-1 flex justify-center flex-col">
                    <h4 className="text-4xl font-black text-slate-800 mb-1">₹{user.fee_amount || '0.00'}</h4>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Total Dues</p>
                 </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="w-full space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">UTR / Transaction ID</label>
                    <input type="text" value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. 123456789012" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                 </div>
                 


                <div className="w-full flex gap-3 mt-6 pt-4">
                  <button type="button" onClick={() => setShowQRModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing || !txId} className="flex-1 py-3 flex justify-center items-center gap-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50">
                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Submit for Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;
