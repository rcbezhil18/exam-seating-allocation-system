const db = require('../db');
const multer = require('multer');
const xlsx = require('xlsx');

exports.uploadRoomsParams = multer({ storage: multer.memoryStorage() }).single('file');

exports.getRooms = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Rooms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createRoom = async (req, res) => {
  const { room_no, building, capacity, rows, cols } = req.body;
  try {
    const newRoom = await db.query(
      'INSERT INTO Rooms (room_no, building, capacity, rows, cols) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [room_no, building, capacity, rows, cols]
    );
    res.json(newRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateRoom = async (req, res) => {
  const { id } = req.params;
  const { room_no, building, capacity, rows, cols } = req.body;
  try {
     const result = await db.query(
       'UPDATE Rooms SET room_no=$1, building=$2, capacity=$3, rows=$4, cols=$5 WHERE id=$6 RETURNING *',
       [room_no, building, capacity, rows, cols, id]
     );
     res.json(result.rows[0]);
  } catch(err) {
     res.status(500).json({msg: 'Error updating'});
  }
};

exports.deleteRoom = async (req, res) => {
  try {
     await db.query('DELETE FROM Rooms WHERE id=$1', [req.params.id]);
     res.json({msg: 'Deleted'});
  } catch(err) {
     res.status(500).json({msg: 'Error deleting'});
  }
};

exports.uploadRooms = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    let count = 0;
    
    for (const row of data) {
      const room_no = row['Hall Number'] || row['Room No'] || row['room_no'];
      const capacity = parseInt(row['Capacity'] || row['capacity']) || 0;
      const building = row['Block / Location'] || row['Block'] || row['Location'] || row['building'];
      
      // Attempt to extract rows and cols, or guess based on capacity (e.g. assume rows = capacity / 6 if unknown)
      const parsedCols = parseInt(row['Columns'] || row['Cols'] || row['columns']);
      const parsedRows = parseInt(row['Rows'] || row['rows']);
      
      const cols = parsedCols ? parsedCols : 6;
      const rows = parsedRows ? parsedRows : Math.ceil(capacity / cols);
      
      if (room_no && capacity) {
        await db.query(
          `INSERT INTO Rooms (room_no, building, capacity, rows, cols) VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (room_no) DO UPDATE SET building=EXCLUDED.building, capacity=EXCLUDED.capacity, rows=EXCLUDED.rows, cols=EXCLUDED.cols`,
          [String(room_no), String(building||''), capacity, rows, cols]
        );
        count++;
      }
    }
    res.json({ msg: `Successfully imported ${count} halls.` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error parsing file.');
  }
};
