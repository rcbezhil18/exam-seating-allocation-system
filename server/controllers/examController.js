const db = require('../db');
const multer = require('multer');
const xlsx = require('xlsx');

exports.uploadExamsParams = multer({ storage: multer.memoryStorage() }).single('file');

exports.getExams = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Exams ORDER BY date ASC, time ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.createExam = async (req, res) => {
  const { name, subject_name, subject_code, date, session, time } = req.body;
  try {
    const newExam = await db.query(
      'INSERT INTO Exams (name, subject_name, subject_code, date, session, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, subject_name, subject_code, date, session, time]
    );
    res.json(newExam.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateExam = async (req, res) => {
  const { id } = req.params;
  const { name, subject_name, subject_code, date, session, time } = req.body;
  try {
     const result = await db.query(
       'UPDATE Exams SET name=$1, subject_name=$2, subject_code=$3, date=$4, session=$5, time=$6 WHERE id=$7 RETURNING *',
       [name, subject_name, subject_code, date, session, time, id]
     );
     res.json(result.rows[0]);
  } catch(err) {
     res.status(500).json({msg: 'Error updating'});
  }
};

exports.deleteExam = async (req, res) => {
  try {
     await db.query('DELETE FROM Exams WHERE id=$1', [req.params.id]);
     res.json({msg: 'Deleted'});
  } catch(err) {
     res.status(500).json({msg: 'Error deleting'});
  }
};

exports.uploadExams = async (req, res) => {
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
      const name = getRowVal(row, ['Exam name(IAT or Semester)', 'Exam Name', 'name', 'exam_name']);
      const subject_name = getRowVal(row, ['Subject Name', 'subject', 'subject_name', 'Subject']);
      const subject_code = getRowVal(row, ['Subject Code', 'code', 'subject_code', 'SubjectCode']);
      const dateStr = getRowVal(row, ['Date', 'date']);
      const session = getRowVal(row, ['Session (FN / AN)', 'Session', 'session']);
      const time = getRowVal(row, ['Time', 'time']);
      
      if (name && subject_name && dateStr) {
        let dateVal = dateStr;
        if (typeof dateStr === 'number') {
           dateVal = new Date(Math.round((dateStr - 25569)*86400*1000));
        }

        await db.query(
          `INSERT INTO Exams (name, subject_name, subject_code, date, session, time) VALUES ($1, $2, $3, $4, $5, $6)`,
          [name, subject_name, String(subject_code||''), dateVal, String(session||''), String(time||'')]
        );
        count++;
      }
    }

    if (count === 0) {
      const detectedColumns = Object.keys(data[0] || {}).join(', ');
      return res.status(400).json({ 
        msg: `No valid records matched. Detected columns: [${detectedColumns}]. Please ensure columns match: Exam Name, Subject Name, Subject Code, Date, Session, and Time.` 
      });
    }

    res.json({ msg: `Successfully imported ${count} timetable entries.` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error parsing file.');
  }
};
