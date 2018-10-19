export interface MarkerDoc {
  id: string;
  title?: string;
  location: {
    type: string,                   // 'Point'
    coordinates: [number, number]   // [longitude, latitude]
  };
  mapId: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-marker' | 'delete-marker';
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
}
