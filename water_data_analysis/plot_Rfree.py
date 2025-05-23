## Read the txt file of global metrics (R-free values) obtained by SFcalculator. Organized in names and r-free values.

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Read in file.
df_deposited=pd.read_csv("/dors/wankowicz_lab/mingbin/water/raw_outputs/New_test052225_rfree2.txt") # deposited model.
df_hydraprot=pd.read_csv("/dors/wankowicz_lab/mingbin/water/raw_outputs/Hydraprot/Hydraprot_output_rfree.txt") # hydraprot
df_superwater=pd.read_csv("/dors/wankowicz_lab/mingbin/water/raw_outputs/Superwater/Superwater_output_rfree.txt") # superwater
color_dict = {'deposited': '#7b3294', 'vratin': '#E66101', 'hydraprot': '#008837', 'superwater': '#0571b0'}
colors=[list(color_dict.values())[0]] + list(color_dict.values())[2:] # Add in the second color with Vratin's results.
print(colors)
labels=['deposited', 'hydraprot', 'superwater']
datas=[df_deposited, df_hydraprot, df_superwater]

# Consistent setting.
x_label = 'R-free'

# Plot. Overlay
fig, ax = plt.subplots()
# Second y-axix, histogram
ax2 = ax.twinx()
# Loop through three sets of data.
for data, label, color in zip(datas, labels, colors):
    rfree = data['r_free'].values
    # seaborn RDF.
    df = pd.DataFrame(rfree, columns=[x_label])
    sns.kdeplot(df, x=x_label, label=label, color=color)

    # Add axis labels.
    ax.set_ylabel('Density')
    ax.set_xlabel(x_label)

    # histogram
    ax2.hist(rfree, alpha=0.5, bins=100, color=color)
# ax2.legend()
plt.legend(labels)
ax2.set_ylabel('Frequency')
plt.savefig('plots/Rfree_plot_overlay.png', dpi=200, bbox_inches='tight')
# plt.show()

# Plot. Histogram
fig, ax = plt.subplots()
# Loop through three sets of data.
for data, label, color in zip(datas, labels, colors):
    rfree = data['r_free'].values
    # histogram
    ax.hist(rfree, alpha=0.5, bins=100, label=label, color=color)
plt.legend()
ax.set_ylabel('Frequency')
plt.xlabel(x_label)
plt.savefig('plots/Rfree_plot_hist.png', dpi=200, bbox_inches='tight')
plt.show()

# Plot. KDE plot
fig, ax = plt.subplots()
# Loop through three sets of data.
for data, label, color in zip(datas, labels, colors):
    rfree = data['r_free'].values
    # seaborn RDF.
    df = pd.DataFrame(rfree, columns=[x_label])
    sns.kdeplot(df, x=x_label, label=label, color=color)
plt.legend()
plt.savefig('plots/Rfree_plot_kde.png', dpi=200, bbox_inches='tight')
plt.show()