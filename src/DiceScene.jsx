// 物理演算サイコロの 3D シーン (src/DiceScene.jsx)
// three.js (@react-three/fiber) + Rapier 物理エンジンでサイコロを転がし、
// 静止した時に上を向いた面を法線ベクトルから判定して App へ通知する

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { createFaceTexture } from './faceTexture'

const DICE_SIZE = 1.4
const DICE_HALF = DICE_SIZE / 2
// 転がる範囲は横に広く奥行きは浅い帯にし、中心を奥へずらす。
// こうすると画面下部の結果テロップとサイコロが重ならない
const ARENA_HALF_X = 3.0
const ARENA_HALF_Z = 1.8
const ARENA_CENTER_Z = -0.8
const WALL_HEIGHT = 9

// 面インデックスとサイコロのローカル軸の対応
// createFaceTexture / themes.js の配列順と一致させること
const FACE_AXES = [
  [1, 0, 0], // 0: +X
  [-1, 0, 0], // 1: -X
  [0, 1, 0], // 2: +Y
  [0, -1, 0], // 3: -Y
  [0, 0, 1], // 4: +Z
  [0, 0, -1], // 5: -Z
]

// 各面のテキストプレーンを面の外側に少しだけ浮かせて貼るための座標と回転
const FACE_DECALS = [
  { position: [DICE_HALF + 0.004, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { position: [-DICE_HALF - 0.004, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { position: [0, DICE_HALF + 0.004, 0], rotation: [-Math.PI / 2, 0, 0] },
  { position: [0, -DICE_HALF - 0.004, 0], rotation: [Math.PI / 2, 0, 0] },
  { position: [0, 0, DICE_HALF + 0.004], rotation: [0, 0, 0] },
  { position: [0, 0, -DICE_HALF - 0.004], rotation: [0, Math.PI, 0] },
]

const UP = new THREE.Vector3(0, 1, 0)

// Rapier のソルバは高摩擦だとサイコロを辺や角の上で安定させてしまうことがある
// （50000 回の試行で約 2.2%）。実物のサイコロでは起きないので、
// これより傾いて止まった場合は軽く弾いて転がし直す
const FLAT_DOT = Math.cos((12 * Math.PI) / 180)
const MAX_NUDGES = 6
const NUDGE_UP = 3.6
const NUDGE_TORQUE = 6.5

// 現在の姿勢から、最も上を向いているローカル軸（= 出目の面）と
// その軸が鉛直にどれだけ近いか（dot が 1 に近いほど面が水平）を返す
function detectTopFace(rotation) {
  const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
  const axis = new THREE.Vector3()
  let bestIndex = 0
  let bestDot = -Infinity
  FACE_AXES.forEach((a, i) => {
    axis.set(a[0], a[1], a[2]).applyQuaternion(quaternion)
    const dot = axis.dot(UP)
    if (dot > bestDot) {
      bestDot = dot
      bestIndex = i
    }
  })
  return { face: bestIndex, dot: bestDot }
}

// サイコロ本体。rollToken が変わるたびに投げ直す
function Dice({ themes, rollToken, onSettle }) {
  const body = useRef(null)
  const rolling = useRef(false)
  const stillFrames = useRef(0)
  const deadline = useRef(0)
  const nudges = useRef(0)

  // テーマが変わったら 6 面のテクスチャを作り直す
  const textures = useMemo(
    () => themes.map((text, i) => createFaceTexture(text, i + 1)),
    [themes],
  )

  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])

  // サイコロを投げる。初期位置・姿勢・速度をランダムに与える
  useEffect(() => {
    if (rollToken === 0 || !body.current) return

    const startX = (Math.random() - 0.5) * 2.4
    const startZ = ARENA_CENTER_Z + 1.3 + Math.random() * 0.4
    body.current.setTranslation({ x: startX, y: 4.6, z: startZ }, true)

    const spin = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
    )
    body.current.setRotation({ x: spin.x, y: spin.y, z: spin.z, w: spin.w }, true)

    body.current.setLinvel(
      {
        x: -startX * 0.9 + (Math.random() - 0.5) * 3,
        y: -2.5,
        z: (ARENA_CENTER_Z - startZ) * 1.8 + (Math.random() - 0.5) * 2,
      },
      true,
    )
    body.current.setAngvel(
      { x: (Math.random() - 0.5) * 34, y: (Math.random() - 0.5) * 34, z: (Math.random() - 0.5) * 34 },
      true,
    )
    body.current.wakeUp()

    rolling.current = true
    stillFrames.current = 0
    nudges.current = 0
    deadline.current = performance.now() + 9000
  }, [rollToken])

  // 毎フレーム速度を監視し、十分止まったら出目を確定する
  useFrame(() => {
    if (!rolling.current || !body.current) return

    const lv = body.current.linvel()
    const av = body.current.angvel()
    const speed = Math.hypot(lv.x, lv.y, lv.z)
    const spin = Math.hypot(av.x, av.y, av.z)

    if (speed < 0.08 && spin < 0.08) {
      stillFrames.current += 1
    } else {
      stillFrames.current = 0
    }

    // 何かに引っかかって止まらない場合の保険として時間切れで打ち切る
    const timedOut = performance.now() > deadline.current
    if (stillFrames.current <= 24 && !timedOut) return

    const { face, dot } = detectTopFace(body.current.rotation())

    // 辺や角の上で止まっていたら、上へ軽く弾いて転がし直す
    if (!timedOut && dot < FLAT_DOT && nudges.current < MAX_NUDGES) {
      nudges.current += 1
      stillFrames.current = 0
      deadline.current += 3000
      const mass = body.current.mass()
      body.current.wakeUp()
      body.current.applyImpulse(
        {
          x: (Math.random() - 0.5) * NUDGE_UP * 0.4 * mass,
          y: NUDGE_UP * mass,
          z: (Math.random() - 0.5) * NUDGE_UP * 0.4 * mass,
        },
        true,
      )
      body.current.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * NUDGE_TORQUE,
          y: (Math.random() - 0.5) * NUDGE_TORQUE,
          z: (Math.random() - 0.5) * NUDGE_TORQUE,
        },
        true,
      )
      return
    }

    rolling.current = false
    onSettle(face)
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[0, DICE_HALF, ARENA_CENTER_Z]}
      restitution={0.32}
      friction={0.75}
      linearDamping={0.22}
      angularDamping={0.32}
      canSleep
    >
      <CuboidCollider args={[DICE_HALF, DICE_HALF, DICE_HALF]} density={2.2} />
      <RoundedBox args={[DICE_SIZE, DICE_SIZE, DICE_SIZE]} radius={0.17} smoothness={5} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f6f1e6" roughness={0.34} clearcoat={0.9} clearcoatRoughness={0.18} />
      </RoundedBox>
      {FACE_DECALS.map((decal, i) => (
        <mesh key={i} position={decal.position} rotation={decal.rotation}>
          <planeGeometry args={[DICE_SIZE * 0.72, DICE_SIZE * 0.72]} />
          <meshStandardMaterial
            map={textures[i]}
            transparent
            roughness={0.5}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-4}
          />
        </mesh>
      ))}
    </RigidBody>
  )
}

