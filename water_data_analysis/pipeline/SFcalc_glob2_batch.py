import SFC_Torch as SFC
import glob
import sys
import os
import pandas as pd
import torch
from tqdm import tqdm
import time
from torch.utils.data import DataLoader

# The absolute path of the given directory.
base_dir=sys.argv[1]
base_dir=os.path.abspath(base_dir)

# Pattern of filename.
pattern="_final"

filenames = os.listdir(base_dir)

# # Show progress.
# for i in tqdm(range(len(filenames))):
#     time.sleep(0.01)

# Collect all PDB_IDs (have subdirectories of .pdb and .mtz files).
try:
    filenames = os.listdir(base_dir)
    files = [f for f in filenames if os.path.exists(os.path.join(base_dir, f))]
except FileNotFoundError:
    print(f"{base_dir} not found or empty.")


# Assign batch size for GPU memory issue.
batch_size = 10
files = DataLoader(files, batch_size=batch_size, shuffle=True)

# Collect pdb and mtz files in the subdirectory and calculate R-free values.
rfree_dict={'name':[], 'r_free':[]}
# Error list.
error_list=[]
runtime_error_list=[]
cuda_runtime_error_list=[]
type_error_list=[]
lin_alg_error_list=[]
for batch in tqdm(files):
    for file in batch:
        time.sleep(0.01)
        torch.cuda.empty_cache() # Clear the torch cache.
        pdb_id = str(file)
        pdb_file = f'{base_dir}/{pdb_id}/{pdb_id}{pattern}.pdb'
        mtz_file = f'{base_dir}/{pdb_id}/{pdb_id}{pattern}.mtz'
        # print('Loaded', pdb_file, mtz_file)

        try: # Faced asseration arror "AssertionError: Unit cell from mtz file does not match that in PDB file!"
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
        except AssertionError:
            error_list.append(pdb_id)
        except RuntimeError:
            runtime_error_list.append(pdb_id)
        except torch.cuda.OutOfMemoryError:
            cuda_runtime_error_list.append(pdb_id)
        except TypeError:
            type_error_list.append(pdb_id)
        except numpy.linalg.LinAlgError: # For training set ran on whitney, this error was faced.
            lin_alg_error_list.append(pdb_id)

if len(rfree_dict['name']) ==0 or len(rfree_dict['r_free']) ==0:
    print("Empty results.")
    
csv_name=sys.argv[2] # name of stored file.
pd.DataFrame(rfree_dict).to_csv(f'{csv_name}.txt', index=False)

with open(f'{csv_name}_error_list.txt', 'w') as f:
    for error in error_list:
        f.write(f'{error}\n')

with open(f'{csv_name}_runtime_error_list.txt', 'w') as f:
    for error in runtime_error_list:
        f.write(f'{error}\n')

with open(f'{csv_name}_cuda_runtime_error_list.txt', 'w') as f:
    for error in cuda_runtime_error_list:
        f.write(f'{error}\n')

with open(f'{csv_name}_type_error_list.txt', 'w') as f:
    for error in type_error_list:
        f.write(f'{error}\n')
