# Water data analysis.
This is a collection of scripts and notebooks that process and plot the properties of water molecules of a collection of given PDB files.

All of them use PDB parser of [Gemmi](https://github.com/project-gemmi/gemmi). Install Gemmi prior to running these scripts/notebooks.
Change the filepath in the script to match your data.

## 1. Residue count and structural resolution of protein.
For residue counts of PDBs in different sets of data:
```
python plot_res_count.py
```

For distribution of resolution of PDB structures:
```
python plot_resolution.py
```

## 2. Global and local metrics of water molecules.
For global metric (R-free values):
```
python plot_Rfree.py
```

For local metrics (e.g., EDIAm, RSCCS, RSR):
```
python plot_local_metrics.py
```

## 3. Calculate the water-residue distance, saving the water properties.
Collect the information of distance/B factor/occupancy for water molecules.
Distance is defined as the distance between water and the residue closest to it.
```
python gen_dist_bfac.py
```

Other than collecting the information, also plot the property vs distance (property=raw/normalized B factor, occupancy).
Change the filepath to all raw data, list of training set (csv file), and list of test set (csv file) based on your data.
```
python plot_water_distance.py
```
