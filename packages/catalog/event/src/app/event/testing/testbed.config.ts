import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../event.config';

import { metadata } from '../event.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
