"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const parsePDB_1 = require("../../../modules/parsers/parsePDB");
const compareWatersAtResidues_1 = require("../../../modules/processors/compareWatersAtResidues");
let apoStruct = (0, parsePDB_1.parsePDB)((0, fs_1.readFileSync)("../PDBs/7kqo/7kqo.pdb", "utf8"));
let apoName = "7kqo";
apoStruct.filterEntries(x => x.chainID == 'A' || x.chainID == 'S');
let exporting = [];
let allHolos = (0, fs_1.readdirSync)("../Mac1Holos/").filter(file => file.endsWith(".pdb"));
allHolos.forEach(holoFilePath => {
    let holoName = holoFilePath.split("-")[0];
    let holoPath = `../Mac1Holos/${holoFilePath}`;
    let holoStruct = (0, parsePDB_1.parsePDB)((0, fs_1.readFileSync)(holoPath, "utf8"));
    holoStruct.filterEntries(x => x.chainID == 'A' || x.chainID == 'S');
    let comparison = (0, compareWatersAtResidues_1.compareWatersAtResidues)(apoStruct, holoStruct, 3.0);
    exporting.push({
        apoPDBId: apoName,
        holoPDBId: holoName,
        waterComparison: comparison,
        netWaterChange: comparison.reduce((acc, curr) => acc + curr.difference, 0)
    });
});
(0, fs_1.writeFileSync)('./scripts/graphing/Mac1Holos/water_comparison.json', JSON.stringify(exporting, null, 2));
