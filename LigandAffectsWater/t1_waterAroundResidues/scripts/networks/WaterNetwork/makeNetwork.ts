import fs from "fs";

import { parsePDB, PDB, PDBLineEntry } from "../../../modules/parsers/parsePDB";
import { getKinasePDBs, KinasePDBExport } from "../../../modules/setup/getKinasePDBs";
import { getClusterIdentifiers } from "./getKinaseSequenceIdentity";


const kinasePDBs : KinasePDBExport[] = getKinasePDBs();
const JSONOutput = [];


kinasePDBs.forEach(kpdbExport => {
    if (fs.existsSync(kpdbExport.path) === false) {
        console.log(`PDB file not found for ${kpdbExport.id}, skipping...`);
        return;
    }
    let parsedPDB = parsePDB(fs.readFileSync(kpdbExport.path, "utf-8"));

    let allWaters = parsedPDB.getWaterMolecules(
        (water : PDBLineEntry, pdb: PDB) => true
    );

    // actually, let's move this to python
    
  
    JSONOutput.push({
        PDB: kpdbExport.id,
        sequenceIdentityIdentifiers: getClusterIdentifiers(kpdbExport.id),
        waters: allWaters.map(water => ({
            serial: water.serialNumber,
            x: water.x,
            y: water.y,
            z: water.z,
            bfactor: water.bFactor,
            occupancy: water.occupancy,
        }))
    });
})

fs.writeFileSync("./scripts/networks/WaterNetwork/allKinaseWaters.json", JSON.stringify(JSONOutput, null, 2));