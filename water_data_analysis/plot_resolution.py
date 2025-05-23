## Plot the resolution (of PDB) for different dataset.
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import numpy as np
import glob
import gemmi

# SOURCE_DIR="/dors/wankowicz_lab/water/PDBRedo"
SOURCE_DIR="/dors/wankowicz_lab/vratins/pdb_redo_data"

def read_csv(file):
    """
    Read a csv file and return a list of the lines.
    """
    with open(file, 'r') as file:
        lines=file.readlines()
    files=[line.strip() for line in lines]
    return files

def count_res(structure_dict):
    """
    Count the number of residues for each PDB structure.
    """
    res_counts = []
    for k, v in structure_dict.items(): # k is the chain name. v is the individual chain dictionary, with keys: seq_id, res.
        count = len(v['seq_id'])
        res_counts.append(count)
    return np.sum(res_counts)


train_list=read_csv("/dors/wankowicz_lab/water/train.txt")
test_list=read_csv("/dors/wankowicz_lab/water/test.txt")

print(len(train_list), len(test_list))

# Store information of structural resolution for train and test sets.
train_dict, test_dict={'name': [], 'resolution': []}, {'name': [], 'resolution': []}
for pdb_list, data_dict in zip([train_list, test_list], [train_dict, test_dict]):
    for pdb in pdb_list:
        pdb_file = f'{SOURCE_DIR}/{pdb}/{pdb}_final.pdb'
        structure = gemmi.read_structure(str(pdb_file))
        resolution = structure.resolution
        data_dict['name'].append(pdb)
        data_dict['resolution'].append(resolution)


# Plots.
fig, ax = plt.subplots() # Regenerate figure for each new key.
ax2 = ax.twinx()
key = 'Resolution'
labels = ['Training', 'Test']
colors = ['blue', 'orange']
x_label = key
# Overlay (both).
# Obtain metric of interest for each dataset.
for data_dict, label, color in zip([train_dict, test_dict], labels, colors):
    data = data_dict['resolution']
    # # seaborn RDF.
    df_A = pd.DataFrame(data, columns=[x_label])
    sns.kdeplot(df_A, x=x_label, label=label, color=color, ax=ax)

    # histogram.
    ax2.hist(data, alpha=0.5, bins=100, color=color)

# Add figure legend and labels. 
# plt.legend(labels)
# plt.legend()
ax.legend()
ax.set_xlabel(x_label)
ax.set_ylabel('Density')
ax2.set_ylabel('Frequency')

# Save plot.
plot_path = 'plots/resolution_overlay.png'
plt.savefig(plot_path, dpi=200, bbox_inches='tight')
plt.show()