# Calculate local metrics for all PDBs in the given PDBs_test directory.
#!/bin/bash

DATASET="/dors/wankowicz_lab/mingbin/water/data/PDBs_test"
DEST_DIR="/dors/wankowicz_lab/mingbin/water/data/PDBs_test_local_metrics"

for dir in "$DATASET"/*; do
  if [ -d "$dir" ]; then

    filename=$(basename "$dir")
    pdb_path="$dir/$filename""_final.pdb"
    mtz_path="$dir/$filename""_final.mtz"
    stats_path="$DEST_DIR/$filename""_stats.txt"

    source /programs/sbgrid.shrc
    density-fitness $mtz_path $pdb_path -o $stats_path
    echo "Completed $filename"

  fi
done

echo "Completed."