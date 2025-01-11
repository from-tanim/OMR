// Endpoint to generate OMR Sheet
app.post('/generate-omr', async (req, res) => {
    try {
        const {
            numQuestions,
            numOptions,
            markType,
            layoutStyle,
            addDetails,
            generateKey,
        } = req.body;

        // Validate input
        if (!numQuestions || !numOptions || !markType) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }
        if (numOptions < 2 || numOptions > 10) {
            return res.status(400).json({ error: 'numOptions must be between 2 and 10.' });
        }
        if (!['circle', 'rectangle'].includes(markType)) {
            return res.status(400).json({ error: 'Invalid markType. Use "circle" or "rectangle".' });
        }
        if (!['single-column', 'double-column'].includes(layoutStyle)) {
            return res.status(400).json({ error: 'Invalid layoutStyle. Use "single-column" or "double-column".' });
        }

        // Create a new PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([595.28, 841.89]); // A4 size

        const margin = 50;
        let yPosition = 800;
        let xPosition = margin;

        // Optional: Add name and ID fields
        if (addDetails === 'yes') {
            page.drawText('Name: ______________________', { x: margin, y: yPosition, size: 14 });
            page.drawText('ID: ______________________', { x: margin + 300, y: yPosition, size: 14 });
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
            if (yPosition < 50) {
                yPosition = 800;
                page = pdfDoc.addPage([595.28, 841.89]); // Add a new page if necessary
            }
        }

        // Optional: Generate answer key
        if (generateKey === 'yes') {
            const answerPage = pdfDoc.addPage([595.28, 841.89]);
            answerPage.drawText('Answer Key:', { x: margin, y: 800, size: 14 });
            let answerYPosition = 780;
            for (let i = 1; i <= numQuestions; i++) {
                answerPage.drawText(
                    `Q${i}: Correct Answer - ${String.fromCharCode(65 + Math.floor(Math.random() * numOptions))}`,
                    { x: margin, y: answerYPosition, size: 12 }
                );
                answerYPosition -= 20;
            }
        }

        // Finalize PDF and send as response
        const pdfBytes = await pdfDoc.save();

        // Correct response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="omr-sheet.pdf"');
        res.status(200).send(pdfBytes);
    } catch (error) {
        console.error('Error generating OMR sheet:', error);
        res.status(500).json({ error: 'Failed to generate OMR sheet.' });
    }
});
