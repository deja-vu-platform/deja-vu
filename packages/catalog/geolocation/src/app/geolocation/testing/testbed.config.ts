import { RendererFactory2 } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule,
  MatIconModule, MatInputModule
} from '@angular/material';

import {
  ConfigService, DvModule, GatewayService, GatewayServiceFactory,
  USED_CLICHES_CONFIG
} from '@deja-vu/core';

import { AgmCoreModule } from '@agm/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { CreateMarkerComponent } from '../create-marker/create-marker.component';
import { DeleteMarkerComponent } from '../delete-marker/delete-marker.component';
import { DisplayMapComponent } from '../display-map/display-map.component';
import {
  GetCurrentLocationComponent
} from '../get-current-location/get-current-location.component';
import { ShowMarkerComponent } from '../show-marker/show-marker.component';
import { ShowMarkersComponent } from '../show-markers/show-markers.component';

import { API_PATH } from '../geolocation.config';

import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';


const allComponents = [
  CreateMarkerComponent,
  DeleteMarkerComponent,
  DisplayMapComponent,
  GetCurrentLocationComponent,
  ShowMarkerComponent,
  ShowMarkersComponent
];


class DummyGatewayServiceFactory  {
  for(_from): DummyGatewayService {
    return new DummyGatewayService();
  }
}

class DummyGatewayService {
  get<T>(path?: string, options?): Observable<T> {
    return Observable.of(null);
  }

  post<T>(_path?: string, _body?: string | Object, _options?): Observable<T> {
    return Observable.of(null);
  }
}

class DummyConfigService {
  getConfig(forNode) {
    return { mapType: 'leaflet' };
  }
}


const config = {
  imports: [
    DvModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    LeafletModule.forRoot(),
    AgmCoreModule.forRoot({
      apiKey: 'test-key'
    })
  ],
  providers: [
    { provide: API_PATH, useValue: '/test-api' },
    { provide: GatewayServiceFactory,
      useValue: new DummyGatewayServiceFactory() },
    { provide: USED_CLICHES_CONFIG, useValue: {} },
    { provide: ConfigService, useValue: new DummyConfigService() }
  ],
  declarations: allComponents,
  entryComponents: allComponents
};

export { config };
