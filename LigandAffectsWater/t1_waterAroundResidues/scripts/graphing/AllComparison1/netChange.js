"use strict";
// Compare all water movement in all PDBs to get a summary of the amino acids gaining waters vs losing waters
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const compareWatersAtResidues_1 = require("../../../modules/processors/compareWatersAtResidues");
const csvReader_1 = require("../../../modules/setup/csvReader");
const parsePDB_1 = require("../../../modules/parsers/parsePDB");
let allComparisonResults = [];
const pairs = (0, csvReader_1.getPairPathnames)('../apo_holo_pairs.csv', '../PDBs');
let changeDPs = [];
let perPDBWater = `pdb,water count\n`;
pairs.forEach((pair, index) => {
    let apoPath = pair.originalPath;
    let holoPath = pair.mobileAlignedPath;
    if (!fs_1.default.existsSync(apoPath) || !fs_1.default.existsSync(holoPath)) {
        console.log(`One of the files does not exist: ${apoPath} or ${holoPath}`);
        return;
    }
    const PDBOne = (0, parsePDB_1.parsePDB)(fs_1.default.readFileSync(apoPath, 'utf8')); // APO
    const PDBTwo = (0, parsePDB_1.parsePDB)(fs_1.default.readFileSync(holoPath, 'utf8')); // HOLO
    const results = (0, compareWatersAtResidues_1.compareWatersAtResidues)(PDBOne, PDBTwo, 3.0);
    let totalWaterDiff = 0;
    results.forEach((result) => {
        totalWaterDiff += result.difference;
    });
    console.log(`Processed ${index + 1}/${pairs.length} pairs`);
    changeDPs.push({
        holoPDB: pair.mobileID,
        apoPDB: pair.originalID,
        waterChange: totalWaterDiff,
    });
    perPDBWater += `${pair.originalID},${PDBOne.getWaterMolecules(() => true).length}\n`;
    perPDBWater += `${pair.mobileID},${PDBTwo.getWaterMolecules(() => true).length}\n`;
});
console.log(`Average water change: ${changeDPs.reduce((a, b) => a + b, 0) / changeDPs.length}`);
fs_1.default.writeFileSync('scripts/graphing/AllComparison1/perPDBWater.csv', perPDBWater, 'utf8');
fs_1.default.writeFileSync('scripts/graphing/AllComparison1/waterChangeDPs.json', JSON.stringify(changeDPs, null, 2), 'utf8');
