import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../match.config';

import { metadata } from '../match.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
