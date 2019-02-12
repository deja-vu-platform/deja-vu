import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../group.config';

import { metadata } from '../group.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
