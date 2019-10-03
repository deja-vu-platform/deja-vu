export interface MarkerDoc {
  id: string;
  title?: string;
  location: {
    type: string,                   // 'Point'
    coordinates: [number, number]   // [longitude, latitude]
  };
  mapId: string;
}

export interface Marker {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  mapId: string;
}

export interface CreateMarkerInput {
  id?: string;
  title?: string;
  latitude: number;
  longitude: number;
  mapId: string;
}

export interface MarkersInput {
  ofMapId?: string;
  centerLat?: number;
  centerLng?: number;
  radius?: number; // in miles
  markerIds?: string[];
}

export interface UpdateMarkerInput {
  id: string;
  title?: string;
  latitude: number;
  longitude: number;
  mapId: string;
}
