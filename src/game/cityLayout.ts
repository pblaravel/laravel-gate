export type CitySprite = {
  key: string
  col: number
  row: number
  scale?: number
  originY?: number
  depthBias?: number
  flipX?: boolean
}

/**
 * Desert city layout.
 * Perimeter uses only `wall_banner` (same length) with overlap so segments join.
 * One south-facing gateway; moderate housing in four quarters.
 */
export function buildCityLayout(size = 20): CitySprite[] {
  const items: CitySprite[] = []
  const last = size - 1
  const mid = 10

  const push = (key: string, col: number, row: number, extras: Partial<CitySprite> = {}) => {
    items.push({ key, col, row, ...extras })
  }

  const inPlaza = (col: number, row: number) =>
    col >= 8 && col <= 11 && row >= 8 && row <= 11

  const isRoad = (col: number, row: number) =>
    col === 9 ||
    col === 10 ||
    row === 9 ||
    row === 10 ||
    (row >= last - 3 && col >= 8 && col <= 11)

  // Ground
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      let key = 'tile_a'
      if (inPlaza(col, row)) key = 'mosaic'
      else if (isRoad(col, row)) key = 'tile_b'
      else key = (col + row) % 3 === 0 ? 'tile_c' : 'tile_a'
      push(key, col, row, { scale: 0.92, originY: 0.5, depthBias: -1000 })
    }
  }

  // Continuous wall ring — place every cell so long wall_banner sprites overlap solidly.
  const WALL_SCALE = 0.44
  const WALL_Y = 0.88

  const placeWall = (col: number, row: number, flipX = false, bias = 5) => {
    push('wall_banner', col, row, {
      scale: WALL_SCALE,
      originY: WALL_Y,
      flipX,
      depthBias: bias,
    })
  }

  // Facing: unflipped wall runs along +col (down-right); flipX runs along +row (down-left).
  for (let i = 1; i < last; i += 1) {
    placeWall(i, 0, false) // north (+col)
    placeWall(last, i, true) // east (+row)
    placeWall(0, i, true) // west (+row)

    // south (+col) — leave opening for the gateway (cols 8..12)
    if (i <= 7 || i >= 13) {
      placeWall(i, last, false)
    }
  }

  // Towers at corners and mid-edge (hide residual seams)
  const towers: Array<[string, number, number]> = [
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
  ]
  towers.forEach(([key, col, row]) => {
    push(key, col, row, { scale: 0.7, originY: 0.92, depthBias: 32 })
  })

  // Main gateway on the south perimeter, facing the viewer (no flip)
  push('gateway', mid, last, { scale: 0.5, originY: 0.93, depthBias: 70 })

  // Palace (NE)
  push('house_wide', 14, 3, { scale: 0.68, originY: 0.9, depthBias: 22 })
  push('tower_tall', 15, 2, { scale: 0.76, originY: 0.92, depthBias: 34 })
  push('tower_spiral', 13, 2, { scale: 0.66, originY: 0.92, depthBias: 30 })
  push('house_a', 16, 4, { scale: 0.55, originY: 0.9 })
  push('banner_a', 13, 3, { scale: 0.5, originY: 0.95 })

  // Plaza
  push('fountain', 10, 10, { scale: 0.7, originY: 0.88, depthBias: 16 })
  push('mosaic', 9, 9, { scale: 1.05, originY: 0.5, depthBias: -900 })
  push('well', 8, 10, { scale: 0.5, originY: 0.88 })
  push('brazier', 11, 9, { scale: 0.52, originY: 0.88 })
  push('brazier', 9, 11, { scale: 0.52, originY: 0.88 })

  // Compact market
  ;[
    ['stall_a', 8, 9, 0.66],
    ['stall_b', 8, 11, 0.66],
    ['stall_c', 11, 8, 0.66],
    ['stall_a', 11, 11, 0.66],
    ['pottery', 10, 8, 0.72],
    ['barrels', 7, 10, 0.5],
    ['crates', 12, 10, 0.5],
    ['stall_c', 9, 16, 0.6],
    ['stall_a', 11, 16, 0.6],
  ].forEach(([key, col, row, scale]) => {
    push(String(key), Number(col), Number(row), {
      scale: Number(scale),
      originY: 0.88,
    })
  })

  // Sparse housing — 4 quarters
  const houses: Array<[string, number, number, number]> = [
    ['house_a', 3, 3, 0.55],
    ['house_small', 5, 4, 0.66],
    ['house_b', 3, 6, 0.54],

    ['house_b', 14, 5, 0.54],
    ['house_small', 16, 6, 0.64],
    ['house_a', 15, 7, 0.52],

    ['house_a', 3, 12, 0.54],
    ['house_b', 5, 14, 0.52],
    ['house_small', 3, 15, 0.64],

    ['house_b', 14, 12, 0.54],
    ['house_a', 16, 14, 0.52],
    ['house_small', 15, 15, 0.64],
  ]
  houses.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.9 })
  })

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
      scale: 0.5,
      originY: 0.95,
    })
  })

  ;[
    [8, 8],
    [11, 8],
    [8, 11],
    [11, 11],
  ].forEach(([col, row], i) => {
    push(`lamp_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.46,
      originY: 0.95,
      depthBias: 8,
    })
  })

  ;[
    [2, 2],
    [17, 2],
    [2, 17],
    [17, 17],
    [7, 3],
    [12, 3],
    [4, 9],
    [15, 9],
    [8, last + 1],
    [12, last + 1],
  ].forEach(([col, row], i) => {
    push(`tree_${i % 4}`, col, row, { scale: 0.68, originY: 0.95, depthBias: 10 })
  })

  push('barrels', 9, last + 1, { scale: 0.48, originY: 0.85 })
  push('crates', 11, last + 1, { scale: 0.48, originY: 0.85 })

  return items
}

export const ASSET_KEYS = [
  'gateway',
  'wall_banner',
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
