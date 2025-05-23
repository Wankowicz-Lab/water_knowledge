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

def calc_distance(coord1, coord2):
    """Calculate the distance between two sets of coordinates."""
    try:
        len(coord1), len(coord2)
    except:
        raise ValueError("The input must be a list of coordinates.")
    distance = np.sqrt(np.sum((np.array(coord1) - np.array(coord2))**2))
    return distance

def normalize_values(list):
    """Normalize the given list of values, e.g., B-factors."""
    list = np.array(list) # Convert list to numpy array.
    mean_value = np.mean(list)
    std_value = np.std(list)
    normalized_list = (list - mean_value) / std_value
    return normalized_list


def gen_wat_AA_dict(PDB_file, water_filter, AA, normalized=False):
    """
    Generate dictionary of water and amino acid residues for each PDB file (orgainized by chain).
    Input: 
    (1) PDB_file: string, single PDB file; 
    (2) water_filter: list, list of water strings in PDB, e.g., ['HOH', 'WAT', 'H2O'].
    (3) AA: list, list of amino acids.
    (4) normalized: Boolean value, if True, the normalized B factor (among all protein atoms) will be stored. 
    If 'normalized' is False (by default), the raw B factor of water is stored.
    Output: two dictionaries of residue information, one for water and one for amino acid. Organized as {'{chain}': {information}}
    """
    structure = gemmi.read_structure(PDB_file)
    # Check model.
    i = 0
    model = structure[i]  # consider the first model (skip if empty)
    while len(model) == 0:  # sometimes the first model is empty
        i += 1
        try:
            model = structure[i]
        except Exception:
            raise ValueError("Can't read valid model from the input PDB file!")

    # Normalize the B factor of atoms.
    all_atom_b_fac ={x.atom.serial: x.atom.b_iso for x in model.all()} # Key is the sequence (ID) of atom, value is the raw b_factor.
    normalized_b_fac = {serial: norm_b for serial, norm_b in zip(list(all_atom_b_fac.keys()), normalize_values(list(all_atom_b_fac.values())))} # store a new dictionary with normalized b fac.

    wat_chain_dict, AA_chain_dict={}, {}
    for chain in model:
        wat_chain_dict[chain.name] = []
        AA_chain_dict[chain.name] = []
        for res in chain:
            # Distinguish between water and amino acid.
            if res.name in water_filter: # water molecules.
                for atom in res: # Store a list of information for each atom.
                    if normalized == False: # Raw B factor values.
                        b_fac = atom.b_iso 
                    elif normalized == True: # Normalized B factor.
                        b_fac = normalized_b_fac[atom.serial]
                    wat_chain_dict[chain.name].append([res.name, str(res.seqid), atom.name, list(atom.pos), b_fac, atom.occ])
            elif res.name in AA: # amino acid residues.
                for atom in res: # Store a list of information for each atom.
                    if normalized == False: # Raw B factor values.
                        b_fac = atom.b_iso 
                    elif normalized == True: # Normalized B factor.
                        b_fac = normalized_b_fac[atom.serial]
                    AA_chain_dict[chain.name].append([res.name, str(res.seqid), atom.name, list(atom.pos), b_fac, atom.occ])
    return wat_chain_dict, AA_chain_dict

def gen_distance_data(wat_chain_dict, AA_chain_dict):
    """
    Given the dictionary of water and amino acid chains (of one PDB file), generate a flat list of distance/b-factor/occupancy values. 
    Distance is defined as the distance between water and the closest residue (amino acid).
    Input: 
    (1) wat_chain_dict: dictionary, information dictionary of water residues.
    (2) AA_chain_dict: dictionary, information dictionary of amino acid residues.
    Output:
    A list of each water. Each element is as [np.float64(2.4625440097590126), 37.54999923706055, 1.0] (distance, water B-factor, water occupancy)
    """
    flat_list = [] # store just the distance values but not whole dictionary.
    for chain, chain_dict in wat_chain_dict.items(): # waters.
        closest_AA={} # water data for each chain.
        for at_dict in chain_dict:
            res = at_dict[0]
            seqid = at_dict[1]
            coord = at_dict[3]
            b_fac = at_dict[4]
            occ = at_dict[5]
            closest_AA[seqid] = {'distance': None, 'AA_res': None, 'AA_seqid': None, 'wat_b_fac': None, 'wat_occ': None} 
            # store the information of closest-distance AA residue for each water.
            for chain2, chain_dict2 in AA_chain_dict.items(): # amino acid residues.
                for at_dict2 in chain_dict2:
                    res2 = at_dict2[0]
                    seqid2 = at_dict2[1]
                    coord2 = at_dict2[3]
                    # b_fac2 = at_dict2[4]
                    # occ2 = at_dict2[5]
                    distance = calc_distance(coord, coord2) # calculate the distance between water and any atom (of amino acid residue).
                    if (closest_AA[seqid]['distance'] is None) or (closest_AA[seqid]['distance'] > distance): # update the values if it's the shortest distance.
                        closest_AA[seqid]['distance'] = distance
                        closest_AA[seqid]['AA_res'] = res2
                        closest_AA[seqid]['AA_seqid'] = seqid2
                        closest_AA[seqid]['wat_b_fac'] = b_fac # store the b-factor of water but not the b-factor of AA.
                        closest_AA[seqid]['wat_occ'] = occ # store the occupancy of water but not the occupancy of AA.
            flat_list.append([closest_AA[seqid]['distance'], closest_AA[seqid]['wat_b_fac'], closest_AA[seqid]['wat_occ']]) # each water molecule is a list.

    return flat_list


