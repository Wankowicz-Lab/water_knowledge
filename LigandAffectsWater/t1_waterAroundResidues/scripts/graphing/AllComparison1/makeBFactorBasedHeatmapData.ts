// Compare all water movement in all PDBs to get a summary of the amino acids gaining waters vs losing waters

import fs from 'fs';

import { compareWatersAtResidues, WaterComparisonResult } from "../../../modules/processors/compareWatersAtResidues";
import { getPairPathnames } from "../../../modules/setup/csvReader";
import { parsePDB, PDB, PDBLineEntry } from '../../../modules/parsers/parsePDB';

let allComparisonResults: WaterComparisonResult[] = [];
const pairs = getPairPathnames('../apo_holo_pairs.csv', '../PDBs');

pairs.forEach((pair, index) => {
    let apoPath = pair.originalPath;
    let holoPath = pair.mobileAlignedPath;

    if (!fs.existsSync(apoPath) || !fs.existsSync(holoPath)) {
        console.log(`One of the files does not exist: ${apoPath} or ${holoPath}`);
        return;
    }


    const PDBOne = parsePDB(fs.readFileSync(apoPath, 'utf8')); // APO
    const PDBTwo = parsePDB(fs.readFileSync(holoPath, 'utf8')); // HOLO

    PDBOne.getAverageBFactor(true);
    PDBTwo.getAverageBFactor(true);

    const results = compareWatersAtResidues(PDBOne, PDBTwo, 3.0, 
        (water : PDBLineEntry, pdb : PDB) => {
            if (pdb.averageProteinBFactor) {
                return water.bFactor >= pdb.averageProteinBFactor * 1.2;
            }
            return false;
        }
    );

    allComparisonResults.push(...results);
    console.log(`Processed ${index + 1}/${pairs.length} pairs`);

})

// fs.writeFileSync('scripts/graphing/AllComparison1/allComparisonResults.json', JSON.stringify(allComparisonResults, null, 2)); // Save all comparison results to a file



/* BIN them and prepare to send over to python for graphing */

interface AggregatedWaterData {
    aminoAcid: string;
    distanceBin: string;
    distanceMin: number;
    avgWaterChange: number;
    count: number;
}

const distanceBins = [
    { min: 0, max: 3, label: '0-3Å' },
    { min: 3, max: 6, label: '3-6Å' },
    { min: 6, max: 9, label: '6-9Å' },
    { min: 9, max: 12, label: '9-12Å' },
    { min: 12, max: Infinity, label: '12+Å' }
];

const aminoAcids = Array.from(new Set(allComparisonResults.map(r => r.residueName))).sort();
const groupedData: AggregatedWaterData[] = [];

for (const aa of aminoAcids) {
    for (const bin of distanceBins) {
        const filteredResults = allComparisonResults.filter(r =>
            r.residueName === aa &&
            (r.distanceToLigand ?? 0) >= bin.min &&
            (r.distanceToLigand ?? 0) < bin.max
        );

        if (filteredResults.length === 0) continue;

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

fs.writeFileSync('scripts/graphing/AllComparison1/allComparisonResultsAggregated_bfacgte.json', JSON.stringify(exportData, null, 2));
