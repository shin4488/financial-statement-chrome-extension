# financialCharts — 共有チャートキット

`financialReports` GraphQL API が返すチャート構造（StackChart / WaterfallChart）を
そのまま描画する汎用コンポーネント群。**科目・会計基準・表示形式の知識を一切持たない**。

## コピー元

- financial-statement `application/frontend` の `src/shared/financialCharts/`

このディレクトリはコピー運用。修正はコピー元（Web フロント側）に入れてから展開すること。
ドリフトの確認はコピー元ディレクトリとの diff で行う（本リポジトリの prettier 整形による差分は許容）。

## 共有の前提（このディレクトリの規約）

Web フロントとブラウザ拡張（financial-statement-chrome-extension）で同一実装を使う想定のため:

- import してよいのは `react` と `recharts` のみ（両リポジトリ共通の依存）
- アプリ固有のもの（GraphQL クライアント・codegen 生成型・ルーティング・状態管理・
  パスエイリアス `@/`）に依存しない。ディレクトリ内は相対 import のみ
- 型は `types.ts` の構造的型で受ける。codegen 生成型はフィールド構造が一致するため
  変換なしでそのまま渡せる
- スタイルはコンポーネント内で完結させる（外部 CSS を要求しない）

## 拡張側への展開手順（コピー運用のドリフト対策）

1. このディレクトリをそのままコピーする。ドリフトの確認はコピー元ディレクトリとの diff で行う
   （コピー先の prettier 整形差分と、コピー先 README の固有追記は許容）
2. 特に `colorRoles.ts` はバックエンドの enum と同時に変更される契約点なので、
   バックエンド側で role を追加したら両リポジトリへ同時に反映する
   （未知 role は `colorForRole` がグレー表示 + console.warn で検知できる）
3. コピー先が 2 箇所を超える・更新頻度が上がってきたら、パッケージ化（npm 公開 or
   GitHub リポジトリ直接参照）での共有へ移行する
   （git submodule 方式は運用の二度手間が大きく本体リポジトリでも廃止した経緯があるため採らない）

## 契約のポイント

- `renderable: false` は正常系（未対応形式・データ欠落）。`note` を代替表示する
- `amount` は描画高さ（常に 0 以上）、`signedAmount` が実値（ツールチップ用）
- `colorRole` は意味ベースの色 enum。新しい role が増えたときだけ `colorRoles.ts` に 1 行追加する
- セグメントの並び順・ラベルは API の配列順序が契約。フロントで並べ替え・翻訳をしない
