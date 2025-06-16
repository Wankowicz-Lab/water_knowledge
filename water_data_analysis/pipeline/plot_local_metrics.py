## Plot the local metrics of different dataset (EDIA, RSCC and RSR). Modify the path to *_stats.txt based on your dataset.
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import numpy as np
import glob
import json

deposited=glob.glob("/dors/wankowicz_lab/mingbin/water/raw_outputs/Deposited_local_metrics/*/*_stats.txt")
hydraprot=glob.glob("/dors/wankowicz_lab/mingbin/water/raw_outputs/Hydraprot/Hydraprot_local_metrics/*/*_stats.txt")
superwater=glob.glob("/dors/wankowicz_lab/mingbin/water/raw_outputs/Superwater/Superwater_local_metrics/*/*_stats.txt")

color_dict = {'deposited': '#7b3294', 'vratin': '#E66101', 'hydraprot': '#008837', 'superwater': '#0571b0'}
colors=[list(color_dict.values())[0]] + list(color_dict.values())[2:] # Add in the second color with Vratin's results.
labels= ['deposited', 'hydraprot', 'superwater']

# Convert from file names to json objects.
list_deposited, list_hydraprot, list_superwater = [], [], []
for list_A, data in zip([list_deposited, list_hydraprot, list_superwater], [deposited, hydraprot, superwater]):
    for file in data:
        with open(file, 'r') as f:
            data = json.load(f)
        list_A.append(data)


# Plot values for local metric: EDIAm, RSCCS, RSR.
keys=['EDIAm', 'RSCCS', "RSR"]
for key in keys: # Loop through 3 different types of local metrics
    fig, ax = plt.subplots() # Regenerate figure for each new key.
    ax2 = ax.twinx()
    x_label = key
    # Overlay (both).
    # Obtain metric of interest for each dataset.
    for list_A, label, color in zip([list_deposited, list_hydraprot, list_superwater], labels, colors):
        data = []
        for structure in list_A: # each pdb
            for res in structure:
                if res['compID'] in ['HOH', 'WAT', 'H2O'] and res[key] is not None: # Only look at waters.
                    data.append(res[key])
        # print(len(data)) # Check if data are loaded.
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
    plt.savefig(f'plots/local_metrics_{key}_overlay.png', dpi=200, bbox_inches='tight')
    plt.show()
