#!/bin/bash
#SBATCH --nodes=1
#SBATCH --array=1-1
#SBATCH --mem=48G
#SBATCH --cpus-per-task=1
#SBATCH --time=0-36:15:00     
#SBATCH --output=KDE._stdout
#SBATCH --job-name=KDE


source /dors/wankowicz_lab/shared/conda/etc/profile.d/conda.sh
conda activate qfit

PDB_file=/dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/pdbs.txt
base_dir='/dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis'
bandwidth=/dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/bandwidths.txt

cd $base_dir
while read -r line; do
   pdb=$line
   echo 'PDB:' ${pdb}
python /dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/KDE_full_protein_biopython.py --pdb $pdb --band 0.5 -d /dors/wankowicz_lab/stephanie/water/water-scripts/4_atom_scripts/analysis/
done < $PDB_file
