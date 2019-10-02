export interface Resource {
  id: string;
  ownerId: string;
  viewerIds: string[];
}

export interface CanDoRes {
  data: { canDo: boolean; };
}
