export interface Principal {
  id: string;
}

export interface Resource {
  id: string;
  ownerId: string;
  viewerIds?: string[];
}
