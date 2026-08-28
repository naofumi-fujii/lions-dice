// アプリのルート (src/App.jsx)
// 3D シーン (DiceScene) の上に番組風の UI を重ね、
// サイコロを振る操作とトークテーマの編集を担当する

import { useCallback, useEffect, useState } from 'react'
import DiceScene from './DiceScene'
import { DEFAULT_THEMES, FACE_COUNT, loadThemes, saveThemes } from './themes'

export default function App() {
  const [themes, setThemes] = useState(loadThemes)
  const [rollToken, setRollToken] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null) // 出た面のインデックス
  const [editing, setEditing] = useState(false)

  useEffect(() => saveThemes(themes), [themes])

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

  return (
    <div className="app">
      <div className="stage">
        <DiceScene themes={themes} rollToken={rollToken} onSettle={handleSettle} />
      </div>

      <header className="header">
        <p className="header__eyebrow">TALK THEME</p>
        <h1 className="header__title">トークテーマ ダイス</h1>
      </header>

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
                <input
                  className="editor__input"
                  value={theme}
                  maxLength={40}
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
        </aside>
      )}
    </div>
  )
}
