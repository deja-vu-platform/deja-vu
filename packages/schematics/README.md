# Déjà Vu Schematics


The Déjà Vu schematics are meant to be used by the Déjà Vu CLI in initializing
concepts and their components. The schematics, built on top of Angular's schematics,
provide the templates and scaffolding that the CLI needs to create.

## Usage

The schematics can be used outside of the DV CLI
just like regular Angular schematics.

- `ng new --collection=@deja-vu/schematics --conceptName=name` -
    create a new concept with the given name
    (cannot be run inside an Angular project)
- `ng generate @deja-vu/schematics:component --conceptName=conceptName
    --componentName=componentName` - create an component in a concept
    (must be run inside the `componentName` concept directory)
 
