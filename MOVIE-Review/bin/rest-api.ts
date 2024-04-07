#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EwdAppStack } from '../lib/ewd-app-stack';
import { AuthAppStack } from '../lib/auth-app-stack';

const app = new cdk.App();
new EwdAppStack(app, 'EwdAppStack');
new AuthAppStack(app, 'AuthAppStack');