const express = require('express');
const pdfLib = require('pdf-lib'); // Use any PDF generation library
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint to generate OMR Sheet
app.post('/generate-omr', async (req, res) => {
    const { numQuestions, numOptions } = req.body;

    // Validate input
    if (!numQuestions || !numOptions) {
        return res.status(400).json({ error: "Invalid input" });
    }

    // PDF creation using pdf-lib
    const { PDFDocument, rgb } = require('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size (in points)

    const fontSize = 12;
    const margin = 50;
    const startY = 800;

    let yPosition = startY;

    // Add questions and options (A, B, C, D, etc.)
    for (let i = 1; i <= numQuestions; i++) {
        page.drawText(`Question ${i}:`, { x: margin, y: yPosition, size: fontSize });
        for (let j = 0; j < numOptions; j++) {
            const optionLetter = String.fromCharCode(65 + j); // Converts 0 to 'A', 1 to 'B', etc.
            page.drawText(`${optionLetter}`, { x: margin + 100 + (j * 50), y: yPosition, size: fontSize });
            page.drawCircle({
                x: margin + 95 + (j * 50),
                y: yPosition - 5,
                size: 10,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
        }
        yPosition -= 30; // Move down for the next question
    }

    // Convert PDF to byte array and send it as a download
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
