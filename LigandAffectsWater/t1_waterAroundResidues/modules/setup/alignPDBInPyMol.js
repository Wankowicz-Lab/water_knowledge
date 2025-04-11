"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBatchingPymol = startBatchingPymol;
exports.submitPDBPaths = submitPDBPaths;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
/**
 * Align multiple PDB structures in parallel using PyMOL and custom script
 * @param alignmentPairs Array of structure pairs to align
 * @param maxConcurrent Maximum number of concurrent PyMOL processes
 * @returns Promise that resolves when all alignments are complete
 */
function startBatchingPymol(alignmentPairs_1) {
    return __awaiter(this, arguments, void 0, function* (alignmentPairs, maxConcurrent = 8) {
        console.log(`Processing ${alignmentPairs.length} alignments with ${maxConcurrent} concurrent processes...`);
        alignmentPairs = alignmentPairs.filter(g => {
            return !fs.existsSync(g.output);
        });
        const results = yield processWithWorkerPool(alignmentPairs, maxConcurrent);
        const successful = results.filter(r => r).length;
        console.log(`Alignment complete: ${successful}/${alignmentPairs.length} structures aligned successfully`);
        return {
            total: alignmentPairs.length,
            successful,
            results
        };
    });
}
/**
 * Process alignments using a worker pool
 */
function processWithWorkerPool(pairs, concurrency) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const total = pairs.length;
            const results = new Array(total).fill(false);
            let completed = 0;
            let nextIndex = 0;
            function processTask(index) {
                const pair = pairs[index];
                console.log(`Starting alignment ${index + 1}/${total}: ${path.basename(pair.mobile)} to ${path.basename(pair.reference)}`);
                console.log(pair);
                // Call pymol -c align_PDBInPyMol.py -- pair.mobile pair.reference pair.output
                const process = (0, child_process_1.spawn)('C:\\ProgramData\\pymol\\PyMOLWin.exe', [
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
                });
                process.on('close', (code) => {
                    const success = code === 0;
                    results[index] = success;
                    if (success) {
                        console.log(`Y Completed alignment ${index + 1}/${total}`);
                    }
                    else {
                        console.error(`X Failed alignment ${index + 1}/${total} with code ${code}`);
                        if (stderr) {
                            console.error(`Error: ${stderr.trim()}`);
                        }
                    }
                    completed++;
                    // Check if we're done
                    if (completed === total) {
                        resolve(results);
                    }
                    else {
                        // Process next task if available
                        if (nextIndex < total) {
                            processTask(nextIndex++);
                        }
                    }
                });
                process.on('error', (err) => {
                    console.error(`Error executing PyMOL for alignment ${index + 1}:`, err);
                    results[index] = false;
                    completed++;
                    // Check if we're done
                    if (completed === total) {
                        resolve(results);
                    }
                    else {
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
    });
}
/**
 * Helper function to create alignment pairs from provided paths
 * @param pairs Array of paths to original and mobile PDB files
 * @returns Array of alignment pairs
 */
function submitPDBPaths(pairs) {
    let alignmentPairs = [];
    for (const pair of pairs) {
        alignmentPairs.push({
            reference: pair.originalPath,
            mobile: pair.mobilePath,
            output: pair.mobileOutputPath
        });
    }
    return alignmentPairs;
}
