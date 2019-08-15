import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../property.config';

import { metadata } from '../property.metadata';

const testConfig = {
  schema: {
    title: 'Person',
    type: 'object',
    properties: {
        firstName: {
            type: 'string'
        }
    }
  }
};
const buildConfig = getConfigBuilder(API_PATH, metadata, []);
const config = buildConfig(null, null, testConfig);

export { config, buildConfig, testConfig };
