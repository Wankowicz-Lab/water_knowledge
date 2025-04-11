"use strict";
// this compares apo with multiple holos on heatmap
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const parsePDB_1 = require("../../../modules/parsers/parsePDB");
const csvReader_1 = require("../../../modules/setup/csvReader");
const compareWatersAtResidues_1 = require("../../../modules/processors/compareWatersAtResidues");
const PDBDirectory = '../PDBs/';
const csvData = (0, csvReader_1.getPairPathnames)('../apo_holo_pairs.csv', PDBDirectory);
let byApo = {};
csvData.forEach((pair) => {
    if (!byApo[pair.originalID]) {
        byApo[pair.originalID] = [];
    }
    byApo[pair.originalID].push(pair);
});
// sort by largest count
let sortedApoIDs = Object.keys(byApo).sort((a, b) => byApo[b].length - byApo[a].length);
let outputGraphDatas = [];
sortedApoIDs.slice(0, 5).forEach((apoID) => {
    console.log(`${apoID}: ${byApo[apoID].length} pairs`);
    let mainApoStruct = csvData.find(pair => pair.originalID === apoID);
    if (!mainApoStruct)
        return;
    let holoStructs = byApo[apoID];
    let apoPath = mainApoStruct.originalPath;
    if (!fs_1.default.existsSync(apoPath)) {
        console.log(`APO file does not exist: ${apoPath}`);
        return;
    }
    const PDBOne = (0, parsePDB_1.parsePDB)(fs_1.default.readFileSync(apoPath, 'utf8')); // APO
    let thisComparisonResults = [];
    holoStructs.forEach((holoStruct) => {
        const holoPath = holoStruct.mobileAlignedPath;
        if (!fs_1.default.existsSync(holoPath)) {
            console.log(`Holo file does not exist: ${holoPath}`);
            return;
        }
        const PDBTwo = (0, parsePDB_1.parsePDB)(fs_1.default.readFileSync(holoPath, 'utf8')); // HOLO
        const results = (0, compareWatersAtResidues_1.compareWatersAtResidues)(PDBOne, PDBTwo, 3.0);
        thisComparisonResults.push({
            holoID: holoStruct.mobileID,
            results: results.map((g) => {
                return {
                    residueNumber: g.residueNumber,
                    aminoAcid: g.residueName,
                    difference: g.difference,
                    distanceToLigand: g.distanceToLigand
                };
            })
        });
    });
    outputGraphDatas.push({
        apoID: apoID,
        comparisons: thisComparisonResults
    });
});
fs_1.default.writeFileSync('scripts/graphing/LigandSeriesComparison/outputGraphDatas.json', JSON.stringify(outputGraphDatas, null, 2)); // Save output graph data to a file
