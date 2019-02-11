import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../scoring.config';

import { metadata } from '../scoring.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
