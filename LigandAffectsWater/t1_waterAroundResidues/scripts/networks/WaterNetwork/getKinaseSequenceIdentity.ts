const mmseq_dir = `./scripts/networks/WaterNetwork/mmseq_clusters`; // TSV files of 100, 90, 70, 50, 30% seq identity
// Format: 
// Representative_chainA     Member_chainA

import fs from 'fs';

function extractClusteredPDBs( mmseqClusterTSVFile : string ) {
    let fileContents = fs.readFileSync(mmseqClusterTSVFile, 'utf8');
    let clusterPrefix = mmseqClusterTSVFile.split("/")[mmseqClusterTSVFile.split("/").length - 1].split(".")[0]; // get the cluster prefix (100, 90, 70, 50, 30, -1)

    let clusters = [] // means it's part of a cluster, so it's part of this seq identity group

    let uniqueReps = new Set();

    fileContents.split('\n').forEach(line => {
        if (line.trim() === '') return; // skip empty lines
        let rep = line.split('\t')[0].split('_')[0].toLowerCase();
        uniqueReps.add(rep);
    });

    ([...uniqueReps]).forEach(rep => {
        let allMembers = fileContents.split('\n').filter(line => line.includes(rep as string)).map(line => line.split('\t')[1].split('_')[0].toLowerCase())
        clusters.push({
            clusterId: clusterPrefix + '_' + (clusters.length).toString(),
            memberIds: allMembers
        });
    })

    return clusters;
}

const seqIDClusters = {
    '100': extractClusteredPDBs(`${mmseq_dir}/clusters100.tsv`),
    '90': extractClusteredPDBs(`${mmseq_dir}/clusters90.tsv`),
    '70': extractClusteredPDBs(`${mmseq_dir}/clusters70.tsv`),
    '50': extractClusteredPDBs(`${mmseq_dir}/clusters50.tsv`),
    '30': extractClusteredPDBs(`${mmseq_dir}/clusters30.tsv`),
    '-1': []
}

export function getClusterIdentifiers( pdbId ) {
    let clusterIds = [];

    for (const [seqID, clusters] of Object.entries(seqIDClusters)) {
        for (const cluster of clusters) {
            if (cluster.memberIds.includes(pdbId.toLowerCase())) {
                clusterIds.push(cluster.clusterId);
            }
        }
    }

    return clusterIds;
}