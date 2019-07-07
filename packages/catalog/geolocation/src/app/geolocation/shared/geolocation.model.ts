export interface Location {
  title?: string;
  latitude: number;
  longitude: number;
}

export interface Marker extends Location {
  id?: string;
  mapId: string;
}

export const DEFAULT_MAP_ID = 'default';
