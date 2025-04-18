# All structures in one scatterplot colored by water gain/loss, Dist to ligand on y-axis, AA on x-axis

import json
import matplotlib.pyplot as plt
import numpy as np
import os
from matplotlib.colors import LinearSegmentedColormap, Normalize
import matplotlib.cm as cm

current_dir = os.path.dirname(os.path.abspath(__file__))
json_file = "./water_comparison.json"

with open(json_file, 'r') as f:
    data = json.load(f)


all_residue_data = []
for structure in data:
    apo_pdb = structure["apoPDBId"]
    holo_pdb = structure["holoPDBId"]
    
    for res in structure["waterComparison"]:
        try:
            if (res and res["distanceToLigand"]):
                all_residue_data.append({
                    "apoPDBId": apo_pdb,
                    "holoPDBId": holo_pdb,
                    "residueNumber": res["residueNumber"],
                    "residueName": res["residueName"],
                    "difference": res["difference"],
                    "distanceToLigand": res["distanceToLigand"]
                })
        except KeyError:
            pass

residue_numbers = [res["residueNumber"] for res in all_residue_data if abs(res['difference']) >= 0]
distances = [res["distanceToLigand"] for res in all_residue_data if abs(res['difference']) >= 0]
differences = [res["difference"] for res in all_residue_data  if abs(res['difference']) >= 0]

max_diff = max([abs(d) for d in differences])
colors = []
for diff in differences:
    if diff > 0:  # Water gain - blue
        intensity = min(abs(diff) / max_diff, 1.0)
        colors.append((0, 0, 1, intensity))  # RGBA: blue with variable alpha
    elif diff < 0:  # Water loss - red
        intensity = min(abs(diff) / max_diff, 1.0)
        colors.append((1, 0, 0, intensity))  # RGBA: red with variable alpha
    else:  # No change - gray
        colors.append((0.5, 0.5, 0.5, 0.5))  # RGBA: gray

plt.figure(figsize=(12, 7))

scatter = plt.scatter(residue_numbers, distances, c=differences, 
                     cmap='RdBu', norm=Normalize(vmin=-max_diff, vmax=max_diff),
                     s=25,   alpha=0.5)
cbar = plt.colorbar(scatter)
cbar.set_label('Water Change (Holo - Apo)', fontsize=12)



plt.xlabel('Residue Number', fontsize=14)
plt.ylabel('Distance to Ligand (Å)', fontsize=14)
plt.title('Mac1 Water Change vs. Distance to Ligand by Residue', fontsize=16)

plt.grid(True, linestyle='--', alpha=0.4)


# Add some statistics as text
gain_count = sum(1 for d in differences if d > 0)
loss_count = sum(1 for d in differences if d < 0)
no_change_count = sum(1 for d in differences if d == 0)
total_count = len(differences)

stats_text = (f"Total residues: {total_count}\n"
              f"Water gain: {gain_count} ({gain_count/total_count*100:.1f}%)\n"
              f"Water loss: {loss_count} ({loss_count/total_count*100:.1f}%)\n"
              f"No change: {no_change_count} ({no_change_count/total_count*100:.1f}%)")

plt.text(0.02, 0.97, stats_text, transform=plt.gca().transAxes, 
         verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))


plt.tight_layout()

output_dir = './figures/'
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "water_change_by_residue_distance.png")
plt.savefig(output_file, dpi=300, bbox_inches='tight')

print(f"Plot saved to {output_file}")
