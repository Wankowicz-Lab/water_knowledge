## Water knowledge analysis.
This is a collection of scripts to perform analysis of water molecules in the given PDBs.

There are two types of scripts here: 
  1. Calculate global and local metrics of PDBs (with water molecules). 
  2. Plotting scripts to plot the obtained results.

### 1. Metric calculations.
#### 1.1 Global metrics (R-free values) with SFcalculator.
Run the script to process all .pdb and .mtz files in the given directory, then store the results in the csv file in the given output path.
Using [SFcalculator](https://github.com/Hekstra-Lab/SFcalculator).
```
python SFcalc_glob2_batch.py $base_dir $csv_file
```

Example of plotting the R-free values based on the output csv file can be found in `SFcalc_plot.ipynb`.

#### 1.2 Local metric calculations.
Run the script to obtain local metrics based on density fitting from .pdb and .mtz files. Return {pdb}_stats.txt, one output file for one PDB structure.
```
bash Local_metrics_glob.sh
```

Run the script to plot the local metrics of PDBs obtained with different methods (e.g., deposited, superwater, and hydraprot).
```
python plot_local_metrics.py
```

### 2. Plotting of residue and resolution.
*Use Gemmi's PDB parser, install Gemmi first.*
To plot the residue counts of different dataset (e.g., training vs test sets), run the script:
```
python plot_res_count.py
```

To plot the distribution of structural resolution of different dataset (e.g., training vs test sets), run the script:
```
python plot_resolution.py
```
