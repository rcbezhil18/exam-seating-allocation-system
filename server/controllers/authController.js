const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // See if user exists
    let userResult = await db.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Mock login since we don't have user registration, create on first try for simplicity
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('admin123', salt);
      userResult = await db.query(
        'INSERT INTO Users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        ['Admin', 'admin@example.com', password_hash, 'coordinator']
      );
      if (email !== 'admin@example.com' || password !== 'admin123') {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.studentLogin = async (req, res) => {
  const { username, password } = req.body; // username is roll_no/register_number, password is dob

  try {
    const studentCheck = await db.query('SELECT * FROM Students WHERE roll_no = $1', [username]);
    
    if (studentCheck.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid Register Number or DOB' });
    }

    const student = studentCheck.rows[0];

    // Password is DOB format checks
    if (student.dob !== password) {
      return res.status(400).json({ msg: 'Invalid Register Number or DOB' });
    }

    const payload = {
      user: {
        id: student.id,
        role: 'student'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: student.id, name: student.name, role: 'student', roll_no: student.roll_no, fee_amount: student.fee_amount, fee_paid: student.fee_paid } });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error during student login');
  }
};
