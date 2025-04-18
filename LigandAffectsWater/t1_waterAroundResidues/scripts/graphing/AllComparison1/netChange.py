import json
import matplotlib.pyplot as plt
import os
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
json_file = os.path.join(current_dir, "waterChangeDPs.json")

with open(json_file, 'r') as f:
    water_changes = json.load(f)
    water_changes = filter(lambda x: x < 200 and x > -200, water_changes)
    water_changes = list(water_changes)

pair_indices = np.arange(1, len(water_changes) + 1)

plt.figure(figsize=(10, 6))
plt.scatter(pair_indices, water_changes, alpha=0.7, s=60, color='#1f77b4', edgecolors='black')

plt.axhline(y=0, color='gray', linestyle='--', alpha=0.7)

positive_changes = sum(1 for change in water_changes if change > 0)
negative_changes = sum(1 for change in water_changes if change < 0)
zero_changes = sum(1 for change in water_changes if change == 0)
mean_change = np.mean(water_changes)

stats_text = (f"Pairs with water gain: {positive_changes}\n"
              f"Pairs with water loss: {negative_changes}\n"
              f"Pairs with no change: {zero_changes}\n"
              f"Mean change: {mean_change:.2f}")

plt.text(0.02, 0.97, stats_text, transform=plt.gca().transAxes, 
         verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

plt.xlabel('Apo-Holo Pair Index', fontsize=12)
plt.ylabel('Net Water Change (Holo - Apo)', fontsize=12)
plt.title('Net Water Change from Apo to Holo States', fontsize=14)

plt.grid(True, linestyle='--', alpha=0.6)

y_min, y_max = plt.ylim()
plt.ylim(y_min - 1, y_max + 1)

output_file = os.path.join(current_dir, "figures/net_water_change_plot.png")
plt.savefig(output_file, dpi=300, bbox_inches='tight')
