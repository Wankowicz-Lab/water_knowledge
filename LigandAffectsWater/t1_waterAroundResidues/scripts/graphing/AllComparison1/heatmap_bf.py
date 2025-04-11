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
    
    distance_order = ['0-3Å', '3-6Å', '6-9Å', '9-12Å', '12+Å']
    
    pivot_data = df.pivot_table(
        index='distanceBin', 
        columns='aminoAcid', 
        values='avgWaterChange',
        aggfunc='mean'
    )
    
    def distance_bin_sort_key(bin_name):
        print(f"Sorting bin: {bin_name}")
        # check if bin includes +
        if '+' in bin_name:
            return len(distance_order) + 1
        
        return len(distance_order)
   
    pivot_data = pivot_data.sort_index(key=lambda x: x.map(distance_bin_sort_key))

    count_data = df.pivot_table(
        index='distanceBin', 
        columns='aminoAcid', 
        values='count',
        aggfunc='sum'
    )

    count_data = count_data.sort_index(key=lambda x: x.map(distance_bin_sort_key))

    
    
    plt.figure(figsize=(14, 8))
    
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

    
    for i in range(len(pivot_data.index)):
        for j in range(len(pivot_data.columns)):
            count = count_data.iloc[i, j]
            if not np.isnan(count):
                plt.text(j + 0.5, i + 0.85, f'n={int(count)}', 
                        ha='center', va='center', 
                        color='black', fontsize=7)
    
    plt.title('Average Water Change by Amino Acid and Distance to Ligand', fontsize=16)
    plt.ylabel('Distance to Ligand')
    plt.xlabel('Amino Acid')
    
    plt.xticks(rotation=45, ha='right')
    
    plt.tight_layout()
    output_path = os.path.join(output_dir, 'water_changes_heatmap.png')
    plt.savefig(output_path, dpi=300)
    
    print(f"Heatmap saved to {output_path}")

    # 
    
    overall_aa_changes = df.groupby('aminoAcid')['avgWaterChange'].mean().reset_index()
    overall_aa_counts = df.groupby('aminoAcid')['count'].sum().reset_index()
    overall_data = pd.merge(overall_aa_changes, overall_aa_counts, on='aminoAcid')
    overall_data = overall_data.sort_values('avgWaterChange', ascending=False)
    
    plt.figure(figsize=(12, 6))
    bars = plt.bar(overall_data['aminoAcid'], overall_data['avgWaterChange'], 
           color=[('royalblue' if x > 0 else 'firebrick') for x in overall_data['avgWaterChange']])
    
    for bar, count in zip(bars, overall_data['count']):
        height = bar.get_height()
        offset = -1 if height >= 0 else -0.3
        plt.text(bar.get_x() + bar.get_width()/2., height - 0.025,
                f'n={count}', ha='center', va='bottom', fontsize=8)
    
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    plt.title('Average Water Change by Amino Acid Type', fontsize=16)
    plt.ylabel('Average Water Change')
    plt.xlabel('Amino Acid')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    
    bar_output_path = os.path.join(output_dir, 'water_changes_by_aa.png')
    plt.savefig(bar_output_path, dpi=300)
    
    print(f"Bar chart saved to {bar_output_path}")

    #
    
    raw_df = pd.DataFrame(data['raw'])
    
    plt.figure(figsize=(10, 6))
    sns.scatterplot(data=raw_df, x='distanceToLigand', y='waterDifference', 
                   hue='aminoAcid', alpha=0.6, s=30)
    
    sns.regplot(data=raw_df, x='distanceToLigand', y='waterDifference', 
               scatter=False, color='black', line_kws={'linewidth': 2})
    
    plt.axhline(y=0, color='black', linestyle='--', alpha=0.3)
    plt.title('Water Change vs Distance to Ligand', fontsize=16)
    plt.xlabel('Distance to Ligand (Å)')
    plt.ylabel('Water Difference')
    plt.legend(title='Amino Acid', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    
    scatter_output_path = os.path.join(output_dir, 'water_changes_vs_distance.png')
    plt.savefig(scatter_output_path, dpi=300)
    
    print(f"Scatter plot saved to {scatter_output_path}")
    
    return plt

if __name__ == "__main__":
    plot_water_changes_heatmap()