import sys
import time
from pymol import cmd

prot1, prot2, out = sys.argv[4], sys.argv[5], sys.argv[6]
temp = prot1.split('.pdb')[0]
holo = temp.split('/')[-1]

temp = prot2.split('.pdb')[0]
apo = temp.split('/')[-1]

cmd.load(prot1, holo)
cmd.load(prot2, apo)

cmd.super(holo, apo)

time.sleep(1)
cmd.save( out, holo, -1)     