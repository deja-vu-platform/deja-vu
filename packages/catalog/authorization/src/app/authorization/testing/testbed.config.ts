import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../authorization.config';

import { metadata } from '../authorization.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
