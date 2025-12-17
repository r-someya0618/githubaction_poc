# GitHub Actions ワークフロー分析レポート

## 概要

本番デプロイワークフローにおける `trstringer/manual-approval` Action の使用に関する分析結果です。

---

## 現状の評価

### 良い点 ✅

- **全て `ubuntu-latest`（Linux）を使用** → 乗数1倍でコスパ最適（詳細は後述）
- Slack 通知で承認者に気づきやすい設計
- Issue に詳細情報（リポジトリ、ブランチ、コミット、実行者）が含まれている
- 承認方法が Issue 本文に明記されている

### 問題点 ⚠️

- **タイムアウトが設定されていない**
- `approve-deployment` ジョブが最大 **6時間** 待機する可能性がある
- 放置された場合、大量の分数を消費するリスクがある

---

## ランナーの選択について

### 推奨: 承認待ちは Linux ランナーで

承認待ちのジョブは **必ず `ubuntu-latest`（Linux）** を使用してください。

理由：
- 待機中もランナーは稼働し続け、分数を消費する
- Linux は乗数1倍で最もコストが低い
- 承認待ちに OS 依存の処理はない

```yaml
approve-deployment:
  runs-on: ubuntu-latest  # ← 承認待ちは必ず Linux
```

### ランナー別のコスト比較（30分待機した場合）

| ランナー | 乗数 | 消費分数 | 月4回の消費 |
|---------|------|---------|------------|
| `ubuntu-latest` | 1倍 | 30分 | 120分 |
| `windows-latest` | 2倍 | 60分 | 240分 |
| `macos-latest` | 10倍 | 300分 | 1,200分 |

**macOS で承認待ちをすると、Linux の10倍のコストがかかります。**

### ビルド・デプロイジョブのランナー選択

承認待ち以外のジョブは、必要に応じて適切なランナーを選択してください：

- **iOS/macOS アプリのビルド** → `macos-latest`
- **Windows アプリのビルド** → `windows-latest`
- **Web アプリ、Docker、一般的な CI/CD** → `ubuntu-latest`

---

## コスト試算

### GitHub Actions の料金体系（Team プラン）

| 項目 | 内容 |
|------|------|
| 無料枠 | 3,000分/月 |
| Linux ランナー | 1倍（$0.008/分） |
| Windows ランナー | 2倍（$0.016/分） |
| macOS ランナー | 10倍（$0.08/分） |

### 承認待ち時間によるコスト変動

| シナリオ | 消費分数 | 備考 |
|---------|---------|------|
| 5分で承認 | 約5分 | 理想的 |
| 30分で承認 | 約30分 | 現実的 |
| 1時間で承認 | 約60分 | やや遅い |
| 忘れて放置（6時間上限） | **360分** | 危険 |

### 月間コスト試算（週1デプロイ、タイムアウト30分設定後）

| ジョブ | 想定時間 | 月4回の消費 |
|-------|---------|------------|
| build | 約3分 | 12分 |
| notify-approval-required | 約1分 | 4分 |
| approve-deployment | 最大30分 | 最大120分 |
| deploy-production | 約2分 | 8分 |
| **合計** | | **最大144分** |

**結論**: 無料枠 3,000分の約5% → 問題なし

---

## 推奨される修正

### 1. タイムアウトの追加（必須）

```yaml
approve-deployment:
  needs: build
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  timeout-minutes: 30  # ← ジョブレベルで追加

  steps:
    - name: Wait for manual approval
      uses: trstringer/manual-approval@v1
      timeout-minutes: 30  # ← ステップレベルでも設定可能
      with:
        secret: ${{ github.TOKEN }}
        approvers: ${{ env.APPROVERS }}
        minimum-approvals: 1
        issue-title: "🚀 本番デプロイ承認リクエスト - Run #${{ github.run_number }}"
        issue-body: |
          ## デプロイ承認が必要です
          # ... 以下同じ
```

### 2. ジョブの依存関係の改善（任意）

現状では `notify-approval-required` と `approve-deployment` が並列実行されるため、通知より先に Issue が作成される可能性があります。

```yaml
notify-approval-required:
  needs: build
  # ...

approve-deployment:
  needs: notify-approval-required  # ← build から変更
  # ...
```

これにより、Slack 通知 → Issue 作成の順序が保証されます。

---

## 修正後の完全なワークフロー

```yaml
name: Build and Deploy with Approval

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  APPROVERS: ${{ vars.APPROVERS || 'admin' }}

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

  deploy-preview:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true

  notify-approval-required:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Notify Slack - Approval Required
        uses: slackapi/slack-github-action@v1.25.0
        with:
          payload: |
            {
              "text": "🚀 デプロイ承認が必要です",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "🚀 本番デプロイの承認待ち"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*リポジトリ:*\n${{ github.repository }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*ブランチ:*\n${{ github.ref_name }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*コミット:*\n${{ github.event.head_commit.message }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*実行者:*\n${{ github.actor }}"
                    }
                  ]
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "承認ページを開く"
                      },
                      "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK

  approve-deployment:
    needs: notify-approval-required  # ← 修正: 通知後に承認待ち
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    timeout-minutes: 30  # ← 追加: タイムアウト設定

    steps:
      - name: Wait for manual approval
        uses: trstringer/manual-approval@v1
        timeout-minutes: 30  # ← 追加: ステップレベルでも設定
        with:
          secret: ${{ github.TOKEN }}
          approvers: ${{ env.APPROVERS }}
          minimum-approvals: 1
          issue-title: "🚀 本番デプロイ承認リクエスト - Run #${{ github.run_number }}"
          issue-body: |
            ## デプロイ承認が必要です

            | 項目 | 内容 |
            |------|------|
            | **リポジトリ** | ${{ github.repository }} |
            | **ブランチ** | ${{ github.ref_name }} |
            | **コミット** | ${{ github.sha }} |
            | **実行者** | @${{ github.actor }} |
            | **ワークフロー** | [Run #${{ github.run_number }}](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}) |

            ---

            ### 承認方法
            このIssueに以下のいずれかをコメントしてください:
            - ✅ 承認: `approve`, `approved`, `lgtm`, `yes`
            - ❌ 却下: `deny`, `denied`, `no`

            ### タイムアウト
            ⏰ **30分以内** に承認されない場合、ワークフローは自動的にキャンセルされます。
          exclude-workflow-initiator-as-approver: false

  deploy-production:
    needs: approve-deployment
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          github-comment: false

      - name: Send deployment notification
        run: |
          echo "✅ Production deployment completed successfully"
          echo "URL: https://your-domain.com"
```

---

## まとめ

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| ランナー選択 | ✅ 最適（Linux） | ✅ 最適（Linux） |
| タイムアウト | ❌ 未設定（6時間リスク） | ✅ 30分で自動キャンセル |
| 通知順序 | ⚠️ 並列実行 | ✅ 通知 → 承認の順序保証 |
| 月間コスト | 最大1,440分（放置時） | 最大144分 |
| 無料枠消費 | 最大48% | 約5% |

---

## 参考情報

### trstringer/manual-approval Action

- GitHub: https://github.com/trstringer/manual-approval
- Marketplace: https://github.com/marketplace/actions/manual-workflow-approval
- スター数: 613（2025年時点）
- 承認キーワード: `approve`, `approved`, `lgtm`, `yes`
- 却下キーワード: `deny`, `denied`, `no`

### GitHub Actions 制限事項

| 制限 | 値 |
|------|-----|
| ジョブの最大実行時間 | 6時間 |
| ワークフローの最大実行時間 | 35日 |
| GitHub App トークン有効期限 | 60分 |