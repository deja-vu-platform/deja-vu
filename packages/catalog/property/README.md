# Property

Describe an object with properties that have values

## Components

- choose-object
- create-object
- create-objects
- create-property
- delete-object
- filter-objects
- object-autocomplete
- show-object
- show-objects
- show-url
- update-object
- updated-objects

## Configuration Options

| Option | Type | Default | Description |
| ------ | ---- | ------  | ----------- |
|`schema` | [JSON schema object](http://json-schema.org/) | `{}` | Describes the object and its properties |
| `initialObjects` | `Object[]` | `[]` | Seeds the property database |

## Notes

- Don't use spaces in field names, use camelCase instead. So instead of `First Name` you should use `firstName`
