const fs = require('fs');
const path = require('path');

async function convertPdfToImage() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const pdfPath = path.resolve(process.argv[2] || 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\a1a0a74c-ede4-4dcc-84de-4e2ec5b4b775\\Quote-Pzd6wNfM5E20hKqH87RG-final.pdf');
    const outputPath = process.argv[3] || pdfPath.replace('.pdf', '.png');
    
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    
    // Use node-canvas if available, otherwise just extract text
    try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;
        
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log('PNG saved to:', outputPath);
    } catch (e) {
        // Fallback: extract text content
        console.log('Canvas not available, extracting text content instead...');
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');
        console.log('\n--- PDF TEXT CONTENT ---');
        console.log(text);
        console.log('--- END ---');
    }
}

convertPdfToImage().catch(console.error);
