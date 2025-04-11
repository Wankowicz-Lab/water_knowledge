import json
import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

def plot_ligand_series_heatmaps(data_path='outputGraphDatas.json', 
                             output_dir='figures/ligand_series'):
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    with open(data_path, 'r') as f:
        data = json.load(f)
    
    print(f"Loaded data for {len(data)} Apo structures")
    
    for apo_data in data:
        apo_id = apo_data['apoID']
        comparisons = apo_data['comparisons']
        
        print(f"Processing Apo {apo_id} with {len(comparisons)} Holo comparisons")
        
        df_rows = []
        
        all_residues = set()
        residue_distances = {}
        
        for comp in comparisons:
            for res in comp['results']:
                res_num = res['residueNumber']
                all_residues.add(res_num)
                
                if 'distanceToLigand' in res and res_num not in residue_distances:
                    residue_distances[res_num] = res['distanceToLigand']
        
        all_residues = sorted(list(all_residues), key=lambda r: residue_distances.get(r, float('inf')))
        
        for comp in comparisons:
            holo_id = comp['holoID']
            
            res_dict = {res['residueNumber']: res for res in comp['results']}
            
            for res_num in all_residues:
                if res_num in res_dict:
                    res_data = res_dict[res_num]
                    df_rows.append({
                        'holoID': holo_id,
                        'residueNumber': res_num,
                        'aminoAcid': res_data['aminoAcid'],
                        'difference': res_data['difference'],
                        'distanceToLigand': residue_distances.get(res_num, float('inf'))
                    })
                else:
                    df_rows.append({
                        'holoID': holo_id,
                        'residueNumber': res_num,
                        'aminoAcid': 'N/A',
                        'difference': 0,
                        'distanceToLigand': residue_distances.get(res_num, float('inf'))
                    })
        
        df = pd.DataFrame(df_rows)
        
        pivot_data = df.pivot_table(
            index='residueNumber', 
            columns='holoID', 
            values='difference',
            aggfunc='mean'
        )
        
        pivot_data = pivot_data.reindex(all_residues)
        
        aa_labels = df.groupby('residueNumber')['aminoAcid'].apply(
            lambda x: x.value_counts().index[0] if x.value_counts().index[0] != 'N/A' else ''
        ).to_dict()
        
        distance_labels = df.groupby('residueNumber')['distanceToLigand'].first().to_dict()
        
        plt.figure(figsize=(12, max(8, len(all_residues) * 0.2)))
        
        max_abs_change = np.nanmax(np.abs(pivot_data.values))
        
        ax = sns.heatmap(pivot_data, 
                         cmap='RdBu',  # Blue for gain, Red for loss
                         vmin=-max_abs_change, 
                         vmax=max_abs_change,
                         center=0,
                         annot=True,
                         fmt='.2f',
                         linewidths=0.5,
                         cbar_kws={'label': 'Water Difference'})
        
        ylabels = [f"{res} ({aa_labels.get(res, '')}) - {distance_labels.get(res, 'N/A'):.1f}Å" 
                  if res in distance_labels else f"{res} ({aa_labels.get(res, '')})"
                  for res in pivot_data.index]
        ax.set_yticklabels(ylabels)
        
        plt.title(f'Water Changes by Residue for APO {apo_id}\n(Sorted by Distance to Ligand)', fontsize=14)
        plt.ylabel('Residue Number (AA) - Distance to Ligand')
        plt.xlabel('Holo Structure ID')
        
        if len(pivot_data) > 1:
            prev_range = None
            for i, res in enumerate(pivot_data.index):
                dist = distance_labels.get(res, float('inf'))
                if dist <= 3:
                    curr_range = "0-3Å"
                elif dist <= 6:
                    curr_range = "3-6Å"
                elif dist <= 9:
                    curr_range = "6-9Å"
                elif dist <= 12:
                    curr_range = "9-12Å"
                else:
                    curr_range = "12+Å"
                
                if prev_range is not None and curr_range != prev_range:
                    plt.axhline(y=i, color='black', linewidth=1.5)
                
                prev_range = curr_range
        
        plt.xticks(rotation=45, ha='right')
        
        plt.tight_layout()
        output_path = os.path.join(output_dir, f'water_changes_{apo_id}.png')
        plt.savefig(output_path, dpi=300)
        plt.close()
        
        print(f"Heatmap saved to {output_path}")
    
    print("All heatmaps generated successfully")

if __name__ == "__main__":
    plot_ligand_series_heatmaps()