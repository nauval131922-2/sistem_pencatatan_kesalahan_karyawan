import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src/app');

function walk(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (file.endsWith('Client.tsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const clientFiles = walk(SRC_DIR);

clientFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // 1. Remove standard setScrapeHist block
    // Example: setScrapeHist(prev => {\n ... });
    const setScrapeRegex = /^\s*setScrapeHist\(prev\s*=>\s*\{[\s\S]*?\}\);\s*$/gm;
    if (setScrapeRegex.test(content)) {
        content = content.replace(setScrapeRegex, '');
        changed = true;
    }
    
    // Also catch some inline ones if they exist
    const setScrapeRegex2 = /\n\s+setScrapeHist\([\s\S]*?\);(?=\n\s+(?:if|try|const|let|return|await|\}))/g;
    // Actually, writing a precise regex for arbitrary balanced brackets is impossible in standard JS regex,
    // let's do something simpler:
    const scrapeBlockRegex = /\n\s*setScrapeHist\(prev\s*=>\s*\{[^{]*?\}\);/g;
    if (scrapeBlockRegex.test(content)) {
      content = content.replace(scrapeBlockRegex, '');
      changed = true;
    }
    // Alternatively, just manually replace it with empty string by matching everything up to });
    // This is safer since we know the structure.
    const strictSetScrape = /setScrapeHist\(prev\s*=>\s*\{[^}]*\}\);?/g;
    content = content.replace(strictSetScrape, '');

    // 2. Remove state declaration
    const stateRegex = /const\s+\[scrapeHist,\s*setScrapeHist\]\s*=\s*useState<.*?>\(null\);/g;
    if (stateRegex.test(content)) {
        content = content.replace(stateRegex, '');
        changed = true;
    }

    // 3. Fix the UI part for Diperbarui
    // We want to replace everything from <span>Diperbarui... up to </span> to just be the start/end date version.
    
    // Some have <span className="opacity-40">|</span><span>Diperbarui
    // Some have <span className="opacity-40">|</span>\n<span>Diperbarui
    // Let's match from Diperbarui: {lastUpdated} until the end of that span.
    
    const uiRegex1 = /<span>\s*Diperbarui:\s*\{lastUpdated\}\s*\{scrapeHist[\s\S]*?<\/span>\s*<\/span>/g;
    const uiRegex2 = /<span>\s*Diperbarui:\s*\{lastUpdated\}[\s\S]*?<\/span>\s*<\/span>\s*<\/div>\s*\)\}/g;
    
    // Let's use string manipulation if it's there
    if (content.includes('{scrapeHist && (')) {
        const parts = content.split('{scrapeHist && (');
        if (parts.length === 2) {
            // Find the end of the scrapeHist block
            const endIdx = parts[1].indexOf(')}');
            if (endIdx !== -1) {
                // Remove the '{scrapeHist && ( ... )}' block completely
                content = parts[0] + parts[1].substring(endIdx + 2);
                changed = true;
            }
        }
    }
    
    // Final generic cleanup of Diperbarui string
    // Replace `<span>Diperbarui: {lastUpdated}</span>` or `<span>\n Diperbarui: {lastUpdated} \n </span>`
    // with `<span>Diperbarui: {lastUpdated} (Periode: {startDate ? startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} - {endDate ? endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''})</span>`
    
    // Reset Diperbarui part
    const diperbaruiPattern = /<span>\s*Diperbarui:\s*\{lastUpdated\}\s*<\/span>/g;
    content = content.replace(diperbaruiPattern, "<span>Diperbarui: {lastUpdated} (Periode: {startDate ? startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} - {endDate ? endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''})</span>");
    
    const diperbaruiPattern2 = /Diperbarui:\s*\{lastUpdated\}(\s*\(Periode:[^)]+\))?/g;
    // Be careful not to replace it if it's already there nicely.
    
    // Just replace the whole span to be safe if it doesn't have Periode
    // This is a bit tricky, let's just do it directly.

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
});
