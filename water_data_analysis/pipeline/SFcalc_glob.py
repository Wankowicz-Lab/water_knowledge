import SFC_Torch as SFC
import glob
import sys
import os
import pandas as pd

# The absolute path of the given directory.
base_dir=sys.argv[1]
base_dir=os.path.abspath(base_dir)

# Pattern of filename.
pattern=sys.argv[2]

# Collect all PDB_IDs (have subdirectories of .pdb and .mtz files).
try:
    filenames = os.listdir(base_dir)
    files = [f for f in filenames if os.path.exists(os.path.join(base_dir, f))]
except FileNotFoundError:
    print(f"{base_dir} not found or empty.")

# Collect pdb and mtz files in the subdirectory and calculate R-free values.
rfree_dict={'name':[], 'r_free':[]}
for file in files:
    pdb_id = str(file)
    pdb_file = f'{base_dir}/{pdb_id}/{pdb_id}{pattern}.pdb'
    mtz_file = f'{base_dir}/{pdb_id}/{pdb_id}{pattern}.mtz'

    dcp = SFC.SFcalculator(
        pdb_file, 
        mtz_file, 
        expcolumns=['FP', 'SIGFP'], 
        set_experiment=True, 
        freeflag='FREE', 
        testset_value=0
    )

    dcp.inspect_data()


    dcp.calc_fprotein()
    dcp.calc_fsolvent()

    dcp.get_scales_adam()
    R_free = dcp.r_free.item() # Convert torch tensor to value.
    # Add values to dictionary.
    rfree_dict['name'].append(pdb_id)
    rfree_dict['r_free'].append(R_free)

if len(rfree_dict['name']) ==0 or len(rfree_dict['r_free']) ==0:
    print("Empty results.")
    
csv_name=sys.argv[3] # name of stored file.
pd.DataFrame(rfree_dict).to_csv(f'{csv_name}.txt', index=False)