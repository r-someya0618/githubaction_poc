# Manual Approval Action 設計書

## 1. 概要

GitHub Actions ワークフロー内でデプロイ前に手動承認を要求するための Composite Action。
GitHub Issue を利用した承認フローを提供し、外部依存なしで承認プロセスを実現する。

## 2. 要件

| ID | 要件 | 詳細 |
|----|------|------|
| REQ-1 | 発火タイミング | Production および Staging へのリリース時に発火する |
| REQ-2 | 承認の有効/無効切り替え | GitHub Variables で簡単に設定可能 |
| REQ-3 | Issue ベースの承認 | Issue を作成し、コメントで承認/拒否を判定 |
| REQ-4 | 承認者の設定 | GitHub Variables で承認者を簡単に追加可能 |

## 3. システム構成

### 3.1 ファイル構成

```
.github/
├── actions/
│   └── manual-approval/
│       ├── action.yml      # Composite Action 本体
│       ├── DESIGN.md       # 本設計書
│       └── README.md       # 使用方法
├── workflows/
│   ├── production.yml      # 本番デプロイワークフロー
│   └── staging.yml         # ステージングデプロイワークフロー
```

### 3.2 GitHub Variables（リポジトリ設定）

| 変数名 | 型 | 必須 | 説明 | 例 |
|--------|-----|------|------|-----|
| `DEPLOY_APPROVERS` | string | Yes | 承認者のGitHubユーザー名（カンマ区切り） | `user1,user2` |
| `STG_SKIP_APPROVAL` | string | No | Staging承認をスキップするか | `true` / `false` |

### 3.3 承認の有効/無効ルール

**基本方針:** デフォルトは承認必須。STGで `STG_SKIP_APPROVAL=true` のときのみスキップ可能。

| 環境 | 条件 | 結果 |
|------|------|------|
| Production | - | 常に承認必須 |
| Staging | `STG_SKIP_APPROVAL=true` | 承認スキップ |
| Staging | `STG_SKIP_APPROVAL=false` | 承認必須 |
| Staging | 未設定 | 承認必須（デフォルト） |

## 4. 処理フロー

### 4.1 承認・拒否判定ロジック

1. コメント取得
2. 承認者リストに含まれるユーザーのコメントのみ対象
3. コメント本文を小文字に変換（大文字小文字を区別しない）
4. 判定:
   - `approved` を含む → 承認（成功）
   - `denied` を含む → 拒否（失敗）
   - それ以外 → 継続監視

## 5. インターフェース設計

### 5.1 Inputs

| 名前 | 必須 | デフォルト | 説明 |
|------|------|------------|------|
| `approvers` | Yes | - | 承認者のGitHubユーザー名（カンマ区切り） |
| `issue-title` | No | `Deploy Approval Required` | Issue のタイトル |
| `issue-body` | No | (自動生成) | Issue の本文 |
| `timeout-minutes` | No | `60` | タイムアウト時間（分） |
| `poll-interval-seconds` | No | `30` | ポーリング間隔（秒） |

### 5.2 Outputs

| 名前 | 説明 |
|------|------|
| `issue-number` | 作成された Issue 番号 |
| `approved-by` | 承認したユーザー名 |
| `result` | `approved` / `denied` / `timeout` |

## 6. エラーハンドリング

| エラー条件 | 挙動 | 終了コード |
|------------|------|------------|
| 承認者が未指定 | エラーメッセージを出力して失敗 | 1 |
| Issue 作成失敗 | エラーメッセージを出力して失敗 | 1 |
| タイムアウト | Issue をクローズして失敗 | 1 |
| 拒否コメント | Issue をクローズして失敗 | 1 |

## 7. セキュリティ考慮事項

1. **承認者の検証**: 指定された承認者以外のコメントは無視する
2. **GITHUB_TOKEN の権限**: `issues: write` のみ必要
3. **機密情報**: Issue 本文に機密情報を含めない

## 8. 制限事項

1. GitHub Actions のジョブタイムアウト（デフォルト6時間）を超えることはできない
2. 同時に複数の承認待ちがある場合、別々の Issue が作成される
3. チーム（Organization Teams）での承認者指定は非対応（個人ユーザー名のみ）
