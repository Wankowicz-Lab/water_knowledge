#!/bin/bash
#SBATCH --nodes=1
#SBATCH --array=1-1%
#SBATCH --mem=48G
#SBATCH --cpus-per-task=1
#SBATCH --time=0-36:15:00     
#SBATCH --output=HBScan._stdout
#SBATCH --job-name=HBScan


PDB_file=/dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/pdbs.txt
base_dir='/dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis'
bandwidth=/dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/bandwidths.txt

cd $base_dir
while read -r line; do
   pdb=$line
   echo 'PDB:' ${pdb}
   python /dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/HBDScan.py --pdb ${pdb} --cut 0.5
done < $PDB_file
