# THIS PUTS ./prediction_results/HydraProt_Predictions/PDB_waters.pdb back into main PDB directory

#!/bin/bash

source_dir="./prediction_results/HydraProt_Predictions"
destination_dir="/home/yuanm6/data_test/PDB_nowat_G_forH"

if [ ! -d "$source_dir" ]; then
  echo "Error: Source directory '$source_dir' does not exist."
  exit 1
fi

if [ ! -d "$destination_dir" ]; then
  echo "Destination directory '$destination_dir' does not exist."
  exit 1
fi

for file in "$source_dir"/*; do
  if [ -f "$file" ]; then
	if [[ "$file" == *".pdb" ]]; then
     		 filename=$(basename "$file")
	         IFS='_' read -r part1 part2 <<< "$filename"
      
     		 destination_path="$destination_dir/$part1/$part1""_hp_centroid.pdb"
	
     		 cp "$file" "$destination_path"
     		 echo "Copied '$filename' to '$destination_dir'"
    	fi
  fi
done

echo "File copying complete."

