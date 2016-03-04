#!/usr/bin/env python

import os
import shutil
from sh import grunt, npm

def main():
  print("Setting up local dev environment")
  cwd = os.getcwd()
  print("Running from {0}".format(cwd))

  os.chdir("core/modules/mean");
  mean_dir = os.getcwd()

  print(grunt.lib());
  with open("lib/mean.d.ts", "r") as f:
    data = f.read().splitlines(True)
  with open("lib/mean.d.ts", "w") as f:
    f.writelines(data[1:])
  os.chdir(cwd)

  build_pattern("community/friend", mean_dir)
  build_pattern("access/auth", mean_dir)
  build_pattern("messaging/feed", mean_dir)
  build_pattern("messaging/post", mean_dir)
  build_sample("social-network", [
    "community/friend",
    "access/auth",
    "messaging/feed",
    "messaging/post"
    ])


def build_pattern(pattern, mean_dir):
  print("Building pattern {0}".format(pattern))

  cwd = os.getcwd()

  os.chdir("patterns/{0}".format(pattern))
  shutil.rmtree("node_modules/mean")
  print(npm.install())
  shutil.rmtree("node_modules/mean/lib")
  os.symlink(os.path.join(mean_dir, "lib"), "node_modules/mean/lib")
  print(grunt("dv-mean:lib"));

  os.chdir(cwd)


def build_sample(sample, patterns):
  print("Building sample {0}".format(sample))

  cwd = os.getcwd()

  os.chdir("samples/{0}".format(sample))
  for pattern in patterns:
    shutil.rmtree("node_modules/dv-{0}".format(pattern.replace("/", "-")))
  print(npm.install())
  for pattern in patterns:
    shutil.rmtree("node_modules/dv-{0}/lib".format(pattern.replace("/", "-")))
    os.symlink(
        os.path.join(cwd, "patterns/{0}/lib".format(pattern)),
        "node_modules/dv-{0}/lib".format(pattern.replace("/", "-")))
  print(grunt("dv-mean:lib"));

  os.chdir(cwd)


if __name__ == "__main__":
  main()
