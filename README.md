# investee Chrome 拡張

株式情報サイトの銘柄ページを見ながら、その企業の財務 3 表（貸借対照表・損益計算書・キャッシュフロー計算書）をポップアップで可視化するブラウザ拡張（Chrome MV3 / Firefox MV2）。

データは [investee.info](https://investee.info) の GraphQL API（`financialReports`）から取得する。

## 対応サイト

以下のサイトで銘柄ページを開くと拡張アイコンが有効になり、クリックで財務 3 表のカルーセルを表示する。

| サイト             | ドメイン                                         |
| ------------------ | ------------------------------------------------ |
| 株探               | kabutan.jp                                       |
| みんかぶ           | minkabu.jp                                       |
| Yahoo!ファイナンス | finance.yahoo.co.jp                              |
| 四季報オンライン   | shikiho.toyokeizai.net                           |
| バフェット・コード | www.buffett-code.com                             |
| 楽天証券           | www.rakuten-sec.co.jp / member.rakuten-sec.co.jp |

## 仕組み

```
タブ切替・URL変更（background service worker）
  → 対応サイトなら銘柄コードを抽出（src/background/stockSite/）
  → GraphQL financialReports をクエリ（src/background/financialStatement/）
  → Redux store へ格納（webext-redux で background/popup 間を共有）
  → ポップアップ（src/popup/ → src/app/）がカルーセルにチャートを描画
      └ チャート本体は共有キット src/shared/financialCharts/（Webフロントとコピー共有）
```

- チャートの科目・積み上げ順・色 role はすべて API が返す。フロントは解釈せず描画するだけの汎用契約（詳細は financial-statement リポジトリの `docs/architecture/04_frontend.md`）
- 技術スタック: React / TypeScript / Redux Toolkit / Apollo Client / recharts / MUI / Vite / @crxjs/vite-plugin

## セットアップ

Node.js 20 以降 / Yarn 1.x

```bash
yarn install
```

## ローカル動作確認

1. [financial-statement](https://github.com/shin4488/financial-statement) リポジトリでバックエンドを起動する（`docker compose up` → API が `http://localhost:20000`）
2. 開発ビルドを作る

   ```bash
   npx vite build --mode development
   ```

3. `chrome://extensions` → 「デベロッパーモード」ON → 「パッケージ化されていない拡張機能を読み込む」→ このリポジトリの `dist/` を選択（名前が `[Dev] investee...` になっていることを確認）
4. 対応サイトの銘柄ページ（例: `https://kabutan.jp/stock/?code=2678`）を開いて拡張アイコンをクリック

- コードを変更したら再ビルドして `chrome://extensions` の「更新」ボタンを押す（フォルダの選択し直しは不要）
- バックエンド側のデータだけが変わった場合は再ビルド不要。銘柄ページを開き直すと再取得される
- HMR で開発する場合は `yarn dev` を起動したままにする（dev サーバ停止中は「Vite Dev Mode」画面になり動かない）

### ビルドモードと接続先

| 項目             | 開発ビルド                                       | 本番ビルド                          |
| ---------------- | ------------------------------------------------ | ----------------------------------- |
| コマンド         | `npx vite build --mode development` / `yarn dev` | `yarn build`                        |
| GraphQL 接続先   | `http://localhost:20000/graphql`                 | `https://investee.info/api/graphql` |
| host_permissions | investee.info + localhost:20000                  | investee.info のみ                  |
| manifest 名      | `[Dev] investee...`                              | `investee...`                       |

## GraphQL 型生成（codegen）

クエリは `.graphql` ファイルで定義する（`src/background/financialStatement/document.graphql`）。変更したら:

```bash
yarn compile
```

- スキーマ取得先はローカル docker のバックエンド `http://localhost:20000/graphql`（`codegen.ts`）。**バックエンドの起動が前提**
- 生成物 `src/__generated__/` はコミットする（build / CI では再生成しない）
- `Money` スカラは `number` として生成される（円単位の金額が JSON 数値で届く）

## テスト・lint

```bash
yarn test
```

```bash
yarn lint
```

`yarn format` で自動整形。pre-commit フック（nano-staged）でも整形が走る。

## 共有チャートキット（src/shared/financialCharts/）

Web フロント（financial-statement `application/frontend`）とコピー共有している汎用チャート部品。**このリポジトリ内で直接編集しないこと。** 修正はコピー元に入れてからディレクトリごとコピーし、コピー先 README のコピー元コミット SHA 記録を更新する。特に `colorRoles.ts` はバックエンドの enum と同時に変更される契約。詳細は [src/shared/financialCharts/README.md](src/shared/financialCharts/README.md)。

## リリース

1. **バックエンド（`financialReports`）の本番デプロイが先行条件**（拡張を先に公開すると、本番 API に存在しないクエリを投げて表示が壊れる）
2. `package.json` の `version` を上げる
3. `yarn build`（`dist/`: Chrome MV3、`dist-firefox-v2/`: Firefox MV2）
4. 本番ビルドを実機確認のうえ Chrome Web Store へ申請

## 補足: host_permissions と CORS

本番 API は CORS ヘッダを返さないため、拡張からの fetch は `host_permissions` による CORS 免除に依存している。パターンはパス付きの `https://investee.info/*` であること（Chrome の CORS 免除はオリジン単位のためパス無しでも動作はするが、マッチパターンとしては誤り）。

## ベース

[browser-extension-react-typescript-starter](https://github.com/sinanbekar/browser-extension-react-typescript-starter) をベースにしている。ライセンスは [LICENSE](LICENSE) を参照。
