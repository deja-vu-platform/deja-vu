import { ElementRef, Injectable  } from '@angular/core';
import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { Observable } from 'rxjs/Observable';


interface RatingsBySourceTarget {
  data: {ratingBySourceTarget: {rating: number}};
}

interface AverageRatingForTarget {
  data: {averageRatingForTarget: {rating: number, count: number}};
}


const GRAPHQL_ENDPOINT = '/graphql';


export class RatingService {
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
      .post<T>(GRAPHQL_ENDPOINT, {query: `mutation { ${mutation} }`});
  }

  async ratingBySourceTarget(sourceId: string, targetId: string)
    : Promise<number> {
    const res = await this.get<RatingsBySourceTarget>(`
        ratingBySourceTarget(sourceId: "${sourceId}", targetId: "${targetId}") {
          rating
        }
      `)
      .toPromise();
    if (!res.data.ratingBySourceTarget) {
      return 0;
    }

    return res.data.ratingBySourceTarget.rating;
  }

  async averageRatingForTarget(targetId: string, decimalPlaces = 2)
    : Promise<{rating: number, count: number}> {
    // We want to display rounded ratings to avoid horribly long ones.
    // These parameters are used to configure rounding.
    const BASE = 10;
    const ROUNDING_MULTIPLE = Math.pow(BASE, decimalPlaces);

    const res = await this
      .get<AverageRatingForTarget>(`
        averageRatingForTarget(targetId: "${targetId}") {
          rating,
          count
        }
      `)
      .toPromise();
    const averageRating = Math.round(
      res.data.averageRatingForTarget.rating * ROUNDING_MULTIPLE) /
        ROUNDING_MULTIPLE;

    return {
      rating: averageRating, count: res.data.averageRatingForTarget.count
    };
    }

  createSource(id: string): Observable<{id: string}> {
    return this.post(`createSource(id: "${id}") { id }`);
  }

  createTarget(id: string): Observable<{id: string}> {
    return this.post(`createTarget(id: "${id}") { id }`);
  }
}

@Injectable()
export class RatingServiceFactory {
  constructor(private gsf: GatewayServiceFactory) {}

  for(from: ElementRef): RatingService {
    return new RatingService(this.gsf.for(from));
  }
}
