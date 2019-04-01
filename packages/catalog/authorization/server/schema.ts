export interface ResourceDoc {
  id: string;
  ownerId: string;
  // Includes the owner id because the owner is also a viewer
  viewerIds: string[];
}

export interface ResourcesInput {
  createdBy?: string;
  viewableBy?: string;
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

export interface RemoveViewerFromResourceInput {
  id: string;
  viewerId: string;
}
