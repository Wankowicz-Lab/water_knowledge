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
    allComparisonResults.push(...results);
    console.log(`Processed ${index + 1}/${pairs.length} pairs`);
});
const distanceBins = [
    { min: 0, max: 3, label: '0-3Å' },
    { min: 3, max: 6, label: '3-6Å' },
    { min: 6, max: 9, label: '6-9Å' },
    { min: 9, max: 12, label: '9-12Å' },
    { min: 12, max: Infinity, label: '12+Å' }
];
const aminoAcids = Array.from(new Set(allComparisonResults.map(r => r.residueName))).sort();
const groupedData = [];
for (const aa of aminoAcids) {
    for (const bin of distanceBins) {
        const filteredResults = allComparisonResults.filter(r => {
            var _a, _b;
            return r.residueName === aa &&
                ((_a = r.distanceToLigand) !== null && _a !== void 0 ? _a : 0) >= bin.min &&
                ((_b = r.distanceToLigand) !== null && _b !== void 0 ? _b : 0) < bin.max;
        });
        if (filteredResults.length === 0)
            continue;
        const avgChange = filteredResults.reduce((sum, r) => sum + r.difference, 0) / filteredResults.length;
        groupedData.push({
            aminoAcid: aa,
            distanceBin: bin.label,
            distanceMin: bin.min,
            avgWaterChange: avgChange,
            count: filteredResults.length
        });
    }
}
const exportData = {
    aggregated: groupedData.sort((a, b) => a.distanceMin - (b.distanceMin)),
    raw: allComparisonResults.map(r => ({
        aminoAcid: r.residueName,
        residueNumber: r.residueNumber,
        chainID: r.chainID,
        waterDifference: r.difference,
        distanceToLigand: r.distanceToLigand
    }))
};
fs_1.default.writeFileSync('scripts/graphing/AllComparison1/allComparisonResultsAggregated.json', JSON.stringify(exportData, null, 2));
