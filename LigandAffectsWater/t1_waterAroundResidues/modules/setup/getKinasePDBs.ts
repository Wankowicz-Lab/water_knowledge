import fs from 'fs';

export interface KinasePDBExport {
    id: string;
    path: string;
}


export function getKinasePDBs(PDBDirectory = "../PDBs/") {
    const allKinase = fs.readFileSync('../all_kinase.txt', 'utf8').split('\n');

    const directoryItems = fs.readdirSync(PDBDirectory);
    let outputPDBs: KinasePDBExport[] = [];

    directoryItems.forEach((item) => {
        const folderPathChopped = item.split('/');
        const pdbId = folderPathChopped[folderPathChopped.length - 1].toLowerCase();

        if (allKinase.find(g => g == pdbId)) {
            outputPDBs.push({
                id: pdbId,
                path: `${PDBDirectory}${item}/${pdbId}.pdb`
            })
        }
    })

    return outputPDBs;
}