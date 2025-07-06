import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface CdkStackProps extends cdk.StackProps {
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
}

export class CdkStack extends cdk.Stack {
  /**
   * Cognito User Pool ID
   */
  public readonly userPoolId;
  /**
   * Cognito User Pool Client ID
   */
  public readonly userPoolClientId;
  /**
   * Cognito Identity Pool ID
   */
  public readonly identityPoolId;
  /**
   * Cognito Issuer URL for auth.js
   */
  public readonly cognitoIssuer;
  /**
   * Cognito User Pool Domain
   */
  public readonly userPoolDomain;
  /**
   * Cognito Hosted UI URL
   */
  public readonly hostedUiUrl;

  public constructor(scope: cdk.App, id: string, props: CdkStackProps = {}) {
    super(scope, id, props);

    // Applying default props
    props = {
      ...props,
      callbackUrl: props.callbackUrl ?? 'http://localhost:3000/api/auth/callback/cognito',
      domainPrefix: props.domainPrefix ?? 'menkoverse-dev',
    };

    // Resources
    const dummyParameter = new ssm.CfnParameter(this, 'DummyParameter', {
      name: '/dummy/placeholder',
      value: 'placeholder',
      type: 'String',
    });

    const userPool = new cognito.CfnUserPool(this, 'UserPool', {
      userPoolName: 'MenkoverseUserPool',
      autoVerifiedAttributes: [
        'email',
      ],
      usernameAttributes: [
        'email',
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

    const userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
      clientName: 'MenkoverseUserPoolClient',
      userPoolId: userPool.ref,
      generateSecret: true,
      allowedOAuthFlows: [
        'code',
      ],
      allowedOAuthScopes: [
        'email',
        'openid',
        'profile',
      ],
      allowedOAuthFlowsUserPoolClient: true,
      callbackUrLs: [
        props.callbackUrl!,
        `https://${props.domainPrefix!}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
      ],
      supportedIdentityProviders: [
        'COGNITO',
      ],
    });

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: 'MenkoverseIdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.ref,
          providerName: userPool.attrProviderName,
        },
      ],
    });

    const userPoolDomain = new cognito.CfnUserPoolDomain(this, 'UserPoolDomain', {
      domain: props.domainPrefix!,
      userPoolId: userPool.ref,
    });
    userPoolDomain.addDependency(userPoolClient);

    const cognitoAuthenticatedRole = new iam.CfnRole(this, 'CognitoAuthenticatedRole', {
      roleName: 'Cognito_MenkoverseAuth_Role',
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

    const identityPoolRoleAttachment = new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: cognitoAuthenticatedRole.attrArn,
      },
    });

    // Outputs
    this.userPoolId = userPool.ref;
    new cdk.CfnOutput(this, 'CfnOutputUserPoolId', {
      key: 'UserPoolId',
      description: 'Cognito User Pool ID',
      exportName: `${this.stackName}-UserPoolId`,
      value: this.userPoolId!.toString(),
    });
    this.userPoolClientId = userPoolClient.ref;
    new cdk.CfnOutput(this, 'CfnOutputUserPoolClientId', {
      key: 'UserPoolClientId',
      description: 'Cognito User Pool Client ID',
      exportName: `${this.stackName}-UserPoolClientId`,
      value: this.userPoolClientId!.toString(),
    });
    this.identityPoolId = identityPool.ref;
    new cdk.CfnOutput(this, 'CfnOutputIdentityPoolId', {
      key: 'IdentityPoolId',
      description: 'Cognito Identity Pool ID',
      exportName: `${this.stackName}-IdentityPoolId`,
      value: this.identityPoolId!.toString(),
    });
    this.cognitoIssuer = `https://cognito-idp.${this.region}.amazonaws.com/${userPool.ref}`;
    new cdk.CfnOutput(this, 'CfnOutputCognitoIssuer', {
      key: 'CognitoIssuer',
      description: 'Cognito Issuer URL for auth.js',
      exportName: `${this.stackName}-CognitoIssuer`,
      value: this.cognitoIssuer!.toString(),
    });
    this.userPoolDomain = userPoolDomain.ref;
    new cdk.CfnOutput(this, 'CfnOutputUserPoolDomain', {
      key: 'UserPoolDomain',
      description: 'Cognito User Pool Domain',
      exportName: `${this.stackName}-UserPoolDomain`,
      value: this.userPoolDomain!.toString(),
    });
    this.hostedUiUrl = `https://${props.domainPrefix!}.auth.${this.region}.amazoncognito.com`;
    new cdk.CfnOutput(this, 'CfnOutputHostedUIUrl', {
      key: 'HostedUIUrl',
      description: 'Cognito Hosted UI URL',
      exportName: `${this.stackName}-HostedUIUrl`,
      value: this.hostedUiUrl!.toString(),
    });
  }
}
