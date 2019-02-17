import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../geolocation.config';

import { metadata } from '../geolocation.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
