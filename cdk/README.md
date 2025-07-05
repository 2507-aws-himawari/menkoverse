# CDK
これは TypeScript で CDK 開発を行うための空のプロジェクトです。

`cdk.json` ファイルは、CDK Toolkit にアプリの実行方法を指示します。

## GUI setup
GUI での開発を行う場合は、以下の手順でセットアップを行います。任意。

1. 必要ライブラリをインストール（Python 3.x が必要）
```bash
pip install boto3 aws-sam-translator pyyaml
```

2. 拡張機能 `AWS Toolkit` をインストール
3. ターミナルで `codegen-mode` を実行
4. `sam-template.yaml` を右クリックし、`Open with Application Composer` を選択

## よく使うコマンド

* `npm run build`   TypeScript を JS にコンパイル
* `npm run watch`   変更を監視して自動コンパイル
* `npm run test`    jest ユニットテストを実行
* `npx cdk deploy`  このスタックをデフォルトの AWS アカウント/リージョンにデプロイ
* `npx cdk diff`    デプロイ済みスタックと現在の状態を比較
* `npx cdk synth`   合成された CloudFormation テンプレートを出力
