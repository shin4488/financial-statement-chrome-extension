# リリース手順（本番反映）

拡張の新バージョンを Chrome Web Store に公開するまでの手順。

## 順序の大原則

**バックエンド（investee.info の API）のデプロイが先、拡張の公開が後。**

拡張はビルド時点のクエリを本番 API に投げるため、API 側に存在しないクエリ・フィールドを使う拡張を先に公開すると、公開済み拡張の表示が壊れる。逆順は不可。

## エージェントで実行する部分

[agent-plugins](https://github.com/shin4488/agent-plugins) の共通 `release` skill を使う。この文書には拡張固有のコマンドと規約を置く。以下の前提や検証が失敗したら、次の工程に進まず理由を報告する。

### 1. 本番 API と作業状態を確認する

```bash
curl --fail-with-body -sS -X POST https://investee.info/api/graphql \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ financialReports(limit: 1, offset: 0) { stockCode companyName } }"}'
```

通信成功だけでなく、応答に `errors` がなく `financialReports` が返ることを確認する。新しいクエリを含む場合は、そのクエリも本番に対応済みであることを確認する。`git fetch` 後の最新 `origin/main` を基点にし、作業ツリーの無関係な変更を含めない。

### 2. バージョンを更新する

- 機能・画面変更は minor、不具合修正だけなら patch を上げる。版番号を提案してユーザーに確認する。既に承認済みなら再確認不要。
- 変更するのは `package.json` の `version`。manifest にはビルド時に反映される。
- タグ名・Release 名はバージョン番号そのまま（例: `1.0.2`）。`v` や `release-` は付けない。

### 3. クリーン検証と本番ビルドを行う

```bash
yarn install --frozen-lockfile
yarn lint
yarn test
yarn build
```

各コマンドの成功を確認してから次へ進む。`dist/manifest.json` では以下を確認する。

| 項目               | 条件                                                 |
| ------------------ | ---------------------------------------------------- |
| `name`             | `[Dev]` が付いていない                               |
| `version`          | 更新した `package.json` と一致する                   |
| `host_permissions` | `https://investee.info/*` のみ。localhost を含まない |

### 4. 申請用 zip とバージョン変更 PR を作る

リポジトリルートから実行する。`manifest.json` が zip 直下になるようにする。

```bash
mkdir -p release
version=$(node -p "require('./package.json').version")
(cd dist && zip -r "../release/investee-$version.zip" .)
```

既存の同名 zip がある場合は、古いファイルが残らないよう新規アーカイブとして作り直す。zip の内容と `manifest.json` を確認する。

- `release/` とビルド成果物はコミットしない。`git status` で確認する。
- バージョン変更は `package.json` と、更新が必要だった場合の `yarn.lock` をコミットする。メッセージは `change:` で始まる英語 1 行。
- PR 経由で main へ反映し、マージはユーザーが行う。マージ前にタグを作成しない。

### 5. PR マージ後にタグ・GitHub Release を作る

最新の `origin/main` へのマージを確認し、公開対象 SHA を確定する。zip とその SHA のソース・依存・ビルド条件を照合し、差があれば手順 3〜4 で再作成する。

前回リリース以降の変更を、簡潔な英語の箇条書きにする。キー・秘密の接続情報を含めず、本文はファイルに書く。

共通 `release` skill の手順で対象 SHA のタグを作成・push し、リモートのタグを確認してから公開する。

```bash
gh release create <version> --verify-tag --title <version> --notes-file <ノートファイル>
gh release view <version>
```

作成済みタグは SHA を照合し、削除・付け替えしない。GitHub Release 作成後も、以下のストア申請は人間が行う。

### 6. 結果と人間の作業を案内する

版番号・zip の絶対パス・タグ・Release の URL を報告する。下の実機チェックリストと、Chrome Web Store ダッシュボードの「パッケージ」から今回の zip をアップロードして審査に提出する手順を、チャットにも表示する。

## 人間が行う部分

### 1. 本番ビルドの実機確認

スキルが作った `dist/` を `chrome://extensions`（デベロッパーモード → パッケージ化されていない拡張機能を読み込む）で読み込み、以下を確認する。前の `dist/` を読み込んだままの場合は、拡張機能のカードの再読み込みボタン（↻）を押してから開く。Chrome の再起動だけでは新しい `dist/` が反映されないことがある（理由と記録されたエラーの消し方は [README の Chrome への読み込み](../README.md#3-chrome-への読み込み)）:

- [ ] 拡張名に `[Dev]` が**付いていない**（本番ビルドであること）
- [ ] 対応サイトの銘柄ページ（例: `https://kabutan.jp/stock/?code=7203`）で拡張アイコンが有効になる
- [ ] ポップアップで貸借対照表・損益計算書・キャッシュフロー計算書・フリー CF・ROE・ROA が描画される（本番 API 接続）
- [ ] カルーセルの切替・ツールチップ・企業名リンクが動く
- [ ] 上の操作のあと、拡張機能のカードに「エラー」ボタンが出ていない

### 2. Chrome Web Store へ申請

[Chrome Web Store デベロッパーダッシュボード](https://chrome.google.com/webstore/devconsole) → 対象アイテム → 「パッケージ」→ スキルが作成した zip をアップロード → 審査に提出（ストアアカウントでの手動作業）。

- ダッシュボードの Privacy practices タブでは、manifest の権限ごとに用途説明の入力が必要（[Chrome Web Store のドキュメント](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)）。`host_permissions` や `permissions` を追加・変更した版を申請する前に、次の用途と入力内容が合っているか確認する

  | 権限                                            | 用途                                                                                                                                              |
  | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `host_permissions`（`https://investee.info/*`） | 自社 API（investee.info）からの財務データ取得                                                                                                     |
  | `tabs`                                          | 各タブの URL から、対応サイトの銘柄ページかを判定する                                                                                             |
  | `storage`                                       | service worker が停止しても、表示中の銘柄の財務データを `storage.session`（メモリ上に置き、ブラウザを閉じると消える）に残し、取り直さずに表示する |

- 審査は通常数時間〜数日
- 公開後、ユーザーの Chrome は数時間ごとの自動更新チェックで新バージョンに切り替わる（`chrome://extensions` の「更新」で即時反映も可能）

### 3. Firefox（公開している場合のみ）

`dist-firefox-v2/` を同様に zip して [AMO（addons.mozilla.org）](https://addons.mozilla.org/developers/) へ提出する。

### 4. 後片付け（任意・エージェントに依頼可）

- バックエンドの変更を先行開発するために `codegen.ts` の schema をローカル docker へ切り替えていた場合は、新クエリの本番デプロイ後に本番（`https://investee.info/api/graphql`）へ戻す PR を作る（規約は [AGENTS.md の重要な規約](../AGENTS.md#重要な規約)）
