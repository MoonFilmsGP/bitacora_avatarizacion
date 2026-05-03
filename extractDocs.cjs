const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (file.endsWith('.docx') && !file.startsWith('~')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getFiles('textos');
let results = {};

allFiles.forEach((file, index) => {
    const outName = `temp_doc${index}.html`;
    try {
        execSync(`npx mammoth "${file}" "${outName}"`);
        const html = fs.readFileSync(outName, 'utf8');
        let text = html.replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '');
        text = text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const baseName = path.basename(file);
        results[baseName] = text.trim();
        fs.unlinkSync(outName);
        console.log('Extracted:', baseName);
    } catch (e) {
        console.error('Error processing', file, e.message);
    }
});

fs.writeFileSync('src/data/documents.json', JSON.stringify(results, null, 2));
console.log('Saved to src/data/documents.json');
