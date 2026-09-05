# リリース手順（本番反映）

拡張の新バージョンを Chrome Web Store に公開するまでの手順。

## 順序の大原則

**バックエンド（investee.info の API）のデプロイが先、拡張の公開が後。**

拡張はビルド時点のクエリを本番 API に投げるため、API 側に存在しないクエリ・フィールドを使う拡張を先に公開すると、公開済み拡張の表示が壊れる。逆順は不可。

## エージェントで実行する部分

[agent-plugins](https://github.com/shin4488/agent-plugins) の共通 `release` skillを使う。この文書には拡張固有のコマンドと規約を置く。以下の前提や検証が失敗したら、次の工程に進まず理由を報告する。

### 1. 本番APIと作業状態を確認する

```bash
curl --fail-with-body -sS -X POST https://investee.info/api/graphql \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ financialReports(limit: 1, offset: 0) { stockCode companyName } }"}'
```

通信成功だけでなく、応答に `errors` がなく `financialReports` が返ることを確認する。新しいクエリを含む場合は、そのクエリも本番に対応済みであることを確認する。`git fetch` 後の最新 `origin/main` を基点にし、作業ツリーの無関係な変更を含めない。

### 2. バージョンを更新する

- 機能・画面変更はminor、不具合修正だけならpatchを上げる。版番号を提案してユーザーに確認する。既に承認済みなら再確認不要。
- 変更するのは `package.json` の `version`。manifestにはビルド時に反映される。
- タグ名・Release名はバージョン番号そのまま（例: `1.0.2`）。`v` や `release-` は付けない。

### 3. クリーン検証と本番ビルドを行う

```bash
yarn install --frozen-lockfile
yarn lint
yarn test
yarn build
```

各コマンドの成功を確認してから次へ進む。`dist/manifest.json` では以下を確認する。

| 項目 | 条件 |
| --- | --- |
| `name` | `[Dev]` が付いていない |
| `version` | 更新した `package.json` と一致する |
| `host_permissions` | `https://investee.info/*` のみ。localhostを含まない |

### 4. 申請用zipとバージョン変更PRを作る

リポジトリルートから実行する。`manifest.json` がzip直下になるようにする。

```bash
mkdir -p release
version=$(node -p "require('./package.json').version")
(cd dist && zip -r "../release/investee-$version.zip" .)
```

既存の同名zipがある場合は、古いファイルが残らないよう新規アーカイブとして作り直す。zipの内容と `manifest.json` を確認する。

- `release/` とビルド成果物はコミットしない。`git status` で確認する。
- バージョン変更は `package.json` と、更新が必要だった場合の `yarn.lock` をコミットする。メッセージは `change:` で始まる英語1行。
- PR経由でmainへ反映し、マージはユーザーが行う。マージ前にタグを作成しない。

### 5. PRマージ後にタグ・GitHub Releaseを作る

最新の `origin/main` へのマージを確認し、公開対象SHAを確定する。zipとそのSHAのソース・依存・ビルド条件を照合し、差があれば手順3〜4で再作成する。

前回リリース以降の変更を、簡潔な英語の箇条書きにする。キー・秘密の接続情報を含めず、本文はファイルに書く。

共通 `release` skillの手順で対象SHAのタグを作成・pushし、リモートのタグを確認してから公開する。

```bash
gh release create <version> --verify-tag --title <version> --notes-file <ノートファイル>
gh release view <version>
```

作成済みタグはSHAを照合し、削除・付け替えしない。GitHub Release作成後も、以下のストア申請は人間が行う。

### 6. 結果と人間の作業を案内する

版番号・zipの絶対パス・タグ・ReleaseのURLを報告する。下の実機チェックリストと、Chrome Web Storeダッシュボードの「パッケージ」から今回のzipをアップロードして審査に提出する手順を、チャットにも表示する。

## 人間が行う部分

### 1. 本番ビルドの実機確認

スキルが作った `dist/` を `chrome://extensions`（デベロッパーモード → パッケージ化されていない拡張機能を読み込む）で読み込み、以下を確認する:

- [ ] 拡張名に `[Dev]` が**付いていない**（本番ビルドであること）
- [ ] 対応サイトの銘柄ページ（例: `https://kabutan.jp/stock/?code=7203`）で拡張アイコンが有効になる
- [ ] ポップアップで貸借対照表・損益計算書・キャッシュフロー計算書が描画される（本番 API 接続）
- [ ] カルーセルの切替・ツールチップ・企業名リンクが動く

### 2. Chrome Web Store へ申請

[Chrome Web Store デベロッパーダッシュボード](https://chrome.google.com/webstore/devconsole) → 対象アイテム → 「パッケージ」→ スキルが作成した zip をアップロード → 審査に提出（ストアアカウントでの手動作業）。

- `host_permissions` や `permissions` を変更した場合、審査で用途説明を求められることがある。本拡張の host_permissions は自社 API（investee.info）からの財務データ取得のためのもの
- 審査は通常数時間〜数日
- 公開後、ユーザーの Chrome は数時間ごとの自動更新チェックで新バージョンに切り替わる（`chrome://extensions` の「更新」で即時反映も可能）

### 3. Firefox（公開している場合のみ）

`dist-firefox-v2/` を同様に zip して [AMO（addons.mozilla.org）](https://addons.mozilla.org/developers/) へ提出する。

### 4. 後片付け（任意・エージェントに依頼可）

- 新クエリの本番デプロイが完了していれば、`codegen.ts` の schema 参照をローカル docker から本番（`https://investee.info/api/graphql`）へ戻す PR を検討する（ローカル docker 必須の制約を外せる。詳細は [README.md](../README.md) の codegen 節）
