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
python dv.py
```

The script will output a bunch of png files. If you update `data.csv` you need to remove
`cliche-dev.pickle` to regenerate it.
