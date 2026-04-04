const PDFDocument = require('pdfkit');
const db = require('../db');

exports.generateRoomPDF = async (req, res) => {
  const { room_id, exam_id } = req.params;

  try {
    // Fetch room details
    const roomResult = await db.query('SELECT * FROM Rooms WHERE id = $1', [room_id]);
    const examResult = await db.query('SELECT * FROM Exams WHERE id = $1', [exam_id]);

    if (roomResult.rows.length === 0 || examResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Room or Exam not found' });
    }

    const room = roomResult.rows[0];
    const exam = examResult.rows[0];

    // Fetch allocations
    const allocationsResult = await db.query(`
      SELECT A.seat_row, A.seat_col, S.name, S.roll_no, S.branch
      FROM Allocations A
      JOIN Students S ON A.student_id = S.id
      WHERE A.room_id = $1 AND A.exam_id = $2
      ORDER BY A.seat_row, A.seat_col
    `, [room_id, exam_id]);

    const allocations = allocationsResult.rows;

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-disposition', `attachment; filename=Invigilator_Room_${room.room_no}.pdf`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Invigilator Sheet', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Exam: ${exam.name}`);
    doc.text(`Date: ${new Date(exam.date).toLocaleDateString()}`);
    doc.text(`Room: ${room.room_no} (${room.building})`);
    doc.moveDown(1);

    // Table Header
    const tableTop = doc.y;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Seat No', 50, tableTop);
    doc.text('Roll No', 150, tableTop);
    doc.text('Student Name', 250, tableTop);
    doc.text('Branch', 450, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    let yPosition = tableTop + 25;
    doc.font('Helvetica');

    allocations.forEach((a) => {
      // pagination basic check
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(`R${a.seat_row}-C${a.seat_col}`, 50, yPosition);
      doc.text(a.roll_no, 150, yPosition);
      doc.text(a.name, 250, yPosition);
      doc.text(a.branch, 450, yPosition);
      
      doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
      yPosition += 25;
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error while generating PDF');
  }
};

exports.generateStudentPDF = async (req, res) => {
  const { student_id, exam_id } = req.params;

  try {
    const dataResult = await db.query(`
      SELECT S.name, S.roll_no, S.branch, E.name as exam_name, E.date, R.room_no, R.building, A.seat_row, A.seat_col
      FROM Allocations A
      JOIN Students S ON A.student_id = S.id
      JOIN Exams E ON A.exam_id = E.id
      JOIN Rooms R ON A.room_id = R.id
      WHERE A.student_id = $1 AND A.exam_id = $2
    `, [student_id, exam_id]);

    if (dataResult.rows.length === 0) {
       return res.status(404).json({ msg: 'Allocation not found for student' });
    }

    const data = dataResult.rows[0];

    const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 30 });
    
    res.setHeader('Content-disposition', `attachment; filename=HallTicket_${data.roll_no}.pdf`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Border
    doc.rect(10, 10, doc.page.width - 20, doc.page.height - 20).stroke();

    doc.fontSize(22).font('Helvetica-Bold').text('EXAM HALL TICKET', { align: 'center' });
    doc.moveDown(1);
    
    doc.fontSize(14).font('Helvetica');
    const labelX = 50;
    const valueX = 150;
    let currY = doc.y;

    doc.font('Helvetica-Bold').text('Exam:', labelX, currY);
    doc.font('Helvetica').text(data.exam_name, valueX, currY);
    currY += 25;
    
    doc.font('Helvetica-Bold').text('Date:', labelX, currY);
    doc.font('Helvetica').text(new Date(data.date).toLocaleDateString(), valueX, currY);
    currY += 25;

    doc.font('Helvetica-Bold').text('Student Name:', labelX, currY);
    doc.font('Helvetica').text(data.name, valueX, currY);
    currY += 25;

    doc.font('Helvetica-Bold').text('Roll No:', labelX, currY);
    doc.font('Helvetica').text(data.roll_no, valueX, currY);
    currY += 25;

    doc.font('Helvetica-Bold').text('Branch:', labelX, currY);
    doc.font('Helvetica').text(data.branch, valueX, currY);
    currY += 35;

    doc.fontSize(18).font('Helvetica-Bold').fillColor('blue');
    doc.text(`Room: ${data.room_no} (${data.building}) | Seat: R${data.seat_row}-C${data.seat_col}`, labelX, currY);

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error generating PDF');
  }
};

function compressRollNumbers(rollNos) {
  if (!rollNos || rollNos.length === 0) return '';
  rollNos.sort((a,b) => String(a).localeCompare(String(b)));
  
  const groups = {};
  rollNos.forEach(roll => {
    let rollStr = String(roll).trim();
    if (rollStr.length > 3) {
      const prefix = rollStr.substring(0, rollStr.length - 3);
      const suffix = rollStr.substring(rollStr.length - 3);
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(parseInt(suffix, 10)); 
    } else {
      if (!groups['']) groups[''] = [];
      groups[''].push(rollStr);
    }
  });

  const parts = [];
  
  Object.keys(groups).forEach(prefix => {
     if (prefix === '') {
        parts.push(groups[prefix].join(', '));
        return;
     }
     
     let nums = groups[prefix].sort((a, b) => a - b);
     let rangeStrs = [];
     let start = nums[0];
     let end = nums[0];
     
     const pushRange = (s, e, isFirst) => {
         const sPadd = isFirst ? String(s).padStart(3, '0') : String(s).padStart(2, '0');
         const ePadd = isFirst ? String(e).padStart(3, '0') : String(e).padStart(2, '0');
         if (s === e) {
             rangeStrs.push(isFirst ? `${prefix}${sPadd}` : sPadd);
         } else if (e === s + 1) {
             rangeStrs.push(isFirst ? `${prefix}${sPadd}, ${String(e).padStart(2, '0')}` : `${sPadd}, ${String(e).padStart(2, '0')}`);
         } else {
             rangeStrs.push(isFirst ? `${prefix}${sPadd}-${String(e).padStart(2, '0')}` : `${sPadd}-${String(e).padStart(2, '0')}`);
         }
     };

     for (let i = 1; i < nums.length; i++) {
        if (nums[i] === end + 1) {
           end = nums[i];
        } else {
           pushRange(start, end, rangeStrs.length === 0);
           start = nums[i];
           end = nums[i];
        }
     }
     pushRange(start, end, rangeStrs.length === 0);
     parts.push(rangeStrs.join(', '));
  });
  
  return parts.join('\n');
}

exports.generateMasterArrangementPDF = async (req, res) => {
  const { exam_id } = req.params;

  try {
    const examResult = await db.query('SELECT * FROM Exams WHERE id = $1', [exam_id]);
    if (examResult.rows.length === 0) return res.status(404).json({ msg: 'Exam not found' });
    const exam = examResult.rows[0];

    const allocationsResult = await db.query(`
      SELECT S.roll_no, S.branch, S.semester, R.room_no, R.building
      FROM Allocations A
      JOIN Students S ON A.student_id = S.id
      JOIN Rooms R ON A.room_id = R.id
      WHERE A.exam_id = $1
      ORDER BY R.room_no, S.semester, S.branch, S.roll_no
    `, [exam_id]);

    const allocations = allocationsResult.rows;

    const roomsMap = {};
    allocations.forEach(a => {
       if (!roomsMap[a.room_no]) roomsMap[a.room_no] = { total: 0, branches: {} };
       roomsMap[a.room_no].total += 1;
       const bKey = `${a.semester} Sem. ${a.branch}`;
       if(!roomsMap[a.room_no].branches[bKey]) roomsMap[a.room_no].branches[bKey] = [];
       roomsMap[a.room_no].branches[bKey].push(a.roll_no);
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-disposition', `attachment; filename=Master_Arrangement_${exam.name.replace(/\s+/g, '_')}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    const printHeader = () => {
       doc.font('Helvetica-Bold').fontSize(12).text('RAMCO INSTITUTE OF TECHNOLOGY', { align: 'center' });
       doc.fontSize(10).text('(An Autonomous Institution)', { align: 'center' });
       doc.text('EXAMINATION CONTROL OFFICE', { align: 'center' });
       doc.text('HALL ARRANGEMENT FOR INTERNAL ASSESSMENT TEST', { align: 'center' });
       doc.moveDown(0.5);
       
       const dtStr = new Date(exam.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
       doc.text(`Date of Test: ${dtStr}`, { align: 'left', continued: true });
       doc.text(`Session: ${exam.session || 'FN/AN'}`, { align: 'right' });
       doc.moveDown(1);
    };

    let yPosition = doc.y;
    printHeader();
    
    const colWidths = [40, 80, 100, 250, 50]; 
    const colX = [40, 80, 160, 260, 510, 560];

    const drawRowLine = (y) => {
       doc.moveTo(40, y).lineTo(560, y).stroke();
    };
    
    const printTableHeader = (y) => {
       drawRowLine(y);
       doc.font('Helvetica-Bold').fontSize(10);
       doc.text('Sl.\nNo.', colX[0]+5, y+5, { width: 30, align: 'center' });
       doc.text('Hall No.\n(Classroom)', colX[1]+5, y+5, { width: 70, align: 'center' });
       doc.text('Semester and\nBranch', colX[2]+5, y+5, { width: 90, align: 'center' });
       doc.text('Register Number of Candidates', colX[3]+5, y+10, { width: 240, align: 'center' });
       doc.text('Total\nNo. of\nCandidates', colX[4]+5, y+2, { width: 40, align: 'center' });
       drawRowLine(y + 35);
       return y + 35;
    };

    yPosition = printTableHeader(doc.y);

    let slNo = 1;
    doc.font('Helvetica').fontSize(10);

    for (const room_no of Object.keys(roomsMap)) {
       const roomData = roomsMap[room_no];
       const bKeys = Object.keys(roomData.branches);
       
       const rowHeights = [];
       const texts = [];
       
       bKeys.forEach(bk => {
          const compStr = compressRollNumbers(roomData.branches[bk]);
          texts.push({ name: bk, rolls: compStr });
          const textHeight = Math.max(doc.heightOfString(compStr, { width: 240 }), doc.heightOfString(bk, { width: 90 }));
          rowHeights.push(textHeight + 10);
       });
       
       const totalRowHeight = rowHeights.reduce((a, b) => a + b, 0);

       if (yPosition + totalRowHeight > 780) {
          doc.addPage();
          printHeader();
          yPosition = printTableHeader(doc.y);
       }
       
       // Draw left, right borders for the entire row block
       doc.moveTo(colX[0], yPosition).lineTo(colX[0], yPosition + totalRowHeight).stroke();
       doc.moveTo(colX[1], yPosition).lineTo(colX[1], yPosition + totalRowHeight).stroke();
       doc.moveTo(colX[2], yPosition).lineTo(colX[2], yPosition + totalRowHeight).stroke();
       doc.moveTo(colX[4], yPosition).lineTo(colX[4], yPosition + totalRowHeight).stroke();
       doc.moveTo(colX[5], yPosition).lineTo(colX[5], yPosition + totalRowHeight).stroke();

       // Vertical centering for merged columns
       const yCenterMerged = yPosition + (totalRowHeight / 2) - 5;
       
       doc.font('Helvetica').text(slNo.toString() + '.', colX[0]+5, yCenterMerged, { width: 30, align: 'center' });
       doc.font('Helvetica').text(room_no, colX[1]+5, yCenterMerged, { width: 70, align: 'center' });
       doc.font('Helvetica-Bold').fontSize(14).text(roomData.total.toString(), colX[4]+5, yCenterMerged - 2, { width: 40, align: 'center' });
       doc.fontSize(10); // reset

       let currentY = yPosition;
       for (let i = 0; i < texts.length; i++) {
          doc.font('Helvetica').text(texts[i].name, colX[2]+5, currentY + 5, { width: 90 });
          doc.font('Helvetica').text(texts[i].rolls, colX[3]+5, currentY + 5, { width: 240, align: 'justify' });
          
          if (i < texts.length - 1) {
             doc.moveTo(colX[2], currentY + rowHeights[i]).lineTo(colX[5], currentY + rowHeights[i]).stroke();
          } else {
             doc.moveTo(colX[0], currentY + rowHeights[i]).lineTo(colX[5], currentY + rowHeights[i]).stroke(); // full bottom border
          }
          currentY += rowHeights[i];
       }

       yPosition += totalRowHeight;
       slNo++;
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error generating Master PDF');
  }
};
