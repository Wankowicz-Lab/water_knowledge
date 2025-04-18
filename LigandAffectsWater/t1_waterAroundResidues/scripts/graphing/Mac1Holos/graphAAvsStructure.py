# Looking at each structure individually, with AA sorted by dist to ligand on Y-axis, and struct name on x-axis, colored by water gain/loss

import json
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

def plot_ligand_series_heatmap(data_path='./water_comparison.json', 
                             output_dir='./figures/'):
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    with open(data_path, 'r') as f:
        data = json.load(f)
    
    df_rows = []
    all_residues = set()
    residue_distances = {}
    residue_names = {}
    
    for structure in data:
        apo_pdb = structure["apoPDBId"]
        holo_pdb = structure["holoPDBId"]
        
        for res in structure["waterComparison"]:
            res_num = res["residueNumber"]
            all_residues.add(res_num)
            
            if res_num not in residue_distances and "distanceToLigand" in res:
                residue_distances[res_num] = res["distanceToLigand"]
            
            if res_num not in residue_names and "residueName" in res:
                residue_names[res_num] = res["residueName"]
            
            df_rows.append({
                'holoPDBId': holo_pdb,
                'apoPDBId': apo_pdb,
                'residueNumber': res_num,
                'residueName': res.get("residueName", "UNK"),
                'difference': res["difference"],
                'distanceToLigand': res.get("distanceToLigand", float('inf'))
            })
    
    all_residues = sorted(list(all_residues), key=lambda r: residue_distances.get(r, float('inf')))
    
    df = pd.DataFrame(df_rows)
    
    df['holoID'] = df['holoPDBId']
    
    pivot_data = df.pivot_table(
        index='residueNumber', 
        columns='holoID', 
        values='difference',
        aggfunc='mean'
    )
    
    pivot_data = pivot_data.reindex(all_residues)

    csv_data = pivot_data.copy()
    csv_data = csv_data.reset_index()  # Convert index to column
    
    csv_data['ResidueType'] = csv_data['residueNumber'].map(residue_names)
    csv_data['DistanceToLigand'] = csv_data['residueNumber'].map(residue_distances)
    
    first_columns = ['residueNumber', 'DistanceToLigand']
    other_columns = [col for col in csv_data.columns if col not in first_columns]
    csv_data = csv_data[first_columns + other_columns]
    
    csv_output_path = os.path.join(output_dir, 'water_changes_by_residue.csv')
    csv_data.to_csv(csv_output_path, index=False)
    print(f"CSV data saved to {csv_output_path}")
    
    
    ylabels = [f"{res} ({residue_names.get(res, 'UNK')}) - {residue_distances.get(res, float('inf')):.1f}Å" 
               for res in pivot_data.index]
    
    plt.figure(figsize=(max(10, len(all_residues) * 0.25), max(10, len(all_residues) * 0.25)))
    
    max_abs_change = max(1, np.nanmax(np.abs(pivot_data.values)))
    
    ax = sns.heatmap(pivot_data, 
                     cmap='RdBu',  # Blue for gain, Red for loss
                     vmin=-max_abs_change, 
                     vmax=max_abs_change,
                     center=0,
                     fmt='.1f',
                     linewidths=0.5,
                     cbar_kws={'label': 'Water Difference (Holo - Apo)'})
    
    ax.set_yticklabels(ylabels)
    
    
    plt.title(f'Mac1 Water Changes by Residue at Multiple Holos', fontsize=14)
    plt.ylabel('Residue Number (AA) - Distance to Ligand (Å) (distance is at Apo state)', fontsize=12)
    plt.xlabel('Holo ID', fontsize=12)
    
    plt.xticks(rotation=45, ha='right')
    
    plt.tight_layout()
    output_path = os.path.join(output_dir, f'water_changes_comparison.png')
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    
    print(f"Heatmap saved to {output_path}")
    return output_path

if __name__ == "__main__":
    output_file = plot_ligand_series_heatmap()