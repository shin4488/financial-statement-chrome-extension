# 拡張機能の利用状況と改善判断

GA4 プロパティは `463560127`（investee-extension）。Web 版とは別の利用者として計測する。

| 確認すること             | 指標・分析軸                                      | 改善の入口                                             |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| 使われているか           | popup_open の総ユーザー数とイベント数             | 対応サイトの導線・利用案内                             |
| 表示できているか         | report_result の表示結果、サイト名                | empty なら収録データ、error なら API・対応サイトの検出 |
| 分析に使われているか     | analysis_interaction の総ユーザー数、グラフの種類 | グラフの説明・ナビゲーション                           |
| Web へ調査を続けているか | outbound_click、link_domain                       | 比較機能への導線                                       |
| 更新で悪化していないか   | 拡張機能バージョン別の表示結果と操作数            | 新旧バージョンで再現確認                               |

過去 28 日と前の 28 日で件数と率を一緒に確認する。利用者が少ないときの率だけで結論を出さない。データが少ない間は、イベント数を割っただけの値をファネルの転換率と呼ばない。同じセッションの経路を調べるときは、GA4 のファネル探索で順序とセッションを指定する。

## イベントとパラメータ

| イベント               | 送るとき                                                                                         | パラメータ                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `popup_open`           | ポップアップを開いたとき（開くたびに 1 回）                                                      | `site_domain_name`                                                       |
| `report_result`        | 表示に使う Redux ストアが success・empty・error になったとき。読み込み中や再レンダーでは送らない | `site_domain_name`、`result_status`、`result_count`、`unavailable_count` |
| `analysis_interaction` | グラフを手動で切り替えたとき、自動切替の設定を変えたとき。自動切替でグラフが進んだときは送らない | `interaction_type`、`chart_type`（手動の切替だけ）                       |
| `outbound_click`       | 株探・Web 版へのリンクを押したとき                                                               | `link_domain`                                                            |

すべてのイベントに `extension_version` を付ける。GA4 では `analysis_interaction` をキーイベントに設定する。Web 版へのリンクには `utm_source=investee_extension` を付け、拡張からの移動を識別できるようにする。

| パラメータ          | 値                                                                | カスタム定義（イベントスコープ） |
| ------------------- | ----------------------------------------------------------------- | -------------------------------- |
| `site_domain_name`  | 対応サイトのドメイン。対応サイト以外は `unknown`                  | サイト名                         |
| `result_status`     | `success`・`empty`・`error`                                       | 表示結果                         |
| `result_count`      | 取得した決算の件数                                                | なし                             |
| `unavailable_count` | 3 表のうち 1 つ以上が表示できない決算の件数。通信の失敗は含まない | なし                             |
| `interaction_type`  | `chart_navigation`（手動の切替）・`autoplay_on`・`autoplay_off`   | 分析操作                         |
| `chart_type`        | `bs`・`pl`・`cf`・`fcf`・`indicators`                             | グラフの種類                     |
| `link_domain`       | `kabutan.jp`・`investee.info`                                     | なし                             |
| `extension_version` | `package.json` の `version`                                       | 拡張機能バージョン               |

## 識別子と送らない情報

ブラウザ内に保存したランダムな ID を使い続け、30 分イベントがなければセッションを切り替える。ポップアップの再レンダーや操作ごとには変えない。

送るのは上の表のパラメータと、ID・セッション・前のイベントからの経過時間（`engagement_time_msec`）だけで、銘柄、企業名、自由入力、閲覧中の URL、他のタブの履歴は送らない。画面下部の「改善のため利用状況を送信する」をオフにすると、以後は送らない。開発ビルドは常に送らない。

## 実装・運用

`src/popup/analytics.ts` が `https://investee.info/api/analytics/extension` へ送信し、Rails が GA4 Measurement Protocol へ中継する。秘密キー・測定 ID はサーバだけが管理し、`VITE_GOOGLE_*` は不要。host_permissions の追加も不要。本番ビルドは `ANALYTICS_ENABLED` と package.json 由来のバージョンだけを埋め込む。計測に失敗しても画面を止めず、再試行で件数を増やさない。

サーバ設定・イベント契約・反映時差は [Web リポジトリの運用文書](https://github.com/shin4488/financial-statement/blob/main/docs/analytics/README.md) を参照。Measurement Protocol だけで計測するため、地域・端末・流入・新規/再訪は ブラウザから送信する Web 版と同じ精度では評価しない。拡張ではサイト別の総ユーザー数と操作・結果を中心に見る。

公開前に計測中継 API を先にデプロイし、GA4 のリアルタイムでも受信を確認する。HTTP 204 が返っても、GA4 で集計されたとは限らない。通常レポートへの反映には 24 ～ 48 時間かかる場合があり、新しい計測は過去に遡らない。
