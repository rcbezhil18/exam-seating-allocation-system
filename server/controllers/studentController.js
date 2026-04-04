const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db');
const path = require('path');
const fs = require('fs');

exports.uploadStudentsParams = multer({ storage: multer.memoryStorage() }).single('file');


exports.uploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let processedCount = 0;
    
    for (const row of data) {
      const name = row['Name'] || row['name'] || row['Student Name'];
      const roll_no = row['Register Number'] || row['Roll No'] || row['roll_no'] || row['Roll Number'];
      const dob = row['Date of Birth (DD-MM-YYYY)'] || row['Date of Birth'] || row['dob'] || row['DOB'];
      const fee_amount = parseFloat(row['Fee Amount'] || row['Fee'] || row['fee_amount']) || 0.00;
      const branch = row['Branch'] || row['branch'] || row['Department'];
      const semester = row['Semester'] || row['semester'] || row['Sem'];
      
      if (name && roll_no && branch && semester && dob) {
        await db.query(
          `INSERT INTO Students (name, roll_no, dob, fee_amount, branch, semester, payment_status) 
           VALUES ($1, $2, $3, $4, $5, $6, 'NOT_PAID') 
           ON CONFLICT (roll_no) DO UPDATE SET 
             name = EXCLUDED.name, 
             dob = EXCLUDED.dob,
             fee_amount = EXCLUDED.fee_amount,
             branch = EXCLUDED.branch, 
             semester = EXCLUDED.semester`,
          [name, String(roll_no), String(dob), fee_amount, branch, parseInt(semester)]
        );
        processedCount++;
      }
    }

    res.json({ msg: `Successfully processed ${processedCount} records` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error parsing file');
  }
};

exports.getStudents = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Students ORDER BY created_at DESC");
    // Handle old data migration on the fly
    const rows = result.rows.map(r => ({
      ...r,
      payment_status: r.payment_status === 'Unpaid' ? 'NOT_PAID' : r.payment_status === 'Paid' ? 'VERIFIED' : r.payment_status === 'Pending' ? 'PENDING' : r.payment_status
    }));
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Students WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Student not found' });
    let st = result.rows[0];
    st.payment_status = st.payment_status === 'Unpaid' ? 'NOT_PAID' : st.payment_status === 'Paid' ? 'VERIFIED' : st.payment_status === 'Pending' ? 'PENDING' : st.payment_status;
    res.json(st);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, roll_no, dob, fee_amount, branch, semester } = req.body;
  try {
     const result = await db.query(
       'UPDATE Students SET name=$1, roll_no=$2, dob=$3, fee_amount=$4, branch=$5, semester=$6 WHERE id=$7 RETURNING *',
       [name, roll_no, dob, fee_amount, branch, semester, id]
     );
     res.json(result.rows[0]);
  } catch(err) {
     res.status(500).json({msg: 'Error updating student'});
  }
};

exports.deleteStudent = async (req, res) => {
  try {
     await db.query('DELETE FROM Students WHERE id=$1', [req.params.id]);
     res.json({msg: 'Student deleted'});
  } catch(err) {
     res.status(500).json({msg: 'Error deleting student'});
  }
};

exports.payFee = async (req, res) => {
  const student_id = req.user.id;
  const { transaction_id } = req.body;

  try {
    const result = await db.query(
      'UPDATE Students SET payment_status = $1, transaction_id = $2 WHERE id = $3 RETURNING *',
      ['PENDING', transaction_id || null, student_id]
    );
    if(result.rows.length === 0) return res.status(404).json({ msg: 'Student not found' });
    res.json({ msg: 'Payment submission received. Pending verification.', student: result.rows[0] });
  } catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.verifyPayment = async (req, res) => {
   const { id } = req.params;
   const { status } = req.body; // Expecting 'VERIFIED' or 'NOT_PAID'
   try {
     const result = await db.query('UPDATE Students SET payment_status = $1 WHERE id = $2 RETURNING *', [status || 'VERIFIED', id]);
     res.json(result.rows[0]);
   } catch(err) {
     res.status(500).json({msg: 'Error verifying payment'});
   }
};
