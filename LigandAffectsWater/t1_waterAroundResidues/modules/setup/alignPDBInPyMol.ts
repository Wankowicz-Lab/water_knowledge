import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * Structure pair to be aligned
 */
interface AlignmentPair {
    reference: string;     // Path to reference PDB file
    mobile: string;        // Path to mobile PDB file to be aligned
    output: string;        // Path where aligned structure should be saved
}

/**
 * Align multiple PDB structures in parallel using PyMOL and custom script
 * @param alignmentPairs Array of structure pairs to align
 * @param maxConcurrent Maximum number of concurrent PyMOL processes
 * @returns Promise that resolves when all alignments are complete
 */
export async function startBatchingPymol(alignmentPairs: AlignmentPair[], maxConcurrent: number = 8) {
    console.log(`Processing ${alignmentPairs.length} alignments with ${maxConcurrent} concurrent processes...`);
    
    alignmentPairs = alignmentPairs.filter(g => {
        return !fs.existsSync(g.output);
    })

    const results = await processWithWorkerPool(alignmentPairs, maxConcurrent);
    
    const successful = results.filter(r => r).length;
    console.log(`Alignment complete: ${successful}/${alignmentPairs.length} structures aligned successfully`);
    
    return {
        total: alignmentPairs.length,
        successful,
        results
    };
}

/**
 * Process alignments using a worker pool
 */
async function processWithWorkerPool(
    pairs: AlignmentPair[], 
    concurrency: number
): Promise<boolean[]> {
    return new Promise((resolve) => {
        const total = pairs.length;
        const results: boolean[] = new Array(total).fill(false);
        let completed = 0;
        let nextIndex = 0;
        
        function processTask(index: number) {
            const pair = pairs[index];
            
            console.log(`Starting alignment ${index+1}/${total}: ${path.basename(pair.mobile)} to ${path.basename(pair.reference)}`);
            console.log(pair)
            // Call pymol -c align_PDBInPyMol.py -- pair.mobile pair.reference pair.output
            const process = spawn('C:\\ProgramData\\pymol\\PyMOLWin.exe', [
                '-c',
                '-r',
                '.\\modules\\setup\\alignPDBInPyMol.py', 
                pair.mobile, 
                pair.reference, 
                pair.output
            ]);
            
            let stderr = '';
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.stdout.on('data', (data) => {
                console.log(data.toString());
            })

            
            process.on('close', (code) => {
                const success = code === 0;
                results[index] = success;
                
                if (success) {
                    console.log(`Y Completed alignment ${index+1}/${total}`);
                } else {
                    console.error(`X Failed alignment ${index+1}/${total} with code ${code}`);
                    if (stderr) {
                        console.error(`Error: ${stderr.trim()}`);
                    }
                }
                
                completed++;
                
                // Check if we're done
                if (completed === total) {
                    resolve(results);
                } else {
                    // Process next task if available
                    if (nextIndex < total) {
                        processTask(nextIndex++);
                    }
                }
            });
            
            process.on('error', (err) => {
                console.error(`Error executing PyMOL for alignment ${index+1}:`, err);
                results[index] = false;
                completed++;
                
                // Check if we're done
                if (completed === total) {
                    resolve(results);
                } else {
                    // Process next task if available
                    if (nextIndex < total) {
                        processTask(nextIndex++);
                    }
                }
            });
        }
        
        const initialCount = Math.min(concurrency, total);
        for (let i = 0; i < initialCount; i++) {
            processTask(nextIndex++);
        }
    });
}

/**
 * Helper function to create alignment pairs from provided paths
 * @param pairs Array of paths to original and mobile PDB files
 * @returns Array of alignment pairs
 */
export function submitPDBPaths(pairs:  { originalPath: string, mobilePath: string, mobileOutputPath: string } []) {
    let alignmentPairs: AlignmentPair[] = [];
    
    for (const pair of pairs) {
        alignmentPairs.push({
            reference: pair.originalPath,
            mobile: pair.mobilePath,
            output: pair.mobileOutputPath
        });
    }
    
    return alignmentPairs;
}