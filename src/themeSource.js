// 外部 JSON からトークテーマ一覧（プール）を読み込む (src/themeSource.js)
// asakai-talk-themes 形式を主対象に、素朴な配列形式にも対応する

// 既定の読み込み元（asakai-talk-themes のデータ）
export const DEFAULT_SOURCE_URL =
  'https://raw.githubusercontent.com/naofumi-fujii/asakai-talk-themes/refs/heads/main/data/asakai-talk-themes.json'

// JSON をテーマ文字列の配列に正規化する (src/themeSource.js)
// 受け付ける形:
//   { "talkThemes": [{ "text": "..." }] }  ... asakai-talk-themes
//   [{ "text": "..." }] / ["..."]          ... 素の配列
// 空文字・重複は落とす
export function parseThemePool(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.talkThemes) ? data.talkThemes : null
  if (!list) throw new Error('talkThemes の配列が見つかりませんでした')

  const texts = list
    .map((item) => (typeof item === 'string' ? item : typeof item?.text === 'string' ? item.text : ''))
    .map((text) => text.trim())
    .filter((text) => text !== '')

  return [...new Set(texts)]
}

// URL から JSON を取得し、parseThemePool で正規化して返す (src/themeSource.js)
// 失敗時はそのまま画面に出せる日本語メッセージの Error を投げる
export async function fetchThemePool(url) {
  let res
  try {
    res = await fetch(url, { cache: 'no-cache' })
  } catch {
    throw new Error('取得できませんでした（URL か通信状況を確認してください）')
  }
  if (!res.ok) throw new Error(`取得できませんでした（HTTP ${res.status}）`)

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('JSON として読み取れませんでした')
  }

  const pool = parseThemePool(data)
  if (pool.length === 0) throw new Error('テーマが 1 件も入っていませんでした')
  return pool
}

// プールから重複なく count 件を引く (src/themeSource.js)
// Fisher-Yates で先頭 count 件だけシャッフルする。件数が足りない分は空文字で埋める
export function pickThemes(pool, count) {
  const rest = [...pool]
  const picked = []
  while (picked.length < count && rest.length > 0) {
    const i = Math.floor(Math.random() * rest.length)
    picked.push(rest.splice(i, 1)[0])
  }
  while (picked.length < count) picked.push('')
  return picked
}

// 使用済みを避けてプールから count 件を引く (src/themeSource.js)
// App.jsx が 6 面を引き直すときに使う。used は出目になったテーマ本文の配列（themes.js の loadUsedThemes）。
// - 未使用が count 件以上あれば、未使用だけから引く
// - 未使用が count 件を切ったら、残りの未使用を必ず面に入れ、足りない分を使用済みから埋めて、使用済みをリセットする
// 戻り値の used はプールに無くなった本文を落とした次の使用済み一覧（話題を消しても履歴が溜まり続けない）
export function pickFreshThemes(pool, count, used) {
  const usedSet = new Set(used)
  const fresh = pool.filter((t) => !usedSet.has(t))
  const stillUsed = pool.filter((t) => usedSet.has(t))

  if (fresh.length >= count) {
    return { themes: pickThemes(fresh, count), used: stillUsed }
  }

  const filler = pickThemes(stillUsed, count - fresh.length).filter((t) => t !== '')
  return { themes: pickThemes([...fresh, ...filler], count), used: [] }
}
