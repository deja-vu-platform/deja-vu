Conventions
===========

- In the case of something like `ShowTask` that needs to display a task it would end up having an object
  (task) and id (id) input and would fetch the object if only the id is given or use the object instead.
  
- When object types (e.g. `Rating`) in the schema have references to other defined object types (e.g. `Source`), use the object type instead of the id even if the only field in the object type is `id`. Example:

Yes:
 ```
 type Source {
   id: ID!
 }
 
 type Target {
   id: ID!
 }
 
 type Rating {
  source: Source!
  target: Target!
  rating: Float!
}
 ```
 No:
 ```
 type Source {
   id: ID!
 }
 
 type Target {
   id: ID!
 }
 
 type Rating {
  sourceId: ID!
  targetId: ID!
  rating: Float!
}
 ```
