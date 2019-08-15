import { getConfigBuilder } from '@deja-vu/core';

import { RouterTestingModule } from '@angular/router/testing';

import { API_PATH } from '../scoring.config';

import { metadata } from '../scoring.metadata';

import * as _ from 'lodash';


const testMetadata = _.clone(metadata);
testMetadata.imports.push(RouterTestingModule);
const buildConfig = getConfigBuilder(API_PATH, metadata);
const config = buildConfig(null, null, {});

export { config, buildConfig };
