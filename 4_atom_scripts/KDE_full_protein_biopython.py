#!/usr/bin/env python3
import os
import numpy as np
import pandas as pd
from analysis_functions_biopython import *	
import glob
from multiprocessing import Pool
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D
from scipy.spatial.distance import cdist
from scipy.spatial.transform import Rotation as R
from scipy.signal import argrelextrema
from scipy import stats
import sklearn
from sklearn.cluster import MeanShift
from sklearn.cluster import  estimate_bandwidth
from sklearn.model_selection  import LeaveOneOut
from sklearn.neighbors import KernelDensity
from sklearn.model_selection import RandomizedSearchCV, GridSearchCV, train_test_split
from argparse import ArgumentParser
from DICT4A_test2 import DICT4A
#from DICT4A_ALLAT import DICT4A_ALLAT
import time


def parse_args():
    p = ArgumentParser(description=__doc__)
    p.add_argument("--pdb", help="Name of PDB")
    p.add_argument("--band", help="bandwidth")
    p.add_argument("-d", help="directory with npy")
    args = p.parse_args()
    return args

def parallel_score_samples(kde, samples, thread_count=int(8)):
    with multiprocessing.Pool(thread_count) as p:
        return np.concatenate(p.map(kde.score_samples, np.array_split(samples, thread_count)))

def score_samples(kde, samples):
    #print(kde)
    #print(samples)
    return kde.score_samples(samples)

from Bio.PDB import PDBParser

def structure_based_KDE(coords_all, norm_factor, s, bandwidth):
    model = s[0]
    #coords_all = [atom.get_coord() for atom in model.get_atoms()]
    kde = KernelDensity(kernel='gaussian', bandwidth=float(bandwidth), atol=0.0005,rtol=0.001).fit(coords_all,sample_weight = norm_factor)
    s_wat = [res for res in model.get_residues() if res.get_resname() == 'HOH']
    new_water = [atom.get_coord() for res in s_wat for atom in res.get_atoms() if atom.get_name() == 'O']
    #print(new_water)
    #density = score_samples(kde, new_water)
    density_all = parallel_score_samples(kde, coords_all,8)
    return density_all

from Bio.PDB import PDBIO

def reassign_bfactors(s, out_coords_all_KDE, density_all, pdb_out, PDB, band):
    bfactor_out = pd.DataFrame(columns=['chain','resid','resname','alt','bfactor', 'PDB', 'band'])
    s_wat = [res for res in s.get_residues() if res.get_resname() == 'HOH']
    s_wat = [atom for res in s_wat for atom in res.get_atoms() if atom.get_name() == 'O']
    n = 0
    for atom in s_wat:
        c = atom.get_parent().get_parent().get_id()
        r = atom.get_parent().get_id()[1]
        a = atom.get_altloc()
        wat = atom.get_coord()
        dist = np.linalg.norm(out_coords_all_KDE.reshape(-1,3) - wat, axis=1)
        bfactor_out = bfactor_out.append({'chain':c, 'resid':r,'resname':'HOH','alt':a,'bfactor':(np.exp(density_all[n])*1000),'PDB':PDB,'band':band},ignore_index=True)
        atom.set_bfactor(np.exp(density_all[n])*1000)
        n += 1
    io = PDBIO()
    io.set_structure(s)
    io.save(f'{pdb_out}_all_wat.pdb')
    #bfactor_out.to_csv(f'{pdb_out}_wat_o_prot_norm.csv',index=False)


def main():
    args = parse_args()
    s = PDBParser().get_structure('PDB', args.pdb)
    args.pdb = args.pdb.rstrip('.pdb')
    out_coords_all_KDE = np.load(f'{args.pdb}_all_out_coord_50000.npy',allow_pickle='TRUE')
    norm_all = np.load(f'{args.pdb}_normalization_None_50000.npy',allow_pickle='TRUE')
    density_all = structure_based_KDE(out_coords_all_KDE.reshape(-1,3), norm_all, s, args.band)
    #reassign_bfactors(s, out_coords_all_KDE, density_all, args.pdb + '_' + args.band, args.pdb, args.band)
    build_density_pdb(out_coords_all_KDE.reshape(-1, 3), f'{args.pdb}_density_all.pdb', density_all)
    np.save(f'{args.pdb}_density_all.npy', density_all)
if __name__ == '__main__':
    main()
