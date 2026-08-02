# リリース手順（本番反映）

拡張の新バージョンを Chrome Web Store に公開するまでの手順。

## 順序の大原則

**バックエンド（investee.info の API）のデプロイが先、拡張の公開が後。**

拡張はビルド時点のクエリを本番 API に投げるため、API 側に存在しないクエリ・フィールドを使う拡張を先に公開すると、公開済み拡張の表示が壊れる。逆順は不可。

## 0. バックエンドの本番デプロイと確認

financial-statement リポジトリ側の手順でバックエンドをデプロイした後、拡張が使うクエリが本番で動くことを確認する:

```bash
curl -s -X POST https://investee.info/api/graphql -H 'Content-Type: application/json' --data '{"query":"{ financialReports(limit: 1, offset: 0) { stockCode companyName } }"}'
```

データが返ってくれば OK（`errors` が返る場合はデプロイ内容を確認）。

## 1. バージョンアップ

`package.json` の `version` を上げる（manifest のバージョンは `package.json` から自動反映される）。

- 機能追加・画面変更: minor（例: 1.0.2 → 1.1.0）
- 不具合修正のみ: patch（例: 1.0.2 → 1.0.3）

変更は PR 経由で main へマージする。

## 2. クリーンな状態で検証・本番ビルド

main を最新化してから:

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

`yarn build` で以下が生成される:

- `dist/` — Chrome 用（Manifest V3）
- `dist-firefox-v2/` — Firefox 用（Manifest V2）

## 3. 本番ビルドの実機確認

申請前に `dist/` を `chrome://extensions`（デベロッパーモード → パッケージ化されていない拡張機能を読み込む）で読み込み、以下を確認する:

- [ ] 拡張名に `[Dev]` が**付いていない**（本番ビルドであること）
- [ ] 対応サイトの銘柄ページ（例: `https://kabutan.jp/stock/?code=7203`）で拡張アイコンが有効になる
- [ ] ポップアップで貸借対照表・損益計算書・キャッシュフロー計算書が描画される（本番 API 接続）
- [ ] カルーセルの切替・ツールチップ・企業名リンクが動く

## 4. Chrome Web Store へ申請

zip を作成する（`manifest.json` が zip のルートに来るように `dist/` の中身を固める）:

```bash
cd dist && zip -r ../investee-$(node -p "require('../package.json').version").zip . && cd ..
```

[Chrome Web Store デベロッパーダッシュボード](https://chrome.google.com/webstore/devconsole) → 対象アイテム → 「パッケージ」→ 新しいパッケージをアップロード → 審査に提出（ストアアカウントでの手動作業）。

### 審査の注意

- `host_permissions` や `permissions` を変更した場合、審査で用途説明を求められることがある。本拡張の host_permissions は自社 API（investee.info）からの財務データ取得のためのもの
- 審査は通常数時間〜数日
- 公開後、ユーザーの Chrome は数時間ごとの自動更新チェックで新バージョンに切り替わる（`chrome://extensions` の「更新」で即時反映も可能）

## 5. Firefox（公開している場合のみ）

`dist-firefox-v2/` を同様に zip して [AMO（addons.mozilla.org）](https://addons.mozilla.org/developers/) へ提出する。

## 6. 後片付け（任意）

- リリースタグ: `git tag v<version> && git push origin v<version>`
- 新クエリの本番デプロイが完了していれば、`codegen.ts` の schema 参照をローカル docker から本番（`https://investee.info/api/graphql`）へ戻す PR を検討する（ローカル docker 必須の制約を外せる。詳細は [README.md](../README.md) の codegen 節）
