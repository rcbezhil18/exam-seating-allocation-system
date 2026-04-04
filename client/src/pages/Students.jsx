import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, Edit2, Trash2, X } from 'lucide-react';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Edit State
  const [editingStudent, setEditingStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage('');
    try {
      const res = await api.post('/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: res.data.msg });
      fetchStudents();
      setFile(null);
      document.getElementById('file-upload').value = '';
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.msg || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this student record?")) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch(err) {
      alert("Failed to delete student");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/students/${editingStudent.id}`, editingStudent);
      setEditingStudent(null);
      fetchStudents();
    } catch(err) {
      alert("Failed to update student settings");
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Master Roster</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage student credentials, fees, and allocations globally.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><UploadCloud className="w-5 h-5"/></div>
          Secure Data Import
        </h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5"/>}
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/50 hover:border-blue-400 transition-colors cursor-pointer group">
              <span className="flex flex-col items-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="font-semibold text-slate-600 flex items-center gap-2">
                  <span className="text-blue-600 font-bold mix-blend-multiply px-2 py-1 bg-blue-100 rounded-md shadow-sm">Browse files</span>
                  {file ? file.name : "or drag and drop here"}
                </span>
              </span>
              <input type="file" id="file-upload" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>
          <button 
            type="submit" 
            disabled={!file || uploading}
            className="w-full md:w-auto px-8 py-4 h-full bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30"
          >
            {uploading ? 'Processing Data...' : 'Upload & Sync Data'}
          </button>
        </form>
        
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
           <span className="uppercase tracking-widest text-slate-400 mr-2">Required Columns:</span>
           {['Register Number', 'Name', 'Date of Birth (DD-MM-YYYY)', 'Fee Amount', 'Branch', 'Semester'].map(col => (
             <span key={col} className="bg-slate-100 px-2.5 py-1 rounded-md">{col}</span>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Active Students ({students.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Register No</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Branch</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">DOB (Pwd)</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-400 font-medium">No students uploaded yet</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4 font-bold text-slate-700">{s.roll_no}</td>
                  <td className="px-8 py-4 font-medium text-slate-600">{s.name}</td>
                  <td className="px-8 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {s.branch} (Sem {s.semester})
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-mono text-slate-500">{s.dob}</td>
                  <td className="px-8 py-4 text-right">
                     <button onClick={() => setEditingStudent(s)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4"/></button>
                     <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors ml-2"><Trash2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Edit Student Record</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Name</label>
                  <input type="text" value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Register No</label>
                  <input type="text" value={editingStudent.roll_no} onChange={e => setEditingStudent({...editingStudent, roll_no: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date of Birth</label>
                  <input type="text" value={editingStudent.dob} onChange={e => setEditingStudent({...editingStudent, dob: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fee Amount</label>
                  <input type="number" step="0.01" value={editingStudent.fee_amount} onChange={e => setEditingStudent({...editingStudent, fee_amount: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Branch</label>
                  <input type="text" value={editingStudent.branch} onChange={e => setEditingStudent({...editingStudent, branch: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Semester</label>
                  <input type="number" value={editingStudent.semester} onChange={e => setEditingStudent({...editingStudent, semester: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
