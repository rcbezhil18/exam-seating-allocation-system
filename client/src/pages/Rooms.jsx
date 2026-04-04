import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, CheckCircle2, Box, UploadCloud, FileSpreadsheet, Edit2, Trash2, X } from 'lucide-react';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({ room_no: '', building: '', capacity: '', rows: '', cols: '' });
  const [msg, setMsg] = useState('');
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms', formData);
      setMsg({ type: 'success', text: 'Hall registered successfully.' });
      setFormData({ room_no: '', building: '', capacity: '', rows: '', cols: '' });
      fetchRooms();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.msg || 'Error adding room' });
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
      const res = await api.post('/rooms/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg({ type: 'success', text: res.data.msg });
      fetchRooms();
      setFile(null);
      document.getElementById('room-file-upload').value = '';
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.msg || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch(err) {
      alert("Error deleting room");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/rooms/${editingRoom.id}`, editingRoom);
      setEditingRoom(null);
      fetchRooms();
    } catch(err) {
      alert("Error updating room");
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto font-sans">
      <div className="mb-10">
         <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Examination Halls</h1>
         <p className="text-slate-500 mt-2 font-medium">Configure physical spaces using manual entry or bulk uploads.</p>
      </div>

      {msg && (
         <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
           {msg.type === 'success' && <CheckCircle2 className="w-4 h-4"/>}
           {msg.text}
         </div>
      )}

      {/* Bulk Upload Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><UploadCloud className="w-5 h-5"/></div>
          Bulk Hall Import
        </h2>
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/50 hover:border-emerald-400 transition-colors cursor-pointer group">
              <span className="flex flex-col items-center space-y-1">
                <FileSpreadsheet className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                <span className="font-semibold text-slate-600 text-sm">{file ? file.name : "Select Excel/CSV file"}</span>
              </span>
              <input type="file" id="room-file-upload" className="hidden" accept=".csv, .xlsx" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </div>
          <button type="submit" disabled={!file || uploading} className="px-8 py-4 h-full bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30">
            {uploading ? 'Processing...' : 'Upload & Sync Data'}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
           <span className="uppercase tracking-widest text-slate-400 mr-2">Required Columns:</span>
           {['Hall Number', 'Capacity', 'Block / Location', 'Rows (Optional)', 'Columns (Optional)'].map(col => (
             <span key={col} className="bg-slate-100 px-2.5 py-1 rounded-md">{col}</span>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Manual Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-8 sticky top-10">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Plus className="w-5 h-5"/></div>
              Manual Entry
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Room Number</label>
                <input required type="text" value={formData.room_no} onChange={e => setFormData({...formData, room_no: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Building</label>
                <input type="text" value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Capacity</label>
                <input required type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rows</label>
                  <input required type="number" min="1" value={formData.rows} onChange={e => setFormData({...formData, rows: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Columns</label>
                  <input required type="number" min="1" value={formData.cols} onChange={e => setFormData({...formData, cols: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 mt-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30">
                Register Hall
              </button>
            </form>
          </div>
        </div>

        {/* Table Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-500"/> Hall Roster ({rooms.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Hall</th>
                    <th className="px-8 py-4">Location</th>
                    <th className="px-8 py-4">Capacity</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rooms.length === 0 ? (
                    <tr><td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-medium">No halls registered.</td></tr>
                  ) : rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-700 text-lg">
                        {r.room_no}
                        <div className="text-xs text-slate-400 font-medium mt-1">Grid: {r.rows}x{r.cols}</div>
                      </td>
                      <td className="px-8 py-5 font-medium text-slate-500">{r.building}</td>
                      <td className="px-8 py-5">
                          <span className="inline-flex items-center min-w-[3rem] px-3 py-1 bg-emerald-100 text-emerald-700 font-black rounded-lg">{r.capacity}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button onClick={() => setEditingRoom(r)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4"/></button>
                         <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors ml-2"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Edit Hall Record</h3>
              <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Room No</label>
                  <input type="text" value={editingRoom.room_no} onChange={e => setEditingRoom({...editingRoom, room_no: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Building/Block</label>
                  <input type="text" value={editingRoom.building} onChange={e => setEditingRoom({...editingRoom, building: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Capacity</label>
                  <input type="number" value={editingRoom.capacity} onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div />
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rows</label>
                  <input type="number" value={editingRoom.rows} onChange={e => setEditingRoom({...editingRoom, rows: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cols</label>
                  <input type="number" value={editingRoom.cols} onChange={e => setEditingRoom({...editingRoom, cols: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                 <button type="button" onClick={() => setEditingRoom(null)} className="px-4 py-2 text-sm font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                 <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Rooms;
