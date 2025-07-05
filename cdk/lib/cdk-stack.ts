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

  public constructor(scope: cdk.App, id: string, props: CdkStackProps = {}) {
    super(scope, id, props);

    // Applying default props
    props = {
      ...props,
      callbackUrl: props.callbackUrl ?? 'http://localhost:3000/api/auth/callback/cognito',
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
  }
}
