from os.path import join
from itertools import product

base_dir = "./future_climate/rainfall"

parts = [["dynamical", "statistical"], ["rcp45", "rcp85"], ["annual", "wet", "dry"], ["present", "mid", "late"]]

for group in product(*parts):
    fname = "_".join(group) + ".json"
    fpath = join(base_dir, fname)
    with open(fpath, "w"):
        pass