# Manual Approval Action

GitHub Issue を利用した手動承認フローを提供する Composite Action です。

## 使用方法

```yaml
- name: Manual Approval
  uses: ./.github/actions/manual-approval
  with:
    approvers: ${{ vars.DEPLOY_APPROVERS }}
    issue-title: "Deploy Approval - Run #${{ github.run_number }}"
    timeout-minutes: "60"
```

## Inputs

| 名前 | 必須 | デフォルト | 説明 |
|------|------|------------|------|
| `approvers` | Yes | - | 承認者のGitHubユーザー名（カンマ区切り） |
| `issue-title` | No | `Deploy Approval Required` | Issue のタイトル |
| `issue-body` | No | (自動生成) | Issue の本文 |
| `timeout-minutes` | No | `60` | タイムアウト時間（分） |
| `poll-interval-seconds` | No | `30` | ポーリング間隔（秒） |

## Outputs

| 名前 | 説明 |
|------|------|
| `issue-number` | 作成された Issue 番号 |
| `approved-by` | 承認したユーザー名 |
| `result` | `approved` / `denied` / `timeout` |

## 必要な権限

```yaml
permissions:
  issues: write
  contents: read
```

## 承認方法

作成された Issue に以下のいずれかをコメントしてください：

- **承認:** `approved`
- **拒否:** `denied`

※ 大文字小文字は区別しません（`Approved`, `APPROVED` なども有効）

## GitHub Variables 設定

リポジトリの Settings > Secrets and variables > Actions > Variables で設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `DEPLOY_APPROVERS` | 承認者リスト | `user1,user2` |
| `STG_SKIP_APPROVAL` | Staging承認スキップ | `true` / `false` |
