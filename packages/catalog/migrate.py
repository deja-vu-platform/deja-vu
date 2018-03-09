#!/usr/bin/env python3
import subprocess
import os
import sys


def main():
    category = sys.argv[1]
    cliche = sys.argv[2]
    if not os.path.exists("migrate.py"):
        print("I must be run from the packages/catalog folder")

    print("Migrating {0}".format(cliche))
    call_or_fail(["dv", "new", "cliche", cliche, "../.."])

    os.chdir(cliche)
    cliche_dir = os.path.join(
      "..", "..", "..", "catalog", category, cliche)
    src_dir = os.path.join(cliche_dir, "src")
    components_dir = os.path.join(src_dir, "components")

    target_module_dir = os.path.join("src", "app", cliche)
    for dirname in os.listdir(components_dir):
        if dirname == "shared":
           # todo
           continue
        component_name = os.path.basename(dirname)
        print("Migrating component {0}".format(component_name))
        call_or_fail(["dv", "generate", "action", component_name])
        replace(components_dir, target_module_dir, component_name, "html")
        replace(components_dir, target_module_dir, component_name, "css")
        replace(components_dir, target_module_dir, component_name, "ts")


    print("Migrating server")
    call_or_fail(["dv", "generate", "server"])
    os.replace(
        os.path.join(src_dir, "app.ts"),
        os.path.join("server", "server.ts"))

    print("Migrating readme")
    os.replace(
        os.path.join(cliche_dir, "README.md"),
        os.path.join("README.md"))

def file(components_dir, component_name, ext):
    return os.path.join(
      components_dir, component_name, "{0}.{1}".format(component_name, ext))

def target_file(target_module_dir, component_name, ext):
    return os.path.join(
      target_module_dir, component_name,
      "{0}.component.{1}".format(component_name, ext))

def replace(components_dir, target_module_dir, component_name, ext):
    src = file(components_dir, component_name, ext)
    if not os.path.exists(src):
        return
    target = target_file(target_module_dir, component_name, ext)
    try:
        os.replace(src, target)
    except OSError as e:
        print("Failed on {0} -> {1}".format(src, target))

def call_or_fail(args):
    fail = subprocess.call(args)
    if fail:
       sys.exit(1)


if __name__ == "__main__":
    main()
