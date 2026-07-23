import Phaser from 'phaser'
import { CityScene } from './scenes/CityScene'

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#c9a46c',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || window.innerWidth,
      height: parent.clientHeight || window.innerHeight,
    },
    scene: [CityScene],
    input: {
      mouse: {
        preventDefaultWheel: true,
      },
    },
    render: {
      antialias: true,
      pixelArt: false,
      transparent: false,
    },
  }
}