// 床と、サイコロが画面外へ飛び出さないための見えない壁
function Arena() {
  return (
    <RigidBody type="fixed" colliders={false} friction={0.85} restitution={0.2}>
      <CuboidCollider args={[ARENA_HALF_X, 0.5, ARENA_HALF_Z]} position={[0, -0.5, ARENA_CENTER_Z]} />
      <CuboidCollider
        args={[0.5, WALL_HEIGHT, ARENA_HALF_Z]}
        position={[ARENA_HALF_X + 0.5, WALL_HEIGHT, ARENA_CENTER_Z]}
      />
      <CuboidCollider
        args={[0.5, WALL_HEIGHT, ARENA_HALF_Z]}
        position={[-ARENA_HALF_X - 0.5, WALL_HEIGHT, ARENA_CENTER_Z]}
      />
      <CuboidCollider
        args={[ARENA_HALF_X, WALL_HEIGHT, 0.5]}
        position={[0, WALL_HEIGHT, ARENA_CENTER_Z + ARENA_HALF_Z + 0.5]}
      />
      <CuboidCollider
        args={[ARENA_HALF_X, WALL_HEIGHT, 0.5]}
        position={[0, WALL_HEIGHT, ARENA_CENTER_Z - ARENA_HALF_Z - 0.5]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#15304a" roughness={0.65} metalness={0.1} />
      </mesh>
    </RigidBody>
  )
}

// シーン全体。App から themes / rollToken を受け取り、出目を onSettle で返す
export default function DiceScene({ themes, rollToken, onSettle }) {
  return (
    <Canvas shadows camera={{ position: [0, 5.2, 7.8], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#081522']} />
      <fog attach="fog" args={['#081522', 12, 26]} />

      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#9fd0ff', '#0b1c2c', 0.5]} />
      <spotLight
        position={[4, 11, 6]}
        angle={0.55}
        penumbra={0.6}
        intensity={420}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 8, -4]} intensity={1.1} color="#ffd9a0" />

      <Physics gravity={[0, -26, 0]}>
        <Arena />
        <Dice themes={themes} rollToken={rollToken} onSettle={onSettle} />
      </Physics>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1, ARENA_CENTER_Z]}
      />
    </Canvas>
  )
}
