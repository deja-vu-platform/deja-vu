import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../passkey.config';

import { metadata } from '../passkey.metadata';

import { PasskeyService } from '../shared/passkey.service';


const buildConfig = getConfigBuilder(
  API_PATH, metadata, [ PasskeyService ]);
const config = buildConfig(null, null, {});

export { config, buildConfig };
