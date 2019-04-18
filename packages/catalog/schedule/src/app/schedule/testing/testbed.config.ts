import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../schedule.config';

import { metadata } from '../schedule.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
