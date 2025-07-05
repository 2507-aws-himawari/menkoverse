import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface CdkStackProps extends cdk.StackProps {
}

export class CdkStack extends cdk.Stack {
  public constructor(scope: cdk.App, id: string, props: CdkStackProps = {}) {
    super(scope, id, props);

    // Resources
    const dummyParameter = new ssm.CfnParameter(this, 'DummyParameter', {
      name: '/dummy/placeholder',
      value: 'placeholder',
      type: 'String',
    });
  }
}
