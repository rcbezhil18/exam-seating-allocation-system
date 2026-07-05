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
    
    if (!data || data.length === 0) {
      return res.status(400).json({ msg: 'The uploaded file is empty' });
    }

    // Helper for robust case-insensitive column matching
    const getRowVal = (row, possibleKeys) => {
      const keys = Object.keys(row);
      for (const pKey of possibleKeys) {
        const match = keys.find(k => k.trim().toLowerCase() === pKey.trim().toLowerCase());
        if (match !== undefined) return row[match];
      }
      return undefined;
    };

    let count = 0;
    
    for (const row of data) {
      const room_no = getRowVal(row, ['Hall Number', 'Room No', 'room_no', 'Hall No', 'Room Number', 'room_number']);
      const capacity = parseInt(getRowVal(row, ['Capacity', 'capacity'])) || 0;
      const building = getRowVal(row, ['Block / Location', 'Block', 'Location', 'building', 'block', 'location']);
      
      // Attempt to extract rows and cols, or guess based on capacity
      const parsedCols = parseInt(getRowVal(row, ['Columns', 'Cols', 'columns', 'cols']));
      const parsedRows = parseInt(getRowVal(row, ['Rows', 'rows']));
      
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

    if (count === 0) {
      const detectedColumns = Object.keys(data[0] || {}).join(', ');
      return res.status(400).json({ 
        msg: `No valid records matched. Detected columns: [${detectedColumns}]. Please ensure columns match: Hall Number, Capacity, and Block / Location.` 
      });
    }

    res.json({ msg: `Successfully imported ${count} halls.` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error parsing file.');
  }
};