# Collect PDB ids.
train_list=read_csv("/dors/wankowicz_lab/water/train.txt")
test_list=read_csv("/dors/wankowicz_lab/water/test.txt")

print(len(train_list), len(test_list))

# List of amino acid residues.
AA=['ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE', 
    'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL']
waters=['HOH', 'WAT', 'H2O']
chain_keys=['seq_id', 'res', 'b_fac', 'occ']


## Processing data.
# Store information of PDB id and values (not dictionary in this case) into train and test sets.
# 1. Raw values.
raw_train_dict, raw_test_dict={'name': [], 'distance':[], 'b_fac':[], 'occ':[], 'resolution':[]}, {'name': [], 'distance':[], 'b_fac':[], 'occ':[], 'resolution':[]}
for pdb_list, data_dict in zip([train_list, test_list], [raw_train_dict, raw_test_dict]):
    for pdb in pdb_list:
        pdb_file = f'{SOURCE_DIR}/{pdb}/{pdb}_final.pdb'
        # Generate the dictionary of water and amino acid atoms for each PDB file. RAW values.
        wat_chain_dict, AA_chain_dict=gen_wat_AA_dict(PDB_file=str(pdb_file), water_filter=waters, AA=AA, normalized=False) 
        # Generate the flat list of distance/b-factor/occupancy values.
        flat_list = gen_distance_data(wat_chain_dict, AA_chain_dict) # One flat_list of water information for one PDB file.
        # Summarize data (only values but not raw dictionaries).
        data_dict['name'].append(pdb)
        data_dict['distance'].append([water[0] for water in flat_list])
        data_dict['b_fac'].append([water[1] for water in flat_list])
        data_dict['occ'].append([water[2] for water in flat_list])
print('Training set: ', len(raw_train_dict['b_fac']), 'Test set: ', len(raw_test_dict['b_fac']))

# 2. Normalized values.
norm_train_dict, norm_test_dict={'name': [], 'distance':[], 'b_fac':[], 'occ':[], 'resolution':[]}, {'name': [], 'distance':[], 'b_fac':[], 'occ':[], 'resolution':[]}
for pdb_list, data_dict in zip([train_list, test_list], [norm_train_dict, norm_test_dict]):
    for pdb in pdb_list:
        pdb_file = f'{SOURCE_DIR}/{pdb}/{pdb}_final.pdb'
        # Generate the dictionary of water and amino acid atoms for each PDB file. NORMALIZED values.
        wat_chain_dict, AA_chain_dict=gen_wat_AA_dict(PDB_file=str(pdb_file), water_filter=waters, AA=AA, normalized=True) 
        # Generate the flat list of distance/b-factor/occupancy values.
        flat_list = gen_distance_data(wat_chain_dict, AA_chain_dict) # One flat_list of water information for one PDB file.
        # Summarize data (only values but not raw dictionaries).
        data_dict['name'].append(pdb)
        data_dict['distance'].append([water[0] for water in flat_list])
        data_dict['b_fac'].append([water[1] for water in flat_list])
        data_dict['occ'].append([water[2] for water in flat_list])
print('Training set: ', len(norm_train_dict['b_fac']), 'Test set: ', len(norm_test_dict['b_fac']))

# Convert to dataframe.
df_raw_train=pd.DataFrame(raw_train_dict)
df_raw_test=pd.DataFrame(raw_test_dict)
df_norm_train=pd.DataFrame(norm_train_dict)
df_norm_test=pd.DataFrame(norm_test_dict)

## Plot.
# 1. B factor versus distance. Raw values.
fig, ax = plt.subplots()
ax.scatter(flat_list(df_raw_train['distance']), flat_list(df_raw_train['b_fac']), label='Training set', marker='.', color='blue')
ax.scatter(flat_list(df_raw_test['distance']), flat_list(df_raw_test['b_fac']), label='Test set', marker='.', color='orange')
# Add labels and legend.
ax.set_xlabel('Distance')
ax.set_ylabel('B-factor')
ax.legend()
# Save plot.
plot_path = 'plots/Both_distance_raw_bfac.pnb'
plt.savefig(plot_path, dpi=200, bbox_inches='tight')
plt.show()

# 2. B factor versus distance. Normalized values.
fig, ax = plt.subplots()
ax.scatter(flat_list(df_norm_train['distance']), flat_list(df_norm_train['b_fac']), label='Training set', marker='.', color='blue')
ax.scatter(flat_list(df_norm_test['distance']), flat_list(df_norm_test['b_fac']), label='Test set', marker='.', color='orange')
# Add labels and legend.
ax.set_xlabel('Distance')
ax.set_ylabel('B-factor')
ax.legend()
# Save plot.
plot_path = 'plots/Both_distance_norm_bfac.pnb'
plt.savefig(plot_path, dpi=200, bbox_inches='tight')
plt.show()

# 3. Occupancy versus distance. Only one set of values.
fig, ax = plt.subplots()
ax.scatter(flat_list(df_raw_train['distance']), flat_list(df_raw_train['occ']), label='Training set', marker='.', color='blue')
ax.scatter(flat_list(df_raw_test['distance']), flat_list(df_raw_test['occ']), label='Test set', marker='.', color='orange')
# Add labels and legend.
ax.set_xlabel('Distance')
ax.set_ylabel('Occupancy')
ax.legend()
# Save plot.
plot_path = 'plots/Both_distance_occ.pnb'
plt.savefig(plot_path, dpi=200, bbox_inches='tight')
plt.show()