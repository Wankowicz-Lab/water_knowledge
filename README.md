# Water Knowledge  (4 atom sets)
Scripts related to solvated rotamer database and water knowledge analysis

Scripts for building 4 atom sets
Scripts:
- find_wat.py → build df of info needed (water coordinates, protein coordinates, etc)

    - new_dihedral : calculate dihedral angle given 4 points
    
    - project_data :  turn distribution into gaussian
    
    - rigid_transform_3D : find optimal rotation/translation matrices to project one set of 4 points on another set
    
    - get_coord_list : find coordinates (and other info) of waters within 3.5 A of atom sets (plus keep info on b factors and occupancy)
    
    - build_df : build df from get_coord_list
    
    - find_max_ang_idx : find what 4 atom set is at local maximas of dihedral distribution (will be used at template set for each dihedral bin)

    - cluster_dih_angs : cluster dihedral angles (define boundaries for these bins)
    
    - obtain_new_xyz : take xyz coords (of atoms sets and waters) from df of build_df and rotate+translate onto template structures from find_max_ang_idx

- density.py → build density distributions + mean-shift centers for each dihedral grouping of each 4 atom set

    - find_density : (only function, does what is describes above)

- Analysis Notebooks
    - get_new_coords : take in a residue, break it into its 4 atom components, and rotate/translate the solvated library for that 4 atom set onto each set of 4 atoms
    - build_density_pdb : create a pdb file of waters from solvated library around residue (max 10000 waters). Density value in b factor column, so coloring by b factor lets you see that
    - build_center_placement_pdb : create a pdb of just the centers of the densities (plus a pml file to size by spread)
