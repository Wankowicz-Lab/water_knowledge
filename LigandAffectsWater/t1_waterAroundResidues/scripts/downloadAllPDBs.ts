import fs from 'fs';

import { getAllPDBs } from "../modules/setup/csvReader";
import { downloadPDBRedoFiles } from "../modules/setup/downloadPDBRedoFiles";
import { getKinasePDBs } from '../modules/setup/getKinasePDBs';


// DOWNLOAD APO/HOLO PAIR PDBS VVVVVVVVVVV
function downloadApoHoloCSVPDBs() {
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
}


// DOWNLOAD KINASE PDBS VVVVV
async function downloadKinasePDBs() {
    let pdbList = fs.readFileSync('../all_kinase.txt');
    let kinasePDBs = pdbList.toString().split('\n').filter(pdb => pdb.trim() !== '' && !pdb.includes("_"));
    const PDBsPath = '../PDBs/';

    console.log(kinasePDBs.length)
    for (let i = 0; i < kinasePDBs.length; i+=10) { 

        let promises = [];

        let batch = kinasePDBs.slice(i, i + 10);
        console.log(`Downloading batch: ${batch.join(', ')}`);
        for (let pdbId of batch) {
            let pdbPath = `${PDBsPath}${pdbId.toLowerCase()}/`;
            if (!fs.existsSync(pdbPath)) {
                fs.mkdirSync(pdbPath, { recursive: true });
            }
            promises.push(downloadPDBRedoFiles(pdbId.toLowerCase(), pdbPath));
        }

        await Promise.all(promises).then(() => {
            console.log(`Downloaded batch starting to finish: ${batch.join(', ')}`);
        }).catch(err => {
            console.error('Error downloading batch:', err);
        });
    }

    console.log('All kinase PDB files downloaded!');
}

downloadKinasePDBs();


process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
})