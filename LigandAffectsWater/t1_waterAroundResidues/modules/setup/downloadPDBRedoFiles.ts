import axios from 'axios';
import fs from 'fs';

const basePath = `https://pdb-redo.eu/db/`

export const downloadPDBRedoFiles = (pdbId: string, directory: string) => {
    return new Promise(async (resolve, reject) => {
        if (fs.existsSync(directory + pdbId + '.pdb')) {
            console.log(pdbId + ' already exists');
            return resolve(true);
        }
        let pdbPathName = basePath + pdbId + '/' + pdbId + '_final.pdb';
        let mtzPathName = basePath + pdbId + '/' + pdbId + '_final.mtz';
        try {
            let downloadSimul = await Promise.all([
                axios.get(pdbPathName, { responseType: 'stream' }),
                axios.get(mtzPathName, { responseType: 'stream' })
            ]);

            let pdbStream = downloadSimul[0].data.pipe(fs.createWriteStream(directory + pdbId + '.pdb'));
            let mtzStream = downloadSimul[1].data.pipe(fs.createWriteStream(directory + pdbId + '.mtz'));

            await Promise.all([
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
        } catch (error) {
            console.log('Error downloading ' + pdbId + '. Prolly not found.');
        }

        resolve(true);
    });
};


process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.log('Uncaught exception:', error);
})