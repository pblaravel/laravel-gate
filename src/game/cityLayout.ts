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

const HOUSE_KEYS = ['house_a', 'house_b', 'house_small', 'house_wide'] as const
const STALL_KEYS = ['stall_a', 'stall_b', 'stall_c'] as const
const TOWER_KEYS = ['tower_tall', 'tower_spiral', 'tower_mid', 'tower_short'] as const
const WALL_KEYS = ['wall_banner', 'wall_plain', 'wall_corner'] as const

function occupiedKey(col: number, row: number) {
  return `${col},${row}`
}

/** Dense walled desert city matching the reference composition. */
export function buildCityLayout(size = 24): CitySprite[] {
  const items: CitySprite[] = []
  const last = size - 1
  const occupied = new Set<string>()

  const push = (
    key: string,
    col: number,
    row: number,
    extras: Partial<CitySprite> = {},
    claim = true,
  ) => {
    if (col < -2 || row < -2 || col > last + 2 || row > last + 2) return
    items.push({ key, col, row, ...extras })
    if (claim && col >= 0 && row >= 0 && col <= last && row <= last) {
      occupied.add(occupiedKey(col, row))
    }
  }

  const mark = (col: number, row: number) => {
    if (col >= 0 && row >= 0 && col <= last && row <= last) {
      occupied.add(occupiedKey(col, row))
    }
  }

  const isInterior = (col: number, row: number) =>
    col >= 1 && row >= 1 && col <= last - 1 && row <= last - 1

  const isRoad = (col: number, row: number) => {
    const mainNS = col >= 11 && col <= 12
    const mainEW = row >= 11 && row <= 12
    const toGate = row >= last - 4 && col >= 10 && col <= 13
    const toPalace = col >= 16 && col <= 18 && row >= 3 && row <= 11
    return mainNS || mainEW || toGate || toPalace
  }

  const inPlaza = (col: number, row: number) =>
    col >= 10 && col <= 13 && row >= 10 && row <= 13

  // Ground tiles
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      let key = 'tile_a'
      if (inPlaza(col, row)) key = 'mosaic'
      else if (isRoad(col, row)) key = 'tile_b'
      else key = (col + row) % 3 === 0 ? 'tile_c' : 'tile_a'

      // Ground must not claim cells — otherwise houses never place
      push(key, col, row, { scale: 0.95, originY: 0.5, depthBias: -1000 }, false)
    }
  }

  // Continuous perimeter walls (only south edge opens for the main gateway)
  const wallOpts = { scale: 0.4, originY: 0.88 as number }
  for (let i = 1; i < last; i += 1) {
    // North edge (row = 0)
    push(WALL_KEYS[i % WALL_KEYS.length], i, 0, wallOpts)
    mark(i, 0)

    // East edge (col = last)
    push(WALL_KEYS[(i + 1) % WALL_KEYS.length], last, i, wallOpts)
    mark(last, i)

    // West edge (col = 0)
    push(WALL_KEYS[(i + 2) % WALL_KEYS.length], 0, i, {
      ...wallOpts,
      flipX: true,
    })
    mark(0, i)

    // South edge (row = last) — leave opening for gateway
    const southGate = i >= 10 && i <= 13
    if (!southGate) {
      push(WALL_KEYS[i % WALL_KEYS.length], i, last, {
        ...wallOpts,
        flipX: true,
      })
      mark(i, last)
    }
  }

  // Extra overlapping wall pieces so segments visually merge
  for (let i = 2; i < last; i += 2) {
    push('wall_plain', i, 0, { scale: 0.36, originY: 0.88, depthBias: -5 })
    push('wall_plain', last, i, { scale: 0.36, originY: 0.88, depthBias: -5 })
    push('wall_plain', 0, i, { scale: 0.36, originY: 0.88, flipX: true, depthBias: -5 })
    if (i < 10 || i > 13) {
      push('wall_plain', i, last, {
        scale: 0.36,
        originY: 0.88,
        flipX: true,
        depthBias: -5,
      })
    }
  }

  // Corner + mid-wall towers (reference: red-domed towers all around)
  const wallTowers: Array<{ col: number; row: number; key: (typeof TOWER_KEYS)[number] }> = [
    { col: 0, row: 0, key: 'tower_tall' },
    { col: last, row: 0, key: 'tower_spiral' },
    { col: 0, row: last, key: 'tower_mid' },
    { col: last, row: last, key: 'tower_short' },
    { col: 4, row: 0, key: 'tower_mid' },
    { col: 8, row: 0, key: 'tower_short' },
    { col: 15, row: 0, key: 'tower_tall' },
    { col: 19, row: 0, key: 'tower_spiral' },
    { col: last, row: 4, key: 'tower_mid' },
    { col: last, row: 8, key: 'tower_short' },
    { col: last, row: 15, key: 'tower_tall' },
    { col: last, row: 19, key: 'tower_spiral' },
    { col: 4, row: last, key: 'tower_short' },
    { col: 8, row: last, key: 'tower_mid' },
    { col: 15, row: last, key: 'tower_spiral' },
    { col: 19, row: last, key: 'tower_tall' },
    { col: 0, row: 4, key: 'tower_spiral' },
    { col: 0, row: 8, key: 'tower_tall' },
    { col: 0, row: 15, key: 'tower_mid' },
    { col: 0, row: 19, key: 'tower_short' },
  ]
  wallTowers.forEach((t) => {
    push(t.key, t.col, t.row, { scale: 0.7, originY: 0.92, depthBias: 25 })
  })

  // Main gateway — south entrance (bottom of diamond, slightly left like reference)
  push('gateway', 11, last - 1, { scale: 0.58, originY: 0.9, depthBias: 50 })
  mark(10, last - 1)
  mark(11, last - 1)
  mark(12, last - 1)
  mark(13, last - 1)
  mark(11, last)
  mark(12, last)

  // Side gates
  push('gate_small_a', last - 1, 11, { scale: 0.48, originY: 0.88, depthBias: 20 })
  push('gate_small_b', 1, 12, { scale: 0.48, originY: 0.88, flipX: true, depthBias: 20 })
  mark(last - 1, 11)
  mark(last - 1, 12)
  mark(1, 11)
  mark(1, 12)

  // Palace / temple complex — upper-right (high col, low row)
  const palace: Array<[string, number, number, number, number?]> = [
    ['house_wide', 17, 3, 0.78, 30],
    ['house_wide', 19, 3, 0.72, 28],
    ['tower_tall', 18, 2, 0.82, 40],
    ['tower_spiral', 16, 2, 0.72, 35],
    ['tower_mid', 20, 2, 0.72, 35],
    ['tower_short', 18, 1, 0.68, 32],
    ['house_a', 16, 4, 0.62],
    ['house_b', 19, 4, 0.62],
    ['house_small', 17, 5, 0.72],
    ['house_a', 20, 5, 0.58],
    ['banner_a', 16, 3, 0.55],
    ['banner_c', 20, 3, 0.55],
  ]
  palace.forEach(([key, col, row, scale, bias]) => {
    push(key, col, row, { scale, originY: 0.9, depthBias: bias ?? 0 })
  })

  // Central plaza landmarks
  push('fountain', 11, 11, { scale: 0.78, originY: 0.88, depthBias: 20 })
  push('mosaic', 12, 12, { scale: 1.1, originY: 0.5, depthBias: -900 })
  push('well', 10, 12, { scale: 0.55, originY: 0.88 })
  push('brazier', 13, 10, { scale: 0.58, originY: 0.88 })
  push('brazier', 10, 10, { scale: 0.55, originY: 0.88 })
  push('brazier', 13, 13, { scale: 0.55, originY: 0.88 })
  ;[
    [10, 10],
    [11, 10],
    [12, 10],
    [13, 10],
    [10, 11],
    [11, 11],
    [12, 11],
    [13, 11],
    [10, 12],
    [11, 12],
    [12, 12],
    [13, 12],
    [10, 13],
    [11, 13],
    [12, 13],
    [13, 13],
  ].forEach(([col, row]) => mark(col, row))

  // Market bazaar around plaza + approach to south gate (reference: colorful stalls near fountain)
  const marketSpots: Array<[string, number, number, number]> = [
    ['stall_a', 9, 10, 0.68],
    ['stall_b', 9, 11, 0.68],
    ['stall_c', 9, 12, 0.68],
    ['stall_a', 14, 10, 0.68],
    ['stall_b', 14, 11, 0.68],
    ['stall_c', 14, 12, 0.68],
    ['stall_a', 10, 9, 0.65],
    ['stall_b', 11, 9, 0.65],
    ['stall_c', 12, 9, 0.65],
    ['stall_a', 13, 9, 0.65],
    ['stall_b', 10, 14, 0.65],
    ['stall_c', 11, 14, 0.65],
    ['stall_a', 12, 14, 0.65],
    ['stall_b', 13, 14, 0.65],
    ['stall_c', 9, 14, 0.62],
    ['stall_a', 14, 14, 0.62],
    ['stall_b', 8, 11, 0.6],
    ['stall_c', 15, 11, 0.6],
    ['barrels', 8, 10, 0.55],
    ['crates', 15, 10, 0.55],
    ['pottery', 8, 12, 0.78],
    ['pottery', 15, 12, 0.78],
    ['barrels', 9, 15, 0.52],
    ['crates', 14, 15, 0.52],
    ['stall_a', 10, 16, 0.62],
    ['stall_b', 12, 16, 0.62],
    ['stall_c', 11, 17, 0.6],
  ]
  marketSpots.forEach(([key, col, row, scale]) => {
    push(key, col, row, { scale, originY: 0.88 })
  })

  // Dense residential blocks filling interior (skip roads / plaza / occupied)
  const houseCandidates: GridPos[] = []
  for (let row = 2; row <= last - 2; row += 1) {
    for (let col = 2; col <= last - 2; col += 1) {
      if (!isInterior(col, row)) continue
      if (inPlaza(col, row)) continue
      if (isRoad(col, row)) continue
      if (occupied.has(occupiedKey(col, row))) continue
      houseCandidates.push({ col, row })
    }
  }

  houseCandidates.forEach(({ col, row }, idx) => {
    const nearPalace = col >= 15 && row <= 7
    // Slight thinning so large sprites don't turn into a solid blob
    if (!nearPalace && (col * 5 + row * 11) % 7 === 0) {
      push(STALL_KEYS[idx % STALL_KEYS.length], col, row, {
        scale: 0.58,
        originY: 0.88,
      })
      return
    }

    const key = nearPalace
      ? HOUSE_KEYS[idx % 2 === 0 ? 3 : idx % 3]
      : HOUSE_KEYS[idx % HOUSE_KEYS.length]
    const scale =
      key === 'house_wide' ? 0.5 : key === 'house_small' ? 0.66 : 0.52
    push(key, col, row, { scale, originY: 0.9 })
  })

  // Banners & lamps along main avenues
  ;[
    [10, 4],
    [13, 4],
    [10, 7],
    [13, 7],
    [10, 15],
    [13, 15],
    [10, 18],
    [13, 18],
    [5, 11],
    [5, 12],
    [18, 11],
    [18, 12],
  ].forEach(([col, row], i) => {
    if (occupied.has(occupiedKey(col, row))) return
    push(`banner_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.52,
      originY: 0.95,
    })
  })

  ;[
    [9, 9],
    [14, 9],
    [9, 14],
    [14, 14],
    [7, 11],
    [16, 11],
    [11, 7],
    [12, 15],
  ].forEach(([col, row], i) => {
    push(`lamp_${['a', 'b', 'c', 'd'][i % 4]}`, col, row, {
      scale: 0.48,
      originY: 0.95,
      depthBias: 10,
    })
  })

  // Cypress trees inside city — clustered, not in straight orchard rows
  const innerTrees: Array<[number, number]> = [
    [3, 3],
    [4, 5],
    [2, 6],
    [6, 3],
    [5, 7],
    [20, 4],
    [21, 6],
    [19, 7],
    [3, 17],
    [5, 19],
    [4, 20],
    [2, 18],
    [19, 18],
    [21, 17],
    [20, 20],
    [17, 19],
    [8, 6],
    [15, 5],
    [7, 16],
    [16, 15],
  ]
  innerTrees.forEach(([col, row], i) => {
    if (occupied.has(occupiedKey(col, row)) && isRoad(col, row)) return
    push(`tree_${i % 4}`, col, row, { scale: 0.68, originY: 0.95, depthBias: 15 })
  })

  // Outer oasis clumps near approaches (reference: sparse palms/cypress outside walls)
  const outerTrees: Array<[number, number]> = [
    [-1, 9],
    [-2, 11],
    [-1, 14],
    [3, -1],
    [7, -2],
    [16, -1],
    [20, -2],
    [last + 1, 7],
    [last + 2, 11],
    [last + 1, 17],
    [6, last + 1],
    [9, last + 2],
    [15, last + 1],
    [18, last + 2],
  ]
  outerTrees.forEach(([col, row], i) => {
    push(`tree_${i % 4}`, col, row, { scale: 0.74, originY: 0.95, depthBias: 5 })
  })

  // Approach props outside south gate
  push('barrels', 10, last + 1, { scale: 0.5, originY: 0.85 })
  push('crates', 13, last + 1, { scale: 0.5, originY: 0.85 })
  push('pottery', 11, last + 2, { scale: 0.7, originY: 0.85 })
  push('banner_b', 10, last, { scale: 0.5, originY: 0.95 })
  push('banner_d', 13, last, { scale: 0.5, originY: 0.95 })

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
