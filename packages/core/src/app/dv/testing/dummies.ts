import {
  ConfigService,
  ConfigServiceFactory,
  USED_CONCEPTS_CONFIG
} from '../config.service';
import { GatewayServiceFactory } from '../gateway.service';

import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';


export class DummyGatewayServiceFactory  {
  constructor(
    private readonly getResp,
    private readonly postResp) { }

  for(_from): DummyGatewayService {
    return new DummyGatewayService(this.getResp, this.postResp);
  }
}

export class DummyGatewayService {
  constructor(
    private readonly getResp,
    private readonly postResp) { }

  get(_path?: string, _options?) {
    return Observable.of(this.getResp);
  }

  post(_path?: string, _body?: string | Object, _options?) {
    return Observable.of(this.postResp);
  }
}

class DummyConfigServiceFactory {
  constructor(private readonly getConfigResp) { }

  createConfigService(): ConfigService {
    return { getConfig: () => this.getConfigResp };
  }
}

export function getConfigBuilder(
  apiPathToken, metadata, additionalProviders = []) {
  return (getResp, postResp, configResp) => ({
    ...metadata,
    providers: additionalProviders.concat([
      { provide: apiPathToken, useValue: '/test-api' },
      { provide: GatewayServiceFactory,
        useValue: new DummyGatewayServiceFactory(getResp, postResp) },
      { provide: USED_CONCEPTS_CONFIG, useValue: {} },
      { provide: ConfigServiceFactory,
        useValue: new DummyConfigServiceFactory(configResp) }
    ])
  });
}
