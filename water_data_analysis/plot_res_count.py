## Plot the residue counts for different dataset.
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

# List of amino acid residues.
AA=['ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE', 
    'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL']
chain_keys=['seq_id', 'res']

# Store information of PDB id and amino acids into train and test sets.
filter=AA # List of residues of interest.
train_dict, test_dict={'name': [], 'structure': []}, {'name': [], 'structure': []}
for pdb_list, data_dict in zip([train_list, test_list], [train_dict, test_dict]):
    for pdb in pdb_list:
        pdb_file = f'{SOURCE_DIR}/{pdb}/{pdb}_final.pdb'
        structure = gemmi.read_structure(str(pdb_file))
        # Check model.
        i = 0
        model = structure[i]  # consider the first model (skip if empty)
        while len(model) == 0:  # sometimes the first model is empty
            i += 1
            try:
                model = structure[i]
            except Exception:
                raise ValueError("Can't read valid model from the input PDB file!")
        # Dictionary of {'{chain}': '{}'}.
        chain_dict={}
        for chain in model:
            ind_chain={k: [] for k in chain_keys} # seq_id, res.
            res_list=[]
            id_list=[]
            for res in chain:
                if res.name in filter: # Check if it is not in any of the filter lists.
                    res_list.append(res.name)
                    id_list.append(str(res.seqid))
            ind_chain['seq_id']=id_list
            ind_chain['res']=res_list
            # For each chain.
            chain_dict[chain.name] = ind_chain
        # Summarize as {chain: list of mols of interest}.
        data_dict['name'].append(pdb)
        data_dict['structure'].append(chain_dict)

# Convert to dataframe and add in column of residue count for each PDB structure.
df_train=pd.DataFrame(train_dict)
df_train['AA_count'] = [count_res(a) for a in train_dict['structure']]
df_test=pd.DataFrame(test_dict)
df_test['AA_count'] = [count_res(a) for a in test_dict['structure']]

print(len(df_train), len(df_test))

# Plots.
fig, ax = plt.subplots() # Regenerate figure for each new key.
ax2 = ax.twinx()
key = 'Residue count'
labels = ['Training', 'Test']
colors = ['blue', 'orange']
x_label = key
# Overlay (both).
# Obtain metric of interest for each dataset.
for df, label, color in zip([df_train, df_test], labels, colors):
    data = df['AA_count'].values
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
plot_path = 'plots/res_count_overlay.png'
plt.savefig(plot_path, dpi=200, bbox_inches='tight')
plt.show()