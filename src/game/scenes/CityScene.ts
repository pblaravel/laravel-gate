import Phaser from 'phaser'
import { ASSET_KEYS, buildCityLayout } from '../cityLayout'
import { depthFor, isoToScreen } from '../iso'

const MAP_SIZE = 20
const WORLD_PADDING = 900

export class CityScene extends Phaser.Scene {
  private isDragging = false
  private dragStart = new Phaser.Math.Vector2()
  private camStart = new Phaser.Math.Vector2()

  constructor() {
    super('CityScene')
  }

  preload() {
    for (const key of ASSET_KEYS) {
      this.load.image(key, `assets/sprites/${key}.png`)
    }
  }

  create() {
    const layout = buildCityLayout(MAP_SIZE)

    let minX = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    for (const item of layout) {
      const { x, y } = isoToScreen(item.col, item.row, 0, 0)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    const worldW = maxX - minX + WORLD_PADDING * 2
    const worldH = maxY - minY + WORLD_PADDING * 2
    const offsetX = -minX + WORLD_PADDING
    const offsetY = -minY + WORLD_PADDING

    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBackgroundColor('#c9a46c')
    this.createDesertBackdrop(worldW, worldH)

    for (const item of layout) {
      if (!this.textures.exists(item.key)) continue

      const { x, y } = isoToScreen(item.col, item.row, offsetX, offsetY)
      const sprite = this.add.image(x, y, item.key)
      sprite.setOrigin(0.5, item.originY ?? 0.9)
      sprite.setScale(item.scale ?? 0.6)
      if (item.flipX) sprite.setFlipX(true)
      sprite.setDepth(depthFor(item.col, item.row, item.depthBias ?? 0))

      if (item.key.startsWith('banner_')) {
        this.tweens.add({
          targets: sprite,
          angle: { from: -2.2, to: 2.2 },
          duration: 1800 + Math.random() * 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      if (item.key === 'brazier') {
        this.tweens.add({
          targets: sprite,
          scaleX: sprite.scaleX * 1.04,
          scaleY: sprite.scaleY * 1.06,
          alpha: { from: 0.92, to: 1 },
          duration: 420 + Math.random() * 220,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
    }

    this.createDust(worldW, worldH)
    this.setupCameraControls(worldW, worldH)

    const center = isoToScreen(MAP_SIZE / 2, MAP_SIZE / 2, offsetX, offsetY)
    this.cameras.main.centerOn(center.x, center.y + 80)
    this.cameras.main.setZoom(0.72)

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 0.78,
      duration: 2200,
      ease: 'Sine.easeOut',
    })
  }

  private createDesertBackdrop(worldW: number, worldH: number) {
    const g = this.add.graphics().setDepth(-20000)
    g.fillGradientStyle(0xe8c789, 0xe8c789, 0xc4934a, 0xb87d38, 1)
    g.fillRect(0, 0, worldW, worldH)

    g.fillStyle(0xd4a85a, 0.35)
    for (let i = 0; i < 8; i += 1) {
      const y = worldH * (0.15 + i * 0.1)
      g.fillEllipse(worldW * (0.2 + (i % 3) * 0.3), y, worldW * 0.55, 120)
    }

    g.fillStyle(0x8a6a45, 0.45)
    const mountainY = worldH * 0.18
    g.fillTriangle(worldW * 0.05, mountainY + 180, worldW * 0.18, mountainY - 40, worldW * 0.3, mountainY + 180)
    g.fillTriangle(worldW * 0.25, mountainY + 180, worldW * 0.42, mountainY - 90, worldW * 0.58, mountainY + 180)
    g.fillTriangle(worldW * 0.55, mountainY + 180, worldW * 0.72, mountainY - 30, worldW * 0.9, mountainY + 180)
  }

  private createDust(worldW: number, worldH: number) {
    const dustKey = 'dust-dot'
    if (!this.textures.exists(dustKey)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false)
      g.fillStyle(0xf4e2c0, 0.9)
      g.fillCircle(4, 4, 3)
      g.generateTexture(dustKey, 8, 8)
      g.destroy()
    }

    this.add
      .particles(0, 0, dustKey, {
        x: { min: 0, max: worldW },
        y: { min: 0, max: worldH },
        lifespan: { min: 4000, max: 9000 },
        speedX: { min: 8, max: 28 },
        speedY: { min: -6, max: 6 },
        scale: { start: 0.4, end: 1.2 },
        alpha: { start: 0.22, end: 0 },
        quantity: 2,
        frequency: 180,
        blendMode: 'ADD',
      })
      .setDepth(50000)
  }

  private setupCameraControls(worldW: number, worldH: number) {
    const cam = this.cameras.main

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return
      this.isDragging = true
      this.dragStart.set(pointer.x, pointer.y)
      this.camStart.set(cam.scrollX, cam.scrollY)
    })

    this.input.on('pointerup', () => {
      this.isDragging = false
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return
      const zoom = cam.zoom
      cam.scrollX = this.camStart.x - (pointer.x - this.dragStart.x) / zoom
      cam.scrollY = this.camStart.y - (pointer.y - this.dragStart.y) / zoom
    })

    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown[],
        _deltaX: number,
        deltaY: number,
      ) => {
        cam.setZoom(Phaser.Math.Clamp(cam.zoom - deltaY * 0.0012, 0.35, 1.6))
      },
    )

    this.events.on('update', () => {
      const maxScrollX = Math.max(0, worldW - cam.width / cam.zoom)
      const maxScrollY = Math.max(0, worldH - cam.height / cam.zoom)
      cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, maxScrollX)
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, maxScrollY)
    })
  }
}
