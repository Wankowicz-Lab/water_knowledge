// Compare all water movement in all PDBs to get a summary of the amino acids gaining waters vs losing waters

import fs from 'fs';

import { compareWatersAtResidues, WaterComparisonResult } from "../../../modules/processors/compareWatersAtResidues";
import { getPairPathnames } from "../../../modules/setup/csvReader";
import { parsePDB } from '../../../modules/parsers/parsePDB';

let allComparisonResults: WaterComparisonResult[] = [];
const pairs = getPairPathnames('../apo_holo_pairs.csv', '../PDBs');

let changeDPs = [];
let perPDBWater = `pdb,water count\n`;

pairs.forEach((pair, index) => {
    let apoPath = pair.originalPath;
    let holoPath = pair.mobileAlignedPath;

    if (!fs.existsSync(apoPath) || !fs.existsSync(holoPath)) {
        console.log(`One of the files does not exist: ${apoPath} or ${holoPath}`);
        return;
    }


    const PDBOne = parsePDB(fs.readFileSync(apoPath, 'utf8')); // APO
    const PDBTwo = parsePDB(fs.readFileSync(holoPath, 'utf8')); // HOLO

    const results = compareWatersAtResidues(PDBOne, PDBTwo, 3.0);

    let totalWaterDiff = 0;
    results.forEach((result) => {
        totalWaterDiff += result.difference;
    })


    console.log(`Processed ${index + 1}/${pairs.length} pairs`);
    changeDPs.push({
        holoPDB: pair.mobileID,
        apoPDB: pair.originalID,
        waterChange: totalWaterDiff,
    });

    perPDBWater += `${pair.originalID},${PDBOne.getWaterMolecules(() => true).length}\n`;
    perPDBWater += `${pair.mobileID},${PDBTwo.getWaterMolecules(() => true).length}\n`;

})

console.log(`Average water change: ${changeDPs.reduce((a, b) => a + b, 0) / changeDPs.length}`);

fs.writeFileSync('scripts/graphing/AllComparison1/perPDBWater.csv', perPDBWater, 'utf8');
fs.writeFileSync('scripts/graphing/AllComparison1/waterChangeDPs.json', JSON.stringify(changeDPs, null, 2), 'utf8');
