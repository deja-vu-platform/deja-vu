This folder includes a script to perform an analysis of how sample apps
use the catalog.

See [conda's doc for managing environments](https://conda.io/docs/user-guide/tasks/manage-environments.html).

If you don't have an environment yet, you will have to create one.

To view a list of your conda environments:
```
conda info --envs
```

To activate on MacOS:
```
source activate dv
```

To run:
```
python dv.py path-to-apps
```

The script will print some data and output a bunch of png files.
The first time you run the simulation, a file `concept-dev.pickle` is created
to cache some intermediate results and subsequent runs will use the
file to speed up execution. If you change the apps being analyzed, you need
to drop the file.
