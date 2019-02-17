import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../comment.config';

import { metadata } from '../comment.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
