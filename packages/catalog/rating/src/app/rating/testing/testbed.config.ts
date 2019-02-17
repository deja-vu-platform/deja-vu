import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../rating.config';

import { metadata } from '../rating.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
