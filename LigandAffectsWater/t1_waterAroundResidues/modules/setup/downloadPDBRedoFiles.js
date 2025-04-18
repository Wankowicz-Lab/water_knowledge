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
exports.downloadPDBRedoFiles = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const basePath = `https://pdb-redo.eu/db/`;
const downloadPDBRedoFiles = (pdbId, directory) => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        if (fs_1.default.existsSync(directory + pdbId + '.pdb')) {
            console.log(pdbId + ' already exists');
            return resolve(true);
        }
        let pdbPathName = basePath + pdbId + '/' + pdbId + '_final.pdb';
        let mtzPathName = basePath + pdbId + '/' + pdbId + '_final.mtz';
        try {
            let downloadSimul = yield Promise.all([
                axios_1.default.get(pdbPathName, { responseType: 'stream' }),
                axios_1.default.get(mtzPathName, { responseType: 'stream' })
            ]);
            let pdbStream = downloadSimul[0].data.pipe(fs_1.default.createWriteStream(directory + pdbId + '.pdb'));
            let mtzStream = downloadSimul[1].data.pipe(fs_1.default.createWriteStream(directory + pdbId + '.mtz'));
            yield Promise.all([
                new Promise((resolveD, reject) => {
                    pdbStream.on('finish', () => {
                        resolveD(true);
                    });
                }),
                new Promise((resolveD, reject) => {
                    mtzStream.on('finish', () => {
                        resolveD(true);
                    });
                })
            ]);
        }
        catch (error) {
            console.log('Error downloading ' + pdbId + '. Prolly not found.');
        }
        resolve(true);
    }));
};
exports.downloadPDBRedoFiles = downloadPDBRedoFiles;
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
});
