const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper function to draw options
function drawOptions(page, x, y, numOptions, markType) {
    const shapeSize = 12;
    for (let i = 0; i < numOptions; i++) {
        const optionLetter = String.fromCharCode(65 + i); // 'A', 'B', 'C', etc.
        page.drawText(optionLetter, { x: x + (i * 50), y: y, size: 12 });

        if (markType === 'circle') {
            page.drawCircle({
                x: x + (i * 50) + 15,
                y: y - 5,
                size: shapeSize,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
        } else {
            page.drawRectangle({
                x: x + (i * 50) + 10,
                y: y - 12,
                width: shapeSize,
                height: shapeSize,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
        }
    }
}

// Endpoint to generate OMR Sheet
app.post('/generate-omr', async (req, res) => {
    const { numQuestions, numOptions, markType, layoutStyle, addDetails, generateKey } = req.body;

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    const margin = 50;
    let yPosition = 800;
    let xPosition = margin;

    // Optional: Add name and ID fields
    if (addDetails === 'yes') {
        page.drawText("Name: ______________________", { x: margin, y: yPosition, size: 14 });
        page.drawText("ID: ______________________", { x: margin + 300, y: yPosition, size: 14 });
        yPosition -= 40; // Adjust for space after adding name/ID
    }

    // Draw OMR circles/squares
    for (let i = 1; i <= numQuestions; i++) {
        // Handle column layout
        if (layoutStyle === 'double-column' && i > numQuestions / 2) {
            xPosition = margin + 300; // Second column
            if (i === Math.ceil(numQuestions / 2) + 1) yPosition = 800; // Reset Y for the second column
        }

        page.drawText(`Q${i}:`, { x: xPosition, y: yPosition, size: 12 });
        drawOptions(page, xPosition + 30, yPosition, numOptions, markType);

        yPosition -= 30; // Move down for the next question
        if (yPosition < 50 && layoutStyle === 'single-column') {
            yPosition = 800;
            page = pdfDoc.addPage([595.28, 841.89]); // Add a new page if necessary
        }
    }

    // Optional: Generate answer key
    if (generateKey === 'yes') {
        const answerPage = pdfDoc.addPage([595.28, 841.89]);
        answerPage.drawText("Answer Key:", { x: margin, y: 800, size: 14 });
        let answerYPosition = 780;
        for (let i = 1; i <= numQuestions; i++) {
            answerPage.drawText(`Q${i}: Correct Answer - ${String.fromCharCode(65 + Math.floor(Math.random() * numOptions))}`, {
                x: margin,
                y: answerYPosition,
                size: 12
            });
            answerYPosition -= 20;
        }
    }

    // Finalize PDF and send as response
    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
