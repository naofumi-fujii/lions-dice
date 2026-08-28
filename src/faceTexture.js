// サイコロの面に貼るテキストテクスチャ生成 (src/faceTexture.js)
// Canvas 2D に日本語のトークテーマを描画し、THREE.CanvasTexture として返す

import * as THREE from 'three'

const TEXTURE_SIZE = 512
const FONT_STACK = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif'
const TEXT_COLOR = '#1c2b4a'
const ACCENT_COLOR = '#c8a24a'

// 日本語向けに 1 文字ずつ幅を測って折り返す
// 半角スペースは行頭に残さないよう trim する
function wrapText(ctx, text, maxWidth) {
  const lines = []
  let current = ''
  for (const char of text) {
    if (char === '\n') {
      lines.push(current)
      current = ''
      continue
    }
    const next = current + char
    if (ctx.measureText(next).width > maxWidth && current !== '') {
      lines.push(current)
      current = char === ' ' ? '' : char
    } else {
      current = next
    }
  }
  lines.push(current)
  return lines
}

// 与えられた領域に収まる最大のフォントサイズと折り返し結果を探す
function fitText(ctx, text, maxWidth, maxHeight) {
  for (let fontSize = 68; fontSize >= 22; fontSize -= 2) {
    ctx.font = `700 ${fontSize}px ${FONT_STACK}`
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = fontSize * 1.32
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lines, lineHeight }
    }
  }
  ctx.font = `700 22px ${FONT_STACK}`
  return { fontSize: 22, lines: wrapText(ctx, text, maxWidth), lineHeight: 22 * 1.32 }
}

// 1 面分のテクスチャを作る。背景は透明で、文字と面番号だけを描く
// faceNumber はサイコロらしさのために隅へ小さく入れる出目 (1〜6)
export function createFaceTexture(text, faceNumber) {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')

  const padding = TEXTURE_SIZE * 0.12
  const maxWidth = TEXTURE_SIZE - padding * 2
  const maxHeight = TEXTURE_SIZE - padding * 2.6

  const { lines, lineHeight } = fitText(ctx, text || '　', maxWidth, maxHeight)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = TEXT_COLOR

  const blockHeight = lines.length * lineHeight
  const startY = TEXTURE_SIZE / 2 - blockHeight / 2 + lineHeight / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, TEXTURE_SIZE / 2, startY + i * lineHeight)
  })

  // 面番号（左上の小さな数字）と装飾の枠線
  ctx.font = `700 34px ${FONT_STACK}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = ACCENT_COLOR
  ctx.fillText(String(faceNumber), padding * 0.5, padding * 0.5)

  ctx.strokeStyle = 'rgba(200, 162, 74, 0.55)'
  ctx.lineWidth = 5
  ctx.strokeRect(padding * 0.42, padding * 0.42, TEXTURE_SIZE - padding * 0.84, TEXTURE_SIZE - padding * 0.84)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
