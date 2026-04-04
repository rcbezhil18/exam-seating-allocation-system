const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());


// Routes will be imported here
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const roomRoutes = require('./routes/rooms');
const examRoutes = require('./routes/exams');
const allocationRoutes = require('./routes/allocations');
const pdfRoutes = require('./routes/pdf');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/pdf', pdfRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
