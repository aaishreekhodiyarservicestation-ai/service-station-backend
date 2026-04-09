import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Vehicle from '../models/Vehicle';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * @desc    Export vehicle register as PDF or Excel with date range support
 * @route   GET /api/reports/daily-register?format=pdf&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&stationId=xxx
 * @access  Private (All roles)
 */
export const exportDailyRegister = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { format = 'pdf', dateFrom, dateTo, stationId } = req.query;

    const query: any = {};

    // Filter by station
    if (req.user!.role !== 'admin') {
      query.stationId = req.user!.stationId;
    } else if (stationId) {
      query.stationId = stationId;
    }

    // Build date range filter only when dates are provided
    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        fromDate = new Date(dateFrom as string);
        fromDate.setHours(0, 0, 0, 0);
        query.createdAt.$gte = fromDate;
      }
      if (dateTo) {
        toDate = new Date(dateTo as string);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }
    // If no dates provided → no date filter → all records

    const vehicles = await Vehicle.find(query)
      .populate('ownerId')
      .populate('dropOffPersonId')
      .populate('pickUpPersonId')
      .populate('stationId', 'name')
      .sort({ serialNumber: 1 });

    // Build a human-readable date range label for titles/filenames
    const dateLabel = buildDateLabel(fromDate, toDate);
    const filenameSuffix = buildFilenameSuffix(fromDate, toDate);

    if (format === 'pdf') {
      await generatePDF(vehicles, res, dateLabel, filenameSuffix);
    } else if (format === 'excel') {
      await generateExcel(vehicles, res, dateLabel, filenameSuffix);
    } else {
      res.status(400).json({ success: false, message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function buildDateLabel(from: Date | null, to: Date | null): string {
  if (!from && !to) return 'All Records';
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (from && to) return `${fmt(from)} to ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  return `Up to ${fmt(to!)}`;
}

function buildFilenameSuffix(from: Date | null, to: Date | null): string {
  if (!from && !to) return 'all';
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  if (from && to) return `${fmt(from)}-to-${fmt(to)}`;
  if (from) return `from-${fmt(from)}`;
  return `upto-${fmt(to!)}`;
}

const generatePDF = async (
  vehicles: any[],
  res: Response,
  dateLabel: string,
  filenameSuffix: string
): Promise<void> => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text('Service Station Vehicle Register', 14, 15);

  // Date range and station
  doc.setFontSize(10);
  doc.text(`Period: ${dateLabel}`, 14, 22);
  doc.text(`Total Records: ${vehicles.length}`, 14, 28);

  if (vehicles.length > 0 && vehicles[0].stationId) {
    doc.text(`Station: ${vehicles[0].stationId.name}`, 14, 34);
  }

  // Table data
  const tableData = vehicles.map((v, index) => [
    index + 1,
    v.serialNumber,
    v.registrationNumber,
    `${v.vehicleType === 'gear' ? 'Gear Bike' : 'Non-Gear Bike'} - ${v.companyBrand}`,
    v.ownerId?.name || 'N/A',
    v.ownerId?.mobile || 'N/A',
    new Date(v.dateSubmitted).toLocaleString(),
    v.dateCollected ? new Date(v.dateCollected).toLocaleString() : 'Pending',
    v.status,
  ]);

  autoTable(doc, {
    head: [['#', 'Serial No', 'Reg No', 'Vehicle', 'Owner', 'Mobile', 'Submitted', 'Collected', 'Status']],
    body: tableData,
    startY: 38,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=register-${filenameSuffix}.pdf`);
  res.send(pdfBuffer);
};

const generateExcel = async (
  vehicles: any[],
  res: Response,
  dateLabel: string,
  filenameSuffix: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Vehicle Register');

  // Title
  worksheet.mergeCells('A1:R1');
  worksheet.getCell('A1').value = 'Service Station Vehicle Register';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.getCell('A2').value = `Period: ${dateLabel}`;
  worksheet.getCell('A3').value = `Total Records: ${vehicles.length}`;

  // Headers
  worksheet.getRow(5).values = [
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

  worksheet.getRow(5).font = { bold: true };
  worksheet.getRow(5).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4285F4' },
  };

  // Data rows
  vehicles.forEach((v) => {
    worksheet.addRow([
      v.serialNumber,
      v.registrationNumber,
      v.vehicleType === 'gear' ? 'Gear Bike' : 'Non-Gear Bike',
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

  // Column widths
  worksheet.columns.forEach((column) => {
    column.width = 18;
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=register-${filenameSuffix}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
};

export default { exportDailyRegister };
