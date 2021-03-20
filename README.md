# zeste.py
```
usage: zeste.py [-h] [-cp CACHE_PATH] [-pp PREFETCH_PATH] [-nb NUMBERBATCH_PATH] [-dp DATASET_PATH] [-lm LABELS_MAPPING] [-rp RESULTS_PATH]
                [-d DEPTH] [-f FILTER] [-s {simple,compound,depth,harmonized}] [-ar ALLOWED_RELS]

Zero-Shot Topic Extraction

optional arguments:
  -h, --help            show this help message and exit
  -cp CACHE_PATH, --cache_path CACHE_PATH
                        Path to where the 1-hop word neighborhoods are cached
  -pp PREFETCH_PATH, --prefetch_path PREFETCH_PATH
                        Path to where the precomputed n-hop neighborhoods are cached
  -nb NUMBERBATCH_PATH, --numberbatch_path NUMBERBATCH_PATH
                        Path to the pickled Numberbatch
  -dp DATASET_PATH, --dataset_path DATASET_PATH
                        Path to the dataset to process
  -lm LABELS_MAPPING, --labels_mapping LABELS_MAPPING
                        Path to the mapping between the dataset labels and ZeSTE labels (multiword labels are comma-separated)
  -rp RESULTS_PATH, --results_path RESULTS_PATH
                        Path to the directory where to store the results
  -d DEPTH, --depth DEPTH
                        How many hops to generate the neighborhoods
  -f FILTER, --filter FILTER
                        Filtering method: top[N], top[P]%, thresh[T], all
  -s {simple,compound,depth,harmonized}, --similarity {simple,compound,depth,harmonized}
  -ar ALLOWED_RELS, --allowed_rels ALLOWED_RELS
                        Which relationships to use (comma-separated or all)
```
