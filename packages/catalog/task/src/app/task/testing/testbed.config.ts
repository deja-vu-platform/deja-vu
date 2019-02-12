import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../task.config';

import { metadata } from '../task.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
