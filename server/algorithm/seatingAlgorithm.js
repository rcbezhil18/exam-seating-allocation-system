const db = require('../db');

exports.generate = async (exam_id) => {
  // 1. Fetch all students
  const studentsResult = await db.query('SELECT * FROM Students ORDER BY semester, branch, roll_no');
  const students = studentsResult.rows;

  if (students.length === 0) {
    throw new Error('No students found to allocate.');
  }

  // 2. Fetch all rooms
  const roomsResult = await db.query('SELECT * FROM Rooms ORDER BY capacity DESC');
  const rooms = roomsResult.rows;

  if (rooms.length === 0) {
    throw new Error('No rooms available.');
  }

  // 3. Clear existing allocations for this exam to recreate
  await db.query('DELETE FROM Allocations WHERE exam_id = $1', [exam_id]);

  // Group students by Sem + Branch
  const branchMap = {};
  students.forEach(s => {
    let key = `${s.semester} Sem. ${s.branch}`;
    if (!branchMap[key]) branchMap[key] = [];
    branchMap[key].push(s);
  });

  const allocations = [];

  for (const room of rooms) {
    for (let r = 1; r <= room.rows; r++) {
      // Pick top 2 branches by remaining count for this row to alternate
      let sortedBranches = Object.keys(branchMap).sort((a, b) => branchMap[b].length - branchMap[a].length);
      sortedBranches = sortedBranches.filter(b => branchMap[b].length > 0);
      
      if (sortedBranches.length === 0) break; // All students allocated

      const branchA = sortedBranches[0];
      const branchB = sortedBranches.length > 1 ? sortedBranches[1] : sortedBranches[0];

      for (let c = 1; c <= room.cols; c++) {
        // Find which branch to pick for this column
        let selectedBranch = (c % 2 === 1) ? branchA : branchB;
        
        if (!branchMap[selectedBranch] || branchMap[selectedBranch].length === 0) {
           // Fallback to the next most populated branch
           const fallbackBranches = Object.keys(branchMap).filter(b => branchMap[b].length > 0).sort((a, b) => branchMap[b].length - branchMap[a].length);
           if (fallbackBranches.length === 0) break; // No students left
           selectedBranch = fallbackBranches[0];
        }

        const student = branchMap[selectedBranch].shift();
        
        allocations.push({
          exam_id,
          student_id: student.id,
          room_id: room.id,
          seat_row: r,
          seat_col: c
        });

        // Break early if we run out globally (handled by fallback array size 0 check)
      }
    }
  }

  // Check if all students were allocated
  const remainingStudents = Object.values(branchMap).reduce((acc, arr) => acc + arr.length, 0);

  // 4. Save allocations to DB
  for (const a of allocations) {
    await db.query(
      'INSERT INTO Allocations (exam_id, student_id, room_id, seat_row, seat_col) VALUES ($1, $2, $3, $4, $5)',
      [a.exam_id, a.student_id, a.room_id, a.seat_row, a.seat_col]
    );
  }

  return {
    allocatedCount: allocations.length,
    remainingCount: remainingStudents,
    msg: remainingStudents > 0 ? "Not enough room capacity for all students" : "All students allocated successfully"
  };
};
