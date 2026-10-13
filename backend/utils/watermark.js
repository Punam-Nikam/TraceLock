// watermark.js
// Adds VISIBLE diagonal watermark to PDFs and images
// The watermark contains encrypted employee UID
// When leaked file is uploaded, we extract and decrypt it

const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const sharp = require('sharp');

// ── ADD WATERMARK TO PDF ─────────────────────────────────────────
// Adds both a visible diagonal watermark AND a hidden metadata marker
const addWatermarkToPDF = async (pdfBuffer, watermarkText, employeeUID) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages  = pdfDoc.getPages();

    // The visible display text shows the UID (not encrypted)
    // The hidden marker stores the encrypted watermarkText for extraction
    const displayText = `CONFIDENTIAL - ${employeeUID}`;
    const markerText  = `[TRACELOCK:${watermarkText}]`;

    for (const page of pages) {
      const { width, height } = page.getSize();

      // ── VISIBLE DIAGONAL WATERMARK (repeating) ──
      const positions = [
        { x: width * 0.1,  y: height * 0.3  },
        { x: width * 0.1,  y: height * 0.6  },
        { x: width * 0.4,  y: height * 0.15 },
        { x: width * 0.4,  y: height * 0.5  },
        { x: width * 0.4,  y: height * 0.8  },
      ];

      for (const pos of positions) {
        page.drawText(displayText, {
          x:       pos.x,
          y:       pos.y,
          size:    18,
          font,
          color:   rgb(0.85, 0.85, 0.85), // light grey — visible
          opacity: 0.35,
          rotate:  degrees(45),
        });
      }

      // ── HIDDEN MACHINE-READABLE MARKER ──
      // Tiny white text at bottom — invisible to human eye
      // but readable by our extraction algorithm
      page.drawText(markerText, {
        x:       5,
        y:       5,
        size:    3,
        font,
        color:   rgb(0.99, 0.99, 0.99),
        opacity: 0.02,
      });
    }

    // Set PDF metadata to also store the watermark
    pdfDoc.setSubject(`TRACELOCK_WATERMARK:${watermarkText}`);
    pdfDoc.setKeywords([`wm:${watermarkText}`]);

    const savedBytes = await pdfDoc.save();
    return Buffer.from(savedBytes);
  } catch (err) {
    console.error('PDF watermark error:', err.message);
    // Return original buffer if watermarking fails
    return pdfBuffer;
  }
};

// ── ADD WATERMARK TO IMAGE ───────────────────────────────────────
const addWatermarkToImage = async (imageBuffer, watermarkText, employeeUID) => {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const w    = meta.width  || 800;
    const h    = meta.height || 600;

    const displayText = `CONFIDENTIAL - ${employeeUID}`;
    const fontSize    = Math.max(16, Math.min(w / 20, 36));

    // Create SVG with repeating watermark text
    const svgOverlay = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wm" x="0" y="0" width="300" height="150" patternUnits="userSpaceOnUse">
            <text
              x="150" y="75"
              font-family="Arial, sans-serif"
              font-size="${fontSize}"
              font-weight="bold"
              fill="rgba(200,200,200,0.4)"
              text-anchor="middle"
              dominant-baseline="middle"
              transform="rotate(-30, 150, 75)"
            >${displayText}</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wm)"/>
        <!-- Hidden marker at 1x1 pixel corner — stores encrypted ID in color values -->
        <text x="1" y="1" font-size="1" fill="rgba(0,0,0,0.001)">${watermarkText}</text>
      </svg>
    `;

    const watermarked = await sharp(imageBuffer)
      .composite([{
        input:  Buffer.from(svgOverlay),
        blend:  'over',
        top:    0,
        left:   0
      }])
      .toBuffer();

    return watermarked;
  } catch (err) {
    console.error('Image watermark error:', err.message);
    return imageBuffer;
  }
};

// ── EXTRACT WATERMARK FROM PDF ───────────────────────────────────
// Looks for our hidden marker in multiple ways
const extractWatermarkFromPDF = async (pdfBuffer) => {
  try {
    // Method 1: Load PDF and check metadata
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const subject = pdfDoc.getSubject() || '';
    const keywords = pdfDoc.getKeywords() || '';

    // Check subject field
    const subjectMatch = subject.match(/TRACELOCK_WATERMARK:([a-f0-9]+)/);
    if (subjectMatch) return subjectMatch[1];

    // Check keywords
    const keywordMatch = keywords.match(/wm:([a-f0-9]+)/);
    if (keywordMatch) return keywordMatch[1];

    // Method 2: Scan raw buffer for hidden text marker
    const rawText = pdfBuffer.toString('latin1');

    // Look for our marker pattern
    const markerMatch = rawText.match(/\[TRACELOCK:([a-f0-9]+)\]/);
    if (markerMatch) return markerMatch[1];

    // Method 3: Broader search
    const broadMatch = rawText.match(/TRACELOCK[_:]([a-f0-9]{16,})/);
    if (broadMatch) return broadMatch[1];

    return null;
  } catch (err) {
    console.error('Watermark extraction error:', err.message);
    return null;
  }
};

module.exports = {
  addWatermarkToPDF,
  addWatermarkToImage,
  extractWatermarkFromPDF
};