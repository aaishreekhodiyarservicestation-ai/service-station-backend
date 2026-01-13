import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Vehicle from '../models/Vehicle';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * @desc    Export daily register as PDF
 * @route   GET /api/reports/daily-register?format=pdf&date=YYYY-MM-DD&stationId=xxx
 * @access  Private (All roles)
 */
export const exportDailyRegister = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { format = 'pdf', date, stationId } = req.query;

    const query: any = {};

    // Filter by station
    if (req.user!.role !== 'admin') {
      query.stationId = req.user!.stationId;
    } else if (stationId) {
      query.stationId = stationId;
    }

    // Filter by date (default to today)
    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    query.createdAt = { $gte: targetDate, $lt: nextDay };

    const vehicles = await Vehicle.find(query)
      .populate('ownerId')
      .populate('dropOffPersonId')
      .populate('stationId', 'name')
      .sort({ serialNumber: 1 });

    if (format === 'pdf') {
      await generatePDF(vehicles, res, targetDate);
    } else if (format === 'excel') {
      await generateExcel(vehicles, res, targetDate);
    } else {
      res.status(400).json({ success: false, message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePDF = async (vehicles: any[], res: Response, date: Date): Promise<void> => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text('Service Station Daily Vehicle Register', 14, 15);

  // Date and station
  doc.setFontSize(10);
  doc.text(`Date: ${date.toLocaleDateString()}`, 14, 22);

  if (vehicles.length > 0 && vehicles[0].stationId) {
    doc.text(`Station: ${vehicles[0].stationId.name}`, 14, 28);
  }

  // Table data
  const tableData = vehicles.map((v, index) => [
    index + 1,
    v.serialNumber,
    v.registrationNumber,
    `${v.vehicleType} - ${v.companyBrand}`,
    v.ownerId?.name || 'N/A',
    v.ownerId?.mobile || 'N/A',
    new Date(v.dateSubmitted).toLocaleString(),
    v.dateCollected ? new Date(v.dateCollected).toLocaleString() : 'Pending',
    v.status,
  ]);

  autoTable(doc, {
    head: [['#', 'Serial No', 'Reg No', 'Vehicle', 'Owner', 'Mobile', 'Submitted', 'Collected', 'Status']],
    body: tableData,
    startY: 32,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  // Send PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=daily-register-${date.toISOString().split('T')[0]}.pdf`);
  res.send(pdfBuffer);
};

const generateExcel = async (vehicles: any[], res: Response, date: Date): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Daily Register');

  // Add title
  worksheet.mergeCells('A1:R1');
  worksheet.getCell('A1').value = 'Service Station Daily Vehicle Register';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.getCell('A2').value = `Date: ${date.toLocaleDateString()}`;

  // Headers
  worksheet.getRow(4).values = [
    'Serial Number',
    'Registration Number',
    'Vehicle Type',
    'Company/Brand',
    'Engine Number',
    'Chassis Number',
    'Owner Name',
    'Owner Address',
    'Owner Mobile',
    'Owner ID Proof',
    'Drop-off Person Name',
    'Drop-off Person Mobile',
    'Pick-up Person Name',
    'Pick-up Person Mobile',
    'Date Submitted',
    'Date Collected',
    'Status',
    'Station Name',
  ];

  worksheet.getRow(4).font = { bold: true };
  worksheet.getRow(4).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4285F4' },
  };

  // Data rows
  vehicles.forEach((v) => {
    worksheet.addRow([
      v.serialNumber,
      v.registrationNumber,
      v.vehicleType,
      v.companyBrand,
      v.engineNumber,
      v.chassisNumber,
      v.ownerId?.name,
      v.ownerId?.address,
      v.ownerId?.mobile,
      `${v.ownerId?.idProofType} - ${v.ownerId?.idProofNumber}`,
      v.dropOffPersonId?.name || 'N/A',
      v.dropOffPersonId?.mobile || 'N/A',
      v.pickUpPersonId?.name || 'N/A',
      v.pickUpPersonId?.mobile || 'N/A',
      new Date(v.dateSubmitted).toLocaleString(),
      v.dateCollected ? new Date(v.dateCollected).toLocaleString() : 'Pending',
      v.status,
      v.stationId?.name,
    ]);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = 15;
  });

  // Send Excel file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=daily-register-${date.toISOString().split('T')[0]}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
};

export default { exportDailyRegister };
