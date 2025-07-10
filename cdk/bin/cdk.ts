#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MenkoverseApp } from '../lib/menkoverse-app';

const app = new cdk.App();

// Environment detection
const environment = process.env.CDK_ENVIRONMENT || 'dev';
const isProduction = environment === 'prod';

new MenkoverseApp(app, `MenkoverseApp-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment: environment,
  callbackUrl: process.env.CALLBACK_URL || 
    (isProduction ? 'https://menkoverse.com/api/auth/callback/cognito' : 'http://localhost:3000/api/auth/callback/cognito'),
  domainPrefix: isProduction ? 'menkoverse' : `menkoverse-${environment}`,
  repositoryUrl: process.env.REPOSITORY_URL || 'https://github.com/2507-aws-himawari/menkoverse',
  branch: process.env.BRANCH || 'main',
  connectionArn: process.env.CONNECTION_ARN,
  databaseName: process.env.DATABASE_NAME || 'menkoverse',
  monthlyBudgetLimit: isProduction ? 200 : 50,
});