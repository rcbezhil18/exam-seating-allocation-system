import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Play, FileText, Search, LayoutGrid, AlertCircle, Eye, CheckCircle2 } from 'lucide-react';

const Generate = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [roomsDict, setRoomsDict] = useState({});
  const [searchRoll, setSearchRoll] = useState('');

  useEffect(() => {
    api.get('/exams').then(res => setExams(res.data)).catch(console.error);
  }, []);

  const fetchAllocations = async (examId) => {
    try {
      const res = await api.get(`/allocations/${examId}`);
      setAllocations(res.data);
      const grouped = res.data.reduce((acc, curr) => {
        if (!acc[curr.room_no]) acc[curr.room_no] = { ...curr, seats: [] };
        acc[curr.room_no].seats.push(curr);
        return acc;
      }, {});
      setRoomsDict(grouped);
      // Removed instant setResultMsg(null) so flash message persists
    } catch (err) {
      console.error(err);
    }
  };

  const handleExamChange = (e) => {
    const eid = e.target.value;
    setSelectedExamId(eid);
    if(eid) fetchAllocations(eid);
    else { setAllocations([]); setRoomsDict({}); }
  };

  const handleGenerate = async () => {
    if (!selectedExamId) return;
    setGenerating(true);
    try {
      const res = await api.post(`/allocations/generate/${selectedExamId}`);
      setResultMsg({ type: 'success', data: res.data });
      fetchAllocations(selectedExamId);
    } catch (err) {
      setResultMsg({ type: 'error', text: err.response?.data?.msg || 'Error generating seats' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadInvigilator = async (room_no) => {
    try {
      const roomsRes = await api.get('/rooms');
      const room = roomsRes.data.find(r => r.room_no === room_no);
      if(!room) return alert("Room not found");
      
      const response = await api.get(`/pdf/room/${room.id}/${selectedExamId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invigilator_${room_no}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch(err) {
      console.error('Failed to download PDF', err);
    }
  };

  const handleDownloadStudentHallTicket = async (studentId, rollNo) => {
    try {
      const response = await api.get(`/pdf/student/${studentId}/${selectedExamId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HallTicket_${rollNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch(err) {
      console.error('Failed to download PDF', err);
    }
  };

  const handleDownloadMaster = async () => {
    try {
      const response = await api.get(`/pdf/master/${selectedExamId}`, { responseType: 'blob' });
      const exam = exams.find(e => String(e.id) === String(selectedExamId));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Master_Arrangement_${exam?.name.replace(/\s+/g, '_') || 'Exam'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch(err) {
      console.error('Failed to download Master PDF', err);
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto font-sans pb-24">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <LayoutGrid className="text-blue-600 w-8 h-8" />
          Seating Engine
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Auto-distribute students across available halls with branch-alternating logic.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 mb-10 flex flex-col md:flex-row gap-6 items-end relative overflow-hidden">
        <div className="absolute -top-24 -right-12 w-64 h-64 bg-slate-50 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex-1 w-full relative z-10">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Exam Schedule</label>
          <select 
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold transition-all shadow-sm cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
            value={selectedExamId}
            onChange={handleExamChange}
          >
            <option value="">-- Dropdown to Select Exam --</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({new Date(e.date).toLocaleDateString()})</option>)}
          </select>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto relative z-10">
          <button 
            onClick={handleDownloadMaster}
            disabled={!selectedExamId || generating || allocations.length === 0}
            className="w-full md:w-auto px-6 py-4 h-[60px] bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-3 shrink-0"
          >
            <FileText className="w-5 h-5" /> Master PDF
          </button>
          
          <button 
            onClick={handleGenerate}
            disabled={!selectedExamId || generating}
            className="w-full md:w-auto px-10 py-4 h-[60px] bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-300 disabled:opacity-50 flex items-center justify-center gap-3 group shrink-0"
          >
            {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            {generating ? 'Processing Engine...' : 'Run Allocation Engine'}
          </button>
        </div>
      </div>

      {resultMsg && resultMsg.type === 'success' && (
        <div className="mb-10 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div className="mb-4 md:mb-0">
            <h3 className="text-emerald-800 font-black text-xl mb-1 flex items-center gap-2"><CheckCircle2/> Engine Executed</h3>
            <p className="text-emerald-600 font-medium">{resultMsg.data.msg}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-emerald-100 flex flex-col items-center">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Allocated</span>
              <div className="font-black text-2xl text-emerald-600">{resultMsg.data.allocatedCount}</div>
            </div>
            {resultMsg.data.remainingCount > 0 && (
              <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-rose-100 flex flex-col items-center">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Overflow</span>
                <div className="font-black text-2xl text-rose-600">{resultMsg.data.remainingCount}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {resultMsg && resultMsg.type === 'error' && (
        <div className="mb-10 p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <AlertCircle className="w-8 h-8 text-rose-500" />
             <div>
               <h3 className="text-rose-800 font-black text-lg">Engine Failure</h3>
               <p className="text-rose-600 font-medium">{resultMsg.text}</p>
             </div>
          </div>
        </div>
      )}

      {allocations.length > 0 && (
        <div className="space-y-10">
          
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 mb-6 gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Search className="text-blue-500 w-5 h-5"/> Allocation Registry Lookup
              </h2>
              <input 
                type="text" 
                placeholder="Search by Roll No..." 
                value={searchRoll}
                onChange={(e) => setSearchRoll(e.target.value)}
                className="w-full md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-600"
              />
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Roll No</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Branch</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Seat Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allocations.filter(a => (a.roll_no || '').toString().toLowerCase().includes((searchRoll || '').toLowerCase())).slice(0, 20).map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{a.roll_no}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{a.name}</td>
                      <td className="px-6 py-4"><span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">{a.branch}</span></td>
                      <td className="px-6 py-4">
                         <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded inline-flex items-center gap-2 font-bold border border-blue-100">
                           {a.room_no} • R{a.seat_row} C{a.seat_col}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDownloadStudentHallTicket(a.student_id, a.roll_no)}
                          className="flex items-center justify-center w-10 h-10 bg-slate-50 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
                          title="Download Hall Ticket"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Eye className="w-6 h-6 text-slate-400" /> Visual Hall Maps
            </h2>
            {Object.keys(roomsDict).map(room_no => (
              <div key={room_no} className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative group">
                
                <div className="px-8 py-5 border-b border-slate-100 bg-emerald-600 flex justify-between items-center text-white">
                  <div>
                    <h3 className="font-black text-xl tracking-tight">Hall {room_no}</h3>
                    <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">{roomsDict[room_no].building}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadInvigilator(room_no)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold rounded-xl transition shadow-sm border border-white/20 text-sm"
                  >
                    <FileText className="w-4 h-4" /> Invigilator Sheet
                  </button>
                </div>
                
                <div className="p-8 overflow-x-auto bg-slate-50 relative">
                  <div className="text-center mb-8">
                     <span className="bg-slate-200 text-slate-500 font-black text-xs uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-sm">Front of Hall</span>
                  </div>

                  <div className="flex flex-col gap-3 pb-4">
                    {(() => {
                      const seats = roomsDict[room_no].seats;
                      const maxRow = Math.max(...seats.map(s => s.seat_row));
                      const maxCol = Math.max(...seats.map(s => s.seat_col));
                      
                      const rows = [];
                      for(let r=1; r<=maxRow; r++){
                        const cols = [];
                        for(let c=1; c<=maxCol; c++){
                          const seat = seats.find(s => s.seat_row === r && s.seat_col === c);
                          
                          const getBranchColor = (branch) => {
                            const bStr = (branch || '').toString();
                            if(!bStr) return 'bg-white border-dashed border-slate-300 text-slate-300';
                            const colors = [
                              'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100/50', 
                              'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100/50', 
                              'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100/50', 
                              'bg-purple-50 border-purple-200 text-purple-800 shadow-purple-100/50', 
                              'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100/50'
                            ];
                            let hash = 0;
                            for (let i = 0; i < bStr.length; i++) hash = bStr.charCodeAt(i) + ((hash << 5) - hash);
                            return colors[Math.abs(hash) % colors.length] + ' shadow-sm border border-solid';
                          };

                          if(seat) {
                             cols.push(
                               <div key={`${r}-${c}`} className={`w-32 p-3 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-default ${getBranchColor(seat.branch)}`}>
                                 <span className="font-mono text-sm font-black w-full truncate text-center mb-1">{seat.roll_no}</span>
                                 <span className="text-[10px] font-bold tracking-wider uppercase text-center px-2 py-0.5 rounded-md bg-white/50 w-full truncate">{seat.branch}</span>
                                 <span className="absolute -top-2 -left-2 w-6 h-6 bg-white border rounded-full text-[9px] font-black flex items-center justify-center text-slate-400 shadow-sm">R{r}</span>
                               </div>
                             );
                          } else {
                             cols.push(<div key={`${r}-${c}`} className="w-32 p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-transparent flex shrink-0 items-center justify-center text-slate-300 font-bold text-xs uppercase tracking-widest relative">
                                <span className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-slate-200 rounded-full text-[9px] font-black flex items-center justify-center text-slate-300 shadow-sm">R{r}</span>
                                Empty
                             </div>);
                          }
                        }
                        rows.push(<div key={r} className="flex gap-4 min-w-max justify-center">{cols}</div>);
                      }
                      return rows;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Generate;
