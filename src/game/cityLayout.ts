import type { GridPos } from './iso'

export type CitySprite = {
  key: string
  col: number
  row: number
  scale?: number
  originY?: number
  depthBias?: number
  flipX?: boolean
}

/** Dense walled desert city matching the reference composition. */
export function buildCityLayout(size = 20): CitySprite[] {
  const items: CitySprite[] = []
  const last = size - 1

  const push = (key: string, col: number, row: number, extras: Partial<CitySprite> = {}) => {
    items.push({ key, col, row, ...extras })
  }

  // Ground tiles
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const inPlaza = col >= 8 && col <= 11 && row >= 8 && row <= 11
      const onRoad =
        (col >= 9 && col <= 10) ||
        (row >= 9 && row <= 10) ||
        (row === last - 2 && col >= 8 && col <= 11)

      let key = 'tile_a'
      if (inPlaza) key = 'mosaic'
      else if (onRoad) key = 'tile_b'
      else key = (col + row) % 3 === 0 ? 'tile_c' : 'tile_a'

      push(key, col, row, { scale: 0.92, originY: 0.5, depthBias: -1000 })
    }
  }

  // Perimeter walls + corner towers
  const wallKeys = ['wall_banner', 'wall_plain', 'wall_corner'] as const
  for (let i = 1; i < last; i += 2) {
    push(wallKeys[i % wallKeys.length], i, 0, { scale: 0.42, originY: 0.85 })
    push(wallKeys[(i + 1) % wallKeys.length], last, i, { scale: 0.42, originY: 0.85 })
    push(wallKeys[(i + 2) % wallKeys.length], i, last, { scale: 0.42, originY: 0.85, flipX: true })
    push(wallKeys[i % wallKeys.length], 0, i, { scale: 0.42, originY: 0.85, flipX: true })
  }

  const cornerTowers: GridPos[] = [
    { col: 0, row: 0 },
    { col: last, row: 0 },
    { col: 0, row: last },
    { col: last, row: last },
  ]
  const towerKeys = ['tower_tall', 'tower_spiral', 'tower_mid', 'tower_short']
  cornerTowers.forEach((p, idx) => {
    push(towerKeys[idx % towerKeys.length], p.col, p.row, { scale: 0.72, originY: 0.92 })
  })

  // Wall mid towers
  ;[
    { col: 5, row: 0, key: 'tower_mid' },
    { col: 14, row: 0, key: 'tower_short' },
    { col: last, row: 5, key: 'tower_spiral' },
    { col: last, row: 14, key: 'tower_mid' },
    { col: 5, row: last, key: 'tower_short' },
    { col: 14, row: last, key: 'tower_tall' },
    { col: 0, row: 5, key: 'tower_mid' },
    { col: 0, row: 14, key: 'tower_spiral' },
  ].forEach((t) => push(t.key, t.col, t.row, { scale: 0.68, originY: 0.92 }))

  // Main gateway (south entrance)
  push('gateway', 10, last - 1, { scale: 0.55, originY: 0.9, depthBias: 40 })

  // Small gates
  push('gate_small_a', last - 1, 10, { scale: 0.45, originY: 0.88 })
  push('gate_small_b', 1, 10, { scale: 0.45, originY: 0.88, flipX: true })

  // Palace / landmark cluster (north-center)
  push('house_wide', 10, 3, { scale: 0.7, originY: 0.9 })
  push('house_b', 8, 3, { scale: 0.62, originY: 0.9 })
  push('house_a', 12, 3, { scale: 0.62, originY: 0.9 })
  push('tower_tall', 10, 2, { scale: 0.75, originY: 0.92, depthBias: 20 })
  push('tower_spiral', 9, 2, { scale: 0.65, originY: 0.92 })
  push('tower_mid', 11, 2, { scale: 0.65, originY: 0.92 })

  // Residential blocks
  const houseSpots: Array<[string, number, number, number]> = [
    ['house_a', 3, 3, 0.58],
    ['house_small', 5, 3, 0.7],
    ['house_b', 3, 5, 0.58],
    ['house_a', 5, 5, 0.55],
    ['house_wide', 3, 7, 0.5],
    ['house_small', 15, 3, 0.68],
    ['house_a', 17, 3, 0.55],
    ['house_b', 15, 5, 0.55],
    ['house_a', 17, 5, 0.55],
    ['house_wide', 15, 7, 0.48],
    ['house_a', 3, 12, 0.55],
    ['house_b', 5, 12, 0.55],
    ['house_small', 3, 14, 0.65],
    ['house_a', 5, 14, 0.52],
    ['house_b', 14, 12, 0.55],
    ['house_a', 16, 12, 0.55],
    ['house_wide', 14, 14, 0.48],
    ['house_small', 16, 14, 0.65],
    ['house_a', 7, 6, 0.5],
    ['house_b', 12, 6, 0.5],
    ['house_small', 7, 13, 0.62],
    ['house_a', 12, 13, 0.5],
  ]
  houseSpots.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.9 })
  })

  // Market bazaar near south gate
  push('stall_a', 8, 16, { scale: 0.7, originY: 0.88 })
  push('stall_b', 10, 16, { scale: 0.7, originY: 0.88 })
  push('stall_c', 12, 16, { scale: 0.7, originY: 0.88 })
  push('stall_a', 9, 15, { scale: 0.65, originY: 0.88 })
  push('stall_c', 11, 15, { scale: 0.65, originY: 0.88 })
  push('barrels', 8, 15, { scale: 0.55, originY: 0.85 })
  push('crates', 12, 15, { scale: 0.55, originY: 0.85 })
  push('pottery', 10, 15, { scale: 0.8, originY: 0.85 })

  // Central plaza
  push('fountain', 10, 10, { scale: 0.72, originY: 0.88, depthBias: 15 })
  push('mosaic', 9, 9, { scale: 1.05, originY: 0.5, depthBias: -900 })
  push('well', 8, 10, { scale: 0.55, originY: 0.88 })
  push('brazier', 12, 10, { scale: 0.6, originY: 0.88 })
  push('brazier', 10, 8, { scale: 0.55, originY: 0.88 })

  // Banners & lamps along main road
  ;[
    [9, 4],
    [11, 4],
    [9, 7],
    [11, 7],
    [9, 12],
    [11, 12],
    [9, 17],
    [11, 17],
  ].forEach(([col, row], i) => {
    push(`banner_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.55,
      originY: 0.95,
    })
  })

  ;[
    [8, 8],
    [12, 8],
    [8, 12],
    [12, 12],
    [7, 10],
    [13, 10],
  ].forEach(([col, row], i) => {
    push(`lamp_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.5,
      originY: 0.95,
    })
  })

  // Cypress trees
  const treeSpots: Array<[number, number]> = [
    [2, 2],
    [4, 1],
    [17, 2],
    [18, 4],
    [2, 17],
    [4, 18],
    [17, 17],
    [18, 15],
    [7, 4],
    [13, 4],
    [6, 9],
    [14, 9],
  ]
  treeSpots.forEach(([col, row], i) => {
    push(`tree_${i % 4}`, col, row, { scale: 0.7, originY: 0.95 })
  })

  return items
}

export const ASSET_KEYS = [
  'gateway',
  'wall_banner',
  'wall_plain',
  'wall_corner',
  'gate_small_a',
  'gate_small_b',
  'tower_tall',
  'tower_mid',
  'tower_spiral',
  'tower_short',
  'house_wide',
  'house_a',
  'house_b',
  'house_small',
  'stall_a',
  'stall_b',
  'stall_c',
  'banner_a',
  'banner_b',
  'banner_c',
  'banner_d',
  'lamp_a',
  'lamp_b',
  'lamp_c',
  'lamp_d',
  'barrels',
  'crates',
  'pottery',
  'brazier',
  'well',
  'fountain',
  'tree_0',
  'tree_1',
  'tree_2',
  'tree_3',
  'tile_a',
  'tile_b',
  'tile_c',
  'mosaic',
] as const
