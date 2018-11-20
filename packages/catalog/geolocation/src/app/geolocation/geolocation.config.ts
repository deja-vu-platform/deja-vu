import { InjectionToken } from '@angular/core';

export const GOOGLE_MAPS_API_KEY = '<INSERT YOUR GOOGLE MAPS API KEY HERE>';

export interface GeolocationConfig {
  mapType: 'gmap' | 'leaflet';
  apiKey: '<INSERT YOUR GOOGLE MAPS API KEY HERE>';
}

export const API_PATH = new InjectionToken<string>('api.path');
export const CONFIG = new InjectionToken<GeolocationConfig>('config');
