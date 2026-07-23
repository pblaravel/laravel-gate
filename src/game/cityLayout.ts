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
 * Fortified desert city.
 * Walls use only straight segments (wall_banner / wall_plain) with a fixed step
 * so pieces abut; corner towers hide the joints. One south-facing gateway.
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

  // Perimeter: straight pieces every 2 cells. Same facing rules as the original set:
  // north/east = native, south/west = flipX (mirrors onto the other iso diagonal).
  const STEP = 2
  const wallScale = 0.4
  const wallY = 0.87

  // South gate occupies cols 9-11 on the south edge
  const isSouthGateCol = (col: number) => col >= 9 && col <= 11

  for (let i = 2; i <= last - 2; i += STEP) {
    // North
    push(i % 4 === 0 ? 'wall_banner' : 'wall_plain', i, 0, {
      scale: wallScale,
      originY: wallY,
    })
    // East
    push(i % 4 === 0 ? 'wall_plain' : 'wall_banner', last, i, {
      scale: wallScale,
      originY: wallY,
    })
    // West
    push(i % 4 === 0 ? 'wall_banner' : 'wall_plain', 0, i, {
      scale: wallScale,
      originY: wallY,
      flipX: true,
    })
    // South — skip gate opening
    if (!isSouthGateCol(i)) {
      push(i % 4 === 0 ? 'wall_plain' : 'wall_banner', i, last, {
        scale: wallScale,
        originY: wallY,
        flipX: true,
      })
    }
  }

  // Towers at corners + mid-edge joints (cover wall seams)
  const towers: Array<[string, number, number]> = [
    ['tower_tall', 0, 0],
    ['tower_spiral', last, 0],
    ['tower_mid', 0, last],
    ['tower_short', last, last],
    ['tower_mid', 6, 0],
    ['tower_short', 14, 0],
    ['tower_spiral', last, 6],
    ['tower_mid', last, 14],
    ['tower_short', 6, last],
    ['tower_tall', 14, last],
    ['tower_mid', 0, 6],
    ['tower_spiral', 0, 14],
  ]
  towers.forEach(([key, col, row]) => {
    push(key, col, row, { scale: 0.7, originY: 0.92, depthBias: 28 })
  })

  // Main gateway: south edge, facing viewer, centered in the opening
  push('gateway', mid, last, { scale: 0.5, originY: 0.93, depthBias: 60 })

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

  // Compact market around fountain + a few stalls near the gate road
  ;[
    ['stall_a', 8, 9, 0.66],
    ['stall_b', 8, 11, 0.66],
    ['stall_c', 11, 8, 0.66],
    ['stall_a', 11, 11, 0.66],
    ['stall_b', 9, 8, 0.62],
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

  // Moderate housing — four sparse quarters (not every tile)
  const houses: Array<[string, number, number, number]> = [
    ['house_a', 3, 3, 0.55],
    ['house_small', 5, 4, 0.66],
    ['house_b', 3, 6, 0.54],
    ['house_a', 5, 7, 0.52],

    ['house_b', 14, 5, 0.54],
    ['house_small', 16, 6, 0.64],
    ['house_a', 15, 7, 0.52],

    ['house_a', 3, 12, 0.54],
    ['house_b', 5, 13, 0.52],
    ['house_small', 3, 15, 0.64],
    ['house_wide', 5, 16, 0.46],

    ['house_b', 14, 12, 0.54],
    ['house_a', 16, 13, 0.52],
    ['house_small', 15, 15, 0.64],
  ]
  houses.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.9 })
  })

  // Avenue banners / plaza lamps
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

  // Sparse trees
  ;[
    [2, 2],
    [17, 2],
    [2, 17],
    [17, 17],
    [7, 3],
    [12, 3],
    [4, 9],
    [15, 9],
    [7, 14],
    [13, 14],
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
