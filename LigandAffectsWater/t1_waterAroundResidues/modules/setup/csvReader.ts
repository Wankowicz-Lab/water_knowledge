import fs from 'fs';

export interface ApoHoloPairEntry {
    Apo: string;
    Apo_Res: number;
    Holo: string;
    Holo_Res: number;
    Ligand: string;
}

/**
 * Parse the Wankowicz CSV file with Apo-Holo pair data
 * @param CSVFilePath Path to the CSV file
 * @returns Array of Apo-Holo pair entries
 */
export function parseApoHoloPairsCSV( CSVFilePath: string ) {
    let CSVData = fs.readFileSync(CSVFilePath, 'utf8').split('\n').slice(1);
    let out : ApoHoloPairEntry[] = [];

    for (let line of CSVData) {
        let [ Apo, Apo_Res, Holo, Holo_Res, Ligand ] = line.split(',');
        out.push({ Apo, Apo_Res: parseFloat(Apo_Res), Holo, Holo_Res: parseFloat(Holo_Res), Ligand });
    }

    return out;
}


export interface ApoHoloPairPathnames {
    originalID: string;
    mobileID: string;
    originalPath: string;
    mobilePath: string;
    mobileAlignedPath: string;
    originalOutputDirectory: string;
    mobileOutputDirectory: string;
}


/**
 * Get paths for Apo-Holo pairs
 * @param CSVFilePath Path to the CSV file with Apo-Holo pairs
 * @returns Array of Apo-Holo pair pathnames
 */
export function getPairPathnames( CSVFilePath: string, directory: string ) {
    let parsed = parseApoHoloPairsCSV(CSVFilePath);
    // originalPath, mobilePath, originalOutputPath, mobileOutputPath
    let out = parsed.map( pair => {
        return {
            
            originalID: pair.Apo,
            mobileID: pair.Holo,

            originalPath: `${directory}/${pair.Apo}/${pair.Apo}.pdb`,
            mobilePath: `${directory}/${pair.Holo}/${pair.Holo}.pdb`,
            mobileAlignedPath: `${directory}/${pair.Holo}/${pair.Holo}_aligned.pdb`,
            originalOutputDirectory: `${directory}/${pair.Apo}`,
            mobileOutputDirectory: `${directory}/${pair.Holo}`

        } as ApoHoloPairPathnames
    });

    return out;
}


/*
    * Get all PDBs from the CSV file
    * @param CSVFilePath Path to the CSV file with Apo-Holo pairs
    * @param directory Directory where the PDBs are stored
    * @returns Array of PDB IDs and their directories
    */
export function getAllPDBs( CSVFilePath: string, directory: String) {
    let parsed = parseApoHoloPairsCSV(CSVFilePath);
    let pdbIdsAndPaths : ({pdbId: string, directory: string })[] = [];

    for (let pair of parsed) {
        pdbIdsAndPaths.push({ pdbId: pair.Apo, directory: directory + '/' + pair.Apo + '/' });
        pdbIdsAndPaths.push({ pdbId: pair.Holo, directory: directory + '/' + pair.Holo + '/' });
    }

    let removedDuplicates = pdbIdsAndPaths.filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.pdbId === value.pdbId
        ))
    );

    return removedDuplicates;
}