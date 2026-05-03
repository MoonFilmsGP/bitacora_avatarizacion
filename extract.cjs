const fs = require('fs');
const xml = fs.readFileSync('temp_docx/word/document.xml', 'utf8');

const paragraphs = xml.match(/<w:p[ >].*?<\/w:p>/g) || [];

paragraphs.forEach(p => {
    let text = '';
    const runs = p.match(/<w:r[ >].*?<\/w:r>/g) || [];
    runs.forEach(r => {
        const rPr = r.match(/<w:rPr>.*?<\/w:rPr>/);
        const tMatch = r.match(/<w:t.*?>([\s\S]*?)<\/w:t>/);
        if (tMatch) {
            if (rPr) console.log("FORMAT:", rPr[0], "TEXT:", tMatch[1]);
            else console.log("FORMAT: NONE", "TEXT:", tMatch[1]);
        }
    });
});
