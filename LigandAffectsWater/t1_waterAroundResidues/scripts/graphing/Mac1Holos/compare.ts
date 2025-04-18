import { readdirSync, readFileSync, writeFileSync } from "fs";
import { parsePDB } from "../../../modules/parsers/parsePDB";
import { compareWatersAtResidues } from "../../../modules/processors/compareWatersAtResidues";


let apoStruct = parsePDB(readFileSync("../PDBs/7kqo/7kqo.pdb", "utf8"));
let apoName = "7kqo"

apoStruct.filterEntries(x => x.chainID == 'A' || x.chainID == 'S')

let exporting = [];

let allHolos = readdirSync("../Mac1Holos/").filter(file => file.endsWith(".pdb"));
allHolos.forEach(holoFilePath => {
    let holoName = holoFilePath.split("-")[0];
    let holoPath = `../Mac1Holos/${holoFilePath}`;
    let holoStruct = parsePDB(readFileSync(holoPath, "utf8"));

    holoStruct.filterEntries(x => x.chainID == 'A' || x.chainID == 'S')

    let comparison = compareWatersAtResidues(apoStruct, holoStruct, 3.0);

    exporting.push({
        apoPDBId: apoName,
        holoPDBId: holoName,
        waterComparison: comparison,
        netWaterChange: comparison.reduce((acc, curr) => acc + curr.difference, 0)
    })


})


writeFileSync('./scripts/graphing/Mac1Holos/water_comparison.json', JSON.stringify(exporting, null, 2)); 