import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH, SUBSCRIPTIONS_PATH } from '../chat.config';

import { metadata } from '../chat.metadata';

const buildConfig = getConfigBuilder(
  API_PATH, metadata,
  [{ provide: SUBSCRIPTIONS_PATH, useValue: '/test-sub' }]);
const config = buildConfig(null, null, {});

export { config, buildConfig };
