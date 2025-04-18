"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const parsePDB_1 = require("../modules/parsers/parsePDB");
const getKinasePDBs_1 = require("../modules/setup/getKinasePDBs");
// amino acid to letter
const aminoAcidMap = {
    'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C',
    'GLN': 'Q', 'GLU': 'E', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I',
    'LEU': 'L', 'LYS': 'K', 'MET': 'M', 'PHE': 'F', 'PRO': 'P',
    'SER': 'S', 'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V',
    'UNK': 'X' // error handle unknown residue
};
function extractSequence(pdb) {
    const proteinAtoms = pdb.getProteinAtoms();
    const sequences = {};
    const visitedResidues = new Set();
    proteinAtoms.forEach(atom => {
        const chainId = atom.chainID;
        const residueKey = `${chainId}_${atom.residueNumber}${atom.insertionCode}`;
        if (!visitedResidues.has(residueKey)) {
            visitedResidues.add(residueKey);
            if (!sequences[chainId]) {
                sequences[chainId] = '';
            }
            const residueName = atom.residueName;
            const oneLetterCode = aminoAcidMap[residueName] || 'X';
            sequences[chainId] += oneLetterCode;
        }
    });
    return sequences;
}
function generateFastaFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const outputFile = 'all_kinases.fasta';
        let fastaContent = '';
        try {
            console.log('Starting to process PDB files...');
            const kinasePDBs = (0, getKinasePDBs_1.getKinasePDBs)();
            console.log(`Found ${kinasePDBs.length} PDB entries to process`);
            for (const pdbEntry of kinasePDBs) {
                const pdbId = pdbEntry.id.toLowerCase();
                const pdbPath = pdbEntry.path;
                console.log(`Processing ${pdbId} from ${pdbPath}`);
                if (fs_1.default.existsSync(pdbPath)) {
                    try {
                        const pdbContent = fs_1.default.readFileSync(pdbPath, 'utf8');
                        const parsedPDB = (0, parsePDB_1.parsePDB)(pdbContent);
                        const sequences = extractSequence(parsedPDB);
                        for (const chainId in sequences) {
                            const sequence = sequences[chainId];
                            if (sequence.length > 0) {
                                fastaContent += `>${pdbId}_chain${chainId}\n`;
                                // Format sequence in blocks of 80 characters
                                for (let i = 0; i < sequence.length; i += 80) {
                                    fastaContent += `${sequence.substring(i, i + 80)}\n`;
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error processing ${pdbId}: ${error}`);
                    }
                }
                else {
                    console.warn(`PDB file not found: ${pdbPath}`);
                }
            }
            fs_1.default.writeFileSync(outputFile, fastaContent);
            console.log(`Successfully generated FASTA file at ${outputFile}`);
        }
        catch (error) {
            console.error(`Failed to generate FASTA file: ${error}`);
        }
    });
}
generateFastaFile().catch(error => {
    console.error(`Unhandled error: ${error}`);
});
