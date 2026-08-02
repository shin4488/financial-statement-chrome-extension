# リリース手順（本番反映）

拡張の新バージョンを Chrome Web Store に公開するまでの手順。

## 順序の大原則

**バックエンド（investee.info の API）のデプロイが先、拡張の公開が後。**

拡張はビルド時点のクエリを本番 API に投げるため、API 側に存在しないクエリ・フィールドを使う拡張を先に公開すると、公開済み拡張の表示が壊れる。逆順は不可。

## エージェントで実行する部分（`/release` スキル）

リリース準備の機械的な作業は Claude Code のスキル [.claude/skills/release/SKILL.md](../.claude/skills/release/SKILL.md) に任せる。Claude Code で `/release` を実行すると、以下を行う:

1. 本番 API が `financialReports` に応答することの事前確認（未デプロイなら中断）
2. `package.json` のバージョンアップ（上げ幅は対話で確認: 機能変更 = minor / 修正のみ = patch）
3. クリーン検証（`yarn install --frozen-lockfile` → `yarn lint` → `yarn test`）と本番ビルド（`yarn build`）
4. ビルド成果物の検査（`[Dev]` が付いていない・version 反映・host_permissions が本番のみ）
5. Chrome Web Store 申請用 zip の作成と、バージョンアップ PR の作成

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

- リリースタグ: `git tag v<version> && git push origin v<version>`
- 新クエリの本番デプロイが完了していれば、`codegen.ts` の schema 参照をローカル docker から本番（`https://investee.info/api/graphql`）へ戻す PR を検討する（ローカル docker 必須の制約を外せる。詳細は [README.md](../README.md) の codegen 節）
