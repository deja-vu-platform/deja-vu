# Geolocation

Locate points of interest

## Actions

- create-marker
- delete-marker
- display-map
- get-current-location
- show-marker
- show-markers

## Notes
To use Leaflet maps in your application, you must do the following:
1. Copy the leaflet directory (`./src/assets/leaflet`) into `<app-name>/src/assets`.
2. In `<app-name>/.angular-cli.json`, replace the `assets` field with:
```
"assets": [
  {
    "glob": "**/*",
    "input": "assets/leaflet/images",
    "output": "leaflet/"
  },
  "assets",
  "favicon.ico"
],
```
3. Similarly replace the `styles` field with:
```
"styles": [
  "styles.css",
  "assets/leaflet/leaflet.css",
  "../../../node_modules/leaflet-routing-machine/dist/leaflet-routing-machine.css",
  "../../../node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css"
],
```
