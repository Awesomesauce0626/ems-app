const express = require('express');
const router = express.Router();
const CompletedAlert = require('../models/CompletedAlert');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Middleware to check for authorized roles (admin or ems_personnel)
const reportAuth = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'ems_personnel') {
        return res.status(403).json({ message: 'Access denied.' });
    }
    next();
};

// @route   GET /api/reports/pdf
// @desc    Generate a PDF report of all completed alerts
// @access  Admin, EMS Personnel
router.get('/pdf', [auth, reportAuth], async (req, res) => {
    try {
        const alerts = await CompletedAlert.find().sort({ archivedAt: -1 });

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=completed_alerts_report.pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(18).text('Completed Alerts Report', { align: 'center' });
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date Completed', 50, tableTop, { width: 100 });
        doc.text('Incident Type', 150, tableTop, { width: 100 });
        doc.text('Address', 250, tableTop, { width: 150 });
        doc.text('Reporter', 400, tableTop, { width: 100 });
        doc.font('Helvetica');

        // Table Rows
        alerts.forEach(alert => {
            const y = doc.y + 15;
            doc.text(new Date(alert.archivedAt).toLocaleString(), 50, y, { width: 100 });
            doc.text(alert.incidentType, 150, y, { width: 100 });
            doc.text(alert.location?.address || 'N/A', 250, y, { width: 150 });
            doc.text(alert.reporterName, 400, y, { width: 100 });
        });

        doc.end();

    } catch (error) {
        res.status(500).json({ message: 'Server error generating PDF report' });
    }
});

// @route   GET /api/reports/excel
// @desc    Generate an Excel report of all completed alerts
// @access  Admin, EMS Personnel
router.get('/excel', [auth, reportAuth], async (req, res) => {
    try {
        const alerts = await CompletedAlert.find().sort({ archivedAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Completed Alerts');

        worksheet.columns = [
            { header: 'Date Completed', key: 'archivedAt', width: 25 },
            { header: 'Incident Type', key: 'incidentType', width: 20 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Reporter Name', key: 'reporterName', width: 20 },
            { header: 'Reporter Phone', key: 'reporterPhone', width: 20 },
            { header: 'Patient Count', key: 'patientCount', width: 15 },
        ];

        alerts.forEach(alert => {
            worksheet.addRow({
                archivedAt: new Date(alert.archivedAt),
                incidentType: alert.incidentType,
                address: alert.location?.address || 'N/A',
                reporterName: alert.reporterName,
                reporterPhone: alert.reporterPhone,
                patientCount: alert.patientCount
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=completed_alerts_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        res.status(500).json({ message: 'Server error generating Excel report' });
    }
});

module.exports = router;
