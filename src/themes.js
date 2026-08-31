// トークテーマの永続化まわり (src/themes.js)
// localStorage に「サイコロ 6 面のテーマ」「読み込んだテーマ一覧（プール）」
// 「読み込み元 URL」を保存し、App.jsx から読み書きする

import { DEFAULT_SOURCE_URL } from './themeSource'

const STORAGE_KEY = 'lions-dice:themes'
const POOL_STORAGE_KEY = 'lions-dice:pool'
const SOURCE_URL_STORAGE_KEY = 'lions-dice:source-url'
const EDITOR_HINT_STORAGE_KEY = 'lions-dice:editor-hint-seen'

// サイコロ 6 面の初期テーマ
export const DEFAULT_THEMES = [
  '最近ハマってること',
  '人生で一番の無駄遣い',
  '子どもの頃の将来の夢',
  '実はちょっと苦手なもの',
  '今年やり残していること',
  'ここだけの話',
]

export const FACE_COUNT = DEFAULT_THEMES.length

// localStorage からテーマを読み込む。壊れていれば既定値に戻す
export function loadThemes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_THEMES
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== FACE_COUNT) return DEFAULT_THEMES
    return parsed.map((t, i) => (typeof t === 'string' ? t : DEFAULT_THEMES[i]))
  } catch {
    return DEFAULT_THEMES
  }
}

// テーマを localStorage に保存する
export function saveThemes(themes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
  } catch {
    // プライベートモード等で書けない場合は黙って諦める
  }
}

// 読み込み済みのテーマ一覧（プール）を localStorage から読む。無ければ空配列
export function loadPool() {
  try {
    const raw = localStorage.getItem(POOL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((t) => typeof t === 'string' && t !== '')
  } catch {
    return []
  }
}

// テーマ一覧（プール）を localStorage に保存する
export function savePool(pool) {
  try {
    localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(pool))
  } catch {
    // 容量オーバー等で書けない場合は黙って諦める（プールはメモリ上に残る）
  }
}

// 前回使った読み込み元 URL を返す。無ければ既定の URL
export function loadSourceUrl() {
  try {
    return localStorage.getItem(SOURCE_URL_STORAGE_KEY) || DEFAULT_SOURCE_URL
  } catch {
    return DEFAULT_SOURCE_URL
  }
}

// 読み込み元 URL を localStorage に保存する
export function saveSourceUrl(url) {
  try {
    localStorage.setItem(SOURCE_URL_STORAGE_KEY, url)
  } catch {
    // 書けない場合は黙って諦める
  }
}

// 編集機能の存在を知らせるヒント（コーチマーク）を表示済みかどうかを返す (src/themes.js)
// App.jsx の初回表示判定に使う
export function loadEditorHintSeen() {
  try {
    return localStorage.getItem(EDITOR_HINT_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// ヒントを表示済みとして記録する (src/themes.js)
export function saveEditorHintSeen() {
  try {
    localStorage.setItem(EDITOR_HINT_STORAGE_KEY, '1')
  } catch {
    // 書けない場合は黙って諦める（次回もヒントが出るだけ）
  }
}
