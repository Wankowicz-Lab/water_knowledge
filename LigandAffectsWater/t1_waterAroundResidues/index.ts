
import { compareWatersAtResidues, getSignificantChanges, summarizeWaterComparison } from "./modules/processors/compareWatersAtResidues";
import { exportPDB, parsePDB } from "./modules/parsers/parsePDB";
import fs from 'fs';
import { ApoHoloPairPathnames, getPairPathnames } from "./modules/setup/csvReader";

const PDBDirectory = '../PDBs/';



// const PDBOne = parsePDB(fs.readFileSync(`${PDBDirectory}1a3h/1a3h_aligned.pdb`, 'utf8')); // APO
// const PDBTwo = parsePDB(fs.readFileSync(`${PDBDirectory}3a3h/3a3h_aligned.pdb`, 'utf8')); // HOLO



// const comparisonResults = compareWatersAtResidues(PDBOne, PDBTwo, 5.0);

// console.log(comparisonResults)

// // Get summary statistics
// const summary = summarizeWaterComparison(comparisonResults);
// console.log(`Total residues analyzed: ${summary.totalResidues}`);
// console.log(`Residues with more water in structure 2: ${summary.residuesWithMoreWater}`);
// console.log(`Residues with less water in structure 2: ${summary.residuesWithLessWater}`);
// console.log(`Residues with no change in water: ${summary.residuesWithSameWater}`);

// // Get residues with significant water changes
// const significantChanges = getSignificantChanges(comparisonResults, 2);
// console.log('\nResidues with significant water changes:');
// for (const change of significantChanges) {
//     console.log(`${change.residueName}${change.residueNumber}${change.chainID}: ${change.structure1WaterCount} -> ${change.structure2WaterCount} (${change.difference > 0 ? '+' : ''}${change.difference})`);
// }

// let colorForChangeAmount: Record<'-4' | '-3' | '-2' | '-1' | '0' | '1' | '2' | '3' | '4', string> = {
//     "-4": '0xff0000',
//     "-3": '0xff3300',
//     "-2": '0xff6600',
//     "-1": '0xff9900',
//     "0": '0xfafafa',
//     "1": '0x99ff99',
//     "2": '0x66ff66',
//     "3": '0x33ff33',
//     "4": '0x00ff00'
// }

// let command = ``;

// Object.keys(colorForChangeAmount).forEach((changeAmount: string) => {

//     let residues = significantChanges.filter((change) => change.difference == parseInt(changeAmount));
//     let color = colorForChangeAmount[changeAmount as '-4' | '-3' | '-2' | '-1' | '0' | '1' | '2' | '3' | '4'];
//     let residueList = residues.map(residue => `resi ${residue.residueNumber}`).join(' or ');
//     if (residueList.length == 0) return;
//     command += `color ${color}, ${residueList};\n`;
// })

// console.log(command)