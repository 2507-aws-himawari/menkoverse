import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface AuthStackProps extends cdk.StackProps {
  /**
   * Callback URL for OAuth
   * @default 'http://localhost:3000/api/auth/callback/cognito'
   */
  readonly callbackUrl?: string;
  /**
   * Domain prefix for Cognito hosted UI
   * @default 'menkoverse-dev'
   */
  readonly domainPrefix?: string;
  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  readonly environment?: string;
}

export class AuthStack extends cdk.Stack {
  /**
   * Cognito User Pool ID
   */
  public readonly userPoolId: string;
  
  /**
   * Cognito User Pool Client ID
   */
  public readonly userPoolClientId: string;
  
  /**
   * Cognito Identity Pool ID
   */
  public readonly identityPoolId: string;
  
  /**
   * Cognito Issuer URL for auth.js
   */
  public readonly cognitoIssuer: string;
  
  /**
   * Cognito User Pool Domain
   */
  public readonly userPoolDomain: string;
  
  /**
   * Cognito Hosted UI URL
   */
  public readonly hostedUiUrl: string;

  public constructor(scope: cdk.App, id: string, props: AuthStackProps = {}) {
    super(scope, id, props);

    const envName = props.environment ?? 'dev';
    const callbackUrl = props.callbackUrl ?? 'http://localhost:3000/api/auth/callback/cognito';
    const domainPrefix = props.domainPrefix ?? `menkoverse-${envName}`;

    // User Pool
    const userPool = new cognito.CfnUserPool(this, 'UserPool', {
      userPoolName: `MenkoverseUserPool-${envName}`,
      autoVerifiedAttributes: ['email'],
      aliasAttributes: ['email', 'preferred_username'],
      schema: [
        {
          name: 'email',
          attributeDataType: 'String',
          required: true,
          mutable: true,
        },
        {
          name: 'preferred_username',
          attributeDataType: 'String',
          required: false,
          mutable: true,
        },
      ],
      verificationMessageTemplate: {
        defaultEmailOption: 'CONFIRM_WITH_CODE',
        emailMessage: 'Your Menkoverse verification code is {####}',
        emailSubject: 'Verify your Menkoverse account',
      },
      emailConfiguration: {
        emailSendingAccount: 'COGNITO_DEFAULT',
      },
      policies: {
        passwordPolicy: {
          minimumLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false,
        },
      },
    });

    // User Pool Client
    const userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
      clientName: `MenkoverseUserPoolClient-${envName}`,
      userPoolId: userPool.ref,
      generateSecret: true,
      allowedOAuthFlows: ['code'],
      allowedOAuthScopes: ['email', 'openid', 'profile'],
      allowedOAuthFlowsUserPoolClient: true,
      callbackUrLs: [
        callbackUrl,
        `https://${domainPrefix}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
      ],
      supportedIdentityProviders: ['COGNITO'],
    });

    // Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: `MenkoverseIdentityPool-${envName}`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.ref,
          providerName: userPool.attrProviderName,
        },
      ],
    });

    // User Pool Domain
    const userPoolDomain = new cognito.CfnUserPoolDomain(this, 'UserPoolDomain', {
      domain: domainPrefix,
      userPoolId: userPool.ref,
    });
    userPoolDomain.addDependency(userPoolClient);

    // Cognito Authenticated Role
    const cognitoAuthenticatedRole = new iam.CfnRole(this, 'CognitoAuthenticatedRole', {
      roleName: `Cognito_MenkoverseAuth_Role_${envName}`,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                'cognito-identity.amazonaws.com:aud': identityPool.ref,
              },
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated',
              },
            },
          },
        ],
      },
      policies: [
        {
          policyName: 'CognitoAuthenticatedPolicy',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'mobileanalytics:PutEvents',
                  'cognito-sync:*',
                  'cognito-identity:*',
                ],
                Resource: '*',
              },
            ],
          },
        },
      ],
    });

    // Identity Pool Role Attachment
    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: cognitoAuthenticatedRole.attrArn,
      },
    });

    // CloudWatch Logs for Cognito monitoring
    new logs.LogGroup(this, 'CognitoLogsGroup', {
      logGroupName: `/aws/cognito/userpool/${envName}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Set public properties
    this.userPoolId = userPool.ref;
    this.userPoolClientId = userPoolClient.ref;
    this.identityPoolId = identityPool.ref;
    this.cognitoIssuer = `https://cognito-idp.${this.region}.amazonaws.com/${userPool.ref}`;
    this.userPoolDomain = userPoolDomain.ref;
    this.hostedUiUrl = `https://${domainPrefix}.auth.${this.region}.amazoncognito.com`;

    // Outputs
    new cdk.CfnOutput(this, 'CfnOutputUserPoolId', {
      key: 'UserPoolId',
      description: 'Cognito User Pool ID',
      exportName: `${this.stackName}-UserPoolId`,
      value: this.userPoolId,
    });

    new cdk.CfnOutput(this, 'CfnOutputUserPoolClientId', {
      key: 'UserPoolClientId',
      description: 'Cognito User Pool Client ID',
      exportName: `${this.stackName}-UserPoolClientId`,
      value: this.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'CfnOutputIdentityPoolId', {
      key: 'IdentityPoolId',
      description: 'Cognito Identity Pool ID',
      exportName: `${this.stackName}-IdentityPoolId`,
      value: this.identityPoolId,
    });

    new cdk.CfnOutput(this, 'CfnOutputCognitoIssuer', {
      key: 'CognitoIssuer',
      description: 'Cognito Issuer URL for auth.js',
      exportName: `${this.stackName}-CognitoIssuer`,
      value: this.cognitoIssuer,
    });

    new cdk.CfnOutput(this, 'CfnOutputUserPoolDomain', {
      key: 'UserPoolDomain',
      description: 'Cognito User Pool Domain',
      exportName: `${this.stackName}-UserPoolDomain`,
      value: this.userPoolDomain,
    });

    new cdk.CfnOutput(this, 'CfnOutputHostedUIUrl', {
      key: 'HostedUIUrl',
      description: 'Cognito Hosted UI URL',
      exportName: `${this.stackName}-HostedUIUrl`,
      value: this.hostedUiUrl,
    });
  }
}
