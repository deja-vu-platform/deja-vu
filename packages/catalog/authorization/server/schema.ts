export interface ResourceDoc {
  id: string;
  ownerId: string;
  // Includes the owner id because the owner is also a viewer
  viewerIds: string[];
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-resource' | 'add-viewer-to-resource' | 'delete-resource';
}

export interface ResourcesInput {
  viewableBy: string;
}

export interface CreateResourceInput {
  id?: string;
  ownerId: string;
  viewerIds?: string[];
}

export interface PrincipalResourceInput {
  principalId: string;
  resourceId: string;
}

export interface AddViewerToResourceInput {
  id: string;
  viewerId: string;
}
