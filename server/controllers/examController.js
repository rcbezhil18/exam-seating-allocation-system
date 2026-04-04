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
    let count = 0;
    
    for (const row of data) {
      const name = row['Exam name(IAT or Semester)'] || row['Exam Name'] || row['name'];
      const subject_name = row['Subject Name'] || row['subject'];
      const subject_code = row['Subject Code'] || row['code'];
      const dateStr = row['Date'] || row['date'];
      const session = row['Session (FN / AN)'] || row['Session'] || row['session'];
      const time = row['Time'] || row['time'];
      
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
    res.json({ msg: `Successfully imported ${count} timetable entries.` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error parsing file.');
  }
};
