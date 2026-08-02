---
name: release
description: investee拡張の本番リリース準備を実行する。本番APIの事前確認→package.jsonのバージョンアップ→クリーン検証・本番ビルド→Chrome Web Store申請用zip作成まで。ストアへのアップロードなど人間の作業には踏み込まない（docs/release.md参照）。
---

# リリース準備（エージェント実行部分）

[docs/release.md](../../../docs/release.md) のうちエージェントが実行できる部分を自動化する。
各ステップで失敗したら**そこで中断してユーザーに報告する**（先に進まない）。

## 1. 前提確認

1. 本番 API が拡張のクエリに応答すること:

   ```bash
   curl -s -X POST https://investee.info/api/graphql -H 'Content-Type: application/json' --data '{"query":"{ financialReports(limit: 1, offset: 0) { stockCode companyName } }"}'
   ```

   `errors` が返る・応答がない場合はバックエンド未デプロイ。**必ず中断**する
   （順序の大原則: バックエンドのデプロイが先。拡張を先に公開すると表示が壊れる）

2. working tree がクリーンで、main が origin/main と一致していること（`git fetch` して確認）

## 2. バージョンアップ

- 上げ幅をユーザーに確認する: 機能追加・画面変更 = minor / 不具合修正のみ = patch
- `package.json` の `version` のみ変更する（manifest には自動反映される）

## 3. 検証と本番ビルド

```bash
yarn install --frozen-lockfile
```

```bash
yarn lint
```

```bash
yarn test
```

```bash
yarn build
```

ビルド後に確認すること:

- `dist/manifest.json` の `name` に `[Dev]` が**付いていない**
- `dist/manifest.json` の `version` が更新後の値
- `host_permissions` が `https://investee.info/*` のみ（localhost が入っていない）

## 4. 申請用 zip の作成

`manifest.json` が zip のルートに来るように作る:

```bash
cd dist && zip -r ../investee-$(node -p "require('../package.json').version").zip . && cd ..
```

zip はコミットしない（gitignore 対象外のためリポジトリ直下に置いたままで良いが、`git status` に出ないことを確認する）。

## 5. バージョンアップの反映

- バージョンアップのコミットを作り、PR 経由で main へ（コミットメッセージは `change:` プレフィックスの英語 1 行）
- コミットするのは `package.json`（と lockfile が変わった場合のみ `yarn.lock`）
- PR のマージはユーザーに依頼し、マージされるまでタグ作成には進まない

## 6. タグと GitHub Release の作成（PR マージ後）

バージョンアップ PR が main にマージされたことを確認してから実行する。
**命名は既存の慣例に従う: タグ名・Release 名ともバージョン番号そのまま（例: `1.0.2`。`v` プレフィックスなし）。本文は空。**

```bash
git fetch origin && git tag <version> origin/main && git push origin <version>
```

```bash
gh release create <version> --title <version> --notes ""
```

## 7. 完了報告

以下をユーザーに伝えて終了する:

- 作成した zip のパスとバージョン
- 作成したタグと GitHub Release
- 残りは人間の作業であること: 実機確認チェックリスト → Chrome Web Store デベロッパーダッシュボードへアップロード → 審査提出（手順は [docs/release.md](../../../docs/release.md)）
