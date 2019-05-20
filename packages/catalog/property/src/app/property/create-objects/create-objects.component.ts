import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { PropertiesRes, Property } from '../shared/property.model';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';


const SAVED_MSG_TIMEOUT = 3000;

/**
 * Create objects in bulk
 * This action does not display anything.
 * The data for the objects must come from another action.
 * The action's execution must be triggered by another action (in a transaction)
 */
@Component({
  selector: 'property-create-objects',
  templateUrl: './create-objects.component.html',
  styleUrls: ['./create-objects.component.css']
})
export class CreateObjectsComponent implements OnInit, OnExec {
  /**
   * List of objects to save to the database as new entities
   */
  @Input() objects: any[];

  private gs: GatewayService;
  private properties: string[];

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadSchema();
  }

  loadSchema() {
    if (!this.gs) {
      return;
    }
    this.gs
      .get<PropertiesRes>(this.apiPath, {
        params: {
          extraInfo: {
            action: 'schema',
            returnFields: 'name'
          }
        }
      })
      .pipe(map((res: PropertiesRes) => res.data.properties))
      .subscribe((properties: Property[]) => {
        this.properties = _.map(properties, 'name');
      });
  }

  async dvOnExec(): Promise<void> {
    if (_.isEmpty(this.objects)) {
      return;
    }
    const res = await this.gs
      .post<{data: any, errors: {message: string}[]}>(this.apiPath, {
        inputs: {
          input: _.map(this.objects, this.objectToCreateObjectInput.bind(this))
        },
        extraInfo: {
          action: 'create',
          returnFields: 'id'
        }
      })
      .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  objectToCreateObjectInput(obj: any) {
    return _.pick(obj, ['id', ...this.properties]);
  }
}
