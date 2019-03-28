import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../passkey.config';

import { metadata } from '../passkey.metadata';


const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
