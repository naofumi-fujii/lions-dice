# lions-dice

トークテーマが書かれたサイコロを物理演算で転がす、テレビ番組風の React アプリ。

サイコロは実際に投げられて床でバウンドし、止まった時点で「上を向いている面」を
法線ベクトルから判定して、その面のトークテーマをテロップに表示します。

## 使い方

```bash
npm install
npm run dev
```

- **サイコロを振る** ボタン、または **スペースキー** で振る
- **テーマを編集** から 6 面のテキストを自由に書き換え（`localStorage` に自動保存）
- ドラッグで視点回転、ホイールでズーム

## 技術構成

| 役割 | 使用しているもの |
| --- | --- |
| ビルド | Vite + React 19 |
| 3D 描画 | three.js / @react-three/fiber / @react-three/drei |
| 物理演算 | @react-three/rapier (Rapier) |

Node のバージョンは `mise.toml` で固定しています（mise 未使用の場合は Node 24 系を用意してください）。

## ソース構成

| ファイル | 役割 |
| --- | --- |
| `src/App.jsx` | UI 全体。振る操作・結果表示・テーマ編集 |
| `src/DiceScene.jsx` | 3D シーン。物理演算と出目の判定 |
| `src/faceTexture.js` | 各面のテキストを Canvas に描いてテクスチャ化 |
| `src/themes.js` | トークテーマの初期値と localStorage 永続化 |
| `src/styles.css` | 番組風オーバーレイ UI のスタイル |

## カスタマイズの勘所

- 初期テーマ: `src/themes.js` の `DEFAULT_THEMES`
- サイコロの質感 / 大きさ: `src/DiceScene.jsx` の `DICE_SIZE` と `meshPhysicalMaterial`
- 転がる範囲とカメラ: `ARENA_HALF_X` / `ARENA_HALF_Z` / `ARENA_CENTER_Z` と `Canvas` の `camera`
- 面の文字色・枠線: `src/faceTexture.js` の `TEXT_COLOR` / `ACCENT_COLOR`

## 出目の公平性について

物理演算の結果をそのまま出目にしているため、6 面が均等に出るかを 50000 回の
シミュレーションで検証しています。カイ二乗検定（自由度 5）で χ² = 4.37 と、
一様分布と矛盾しない結果でした。

ただし Rapier のソルバは高摩擦下でサイコロを辺や角の上に安定させてしまうことがあり
（約 2.2%）、そのままでは面が水平にならず出目が曖昧になります。そのため
`src/DiceScene.jsx` では、12 度以上傾いて静止した場合に軽く弾いて転がし直しています
(`FLAT_DOT` / `NUDGE_UP` / `NUDGE_TORQUE`)。95% の試行は弾き直しなしで確定します。
