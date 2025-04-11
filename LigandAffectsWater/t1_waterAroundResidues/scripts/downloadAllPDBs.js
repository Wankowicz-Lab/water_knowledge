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
const csvReader_1 = require("../modules/setup/csvReader");
const downloadPDBRedoFiles_1 = require("../modules/setup/downloadPDBRedoFiles");
const csvPath = '../apo_holo_pairs.csv';
const PDBsPath = '../PDBs';
const allPDBs = (0, csvReader_1.getAllPDBs)(csvPath, PDBsPath);
function startDownload() {
    return __awaiter(this, void 0, void 0, function* () {
        for (var pdb in allPDBs) {
            let pdbContext = allPDBs[pdb];
            if (!fs_1.default.existsSync(pdbContext.directory)) {
                fs_1.default.mkdirSync(pdbContext.directory);
            }
            yield (0, downloadPDBRedoFiles_1.downloadPDBRedoFiles)(pdbContext.pdbId, pdbContext.directory);
            console.log(`Downloaded PDB files for ${pdbContext.pdbId}`);
        }
        console.log('All PDB files downloaded!');
    });
}
startDownload();
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
});
