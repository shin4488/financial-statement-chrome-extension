# financialCharts — 共有チャートキット

`financialReports` GraphQL API が返すチャート構造（StackChart / WaterfallChart）を
そのまま描画する汎用コンポーネント群。**科目・会計基準・表示形式の知識を一切持たない**。

## コピー元（ドリフト追跡用）

- コピー元リポジトリ: financial-statement `application/frontend`（`src/shared/financialCharts/`）
- コピー元コミット SHA: `40f8157083df7d4210c3a3cd3e92932b2304a6af`（main）
  - 注: コピー時点でコピー元は未コミットの変更を含む（colorRoles.ts の expense3/revenue2、
    WaterfallChart.tsx のコメント修正）。コピー元でコミットされたら SHA を更新すること
- コピー日: 2026-08-02

このディレクトリはコピー運用。修正はコピー元（Web フロント側）に入れてから展開すること。

## 共有の前提（このディレクトリの規約）

Web フロントとブラウザ拡張（financial-statement-chrome-extension）で同一実装を使う想定のため:

- import してよいのは `react` と `recharts` のみ（両リポジトリ共通の依存）
- アプリ固有のもの（GraphQL クライアント・codegen 生成型・ルーティング・状態管理・
  パスエイリアス `@/`）に依存しない。ディレクトリ内は相対 import のみ
- 型は `types.ts` の構造的型で受ける。codegen 生成型はフィールド構造が一致するため
  変換なしでそのまま渡せる
- スタイルはコンポーネント内で完結させる（外部 CSS を要求しない）

## 拡張側への展開手順（コピー運用のドリフト対策）

1. このディレクトリをそのままコピーし、コピー先の README に**コピー元のコミット SHA**を記録する
   （差分が出たとき、どの時点からのドリフトか追えるようにする）
2. 特に `colorRoles.ts` はバックエンドの enum と同時に変更される契約点なので、
   バックエンド側で role を追加したら両リポジトリへ同時に反映する
   （未知 role は `colorForRole` がグレー表示 + console.warn で検知できる）
3. コピー先が 2 箇所を超える・更新頻度が上がってきたら、親リポジトリで実績のある
   git submodule 方式（このディレクトリを共有用の小リポジトリに切り出し）へ移行する

## 契約のポイント

- `renderable: false` は正常系（未対応形式・データ欠落）。`note` を代替表示する
- `amount` は描画高さ（常に 0 以上）、`signedAmount` が実値（ツールチップ用）
- `colorRole` は意味ベースの色 enum。新しい role が増えたときだけ `colorRoles.ts` に 1 行追加する
- セグメントの並び順・ラベルは API の配列順序が契約。フロントで並べ替え・翻訳をしない
