import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../authentication.config';
import { AuthenticationService } from '../shared/authentication.service';

import { metadata } from '../authentication.metadata';

const buildConfig = getConfigBuilder(
  API_PATH, metadata, [ AuthenticationService ]);
const config = buildConfig(null, null, {});

export { config, buildConfig };
