import { Injectable, ElementRef } from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';


interface ConsumerOfResourceRes {
  data: {consumerOfResource: {id: string}};
}

interface AllocationRes {
  data: {allocation: {consumers: {id: string}[]}};
}

interface CreateResourceRes {
  data: {createResource: {id: string}};
}

interface DeleteResourceRes {
  data: {deleteResource: {id: string}};
}

interface CreateAllocationRes {
  data: {createAllocation: {id: string}};
}

export interface Consumer { id: string; }
export interface Resource { id: string; }

const GRAPHQL_ENDPOINT = '/graphql';


export class AllocatorService {
  constructor(private gs: GatewayService) {}

  get<T>(query: string): Observable<T> {
    return this.gs
      .get<T>(GRAPHQL_ENDPOINT, {
        params: {
          query: `query { ${query} }`
        }
      });
  }

  post<T>(mutation: string): Observable<T> {
    return this.gs
      .post(GRAPHQL_ENDPOINT, JSON.stringify({
        query: `mutation { ${mutation} }`
      }));
  }

  consumerOfResource(resourceId: string, allocationId: string)
    : Observable<Consumer> {
    return this.get<ConsumerOfResourceRes>(`
      consumerOfResource(
        resourceId: "${resourceId}", allocationId: "${allocationId}") {
          id
      }
    `)
    .pipe(map(res => res.data.consumerOfResource));
  }

  consumers(allocationId: string): Observable<Consumer[]>  {
    return  this.get<AllocationRes>(`
      allocation(id: "${allocationId}") {
        consumers {
          id
        }
      }
    `)
    .pipe(map(res => res.data.allocation.consumers));
  }

  editConsumerOfResource(
    resourceId: string, allocationId: string, newConsumerId: string)
    : Observable<boolean> {
    return this.post(`
      editConsumerOfResource(
        resourceId: "${resourceId}",
        allocationId: "${allocationId}",
        newConsumerId: "${newConsumerId}")
    `);
  }

  createResource(id: string): Observable<Resource> {
    return this.post<CreateResourceRes>(`
      createResource(id: "${id}") {
        id
      }
    `)
    .pipe(map(res => res.data.createResource));
  }

  deleteResource(id: string): Observable<Resource> {
    return this.post<DeleteResourceRes>(`
      deleteResource(id: "${id}") {
        id
      }
    `)
    .pipe(map(res => res.data.deleteResource));
  }

  createAllocation(
    id: string, resourceIds: string[], saveResources: boolean) {
    return this.post<CreateAllocationRes>(`
      createAllocation(
        id: "${id}", resourceIds: ${JSON.stringify(resourceIds)},
        saveResources: ${saveResources}) {
        id
      }
    `)
    .pipe(map(res => res.data.createAllocation));
  }
}

@Injectable()
export class AllocatorServiceFactory {
  constructor(private gsf: GatewayServiceFactory) {}

  for(from: ElementRef): AllocatorService {
    return new AllocatorService(this.gsf.for(from));
  }
}
