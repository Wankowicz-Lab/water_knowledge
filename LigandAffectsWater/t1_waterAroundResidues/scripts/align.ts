import { startBatchingPymol, submitPDBPaths } from "../modules/setup/alignPDBInPyMol";
import { getPairPathnames } from "../modules/setup/csvReader";

const pairs = getPairPathnames('../apo_holo_pairs.csv', '../PDBs').map((pair) => {
    return {
        originalPath: pair.originalPath,
        mobilePath: pair.mobilePath,
        mobileOutputPath: `${pair.mobileOutputDirectory}/${pair.mobileID}_aligned.pdb`,
    };
});

const alignmentPairs = submitPDBPaths(pairs);


startBatchingPymol(alignmentPairs);