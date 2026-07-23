export type CitySprite = {
  key: string
  col: number
  row: number
  scale?: number
  originY?: number
  depthBias?: number
  flipX?: boolean
}

/** Fortified desert city: continuous walls, one main gate, moderate housing. */
export function buildCityLayout(size = 20): CitySprite[] {
  const items: CitySprite[] = []
  const last = size - 1
  const mid = Math.floor(size / 2)

  const push = (key: string, col: number, row: number, extras: Partial<CitySprite> = {}) => {
    items.push({ key, col, row, ...extras })
  }

  const inPlaza = (col: number, row: number) =>
    col >= mid - 2 && col <= mid + 1 && row >= mid - 2 && row <= mid + 1

  const isRoad = (col: number, row: number) => {
    const avenue = col === mid || col === mid - 1 || row === mid || row === mid - 1
    const toGate = row >= last - 3 && col >= mid - 2 && col <= mid + 1
    return avenue || toGate
  }

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

  // Straight wall runs — only long/short straight pieces (never corner/arch in the middle).
  // Step 2 + scale ~0.42 matches original footprint so segments abut along each edge.
  const wallScale = 0.42
  const wallOriginY = 0.86
  const gateCols = new Set([mid - 1, mid, mid + 1])

  for (let i = 1; i < last; i += 2) {
    const northKey = i % 4 === 1 ? 'wall_banner' : 'wall_plain'
    const eastKey = i % 4 === 1 ? 'wall_plain' : 'wall_banner'
    const southKey = i % 4 === 1 ? 'wall_banner' : 'wall_plain'
    const westKey = i % 4 === 1 ? 'wall_plain' : 'wall_banner'

    // North edge (row = 0) — native facing
    push(northKey, i, 0, { scale: wallScale, originY: wallOriginY })

    // East edge (col = last) — native facing along this axis
    push(eastKey, last, i, { scale: wallScale, originY: wallOriginY })

    // West edge (col = 0) — mirror to face outward
    push(westKey, 0, i, { scale: wallScale, originY: wallOriginY, flipX: true })

    // South edge (row = last) — mirror; leave opening for main gate
    if (!gateCols.has(i) && !gateCols.has(i + 1)) {
      push(southKey, i, last, { scale: wallScale, originY: wallOriginY, flipX: true })
    }
  }

  // True corner connectors at the four corners
  push('wall_corner', 1, 0, { scale: 0.4, originY: 0.86, depthBias: -2 })
  push('wall_corner', last - 1, 0, { scale: 0.4, originY: 0.86, depthBias: -2 })
  push('wall_corner', 1, last, { scale: 0.4, originY: 0.86, flipX: true, depthBias: -2 })
  push('wall_corner', last - 1, last, { scale: 0.4, originY: 0.86, flipX: true, depthBias: -2 })

  // Corner + mid-wall towers (join points between wall segments)
  const towers: Array<{ col: number; row: number; key: string; scale?: number }> = [
    { col: 0, row: 0, key: 'tower_tall', scale: 0.72 },
    { col: last, row: 0, key: 'tower_spiral', scale: 0.72 },
    { col: 0, row: last, key: 'tower_mid', scale: 0.72 },
    { col: last, row: last, key: 'tower_short', scale: 0.72 },
    { col: 5, row: 0, key: 'tower_mid' },
    { col: 14, row: 0, key: 'tower_short' },
    { col: last, row: 5, key: 'tower_spiral' },
    { col: last, row: 14, key: 'tower_mid' },
    { col: 5, row: last, key: 'tower_short' },
    { col: 14, row: last, key: 'tower_tall' },
    { col: 0, row: 5, key: 'tower_mid' },
    { col: 0, row: 14, key: 'tower_spiral' },
  ]
  towers.forEach((t) => {
    push(t.key, t.col, t.row, {
      scale: t.scale ?? 0.68,
      originY: 0.92,
      depthBias: 30,
    })
  })

  // Main gateway — on the south perimeter, centered, facing the viewer (no flip)
  push('gateway', mid, last, { scale: 0.52, originY: 0.92, depthBias: 55 })
  // Flanking wall stubs that meet the gate towers
  push('wall_plain', mid - 2, last, {
    scale: 0.4,
    originY: 0.86,
    flipX: true,
    depthBias: 20,
  })
  push('wall_plain', mid + 2, last, {
    scale: 0.4,
    originY: 0.86,
    flipX: true,
    depthBias: 20,
  })

  // Palace / landmark — north-east cluster
  push('house_wide', 14, 3, { scale: 0.7, originY: 0.9, depthBias: 25 })
  push('tower_tall', 15, 2, { scale: 0.78, originY: 0.92, depthBias: 35 })
  push('tower_spiral', 13, 2, { scale: 0.68, originY: 0.92, depthBias: 30 })
  push('tower_mid', 16, 3, { scale: 0.66, originY: 0.92, depthBias: 28 })
  push('house_a', 13, 4, { scale: 0.58, originY: 0.9 })
  push('house_b', 16, 4, { scale: 0.58, originY: 0.9 })
  push('banner_a', 13, 3, { scale: 0.52, originY: 0.95 })
  push('banner_c', 16, 2, { scale: 0.52, originY: 0.95 })

  // Central plaza
  push('fountain', mid, mid, { scale: 0.72, originY: 0.88, depthBias: 18 })
  push('mosaic', mid - 1, mid - 1, { scale: 1.05, originY: 0.5, depthBias: -900 })
  push('well', mid - 2, mid, { scale: 0.52, originY: 0.88 })
  push('brazier', mid + 1, mid - 1, { scale: 0.55, originY: 0.88 })
  push('brazier', mid - 1, mid + 1, { scale: 0.55, originY: 0.88 })

  // Market around plaza (compact ring, not city-wide)
  const market: Array<[string, number, number, number]> = [
    ['stall_a', mid - 2, mid - 1, 0.68],
    ['stall_b', mid - 2, mid + 1, 0.68],
    ['stall_c', mid + 1, mid - 2, 0.68],
    ['stall_a', mid + 1, mid + 1, 0.68],
    ['stall_b', mid - 1, mid - 2, 0.65],
    ['stall_c', mid, mid + 2, 0.65],
    ['barrels', mid - 3, mid, 0.52],
    ['crates', mid + 2, mid, 0.52],
    ['pottery', mid, mid - 2, 0.75],
    // small bazaar near south gate approach
    ['stall_a', mid - 1, last - 3, 0.62],
    ['stall_b', mid + 1, last - 3, 0.62],
    ['stall_c', mid, last - 4, 0.6],
  ]
  market.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.88 })
  })

  // Residential quarters — explicit spots, moderate density (4 blocks)
  const houses: Array<[string, number, number, number]> = [
    // NW
    ['house_a', 3, 3, 0.56],
    ['house_small', 5, 3, 0.68],
    ['house_b', 3, 5, 0.56],
    ['house_a', 5, 5, 0.54],
    ['house_wide', 3, 7, 0.48],
    // NE (below palace)
    ['house_small', 14, 5, 0.66],
    ['house_a', 16, 6, 0.54],
    ['house_b', 14, 7, 0.54],
    ['house_a', 17, 7, 0.52],
    // SW
    ['house_b', 3, 12, 0.54],
    ['house_a', 5, 12, 0.54],
    ['house_small', 3, 14, 0.64],
    ['house_a', 5, 14, 0.52],
    ['house_wide', 4, 16, 0.48],
    // SE
    ['house_a', 14, 12, 0.54],
    ['house_b', 16, 12, 0.54],
    ['house_small', 14, 14, 0.64],
    ['house_a', 16, 14, 0.52],
    ['house_wide', 15, 16, 0.48],
    // near avenues
    ['house_a', 7, 4, 0.5],
    ['house_b', 12, 4, 0.5],
    ['house_small', 7, 14, 0.6],
    ['house_a', 12, 15, 0.5],
  ]
  houses.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.9 })
  })

  // Banners & lamps along main road
  ;[
    [mid - 1, 4],
    [mid + 1, 4],
    [mid - 1, 7],
    [mid + 1, 7],
    [mid - 1, 13],
    [mid + 1, 13],
    [mid - 1, 16],
    [mid + 1, 16],
  ].forEach(([col, row], i) => {
    push(`banner_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.52,
      originY: 0.95,
    })
  })

  ;[
    [mid - 2, mid - 2],
    [mid + 1, mid - 2],
    [mid - 2, mid + 1],
    [mid + 1, mid + 1],
  ].forEach(([col, row], i) => {
    push(`lamp_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.48,
      originY: 0.95,
      depthBias: 8,
    })
  })

  // Trees — small clusters, not orchard rows
  const trees: Array<[number, number]> = [
    [2, 2],
    [4, 1],
    [17, 2],
    [18, 4],
    [2, 17],
    [4, 18],
    [17, 17],
    [18, 15],
    [7, 3],
    [12, 3],
    [6, 8],
    [13, 8],
    [6, 12],
    [13, 13],
    // outside near south approach
    [mid - 3, last + 1],
    [mid + 2, last + 1],
    [-1, 8],
    [last + 1, 10],
  ]
  trees.forEach(([col, row], i) => {
    push(`tree_${i % 4}`, col, row, { scale: 0.7, originY: 0.95, depthBias: 12 })
  })

  // Approach props outside the main gate
  push('barrels', mid - 1, last + 1, { scale: 0.5, originY: 0.85 })
  push('crates', mid + 1, last + 1, { scale: 0.5, originY: 0.85 })
  push('pottery', mid, last + 1, { scale: 0.7, originY: 0.85 })

  return items
}

export const ASSET_KEYS = [
  'gateway',
  'wall_banner',
  'wall_plain',
  'wall_corner',
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
