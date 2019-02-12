import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../label.config';

import { metadata } from '../label.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
