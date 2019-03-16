# Geolocation

Locate points of interest

## Actions

- create-marker
- delete-marker
- display-map
- get-current-location
- show-marker
- show-marker-count
- show-markers

## Notes

To use this cliché in your app you need to add the following
to `styles.css`:
```css
@import "~leaflet/dist/leaflet.css";
@import "~leaflet-routing-machine/dist/leaflet-routing-machine.css";
@import "~leaflet-control-geocoder/dist/Control.Geocoder.css";
```

## Configuration Options
- `mapType` (`string`): If set to `leaflet`, the cliche uses the Leaflet Maps API. If set to `gmap`, it uses the Google Maps API.
- `apiKey` (`string`): Must be set if `mapType` is `gmap`.

