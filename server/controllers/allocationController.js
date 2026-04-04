const seatingAlgorithm = require('../algorithm/seatingAlgorithm');
const db = require('../db');

exports.generateAllocations = async (req, res) => {
  const { exam_id } = req.params;

  try {
    // Check if exam exists
    const examCheck = await db.query('SELECT * FROM Exams WHERE id = $1', [exam_id]);
    if (examCheck.rows.length === 0) {
      return res.status(404).json({ msg: 'Exam not found' });
    }

    const result = await seatingAlgorithm.generate(exam_id);
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
};

exports.getAllocations = async (req, res) => {
  const { exam_id } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        A.seat_row, A.seat_col, 
        S.id as student_id, S.name, S.roll_no, S.branch, S.semester,
        R.room_no, R.building
      FROM Allocations A
      JOIN Students S ON A.student_id = S.id
      JOIN Rooms R ON A.room_id = R.id
      WHERE A.exam_id = $1
      ORDER BY R.room_no, A.seat_row, A.seat_col
    `, [exam_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getStudentAllocations = async (req, res) => {
  const student_id = req.user.id;
  try {
    const result = await db.query(`
      SELECT 
        A.seat_row, A.seat_col, 
        E.name as exam_name, E.date,
        R.room_no, R.building
      FROM Allocations A
      JOIN Exams E ON A.exam_id = E.id
      JOIN Rooms R ON A.room_id = R.id
      WHERE A.student_id = $1
      ORDER BY E.date ASC
    `, [student_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
