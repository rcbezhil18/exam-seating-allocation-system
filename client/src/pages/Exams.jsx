import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CalendarPlus, CheckCircle2, CopyCheck, UploadCloud, FileSpreadsheet, Edit2, Trash2, X } from 'lucide-react';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [formData, setFormData] = useState({ name: '', subject_name: '', subject_code: '', date: '', session: '', time: '' });
  const [msg, setMsg] = useState('');
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams', formData);
      setMsg({ type: 'success', text: 'Exam schedule published.' });
      setFormData({ name: '', subject_name: '', subject_code: '', date: '', session: '', time: '' });
      fetchExams();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.msg || 'Error creating exam' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('file', file);
    setUploading(true);
    setMsg('');
    try {
      const res = await api.post('/exams/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'success', text: res.data.msg });
      fetchExams();
      setFile(null);
      document.getElementById('exam-file-upload').value = '';
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.msg || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this timetable entry?")) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch(err) {
      alert("Error deleting exam");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      // Reformat JS standard date strings for the input native date picker parsing if required, but simple approach is pass directly
      await api.put(`/exams/${editingExam.id}`, editingExam);
      setEditingExam(null);
      fetchExams();
    } catch(err) {
      alert("Error updating exam");
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto font-sans">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Exam Schedules</h1>
          <p className="text-slate-500 mt-2 font-medium">Create and manage upcoming examination dates via manual entry or bulk excel upload.</p>
        </div>
      </div>

      {msg && (
         <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border flex items-center gap-2 ${msg.type === 'success' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
           {msg.type === 'success' && <CheckCircle2 className="w-4 h-4"/>}
           {msg.text}
         </div>
      )}

      {/* Bulk Upload Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UploadCloud className="w-5 h-5"/></div>
          Bulk Timetable Import
        </h2>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/50 hover:border-indigo-400 transition-colors cursor-pointer group">
              <span className="flex flex-col items-center space-y-1">
                <FileSpreadsheet className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                <span className="font-semibold text-slate-600 text-sm">{file ? file.name : "Select Excel/CSV Timetable Sheet"}</span>
              </span>
              <input type="file" id="exam-file-upload" className="hidden" accept=".csv, .xlsx" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>
          <button type="submit" disabled={!file || uploading} className="px-8 py-4 h-full bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30">
            {uploading ? 'Processing Data...' : 'Upload Timetable'}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
           <span className="uppercase tracking-widest text-slate-400 mr-2">Required Columns:</span>
           {['Exam name(IAT or Semester)', 'Subject Name', 'Subject Code', 'Date', 'Session (FN / AN)', 'Time'].map(col => (
             <span key={col} className="bg-slate-100 px-2.5 py-1 rounded-md">{col}</span>
           ))}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sticky top-10">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarPlus className="w-5 h-5"/></div>
              New Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Exam Series Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="E.g. IAT 1" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject Name</label>
                <input required type="text" value={formData.subject_name} onChange={e => setFormData({...formData, subject_name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="Machine Learning" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Subject Code</label>
                <input required type="text" value={formData.subject_code} onChange={e => setFormData({...formData, subject_code: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="CS501" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Session</label>
                  <input required type="text" value={formData.session} onChange={e => setFormData({...formData, session: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="FN" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Time</label>
                  <input required type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" placeholder="9:00 AM" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 mt-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30">
                Publish Entry
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CopyCheck className="w-5 h-5 text-indigo-500"/> Master Timetable ({exams.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Exam Series</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">No active schedules.</td></tr>
                  ) : exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-black text-slate-800">{ex.name}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{ex.subject_name}</p>
                        <p className="text-xs font-medium text-slate-500 font-mono mt-0.5">{ex.subject_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-600">{new Date(ex.date).toLocaleDateString()}</p>
                        <p className="text-xs font-bold text-indigo-500 mt-0.5">{ex.session} - {ex.time}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => setEditingExam({...ex, date: new Date(ex.date).toISOString().substring(0,10)})} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4"/></button>
                         <button onClick={() => handleDelete(ex.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors ml-2"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Edit Timetable Entry</h3>
              <button onClick={() => setEditingExam(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Exam Series Name</label>
                  <input type="text" value={editingExam.name} onChange={e => setEditingExam({...editingExam, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                  <input type="text" value={editingExam.subject_name} onChange={e => setEditingExam({...editingExam, subject_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject Code</label>
                  <input type="text" value={editingExam.subject_code} onChange={e => setEditingExam({...editingExam, subject_code: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                  <input type="date" value={editingExam.date} onChange={e => setEditingExam({...editingExam, date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Session</label>
                  <input type="text" value={editingExam.session} onChange={e => setEditingExam({...editingExam, session: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Time</label>
                  <input type="text" value={editingExam.time} onChange={e => setEditingExam({...editingExam, time: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setEditingExam(null)} className="px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Exams;
