import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../property.config';

import { metadata } from '../property.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
