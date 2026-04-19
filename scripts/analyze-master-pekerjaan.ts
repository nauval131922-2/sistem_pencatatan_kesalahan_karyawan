
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

async function main() {
    const filePath = path.join(process.cwd(), 'Referensi', '060105 MASTER PEKERJAAN.xlsm');
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = 'MASTER TARGET PEKERJAAN';
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;

        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const masterTargets: { name: string, target: number }[] = [];

        // Data starts from Row 4
        // Columns: 1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45
        const nameIndices = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45];

        for (let r = 0; r < data.length; r++) {
            const row = data[r] as any[];
            if (!row) continue;
            
            nameIndices.forEach(idx => {
                const name = row[idx];
                const target = row[idx + 2]; // Target is at NameIndex + 2 (Col D, H, L...)

                if (typeof name === 'string' && name.trim() && typeof target === 'number') {
                    masterTargets.push({
                        name: name.trim(),
                        target: target
                    });
                }
            });
        }

        const outputPath = path.join(process.cwd(), 'scripts', 'extracted_master_targets.json');
        fs.writeFileSync(outputPath, JSON.stringify(masterTargets, null, 2));
        console.log(`Successfully extracted ${masterTargets.length} target items to ${outputPath}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
