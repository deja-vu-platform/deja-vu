import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../transfer.config';

import { metadata } from '../transfer.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
