# GitHub Secretsの設定手順

## 1. Vercelの情報を取得

### Vercel Token
1. [Vercel Dashboard](https://vercel.com/account/tokens)にアクセス
2. "Create Token"をクリック
3. トークン名を入力（例: "GitHub Actions"）
4. スコープは"Full Account"を選択
5. 生成されたトークンをコピー

### Organization IDとProject ID
```bash
# Vercel CLIをインストール
npm i -g vercel

# ログイン
vercel login

# Organization ID確認
vercel whoami
# → "orgId: team_xxxxxxxxxxxxx" の値をメモ

# プロジェクトをリンク（新規作成または既存選択）
vercel link
# → ".vercel/project.json" が作成される

# Project ID確認
cat .vercel/project.json
# → "projectId: prj_xxxxxxxxxxxxx" の値をメモ
```

## 2. GitHub Secretsに登録

1. GitHubリポジトリを開く
2. **Settings** タブをクリック
3. 左メニューから **Secrets and variables** > **Actions** を選択
4. **New repository secret** ボタンをクリック
5. 以下の3つのシークレットを作成:

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | Vercelで取得したトークン |
| `VERCEL_ORG_ID` | team_で始まるOrganization ID |
| `VERCEL_PROJECT_ID` | prj_で始まるProject ID |

## 3. GitHub Environment設定（承認フロー用）

1. **Settings** > **Environments** を選択
2. **New environment** をクリック
3. 名前に `production` と入力して作成
4. **Configure environment** をクリック
5. **Required reviewers** にチェック
6. 承認者のGitHubユーザー名を入力（最大6人）
7. オプション設定:
   - **Wait timer**: デプロイ前の待機時間（0-43200分）
   - **Deployment branches**: mainブランチのみに制限可能

## 4. 動作確認

### テスト方法
```bash
# テスト用ブランチを作成
git checkout -b test-deployment

# 変更をコミット
git add .
git commit -m "Test deployment workflow"

# PRを作成
git push origin test-deployment
```

GitHubでPRを作成すると:
1. ビルドが自動実行される
2. プレビュー環境にデプロイされる
3. PRコメントにプレビューURLが表示される

PRをマージすると:
1. ビルドが実行される
2. **Actions**タブに承認待ちが表示される
3. 承認者が"Review deployments"をクリックして承認
4. 本番環境へデプロイされる

## トラブルシューティング

### "Error: Missing required environment variables"
→ GitHub Secretsが正しく設定されているか確認

### 承認ボタンが表示されない
→ Environment設定で自分以外を承認者に指定する（自分は承認できない）

### Vercelデプロイエラー
→ Vercelプロジェクトが存在するか、トークンの権限を確認