// トークテーマの永続化まわり (src/themes.js)
// localStorage に 6 面分のテーマを保存し、App.jsx から読み書きする

const STORAGE_KEY = 'lions-dice:themes'

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
