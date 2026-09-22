# financial-statement-chrome-extension

investee（https://investee.info）のブラウザ拡張。株式情報サイトの銘柄ページを開くと、background service worker が GraphQL `financialReports` から財務 3 表チャートを取得し、ポップアップに描画する。

## コマンド

| 目的                            | コマンド                                           |
| ------------------------------- | -------------------------------------------------- |
| 依存インストール                | `yarn install`                                     |
| 開発ビルド（ローカル API 接続） | `npx vite build --mode development`                |
| HMR 開発                        | `yarn dev`（dev サーバ起動中のみ動く成果物になる） |
| 本番ビルド                      | `yarn build`（tsc + vite + Firefox MV2 変換）      |
| GraphQL 型生成                  | `yarn compile`（`codegen.ts` の schema を参照）    |
| lint / 型チェック / テスト      | `yarn lint` / `yarn lint:type` / `yarn test`       |

## アーキテクチャ

`src/background/` がタブ・銘柄を判定して API を取得し、`src/store/` の webext-redux 経由で `src/popup/` に渡す。描画は `src/shared/financialCharts/`。接続先は下記の設定元を確認し、値を重複して管理しない。

- パスエイリアス `@/` = `src/`。UI コンポーネントはクラスコンポーネントが既存の流儀
- チャートの科目・色・積み上げ順は API の返却値（colorRole・配列順序）が契約で、フロントで解釈・並べ替えをしない

## 重要な規約

- **GraphQL クエリは `.graphql` ファイル**（codegen の documents: `**/*.graphql`。gql タグではない）。変更後 `yarn compile`。生成物 `src/__generated__/` はコミットする
- codegen の schema は本番 introspection（`https://investee.info/api/graphql`）を参照。バックエンドの変更を先行開発するときだけ一時的にローカル docker（`http://localhost:20000/graphql`）へ切り替える。`Money` スカラは `number`
- **`src/shared/financialCharts/` と `src/shared/financialIndicators/` は直接編集禁止**。コピー元は financial-statement `application/frontend/src/shared/` の同名ディレクトリ。同期はディレクトリごとコピーする（ドリフト確認はコピー元との diff）。`colorRoles.ts` はバックエンド enum との契約で、BE / Web フロント / 拡張の 3 点同時変更
- 接続先切替は `import.meta.env.MODE`（`src/background/financialStatement/apolloClientService.ts`）と `env.mode`（`src/manifest.mts`）。本番 API は CORS ヘッダを返さないため host_permissions の CORS 免除で fetch している。パターンは `https://investee.info/*`（パス `/*` 必須）
- コミットメッセージは `add:` / `change:` プレフィックスの英語 1 行（`git log` 参照）

## 関連リポジトリ・ローカル環境

- financial-statement（通常 `../financial-statement`）: monorepo（`application/backend` = Rails、`application/frontend` = React）。`docker compose up` で API が `localhost:20000`、GraphiQL は `http://localhost:20000/graphiql`
- 設計ドキュメントは financial-statement の `docs/guide/`（README.md が目次。チャート契約は `03_data_flow.md`・`04_system.md` の関連節）
- ローカル動作確認の手順は [README.md](README.md) を参照

## リリースの順序制約

バックエンドの `financialReports` 本番デプロイ → 本番 API で動作確認 → version up → `yarn build` → ストア申請。順序が逆だと、公開済み拡張が本番に存在しないクエリを投げて表示が壊れる。

共通 `release` skill を使い、この拡張固有のコマンド・版番号・確認項目は [docs/release.md](docs/release.md) に従う。

ブラウザで確認する場合は [README の開発環境と動作確認](README.md#開発環境と動作確認)を参照する。

## 共通エージェント設定

- 導入は [Makefile](Makefile) の `make setup` を使う。共通 skill の実体は plugin 側で編集する。
- この拡張は ESLint・Prettier を使い、共通 hook の Biome は適用しない。既存の lint・ビルドで確認する。

## 作業の進め方

- 対象のファイル・見出し・シンボルから調べ、必要な場合だけ範囲を広げる。資料や skills は作業に該当するものを読む。
- 不明点は質問して解消してから、その判断に依存する作業に進む。すでに決まっている事項は再確認しない。
- 文書の言語を保ち、日本語は日本人に、英語は英語圏の読者に自然に伝わる表現にする。
- 必須検証は適用条件に従って実行し、同じ差分・依存・設定・実行条件で得た結果は再利用する。問題を修正し、結果と未確認の範囲を簡潔に報告する。
- このガイドには継続して必要な規約と参照先を残す。進捗や設定値、他の資料・skills の手順は複製しない。
