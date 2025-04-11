import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os

def plot_water_changes_heatmap(data_path='allComparisonResultsAggregated_bfacgte.json', 
                              output_dir='figures-bfac-gte'):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    with open(data_path, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data['aggregated'])
    
    aa_categories = {
        # Non-polar
        'GLY': 1, 'ALA': 1, 'VAL': 1, 'LEU': 1, 'ILE': 1, 
        'MET': 1, 'PRO': 1, 'PHE': 1, 'TRP': 1,
        
        # Polar uncharged
        'SER': 2, 'THR': 2, 'CYS': 2, 'ASN': 2, 
        'GLN': 2, 'TYR': 2,
        
        # Negatively charged
        'ASP': 3, 'GLU': 3,
        
        # Positively charged
        'LYS': 4, 'ARG': 4, 'HIS': 4
    }
    
    def aa_sort_key(aa):
        category = aa_categories.get(aa, 5)
        return (category, aa)
    
    distance_order = ['0-3Å', '3-6Å', '6-9Å', '9-12Å', '12+Å']
    
    pivot_data = df.pivot_table(
        index='distanceBin', 
        columns='aminoAcid', 
        values='avgWaterChange',
        aggfunc='mean'
    )
    
    def distance_bin_sort_key(bin_name):
        # check if bin includes +
        if '+' in bin_name:
            return len(distance_order) + 1
        
        try:
            return distance_order.index(bin_name)
        except ValueError:
            return len(distance_order)
   
    pivot_data = pivot_data.sort_index(key=lambda x: x.map(distance_bin_sort_key))
    
    pivot_data = pivot_data[sorted(pivot_data.columns, key=aa_sort_key)]

    count_data = df.pivot_table(
        index='distanceBin', 
        columns='aminoAcid', 
        values='count',
        aggfunc='sum'
    )

    count_data = count_data.sort_index(key=lambda x: x.map(distance_bin_sort_key))
    count_data = count_data[sorted(count_data.columns, key=aa_sort_key)]
    
    plt.figure(figsize=(14, 8))
    
    category_positions = []
    current_pos = 0
    
    sorted_aas = sorted(pivot_data.columns, key=aa_sort_key)
    categories = [aa_categories.get(aa, 5) for aa in sorted_aas]
    
    for i in range(1, len(categories)):
        if categories[i] != categories[i-1]:
            category_positions.append((current_pos + i)/2)
            current_pos = i
    
    category_positions.append((current_pos + len(categories))/2)
    
    max_abs_change = np.nanmax(np.abs(pivot_data.values))
    heatmap = sns.heatmap(pivot_data, 
                         cmap='RdBu',
                         vmin=-max_abs_change, 
                         vmax=max_abs_change,
                         center=0,
                         annot=True, 
                         fmt='.2f',
                         linewidths=0.5, 
                         cbar_kws={'label': 'Average Water Change'})
    
    # Add vertical lines to separate amino acid categories
    prev_cat = -1
    for i, aa in enumerate(sorted_aas):
        cat = aa_categories.get(aa, 5)
        if cat != prev_cat and i > 0:
            plt.axvline(x=i, color='black', linestyle='-', linewidth=1.5)
        prev_cat = cat
    
    for i in range(len(pivot_data.index)):
        for j in range(len(pivot_data.columns)):
            count = count_data.iloc[i, j]
            if not np.isnan(count):
                plt.text(j + 0.5, i + 0.85, f'n={int(count)}', 
                        ha='center', va='center', 
                        color='black', fontsize=7)
    
    category_names = ["Non-polar", "Polar uncharged", "Negative", "Positive"]
    category_indices = []
    prev_cat = -1
    
    curr_indices = []
    for i, aa in enumerate(sorted_aas):
        cat = aa_categories.get(aa, 5) - 1
        if cat != prev_cat and i > 0:
            if curr_indices:
                category_indices.append((min(curr_indices) + max(curr_indices)) / 2)
            curr_indices = [i]
        else:
            curr_indices.append(i)
        prev_cat = cat
    
    if curr_indices:
        category_indices.append((min(curr_indices) + max(curr_indices)) / 2)
    
    for i, (pos, name) in enumerate(zip(category_indices, category_names)):
        plt.text(pos, -0.6, name, ha='center', va='top', fontsize=12, fontweight='bold')
    
    plt.title('Average Water Change by Amino Acid and Distance to Ligand', fontsize=16)
    plt.ylabel('Distance to Ligand')
    plt.xlabel('Amino Acid')
    
    plt.xticks(rotation=45, ha='right')
    
    plt.tight_layout()
    output_path = os.path.join(output_dir, 'water_changes_heatmap.png')
    plt.savefig(output_path, dpi=300)
    
    print(f"Heatmap saved to {output_path}")

    return plt

if __name__ == "__main__":
    plot_water_changes_heatmap()