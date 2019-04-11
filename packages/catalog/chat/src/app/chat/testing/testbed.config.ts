import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../chat.config';

import { metadata } from '../chat.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
