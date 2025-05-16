import os
import pathlib
import glob
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import gemmi

water_filter = ['HOH', 'WAT', 'H2O'] # List of water residue names.
AA=['ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE', 'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL'] # amino acids.

# Loop through all the PDB files in the data folder.
# Training set.
train_list = pd.read_csv("/Users/mingbin/Desktop/Wankowicz_lab_Mac/Projects/water/data/train_split.txt", header=None)
train_list = train_list[0].tolist()
# Test set.
test_list = pd.read_csv("/Users/mingbin/Desktop/Wankowicz_lab_Mac/Projects/water/data/test_split.txt", header=None)
test_list = test_list[0].tolist()

pdb_path = pathlib.Path('/Users/mingbin/Desktop/Wankowicz_lab_Mac/Projects/water/data/pdb_redo_data')
pdbs = list(pdb_path.glob('*_final.pdb')) # Pay attention to the pattern of names. A general "*.pdb" would result in duplicate files when looping.
# Train.
pdb_train = []
for a in pdbs:
    name = a.stem.split('_')[0]
    if name in train_list:
        pdb_train.append(a)
# Test.
pdb_test = []
for a in pdbs:
    name = a.stem.split('_')[0]
    if name in test_list:
        pdb_test.append(a)

def calc_distance(coord1, coord2):
    """Calculate the distance between two sets of coordinates."""
    try:
        len(coord1), len(coord2)
    except:
        raise ValueError("The input must be a list of coordinates.")
    distance = np.sqrt(np.sum((np.array(coord1) - np.array(coord2))**2))
    return distance

def gen_distance_data(wat_chain_dict, AA_chain_dict):
    """
    Given the dictionary of water and amino acid chains (of one PDB file), generate a flat list of distance/b-factor/occupancy values. 
    Distance is defined as the distance between water and the closest residue.
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

# Training set and test set. Generate flat lists for each set.
train_distance_data, test_distance_data = {}, {}
for data, pdbs in zip([train_distance_data, test_distance_data], [pdb_train, pdb_test]):
    data={'name':[], 'distance':[], 'b_fac':[], 'occ':[]}
    for pdb in pdbs:
        name = a.stem.split('_')[0]
        structure = gemmi.read_structure(str(a))
        # Check model.
        i = 0
        model = structure[i]  # consider the first model (skip if empty)
        while len(model) == 0:  # sometimes the first model is empty
            i += 1
            try:
                model = structure[i]
            except Exception:
                raise ValueError("Can't read valid model from the input PDB file!")
            
        # Generate the dictionary of water and amino acid atoms for each PDB file.
        wat_chain_dict, AA_chain_dict={}, {}
        for chain in model:
            wat_chain_dict[chain.name] = []
            AA_chain_dict[chain.name] = []
            for res in chain:
                # Distinguish between water and amino acid.
                if res.name in water_filter: # water molecules.
                    for atom in res: # Store a list of information for each atom.
                        wat_chain_dict[chain.name].append([res.name, str(res.seqid), atom.name, list(atom.pos), atom.b_iso, atom.occ])
                elif res.name in AA: # amino acid residues.
                    for atom in res: # Store a list of information for each atom.
                        AA_chain_dict[chain.name].append([res.name, str(res.seqid), atom.name, list(atom.pos), atom.b_iso, atom.occ])
        
        # Generate the flat list of distance/b-factor/occupancy values.
        flat_list = gen_distance_data(wat_chain_dict, AA_chain_dict)
        data['name'].append(name)
        for water in flat_list:
            data['distance'].append(flat_list[0])
            data['b_fac'].append(flat_list[1])
            data['occ'].append(flat_list[2])

df_train = pd.DataFrame(train_distance_data)
df_test = pd.DataFrame(test_distance_data)

df_train.to_pickle("water_distance_bfac_train.pckl", index=False)
df_test.to_pickle("water_distance_bfac_test.pckl", index=False)