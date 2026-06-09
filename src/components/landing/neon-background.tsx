"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

const BEAM_COUNT = 400
const SPREAD_X = 16
const SPREAD_Z = 10
const VERTICAL_RANGE = 24

type Beam = {
  x: number
  z: number
  speed: number
  length: number
  phase: number
  colorMix: number
}

export function NeonBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const width = el.clientWidth
    const height = el.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030712)

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.set(0, 0.5, 16)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const beams: Beam[] = []
    const positions = new Float32Array(BEAM_COUNT * 2 * 3)
    const alphas = new Float32Array(BEAM_COUNT * 2)

    for (let i = 0; i < BEAM_COUNT; i++) {
      beams.push({
        x: (Math.random() - 0.5) * SPREAD_X * 2,
        z: (Math.random() - 0.5) * SPREAD_Z * 2 - 2,
        speed: 0.03 + Math.random() * 0.1,
        length: 0.6 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
        colorMix: Math.random(),
      })
    }

    function updateGeometry(time: number) {
      const cGreen: [number, number, number] = [0.0, 0.898, 0.6]
      const cBlue: [number, number, number] = [0.0, 0.639, 1.0]

      for (let i = 0; i < BEAM_COUNT; i++) {
        const b = beams[i]
        const yPos = ((time * b.speed + b.phase) % VERTICAL_RANGE) - VERTICAL_RANGE / 2
        const h = b.length
        const vi = i * 6

        positions[vi + 0] = b.x
        positions[vi + 1] = yPos - h / 2
        positions[vi + 2] = b.z
        positions[vi + 3] = b.x
        positions[vi + 4] = yPos + h / 2
        positions[vi + 5] = b.z

        alphas[i * 2 + 0] = 1.0
        alphas[i * 2 + 1] = 0.0
      }
    }

    updateGeometry(0)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0x00e599) } },
      vertexShader: `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const mesh = new THREE.LineSegments(geometry, material as THREE.Material)
    scene.add(mesh)

    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    }
    window.addEventListener("mousemove", onMouseMove)

    let animId: number
    let elapsed = 0

    function animate() {
      elapsed += 0.016
      const t = elapsed * 0.35

      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      camera.position.x = mouseX * 1.5
      camera.position.y = -mouseY * 1.0
      camera.lookAt(0, 0, 0)

      updateGeometry(t)
      const pos = geometry.attributes.position as THREE.BufferAttribute
      pos.array.set(positions)
      pos.needsUpdate = true

      const alp = geometry.attributes.aAlpha as THREE.BufferAttribute
      alp.array.set(alphas)
      alp.needsUpdate = true

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    const onResize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(animId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10"
      style={{
        filter: "drop-shadow(0 0 10px #00e59933) drop-shadow(0 0 30px #00e59911)",
      }}
    />
  )
}
