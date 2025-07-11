# CDK
CloudFormation を使用してデプロイを行うためのリポジトリ

## How to deploy 
1. `aws sso login --profile himawari` で認証しておく
2. ここ `/cdk` に cd する
3. `cdk list` でデプロイ対象の Stack を確認する
   - frontend サーバーの変更の場合は `Menkoverse-dev-App` です
4. `cdk deploy --profile himawari <StackName>` する
5. 問題なくデプロイが進めば成功！

## よく使うコマンド

* `npm run build`   TypeScript を JS にコンパイル
* `npm run watch`   変更を監視して自動コンパイル
* `npm run test`    jest ユニットテストを実行
* `npx cdk deploy`  このスタックをデフォルトの AWS アカウント/リージョンにデプロイ
* `npx cdk diff`    デプロイ済みスタックと現在の状態を比較
* `npx cdk synth`   合成された CloudFormation テンプレートを出力
