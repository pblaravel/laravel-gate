export type CitySprite = {
  key: string
  col: number
  row: number
  scale?: number
  originY?: number
  depthBias?: number
  flipX?: boolean
}

/** Fortified desert city — continuous walls, one south gate, moderate housing. */
export function buildCityLayout(size = 20): CitySprite[] {
  const items: CitySprite[] = []
  const last = size - 1

  const push = (key: string, col: number, row: number, extras: Partial<CitySprite> = {}) => {
    items.push({ key, col, row, ...extras })
  }

  // Ground
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const inPlaza = col >= 8 && col <= 11 && row >= 8 && row <= 11
      const onRoad =
        col === 9 ||
        col === 10 ||
        row === 9 ||
        row === 10 ||
        (row >= last - 3 && col >= 8 && col <= 11)

      let key = 'tile_a'
      if (inPlaza) key = 'mosaic'
      else if (onRoad) key = 'tile_b'
      else key = (col + row) % 3 === 0 ? 'tile_c' : 'tile_a'

      push(key, col, row, { scale: 0.92, originY: 0.5, depthBias: -1000 })
    }
  }

  // Straight perimeter — only wall_banner (same length) so ends meet.
  // Facing from the original layout: N/E native, S/W flipX.
  const wallScale = 0.5
  const wallY = 0.85
  for (let i = 1; i < last; i += 2) {
    push('wall_banner', i, 0, { scale: wallScale, originY: wallY })
    push('wall_banner', last, i, { scale: wallScale, originY: wallY })
    push('wall_banner', 0, i, { scale: wallScale, originY: wallY, flipX: true })

    // South: skip cells occupied by the gateway
    if (i < 8 || i > 12) {
      push('wall_banner', i, last, { scale: wallScale, originY: wallY, flipX: true })
    }
  }

  // Corner + mid towers (join points)
  ;[
    ['tower_tall', 0, 0],
    ['tower_spiral', last, 0],
    ['tower_mid', 0, last],
    ['tower_short', last, last],
    ['tower_mid', 5, 0],
    ['tower_short', 14, 0],
    ['tower_spiral', last, 5],
    ['tower_mid', last, 14],
    ['tower_short', 5, last],
    ['tower_tall', 14, last],
    ['tower_mid', 0, 5],
    ['tower_spiral', 0, 14],
  ].forEach(([key, col, row]) => {
    push(String(key), Number(col), Number(row), {
      scale: 0.7,
      originY: 0.92,
      depthBias: 28,
    })
  })

  // Main gateway — south approach (same placement as original: one row inside edge)
  push('gateway', 10, last - 1, { scale: 0.55, originY: 0.9, depthBias: 45 })

  // Palace / landmark (north)
  push('house_wide', 10, 3, { scale: 0.7, originY: 0.9 })
  push('house_b', 8, 3, { scale: 0.58, originY: 0.9 })
  push('house_a', 12, 3, { scale: 0.58, originY: 0.9 })
  push('tower_tall', 10, 2, { scale: 0.75, originY: 0.92, depthBias: 20 })
  push('tower_spiral', 9, 2, { scale: 0.65, originY: 0.92 })
  push('tower_mid', 11, 2, { scale: 0.65, originY: 0.92 })

  // Residential — moderate, four corners (fewer than before)
  const houses: Array<[string, number, number, number]> = [
    ['house_a', 3, 3, 0.56],
    ['house_small', 5, 4, 0.68],
    ['house_b', 3, 6, 0.54],
    ['house_small', 15, 3, 0.66],
    ['house_a', 17, 4, 0.54],
    ['house_b', 15, 6, 0.54],
    ['house_a', 3, 13, 0.54],
    ['house_b', 5, 15, 0.52],
    ['house_small', 4, 16, 0.64],
    ['house_a', 15, 13, 0.54],
    ['house_b', 17, 14, 0.52],
    ['house_small', 15, 16, 0.64],
  ]
  houses.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.9 })
  })

  // Market near plaza + south road
  push('stall_a', 8, 9, { scale: 0.68, originY: 0.88 })
  push('stall_b', 11, 8, { scale: 0.68, originY: 0.88 })
  push('stall_c', 11, 11, { scale: 0.68, originY: 0.88 })
  push('stall_a', 8, 11, { scale: 0.65, originY: 0.88 })
  push('barrels', 7, 10, { scale: 0.52, originY: 0.85 })
  push('crates', 12, 10, { scale: 0.52, originY: 0.85 })
  push('pottery', 10, 8, { scale: 0.78, originY: 0.85 })
  push('stall_b', 9, 16, { scale: 0.62, originY: 0.88 })
  push('stall_c', 11, 16, { scale: 0.62, originY: 0.88 })

  // Plaza
  push('fountain', 10, 10, { scale: 0.72, originY: 0.88, depthBias: 15 })
  push('mosaic', 9, 9, { scale: 1.05, originY: 0.5, depthBias: -900 })
  push('well', 8, 10, { scale: 0.55, originY: 0.88 })
  push('brazier', 11, 9, { scale: 0.55, originY: 0.88 })
  push('brazier', 9, 11, { scale: 0.55, originY: 0.88 })

  ;[
    [9, 4],
    [11, 4],
    [9, 7],
    [11, 7],
    [9, 13],
    [11, 13],
    [9, 16],
    [11, 16],
  ].forEach(([col, row], i) => {
    push(`banner_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.52,
      originY: 0.95,
    })
  })

  ;[
    [8, 8],
    [12, 8],
    [8, 12],
    [12, 12],
  ].forEach(([col, row], i) => {
    push(`lamp_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.48,
      originY: 0.95,
    })
  })

  ;[
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
  ].forEach(([col, row], i) => {
    push(`tree_${i % 4}`, col, row, { scale: 0.7, originY: 0.95 })
  })

  return items
}

export const ASSET_KEYS = [
  'gateway',
  'wall_banner',
  'wall_plain',
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
