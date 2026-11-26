// トークテーマの永続化まわり (src/themes.js)
// localStorage に「サイコロ 6 面のテーマ」「読み込んだテーマ一覧（プール）」
// 「読み込み元 URL」「出目になった使用済みテーマ」を保存し、App.jsx から読み書きする

import { DEFAULT_SOURCE_URL } from './themeSource'

const STORAGE_KEY = 'lions-dice:themes'
const POOL_STORAGE_KEY = 'lions-dice:pool'
const SOURCE_URL_STORAGE_KEY = 'lions-dice:source-url'
const USED_STORAGE_KEY = 'lions-dice:used-themes'

// サイコロ 6 面の初期テーマ
// 1 面目は当たり目。この言い回しのときだけ faceTexture.js が赤い「当」の面を描く
export const DEFAULT_THEMES = [
  '今日の当たり目',
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

// ユーザーが編集したテーマが保存済みかどうか (src/themes.js)
// App.jsx の起動時自動読み込みで、6 面を上書きしてよいかの判定に使う
export function hasStoredThemes() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

// 出目になった使用済みテーマ（本文の配列）を localStorage から読む (src/themes.js)
// 同じ話題が続けて出ないよう、themeSource.js の pickFreshThemes が未使用分から 6 面を引くのに使う。
// 話題データに ID が無いため本文そのものをキーにする。無い・壊れている・読めない場合は空配列
export function loadUsedThemes() {
  try {
    const raw = localStorage.getItem(USED_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((t) => typeof t === 'string' && t !== '')
  } catch {
    return []
  }
}

// 使用済みテーマを localStorage に保存する (src/themes.js)
export function saveUsedThemes(used) {
  try {
    localStorage.setItem(USED_STORAGE_KEY, JSON.stringify(used))
  } catch {
    // 書けない場合はメモリ上の履歴だけで動く（リロードすると履歴は消える）
  }
}
