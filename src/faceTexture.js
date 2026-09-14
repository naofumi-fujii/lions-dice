// サイコロの面に貼るテキストテクスチャ生成 (src/faceTexture.js)
// Canvas 2D に日本語のトークテーマを描画し、THREE.CanvasTexture として返す
// テレビ番組のトークテーマ用サイコロに寄せて、面ごとにパステルのベタ塗り＋黒の太文字にする

import * as THREE from 'three'

const TEXTURE_SIZE = 512
// 丸ゴシックを優先し、無い環境ではゴシックへ落とす
const FONT_STACK =
  '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif'
const TEXT_COLOR = '#1d1a17'
// 面ごとの地色。番組で使われていたサイコロは面がパステルのベタ塗りなので、
// アプリコット / ターコイズ / ラベンダー / コーラル / イエロー / 水色の 6 色にする
const FACE_COLORS = ['#f7c079', '#5bd2c3', '#e2b5e6', '#f59aa2', '#ffd64d', '#9ed4ef']

// 角丸の矩形パスを引く
function roundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

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
  for (let fontSize = 104; fontSize >= 24; fontSize -= 2) {
    ctx.font = `900 ${fontSize}px ${FONT_STACK}`
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = fontSize * 1.18
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lines, lineHeight }
    }
  }
  ctx.font = `900 24px ${FONT_STACK}`
  return { fontSize: 24, lines: wrapText(ctx, text, maxWidth), lineHeight: 24 * 1.18 }
}

// 1 面分のテクスチャを作る。面の地色をベタ塗りし、その上に文字を描く
// faceIndex は地色を面ごとに変えるための 0 始まりの面番号
export function createFaceTexture(text, faceIndex) {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const ctx = canvas.getContext('2d')

  // 面いっぱいのベタ塗り。角を丸めて、サイコロ本体の丸みに色が乗るようにする
  ctx.fillStyle = FACE_COLORS[faceIndex % FACE_COLORS.length]
  roundRectPath(ctx, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE, 76)
  ctx.fill()

  // トークテーマ本文。地色の上に黒い太文字を面いっぱいに置く
  const textPadding = 44
  const maxWidth = TEXTURE_SIZE - textPadding * 2
  const maxHeight = TEXTURE_SIZE - textPadding * 2

  const { lines, lineHeight } = fitText(ctx, text || '　', maxWidth, maxHeight)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = TEXT_COLOR

  const blockHeight = lines.length * lineHeight
  const startY = TEXTURE_SIZE / 2 - blockHeight / 2 + lineHeight / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, TEXTURE_SIZE / 2, startY + i * lineHeight)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
