"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const alignPDBInPyMol_1 = require("../modules/setup/alignPDBInPyMol");
const csvReader_1 = require("../modules/setup/csvReader");
const pairs = (0, csvReader_1.getPairPathnames)('../apo_holo_pairs.csv', '../PDBs').map((pair) => {
    return {
        originalPath: pair.originalPath,
        mobilePath: pair.mobilePath,
        mobileOutputPath: `${pair.mobileOutputDirectory}/${pair.mobileID}_aligned.pdb`,
    };
});
const alignmentPairs = (0, alignPDBInPyMol_1.submitPDBPaths)(pairs);
(0, alignPDBInPyMol_1.startBatchingPymol)(alignmentPairs);
