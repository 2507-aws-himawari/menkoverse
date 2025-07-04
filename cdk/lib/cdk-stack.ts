import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface MyStackProps extends cdk.StackProps {
}

export class MyStack extends cdk.Stack {
  public constructor(scope: cdk.App, id: string, props: MyStackProps = {}) {
    super(scope, id, props);

    // Resources
    const dummyParameter = new ssm.CfnParameter(this, 'DummyParameter', {
      name: '/dummy/placeholder',
      value: 'placeholder',
      type: 'String',
    });
  }
}
