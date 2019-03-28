import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../authentication.config';

import { metadata } from '../authentication.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
