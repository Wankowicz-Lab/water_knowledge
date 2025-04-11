"use strict";
// Parse PDB file into a structured object
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePDB = parsePDB;
exports.exportPDB = exportPDB;
exports.filterByDistance = filterByDistance;
const fs_1 = __importDefault(require("fs"));
/**
 * Parse a PDB file into a structured object
 * @param pdb PDB file contents as a string
 * @returns PDB object
 */
function parsePDB(pdb) {
    const lines = pdb.split('\n');
    const entries = [];
    const header = [];
    const footer = [];
    let inFooter = false;
    let hasLigand = false;
    let endCount = 0; // make sure PDBs have only one END record
    for (const line of lines) {
        if (line.startsWith('END')) {
            inFooter = true;
            footer.push(line);
            endCount++;
            if (endCount > 1)
                console.error('Multiple END records found in PDB file', pdb);
            continue;
        }
        if (inFooter) {
            footer.push(line);
            continue;
        }
        if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
            const residueName = line.substring(17, 20).trim();
            const isWater = residueName === 'HOH' || residueName === 'WAT';
            const isLigand = line.startsWith('HETATM');
            if (isLigand)
                hasLigand = true;
            const entry = {
                recordName: line.substring(0, 6).trim(),
                serialNumber: parseInt(line.substring(6, 11).trim()) || 0,
                atomName: line.substring(12, 16).trim(),
                altLoc: line.substring(16, 17).trim(),
                residueName: residueName,
                chainID: line.substring(21, 22).trim(),
                residueNumber: parseInt(line.substring(22, 26).trim()) || 0,
                insertionCode: line.substring(26, 27).trim(),
                x: parseFloat(line.substring(30, 38).trim()) || 0,
                y: parseFloat(line.substring(38, 46).trim()) || 0,
                z: parseFloat(line.substring(46, 54).trim()) || 0,
                occupancy: parseFloat(line.substring(54, 60).trim()) || 1.0,
                bFactor: parseFloat(line.substring(60, 66).trim()) || 0.0,
                element: line.substring(76, 78).trim(),
                charge: line.substring(78, 80).trim(),
                originalLine: line,
                isWater: isWater,
                isLigand: isLigand
            };
            entries.push(entry);
        }
        else {
            header.push(line);
        }
    }
    return {
        entries,
        header,
        footer,
        hasLigand,
        toPDBString() {
            const atomLines = this.entries.map(entry => formatPDBLine(entry));
            return [...this.header, ...atomLines, ...this.footer].join('\n');
        },
        getWaterMolecules(waterfilter = (water, pdb) => true) {
            console.log(this.entries.length);
            return this.entries.filter(entry => entry.isWater).filter(g => {
                return waterfilter(g, this);
            });
        },
        getProteinAtoms() {
            const standardAminoAcids = [
                'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS',
                'ILE', 'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP',
                'TYR', 'VAL'
            ];
            return this.entries.filter(entry => entry.recordName === 'ATOM' &&
                standardAminoAcids.includes(entry.residueName));
        },
        getLigandAtoms() {
            return this.entries.filter(entry => entry.recordName === 'HETATM' && !entry.isWater);
        },
        getAtomsByResidue(residueName) {
            return this.entries.filter(entry => entry.residueName.toUpperCase() === residueName.toUpperCase());
        },
        getAtomsByChain(chainID) {
            return this.entries.filter(entry => entry.chainID === chainID);
        },
        getAverageBFactor(proteinOnly = true) {
            const atoms = proteinOnly ? this.getProteinAtoms() : this.entries;
            const bFactors = atoms.map(entry => entry.bFactor);
            if (bFactors.length === 0)
                return 0;
            const average = bFactors.reduce((sum, val) => sum + val, 0) / bFactors.length;
            if (proteinOnly)
                this.averageProteinBFactor = average;
            return average;
        }
    };
}
function formatPDBLine(entry) {
    return `${entry.recordName.padEnd(6)}${String(entry.serialNumber).padStart(5)}  ${entry.atomName.padEnd(4)}${entry.altLoc.padEnd(1)}${entry.residueName.padStart(3)} ${entry.chainID.padEnd(1)}${String(entry.residueNumber).padStart(4)}${entry.insertionCode.padEnd(1)}   ${entry.x.toFixed(3).padStart(8)}${entry.y.toFixed(3).padStart(8)}${entry.z.toFixed(3).padStart(8)}${entry.occupancy.toFixed(2).padStart(6)}${entry.bFactor.toFixed(2).padStart(6)}          ${entry.element.padStart(2)}${entry.charge.padEnd(2)}`;
}
/**
 * Export a PDB object back to a file
 * @param pdb The PDB object to export
 * @param filepath Path to save the file
 */
function exportPDB(pdb, filepath) {
    fs_1.default.writeFileSync(filepath, pdb.toPDBString());
}
/**
 * Filter PDB entries by distance from a reference point
 * @param entries Array of PDBLineEntry objects
 * @param referencePoint {x, y, z} coordinate
 * @param maxDistance Maximum distance in Angstroms
 * @returns Filtered array of PDBLineEntry objects
 */
function filterByDistance(entries, referencePoint, maxDistance) {
    return entries.filter(entry => {
        const dx = entry.x - referencePoint.x;
        const dy = entry.y - referencePoint.y;
        const dz = entry.z - referencePoint.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance <= maxDistance;
    });
}
