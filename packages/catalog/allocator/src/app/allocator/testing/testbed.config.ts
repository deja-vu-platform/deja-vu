import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../allocator.config';

import { metadata } from '../allocator.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
