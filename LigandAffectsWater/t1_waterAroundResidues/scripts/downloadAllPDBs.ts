import fs from 'fs';

import { getAllPDBs } from "../modules/setup/csvReader";
import { downloadPDBRedoFiles } from "../modules/setup/downloadPDBRedoFiles";

const csvPath = '../apo_holo_pairs.csv';
const PDBsPath = '../PDBs';

const allPDBs = getAllPDBs(csvPath, PDBsPath);

async function startDownload() {
    for (var pdb in allPDBs) {
        let pdbContext = allPDBs[pdb];
        
        if (!fs.existsSync(pdbContext.directory)) {
            fs.mkdirSync(pdbContext.directory);
        }

        await downloadPDBRedoFiles(pdbContext.pdbId, pdbContext.directory);
        console.log(`Downloaded PDB files for ${pdbContext.pdbId}`);
    }
    console.log('All PDB files downloaded!');
}

startDownload();


process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
})