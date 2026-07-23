import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from './config'

export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return

    const game = new Phaser.Game(createGameConfig(hostRef.current))
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div className="phaser-host" ref={hostRef} />
}
