/**
 * controllers/logsController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/logs              — list logs with filters + pagination
 * GET    /api/logs/download     — download as PDF report
 * DELETE /api/logs              — clear all logs (admin)
 * POST   /api/logs              — manually append a log entry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PDFDocument = require('pdfkit');
const storage     = require('../services/storageService');

/** GET /api/logs */
function list(req, res) {
  const { severity, attackType, limit, offset } = req.query;
  const result = storage.getLogs({
    severity,
    attackType,
    limit:  parseInt(limit,  10) || 50,
    offset: parseInt(offset, 10) || 0,
  });
  return res.json({ success: true, ...result });
}

/** DELETE /api/logs — admin only */
function clearAll(req, res) {
  storage.clearLogs();
  return res.json({ success: true, message: 'All logs cleared.' });
}

/** POST /api/logs — manual log entry */
function create(req, res) {
  const { severity = 'low', attackType = 'system', message, source = 'ManualEntry' } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'message is required.' });
  const entry = storage.appendLog({ severity, attackType, message, source });
  return res.status(201).json({ success: true, data: entry });
}

/**
 * GET /api/logs/download?format=pdf
 * Streams a formatted PDF report of the current log dataset.
 */
function download(req, res, next) {
  try {
    const { severity, attackType } = req.query;
    const { data: logs } = storage.getLogs({ severity, attackType, limit: 1000 });

    // ── Build PDF ─────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="svdf-logs-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).fillColor('#00ff41').text('Security Vulnerability Detection Framework', { align: 'center' });
    doc.fontSize(12).fillColor('#aaaaaa').text('Threat Log Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#888888')
       .text(`Generated: ${new Date().toUTCString()}    Total entries: ${logs.length}`, { align: 'center' });
    doc.moveDown();

    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#333333').stroke();
    doc.moveDown(0.5);

    if (logs.length === 0) {
      doc.fontSize(12).fillColor('#ffffff').text('No log entries found matching the current filters.', { align: 'center' });
    } else {
      // Table header
      const colX   = [40, 180, 280, 370, 440];
      const headers = ['Timestamp', 'Source', 'Attack Type', 'Severity', 'Message'];

      doc.fontSize(9).fillColor('#00ff41');
      headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 115, lineBreak: false }));
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#444444').stroke();
      doc.moveDown(0.3);

      // Rows
      const severityColour = { high: '#ff4444', medium: '#ffaa00', low: '#44ff44', critical: '#ff0000' };

      logs.forEach((log, idx) => {
        // Alternate row background
        if (idx % 2 === 0) {
          doc.rect(40, doc.y - 2, 515, 14).fillColor('#111111').fill();
        }

        const rowY   = doc.y;
        const colour = severityColour[log.severity] || '#ffffff';
        const ts     = new Date(log.timestamp).toLocaleString('en-GB');

        doc.fontSize(7).fillColor('#cccccc').text(ts,                        colX[0], rowY, { width: 136, lineBreak: false });
        doc.fillColor('#aaaaaa')            .text(log.source   || '-',       colX[1], rowY, { width:  96, lineBreak: false });
        doc.fillColor('#aaaaaa')            .text(log.attackType || '-',     colX[2], rowY, { width:  86, lineBreak: false });
        doc.fillColor(colour)               .text((log.severity || '-').toUpperCase(), colX[3], rowY, { width: 66, lineBreak: false });
        doc.fillColor('#dddddd')            .text((log.message || '').substring(0, 80), colX[4], rowY, { width: 115 });
        doc.moveDown(0.15);

        if (doc.y > 760) {
          doc.addPage();
          doc.fontSize(8).fillColor('#555555').text('— continued —', { align: 'center' });
          doc.moveDown(0.5);
        }
      });
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#555555').text('SVDF — Security Vulnerability Detection Framework  |  Confidential', { align: 'center' });
    doc.end();
  } catch (err) { next(err); }
}

module.exports = { list, clearAll, create, download };
