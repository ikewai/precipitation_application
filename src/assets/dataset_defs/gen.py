from os.path import join
from itertools import product

base_dir = "./historical_rainfall/legacy/sets"

parts = [["month"]]

for group in product(*parts):
    fname = "_".join(group) + ".json"
    fpath = join(base_dir, fname)
    with open(fpath, "w"):
        pass