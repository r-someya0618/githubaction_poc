# セットアップ手順書

## 1. ローカル環境の準備

### 依存関係のインストール
```bash
# package.jsonの依存関係をインストール
npm install

# Vercel CLIをグローバルインストール
npm install -g vercel
```

## 2. Gitリポジトリの初期化

```bash
# Gitリポジトリを初期化
git init

# 初回コミット
git add .
git commit -m "Initial commit: GitHub Actions approval workflow with Vercel"
```

## 3. GitHubリポジトリの作成

### GitHub CLIを使う場合:
```bash
# GitHub CLIでリポジトリ作成（public/privateを選択）
gh repo create nextjs-approval-deploy --public --source=. --remote=origin --push
```

### ブラウザで作成する場合:
1. [GitHub](https://github.com/new)で新規リポジトリ作成
2. リポジトリ名: `nextjs-approval-deploy`（任意）
3. **重要**: READMEは追加しない（既にあるため）
4. 作成後、以下のコマンドを実行:

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/YOUR_USERNAME/nextjs-approval-deploy.git

# mainブランチにpush
git branch -M main
git push -u origin main
```

## 4. Vercelプロジェクトのセットアップ

```bash
# Vercelにログイン
vercel login

# プロジェクトをセットアップ（対話形式）
vercel link

# 以下の質問に答える:
# ? Set up "~/nextjs-approval-deploy"? [Y/n] → Y
# ? Which scope should contain your project? → あなたのアカウントを選択
# ? Link to existing project? [Y/n] → n
# ? What's your project's name? → nextjs-approval-deploy
# ? In which directory is your code located? → ./

# 成功すると.vercel/フォルダが作成される
```

### 必要な情報を取得:
```bash
# Organization IDを確認
vercel whoami
# 出力例: > octocat (Team ID: team_xxxxxxxxxxxxx)

# Project IDを確認
cat .vercel/project.json
# 出力例: {"projectId":"prj_xxxxxxxxxxxxx","orgId":"team_xxxxxxxxxxxxx"}
```

## 5. GitHub Secretsの設定

### Vercel Tokenの取得:
1. [Vercel Tokens](https://vercel.com/account/tokens)にアクセス
2. "Create Token"をクリック
3. Token Name: `GitHub Actions`
4. Scope: `Full Account`
5. "Create"をクリックしてトークンをコピー

### GitHub Secretsに登録:
1. GitHubリポジトリページを開く
2. Settings → Secrets and variables → Actions
3. "New repository secret"で以下を追加:

| Secret Name | Value |
|------------|-------|
| VERCEL_TOKEN | （Vercelで取得したトークン） |
| VERCEL_ORG_ID | team_xxxxxxxxxxxxx（vercel whoamiで確認） |
| VERCEL_PROJECT_ID | prj_xxxxxxxxxxxxx（.vercel/project.jsonで確認） |

## 6. GitHub Environment設定（承認フロー）

1. Settings → Environments
2. "New environment"をクリック
3. Name: `production`と入力して"Configure environment"
4. **Required reviewers**をチェック
5. 承認者を追加（自分以外のユーザー、または別のGitHubアカウント）
6. "Save protection rules"をクリック

**注意**: 自分自身は承認者になれないため、以下のいずれかが必要:
- 他のチームメンバーを承認者に設定
- テスト用の別GitHubアカウントを作成
- または承認フローをスキップ（後述）

## 7. 動作確認

### プレビューデプロイのテスト（PR）:
```bash
# featureブランチを作成
git checkout -b feature/test-deployment

# 小さな変更を加える
echo "// Test comment" >> app/page.tsx

# コミット＆プッシュ
git add .
git commit -m "Test: Add test comment"
git push origin feature/test-deployment
```

GitHubでPRを作成 → Actionsタブでビルドとプレビューデプロイを確認

### 本番デプロイのテスト（承認フロー）:
```bash
# mainブランチに戻る
git checkout main

# PRをマージまたは直接push
git merge feature/test-deployment
git push origin main
```

1. Actionsタブを開く
2. ワークフローが"Waiting"状態になる
3. "Review deployments"をクリック
4. 承認者がApproveする
5. 本番環境へデプロイ開始

## 8. 承認フローをスキップする場合

個人プロジェクトで承認が不要な場合、`.github/workflows/deploy-with-approval.yml`を編集:

```yaml
# approve-deploymentジョブを削除または条件を追加
approve-deployment:
  needs: build
  runs-on: ubuntu-latest
  if: false  # 承認を無効化
  # ...

deploy-production:
  needs: build  # approve-deploymentの代わりにbuildに依存
  # ...
```

## トラブルシューティング

### Vercel接続エラー
```bash
# Vercelから一度ログアウトして再ログイン
vercel logout
vercel login
```

### GitHub Actions実行エラー
- Secretsが正しく設定されているか確認
- Actionsタブのエラーログを確認

### 承認が表示されない
- Environmentが"production"という名前で作成されているか確認
- Required reviewersが設定されているか確認

## 完了チェックリスト

- [ ] npm installが成功
- [ ] git initとinitial commit完了
- [ ] GitHubリポジトリ作成とpush完了
- [ ] Vercel linkが成功
- [ ] GitHub Secrets 3つ設定完了
- [ ] GitHub Environment設定完了
- [ ] PRでプレビューデプロイ成功
- [ ] mainブランチで承認フロー動作確認