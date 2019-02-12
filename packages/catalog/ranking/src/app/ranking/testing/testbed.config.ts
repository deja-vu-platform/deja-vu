import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../ranking.config';

import { metadata } from '../ranking.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
