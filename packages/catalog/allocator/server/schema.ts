export interface AllocationDoc {
  id: string;
  resourceIds: string[];
  consumerIds: string[];
  assignments: Assignment[];
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-allocation' | 'delete-resource' | 'edit-consumer';
}

export interface Assignment {
  resourceId: string;
  consumerId: string;
}

export interface EditConsumerOfResourceInput {
  resourceId: string;
  allocationId: string;
  newConsumerId: string;
}

export interface ConsumerOfResourceInput {
  resourceId: string;
  allocationId: string;
}

export interface CreateAllocationInput {
  id?: string;
  resourceIds: string[];
  consumerIds: string[];
}

export interface DeleteResourceInput {
  resourceId: string;
  allocationId: string;
}
