import fs from "fs";

import { parsePDB, PDB, PDBLineEntry } from "../../../modules/parsers/parsePDB";
import { getKinasePDBs, KinasePDBExport } from "../../../modules/setup/getKinasePDBs";


const kinasePDBs : KinasePDBExport[] = getKinasePDBs();
const JSONOutput = [];


kinasePDBs.forEach(kpdbExport => {
    let parsedPDB = parsePDB(fs.readFileSync(kpdbExport.path, "utf-8"));

    let allWaters = parsedPDB.getWaterMolecules(
        (water : PDBLineEntry, pdb: PDB) => true
    );

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
})

fs.writeFileSync("./scripts/networks/WaterNetwork/allKinaseWaters.json", JSON.stringify(JSONOutput, null, 2));