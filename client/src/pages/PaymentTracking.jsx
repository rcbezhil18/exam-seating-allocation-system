import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { IndianRupee, ShieldCheck, CheckCircle2, XCircle, Search, FileText, X } from 'lucide-react';

const PaymentTracking = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');


  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleVerify = async (id, status) => {
    try {
      await api.put(`/students/verify-payment/${id}`, { status });
      const currentScroll = window.scrollY;
      await fetchStudents();
      setTimeout(() => window.scrollTo(0, currentScroll), 50);
    } catch(err) {
      alert("Verification failed");
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.roll_no.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || s.payment_status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-10 max-w-7xl mx-auto font-sans pb-24">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <IndianRupee className="w-8 h-8 text-emerald-600"/> Financials & Verification
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Verify student submitted payment receipts and transaction records.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex bg-slate-100 p-1 rounded-xl">
             {['All', 'PENDING', 'VERIFIED', 'NOT_PAID'].map(f => (
               <button 
                 key={f} 
                 onClick={() => setFilter(f)}
                 className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 {f === 'PENDING' ? 'Pending' : f === 'VERIFIED' ? 'Verified' : f === 'NOT_PAID' ? 'Not Paid' : 'All'} {f==='PENDING' && students.filter(s=>s.payment_status==='PENDING').length > 0 && <span className="ml-1 inline-flex items-center justify-center bg-rose-500 text-white rounded-full w-4 h-4 text-[10px]">{students.filter(s=>s.payment_status==='PENDING').length}</span>}
               </button>
             ))}
           </div>
           
           <div className="relative w-full md:w-64">
             <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
             <input type="text" placeholder="Search by Reg No or Name" value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fee Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Submission Details</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr><td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-medium">No records found for the current filter.</td></tr>
              ) : filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 text-base">{s.roll_no}</p>
                      <p className="text-sm font-medium text-slate-500 mt-1">{s.name}</p>
                  </td>
                  <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-700">₹{s.fee_amount}</span>
                          {s.payment_status === 'VERIFIED' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full tracking-widest">VERIFIED</span>}
                          {s.payment_status === 'PENDING' && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full tracking-widest">PENDING</span>}
                          {s.payment_status === 'NOT_PAID' && <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-full tracking-widest">NOT PAID</span>}
                      </div>
                  </td>
                  <td className="px-8 py-5">
                      {s.payment_status === 'NOT_PAID' ? (
                          <span className="text-slate-400 font-medium text-sm">No submission yet.</span>
                      ) : (
                          <div className="flex items-center gap-4">
                              {s.transaction_id && (
                                <div className="border border-slate-200 bg-white px-3 py-1.5 rounded-lg">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">TX ID / UTR</span>
                                  <span className="font-mono font-bold text-sm text-slate-700">{s.transaction_id}</span>
                                </div>
                              )}

                          </div>
                      )}
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2">
                     {s.payment_status === 'PENDING' && (
                       <>
                         <button onClick={() => handleVerify(s.id, 'VERIFIED')} className="flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" title="Approve">
                           <CheckCircle2 className="w-5 h-5"/>
                         </button>
                         <button onClick={() => handleVerify(s.id, 'NOT_PAID')} className="flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100" title="Reject">
                           <XCircle className="w-5 h-5"/>
                         </button>
                       </>
                     )}
                     {s.payment_status === 'VERIFIED' && (
                         <button onClick={() => handleVerify(s.id, 'NOT_PAID')} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors">
                           Revoke Approval
                         </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default PaymentTracking;
