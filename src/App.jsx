// アプリのルート (src/App.jsx)
// 3D シーン (DiceScene) の上に番組風の UI を重ね、
// サイコロを振る操作・トークテーマの編集・外部 JSON からのテーマ読み込みを担当する

import { useCallback, useEffect, useState } from 'react'
import DiceScene from './DiceScene'
import {
  DEFAULT_THEMES,
  FACE_COUNT,
  loadPool,
  loadSourceUrl,
  loadThemes,
  savePool,
  saveSourceUrl,
  saveThemes,
} from './themes'
import { DEFAULT_SOURCE_URL, fetchThemePool, pickThemes } from './themeSource'

export default function App() {
  const [themes, setThemes] = useState(loadThemes)
  const [rollToken, setRollToken] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null) // 出た面のインデックス
  const [editing, setEditing] = useState(false)
  const [pool, setPool] = useState(loadPool) // 読み込んだテーマ一覧
  const [sourceUrl, setSourceUrl] = useState(loadSourceUrl)
  const [loadingPool, setLoadingPool] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'ok' | 'error', text }

  useEffect(() => saveThemes(themes), [themes])
  useEffect(() => savePool(pool), [pool])
  useEffect(() => saveSourceUrl(sourceUrl), [sourceUrl])

  // サイコロを振る。DiceScene 側は rollToken の変化を検知して投げ直す
  const roll = useCallback(() => {
    if (rolling) return
    setResult(null)
    setRolling(true)
    setRollToken((t) => t + 1)
  }, [rolling])

  // DiceScene から出目を受け取る
  const handleSettle = useCallback((faceIndex) => {
    setRolling(false)
    setResult(faceIndex)
  }, [])

  // スペースキーでも振れるようにする
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      e.preventDefault()
      roll()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [roll])

  // 編集フォームの 1 面分を更新する
  const updateTheme = (index, value) => {
    setThemes((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  // 入力された URL から JSON を読み込み、プールと 6 面のテーマを入れ替える (src/App.jsx)
  const loadFromUrl = async () => {
    const url = sourceUrl.trim()
    if (!url || loadingPool) return
    setLoadingPool(true)
    setStatus(null)
    try {
      const loaded = await fetchThemePool(url)
      setPool(loaded)
      setThemes(pickThemes(loaded, FACE_COUNT))
      setResult(null)
      setStatus({ type: 'ok', text: `${loaded.length} 件を読み込み、6 面に割り当てました` })
    } catch (e) {
      setStatus({ type: 'error', text: e.message })
    } finally {
      setLoadingPool(false)
    }
  }

  // 読み込み済みのプールから 6 面を引き直す (src/App.jsx)
  const reshuffleFaces = () => {
    if (pool.length === 0) return
    setThemes(pickThemes(pool, FACE_COUNT))
    setResult(null)
    setStatus({ type: 'ok', text: `${pool.length} 件から 6 面を引き直しました` })
  }

  return (
    <div className="app">
      <div className="stage">
        <DiceScene themes={themes} rollToken={rollToken} onSettle={handleSettle} />
      </div>

      <header className="header">
        <p className="header__eyebrow">TALK THEME</p>
        <h1 className="header__title">トークテーマ ダイス</h1>
      </header>

      <a
        className="github-link"
        href="https://github.com/naofumi-fujii/lions-dice"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub リポジトリを開く"
        title="GitHub"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      </a>

      <div className="result" aria-live="polite">
        {rolling && <p className="result__rolling">ころがしています…</p>}
        {!rolling && result !== null && (
          <div className="result__card" key={rollToken}>
            <span className="result__face">{result + 1}</span>
            <p className="result__text">{themes[result]}</p>
          </div>
        )}
        {!rolling && result === null && rollToken === 0 && (
          <p className="result__hint">サイコロを振ってトークテーマを決めよう</p>
        )}
      </div>

      <div className="controls">
        <button className="btn btn--primary" onClick={roll} disabled={rolling}>
          {rolling ? 'ころがし中' : 'サイコロを振る'}
        </button>
        {pool.length > 0 && (
          <button className="btn" onClick={reshuffleFaces} disabled={rolling}>
            6面を引き直す
          </button>
        )}
        <button className="btn" onClick={() => setEditing((v) => !v)}>
          {editing ? '閉じる' : 'テーマを編集'}
        </button>
      </div>

      {editing && (
        <aside className="editor">
          <h2 className="editor__title">トークテーマ（6面）</h2>
          <ul className="editor__list">
            {themes.map((theme, i) => (
              <li className="editor__row" key={i}>
                <span className="editor__face">{i + 1}</span>
                <textarea
                  className="editor__input"
                  value={theme}
                  rows={2}
                  maxLength={120}
                  placeholder={DEFAULT_THEMES[i]}
                  onChange={(e) => updateTheme(i, e.target.value)}
                />
              </li>
            ))}
          </ul>
          <div className="editor__actions">
            <button className="btn btn--ghost" onClick={() => setThemes(DEFAULT_THEMES)}>
              初期値に戻す
            </button>
            <button className="btn btn--ghost" onClick={() => setThemes(Array(FACE_COUNT).fill(''))}>
              すべて消す
            </button>
          </div>
          <p className="editor__note">入力内容は自動保存されます</p>

          <section className="editor__source">
            <h3 className="editor__subtitle">JSON からまとめて読み込む</h3>
            <input
              className="editor__input"
              value={sourceUrl}
              placeholder={DEFAULT_SOURCE_URL}
              spellCheck={false}
              onChange={(e) => setSourceUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadFromUrl()}
            />
            <div className="editor__actions">
              <button className="btn btn--ghost" onClick={loadFromUrl} disabled={loadingPool}>
                {loadingPool ? '読み込み中…' : 'URL から読み込む'}
              </button>
              <button className="btn btn--ghost" onClick={reshuffleFaces} disabled={pool.length === 0}>
                6面を引き直す
              </button>
            </div>
            {status && (
              <p className={`editor__note${status.type === 'error' ? ' editor__note--error' : ''}`}>
                {status.text}
              </p>
            )}
            {!status && pool.length > 0 && (
              <p className="editor__note">読み込み済み: {pool.length} 件</p>
            )}
          </section>
        </aside>
      )}
    </div>
  )
}
