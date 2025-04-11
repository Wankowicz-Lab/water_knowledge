"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const parsePDB_1 = require("../../../modules/parsers/parsePDB");
const getKinasePDBs_1 = require("../../../modules/setup/getKinasePDBs");
const kinasePDBs = (0, getKinasePDBs_1.getKinasePDBs)();
const JSONOutput = [];
kinasePDBs.forEach(kpdbExport => {
    let parsedPDB = (0, parsePDB_1.parsePDB)(fs_1.default.readFileSync(kpdbExport.path, "utf-8"));
    let allWaters = parsedPDB.getWaterMolecules((water, pdb) => true);
    // actually, let's move this to python
    JSONOutput.push({
        PDB: kpdbExport.id,
        waters: allWaters.map(water => ({
            serial: water.serialNumber,
            x: water.x,
            y: water.y,
            z: water.z,
            bfactor: water.bFactor,
            occupancy: water.occupancy,
        }))
    });
});
fs_1.default.writeFileSync("./scripts/networks/WaterNetwork/allKinaseWaters.json", JSON.stringify(JSONOutput, null, 2));
