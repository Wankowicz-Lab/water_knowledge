// this compares apo with multiple holos on heatmap

import fs from 'fs';
import { parsePDB } from "../../../modules/parsers/parsePDB";
import { ApoHoloPairPathnames, getPairPathnames } from "../../../modules/setup/csvReader";
import { compareWatersAtResidues } from '../../../modules/processors/compareWatersAtResidues';

const PDBDirectory = '../PDBs/';


const csvData = getPairPathnames('../apo_holo_pairs.csv', PDBDirectory);

let byApo : { [key: string ]: ApoHoloPairPathnames[] } = {};

csvData.forEach((pair) => {
    if (!byApo[pair.originalID]) {
        byApo[pair.originalID] = [];
    }
    byApo[pair.originalID].push(pair);
})

// sort by largest count
let sortedApoIDs = Object.keys(byApo).sort((a, b) => byApo[b].length - byApo[a].length);


let outputGraphDatas = [];

sortedApoIDs.slice(0, 5).forEach((apoID) => {
    console.log(`${apoID}: ${byApo[apoID].length} pairs`);

    let mainApoStruct = csvData.find(pair => pair.originalID === apoID);
    if (!mainApoStruct) return;

    let holoStructs = byApo[apoID]
    let apoPath = mainApoStruct.originalPath;

    if (!fs.existsSync(apoPath)) {
        console.log(`APO file does not exist: ${apoPath}`);
        return;
    }

    const PDBOne = parsePDB(fs.readFileSync(apoPath, 'utf8')); // APO

    let thisComparisonResults = [];

    holoStructs.forEach((holoStruct) => {
        const holoPath = holoStruct.mobileAlignedPath;
        if (!fs.existsSync(holoPath)) {
            console.log(`Holo file does not exist: ${holoPath}`);
            return;
        }
        const PDBTwo = parsePDB(fs.readFileSync(holoPath, 'utf8')); // HOLO
        const results = compareWatersAtResidues(PDBOne, PDBTwo, 3.0);

        thisComparisonResults.push({
            holoID: holoStruct.mobileID,
            results: results.map((g) => {
                return {
                    residueNumber: g.residueNumber,
                    aminoAcid: g.residueName,
                    difference: g.difference,
                    distanceToLigand: g.distanceToLigand
                }
            })
        })
    });

    outputGraphDatas.push({
        apoID: apoID,
        comparisons: thisComparisonResults
    });
})


fs.writeFileSync('scripts/graphing/LigandSeriesComparison/outputGraphDatas.json', JSON.stringify(outputGraphDatas, null, 2)); // Save output graph data to a file
