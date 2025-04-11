"use strict";
// Gets before-and-after water counts around residues in two apo/holo PDB structures
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareWatersAtResidues = compareWatersAtResidues;
exports.summarizeWaterComparison = summarizeWaterComparison;
exports.calculateMinimumDistance = calculateMinimumDistance;
exports.getSignificantChanges = getSignificantChanges;
/**
 * Compare water molecules around residues in two PDB structures
 * @param pdb1 First APO PDB structure
 * @param pdb2 Second HOLO PDB structure
 * @param distance Maximum distance (in Angstroms) from residue to consider water molecules
 * @param waterFilter Function to filter waters
 * @return Array of comparison results for each residue
 */
function compareWatersAtResidues(pdb1, // APO
pdb2, // HOLO
distance = 2.0, waterFilter = (water, pdb) => true) {
    const waters1 = pdb1.getWaterMolecules(waterFilter);
    const waters2 = pdb2.getWaterMolecules(waterFilter);
    const ligandAtoms = pdb2.getLigandAtoms();
    const proteinAtoms1 = pdb1.getProteinAtoms();
    // Group protein atoms by residue
    const residueGroups = groupAtomsByResidue(proteinAtoms1);
    const results = [];
    for (const [residueKey, atoms] of Object.entries(residueGroups)) {
        const [residueNumber, chainID, residueName] = residueKey.split('_');
        const watersNearResidue1 = countWatersNearResidue(atoms, waters1, distance);
        const watersNearResidue2 = countWatersNearResidue(atoms, waters2, distance);
        const difference = watersNearResidue2 - watersNearResidue1;
        const percentChange = watersNearResidue1 > 0
            ? ((watersNearResidue2 - watersNearResidue1) / watersNearResidue1) * 100
            : watersNearResidue2 > 0 ? Infinity : 0;
        const result = {
            residueNumber: parseInt(residueNumber),
            chainID,
            residueName,
            structure1WaterCount: watersNearResidue1,
            structure2WaterCount: watersNearResidue2,
            difference,
            percentChange
        };
        // if we got ligand atoms lets get the distance.
        if (ligandAtoms && ligandAtoms.length > 0) {
            result.distanceToLigand = calculateMinimumDistance(atoms, ligandAtoms);
        }
        results.push(result);
    }
    return results;
}
/**
 * Group protein atoms by residue
 */
function groupAtomsByResidue(proteinAtoms) {
    const residueGroups = {};
    for (const atom of proteinAtoms) {
        const residueKey = `${atom.residueNumber}_${atom.chainID}_${atom.residueName}`;
        if (!residueGroups[residueKey]) {
            residueGroups[residueKey] = [];
        }
        residueGroups[residueKey].push(atom);
    }
    return residueGroups;
}
/**
 * Count water molecules within specified distance of any atom in the residue
 */
function countWatersNearResidue(residueAtoms, waters, maxDistance) {
    const uniqueWaters = new Set();
    for (const atom of residueAtoms) {
        for (const water of waters) {
            const distance = calculateDistance(atom, water);
            if (distance <= maxDistance) {
                uniqueWaters.add(water.serialNumber);
            }
        }
    }
    return uniqueWaters.size;
}
/**
 * Calculate sqrt(x^2 + y^2 + z^2) distance between two atoms
 */
function calculateDistance(atom1, atom2) {
    const dx = atom1.x - atom2.x;
    const dy = atom1.y - atom2.y;
    const dz = atom1.z - atom2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * a summary of the comparison results
 */
function summarizeWaterComparison(results) {
    let residuesWithMoreWater = 0;
    let residuesWithLessWater = 0;
    let residuesWithSameWater = 0;
    let residuesWithNoWater = 0;
    let totalAbsChange = 0;
    let maxIncrease = results[0];
    let maxDecrease = results[0];
    for (const result of results) {
        if (result.structure1WaterCount === 0 && result.structure2WaterCount === 0) {
            residuesWithNoWater++;
        }
        else if (result.difference > 0) {
            residuesWithMoreWater++;
            if (result.difference > maxIncrease.difference) {
                maxIncrease = result;
            }
        }
        else if (result.difference < 0) {
            residuesWithLessWater++;
            if (result.difference < maxDecrease.difference) {
                maxDecrease = result;
            }
        }
        else {
            residuesWithSameWater++;
        }
        totalAbsChange += Math.abs(result.difference);
    }
    return {
        totalResidues: results.length,
        residuesWithMoreWater,
        residuesWithLessWater,
        residuesWithSameWater,
        residuesWithNoWater,
        avgAbsoluteChange: totalAbsChange / results.length,
        maxIncrease,
        maxDecrease
    };
}
/**
 * Calculate the minimum distance between two sets of atoms
 * @param atoms1 First set of atoms
 * @param atoms2 Second set of atoms
 * @returns The minimum distance between any pair of atoms
 */
function calculateMinimumDistance(atoms1, atoms2) {
    let minDistance = Infinity;
    for (const atom1 of atoms1) {
        for (const atom2 of atoms2) {
            const distance = calculateDistance(atom1, atom2);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
    }
    return minDistance;
}
/**
 * Get residues with the most significant changes in water count
 */
function getSignificantChanges(results, minAbsoluteDifference = 2) {
    return results.filter(r => Math.abs(r.difference) >= minAbsoluteDifference)
        .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
}
