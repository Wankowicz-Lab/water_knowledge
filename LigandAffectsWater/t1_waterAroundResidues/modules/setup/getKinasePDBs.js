"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKinasePDBs = getKinasePDBs;
const fs_1 = __importDefault(require("fs"));
function getKinasePDBs(PDBDirectory = "../PDBs/") {
    const allKinase = fs_1.default.readFileSync('../all_kinase.txt', 'utf8').split('\n');
    const directoryItems = fs_1.default.readdirSync(PDBDirectory);
    let outputPDBs = [];
    directoryItems.forEach((item) => {
        const folderPathChopped = item.split('/');
        const pdbId = folderPathChopped[folderPathChopped.length - 1].toLowerCase();
        if (allKinase.find(g => g == pdbId)) {
            outputPDBs.push({
                id: pdbId,
                path: `${PDBDirectory}${item}/${pdbId}.pdb`
            });
        }
    });
    return outputPDBs;
}
