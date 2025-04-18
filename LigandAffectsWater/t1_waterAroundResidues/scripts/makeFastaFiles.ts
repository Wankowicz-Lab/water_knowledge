import fs from 'fs';
import path from 'path';
import { parsePDB, PDB } from '../modules/parsers/parsePDB';
import { getAllPDBs } from '../modules/setup/csvReader';
import { getKinasePDBs } from '../modules/setup/getKinasePDBs';

// amino acid to letter
const aminoAcidMap: { [key: string]: string } = {
    'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C',
    'GLN': 'Q', 'GLU': 'E', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I',
    'LEU': 'L', 'LYS': 'K', 'MET': 'M', 'PHE': 'F', 'PRO': 'P',
    'SER': 'S', 'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V',
    'UNK': 'X' // error handle unknown residue
};

function extractSequence(pdb: PDB): { [chainId: string]: string } {
    const proteinAtoms = pdb.getProteinAtoms();
    const sequences: { [chainId: string]: string } = {};
    const visitedResidues = new Set<string>();

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

async function generateFastaFile() {
    const outputFile = 'all_kinases.fasta';
    let fastaContent = '';
    
    try {
        console.log('Starting to process PDB files...');
        
        const kinasePDBs = getKinasePDBs();
        
        console.log(`Found ${kinasePDBs.length} PDB entries to process`);
        
        for (const pdbEntry of kinasePDBs) {
            const pdbId = pdbEntry.id.toLowerCase();
            const pdbPath = pdbEntry.path
            
            console.log(`Processing ${pdbId} from ${pdbPath}`);
            
            if (fs.existsSync(pdbPath)) {
                try {
                    const pdbContent = fs.readFileSync(pdbPath, 'utf8');
                    const parsedPDB = parsePDB(pdbContent);
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
                } catch (error) {
                    console.error(`Error processing ${pdbId}: ${error}`);
                }
            } else {
                console.warn(`PDB file not found: ${pdbPath}`);
            }
        }
        
        fs.writeFileSync(outputFile, fastaContent);
        console.log(`Successfully generated FASTA file at ${outputFile}`);
        
    } catch (error) {
        console.error(`Failed to generate FASTA file: ${error}`);
    }
}

generateFastaFile().catch(error => {
    console.error(`Unhandled error: ${error}`);
});