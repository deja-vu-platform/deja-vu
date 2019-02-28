import { getConfigBuilder } from '@deja-vu/core';

import { API_PATH } from '../<%= dasherize(clicheName) %>.config';

import { metadata } from '../<%= dasherize(clicheName) %>.metadata';

const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
