import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../follow.config';

import { metadata } from '../follow.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
