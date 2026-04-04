CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'coordinator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    session VARCHAR(50) NOT NULL,
    time VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_no VARCHAR(50) NOT NULL UNIQUE,
    building VARCHAR(100),
    capacity INT NOT NULL,
    rows INT NOT NULL,
    cols INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    roll_no VARCHAR(100) UNIQUE NOT NULL,
    dob VARCHAR(50) NOT NULL,
    fee_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    transaction_id VARCHAR(255),
    payment_screenshot VARCHAR(255),
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES Exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES Students(id) ON DELETE CASCADE,
    room_id UUID REFERENCES Rooms(id) ON DELETE CASCADE,
    seat_row INT NOT NULL,
    seat_col INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id), -- A student can only have one seat per exam
    UNIQUE(exam_id, room_id, seat_row, seat_col) -- A seat in an exam can only be assigned once
);
