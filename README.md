# GitHub Actions Approval Flow with Vercel Deployment

このプロジェクトは、GitHub Actionsで承認フローを含むビルド・デプロイのサンプル実装です。

## 概要

- **ビルド**: コードのプッシュ時に自動的にビルドとテストを実行
- **承認フロー**: 本番環境へのデプロイ前に手動承認が必要
- **デプロイ**: Vercelへの自動デプロイ

## ワークフローの流れ

### Pull Request時
1. ビルドとテストの実行
2. Vercelのプレビュー環境へ自動デプロイ
3. PRコメントにプレビューURLを表示

### mainブランチへのマージ時
1. ビルドとテストの実行
2. **手動承認待ち** (GitHub Environmentの承認機能)
3. 承認後、Vercel本番環境へデプロイ

## セットアップ

### 1. 必要なシークレットの設定

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定:

- `VERCEL_TOKEN`: Vercelのアクセストークン
- `VERCEL_ORG_ID`: VercelのOrganization ID
- `VERCEL_PROJECT_ID`: VercelのProject ID

### 2. GitHub Environment の設定

1. Settings > Environments で "production" 環境を作成
2. "Required reviewers" を有効化
3. 承認者を指定（最大6人まで）
4. オプション: Wait timer を設定（承認までの待機時間）

### 3. Vercelプロジェクトの作成

```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトをリンク
vercel link

# 初回デプロイ
vercel --prod
```

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テスト
npm test
```

## ワークフローのカスタマイズ

### 承認者の変更

`.github/workflows/deploy-with-approval.yml` の `environment: production` セクションで、
GitHub Environmentの設定を参照しています。承認者はGitHub UIから変更してください。

### 承認をスキップする場合

特定の条件で承認をスキップしたい場合は、ワークフローファイルの `if` 条件を調整:

```yaml
approve-deployment:
  if: github.ref == 'refs/heads/main' && !contains(github.event.head_commit.message, '[skip-approval]')
```

### 通知の追加

Slackなどへの通知を追加する場合:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## トラブルシューティング

### 承認が表示されない
- GitHub Environmentが正しく設定されているか確認
- リポジトリの Settings > Environments で production 環境が存在するか確認

### Vercelデプロイが失敗する
- シークレットが正しく設定されているか確認
- Vercelプロジェクトが存在するか確認
- `vercel.json` の設定を確認

## 参考リンク

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Vercel GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [GitHub Actions Approval](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments)