# Déjà Vu Schematics


The Déjà Vu schematics are meant to be used by the Déjà Vu CLI in initializing
clichés and their actions. The schematics, built on top of Angular's schematics,
provide the templates and scaffolding that the CLI needs to create.

## Usage

The schematics can be used outside of the DV CLI
just like regular Angular schematics.

- `ng new --collection=@deja-vu/schematics --clicheName=name` -
    create a new cliché with the given name
    (cannot be run inside an Angular project)
 