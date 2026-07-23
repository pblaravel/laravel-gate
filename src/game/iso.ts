// Match ground tile sprite width (~147px) so perimeter pieces abut correctly.
export const TILE_WIDTH = 140
export const TILE_HEIGHT = 70

export type GridPos = {
  col: number
  row: number
}

export function isoToScreen(
  col: number,
  row: number,
  originX: number,
  originY: number,
  tileW = TILE_WIDTH,
  tileH = TILE_HEIGHT,
) {
  return {
    x: (col - row) * (tileW / 2) + originX,
    y: (col + row) * (tileH / 2) + originY,
  }
}

export function depthFor(col: number, row: number, bias = 0) {
  return (col + row) * 10 + bias
}
