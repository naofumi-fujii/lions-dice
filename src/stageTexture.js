// スタジオの床と背景のテクスチャ生成 (src/stageTexture.js)
// Canvas 2D で市松模様のマットと背景のグラデーションを描き、THREE.CanvasTexture として返す

import * as THREE from 'three'

// サイコロが転がるマットの市松模様。番組ではこの床が緑と黄色だった
const CHECKER_COLS = 8
const CHECKER_ROWS = 5
const CHECKER_CELL = 64
const CHECKER_COLORS = ['#f2d84b', '#63bd6a']
const CHECKER_EDGE = '#fbf1df'

// 背景の壁のグラデーション。上を暖色の濃いめ、下を床に近いクリームにして奥行きを出す
const BACKDROP_HEIGHT = 512
const BACKDROP_STOPS = [
  [0, '#e79f80'],
  [0.45, '#f4c7a4'],
  [0.78, '#f9e0c6'],
  [1, '#fbead7'],
]

// Canvas を sRGB のテクスチャにする
function toTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

// 市松模様のマットのテクスチャを作る。縁はクリームで細く囲む
export function createCheckerTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = CHECKER_COLS * CHECKER_CELL
  canvas.height = CHECKER_ROWS * CHECKER_CELL
  const ctx = canvas.getContext('2d')

  for (let row = 0; row < CHECKER_ROWS; row += 1) {
    for (let col = 0; col < CHECKER_COLS; col += 1) {
      ctx.fillStyle = CHECKER_COLORS[(row + col) % 2]
      ctx.fillRect(col * CHECKER_CELL, row * CHECKER_CELL, CHECKER_CELL, CHECKER_CELL)
    }
  }

  ctx.strokeStyle = CHECKER_EDGE
  ctx.lineWidth = 14
  ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14)

  return toTexture(canvas)
}

// 背景の壁に貼るグラデーションのテクスチャを作る
export function createBackdropTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = BACKDROP_HEIGHT
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 0, BACKDROP_HEIGHT)
  BACKDROP_STOPS.forEach(([offset, color]) => gradient.addColorStop(offset, color))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, BACKDROP_HEIGHT)

  return toTexture(canvas)
}
