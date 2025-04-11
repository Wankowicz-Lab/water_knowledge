"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseApoHoloPairsCSV = parseApoHoloPairsCSV;
exports.getPairPathnames = getPairPathnames;
exports.getAllPDBs = getAllPDBs;
const fs_1 = __importDefault(require("fs"));
/**
 * Parse the Wankowicz CSV file with Apo-Holo pair data
 * @param CSVFilePath Path to the CSV file
 * @returns Array of Apo-Holo pair entries
 */
function parseApoHoloPairsCSV(CSVFilePath) {
    let CSVData = fs_1.default.readFileSync(CSVFilePath, 'utf8').split('\n').slice(1);
    let out = [];
    for (let line of CSVData) {
        let [Apo, Apo_Res, Holo, Holo_Res, Ligand] = line.split(',');
        out.push({ Apo, Apo_Res: parseFloat(Apo_Res), Holo, Holo_Res: parseFloat(Holo_Res), Ligand });
    }
    return out;
}
/**
 * Get paths for Apo-Holo pairs
 * @param CSVFilePath Path to the CSV file with Apo-Holo pairs
 * @returns Array of Apo-Holo pair pathnames
 */
function getPairPathnames(CSVFilePath, directory) {
    let parsed = parseApoHoloPairsCSV(CSVFilePath);
    // originalPath, mobilePath, originalOutputPath, mobileOutputPath
    let out = parsed.map(pair => {
        return {
            originalID: pair.Apo,
            mobileID: pair.Holo,
            originalPath: `${directory}/${pair.Apo}/${pair.Apo}.pdb`,
            mobilePath: `${directory}/${pair.Holo}/${pair.Holo}.pdb`,
            mobileAlignedPath: `${directory}/${pair.Holo}/${pair.Holo}_aligned.pdb`,
            originalOutputDirectory: `${directory}/${pair.Apo}`,
            mobileOutputDirectory: `${directory}/${pair.Holo}`
        };
    });
    return out;
}
/*
    * Get all PDBs from the CSV file
    * @param CSVFilePath Path to the CSV file with Apo-Holo pairs
    * @param directory Directory where the PDBs are stored
    * @returns Array of PDB IDs and their directories
    */
function getAllPDBs(CSVFilePath, directory) {
    let parsed = parseApoHoloPairsCSV(CSVFilePath);
    let pdbIdsAndPaths = [];
    for (let pair of parsed) {
        pdbIdsAndPaths.push({ pdbId: pair.Apo, directory: directory + '/' + pair.Apo + '/' });
        pdbIdsAndPaths.push({ pdbId: pair.Holo, directory: directory + '/' + pair.Holo + '/' });
    }
    let removedDuplicates = pdbIdsAndPaths.filter((value, index, self) => index === self.findIndex((t) => (t.pdbId === value.pdbId)));
    return removedDuplicates;
}
