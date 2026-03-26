/**
 * pieces.js — Mosaic piece system
 * The 10×10 grid is divided into 4 quadrants (pieces) of 25 tiles each:
 *   Piece 0: top-left     (rows 0-4, cols 0-4)
 *   Piece 1: top-right    (rows 0-4, cols 5-9)
 *   Piece 2: bottom-left  (rows 5-9, cols 0-4)
 *   Piece 3: bottom-right (rows 5-9, cols 5-9)
 */

/**
 * Return which piece (0-3) a tile at (x=col, y=row) belongs to.
 * @param {number} x  column index 0-9
 * @param {number} y  row index 0-9
 * @returns {0|1|2|3}
 */
export function getPieceForTile(x, y) {
  if (y < 5 && x < 5) return 0;
  if (y < 5 && x >= 5) return 1;
  if (y >= 5 && x < 5) return 2;
  return 3;
}

/**
 * Return all 25 tile positions for a given piece id.
 * @param {number} pieceId  0-3
 * @returns {{ x: number, y: number }[]}
 */
export function getPieceTiles(pieceId) {
  const tiles = [];
  const rowStart = pieceId >= 2 ? 5 : 0;
  const colStart = (pieceId === 1 || pieceId === 3) ? 5 : 0;
  for (let y = rowStart; y < rowStart + 5; y++) {
    for (let x = colStart; x < colStart + 5; x++) {
      tiles.push({ x, y });
    }
  }
  return tiles;
}

/**
 * Check whether all 25 tiles of a piece have been painted.
 * @param {{ x: number, y: number }[]} tiles  painted tiles array
 * @param {number} pieceId
 * @returns {boolean}
 */
export function isPieceComplete(tiles, pieceId) {
  const pieceTiles = getPieceTiles(pieceId);
  return pieceTiles.every(pt =>
    tiles.some(t => t.x === pt.x && t.y === pt.y)
  );
}

/**
 * Return an array of piece IDs (0-3) that are fully complete.
 * @param {{ x: number, y: number }[]} tiles
 * @returns {number[]}
 */
export function getCompletedPieces(tiles) {
  return [0, 1, 2, 3].filter(id => isPieceComplete(tiles, id));
}

/**
 * Returns true when all 100 tiles have been painted.
 * @param {{ x: number, y: number }[]} tiles
 * @returns {boolean}
 */
export function isLastTileOverall(tiles) {
  return tiles.length >= 100;
}

/**
 * Returns how many tiles of a piece have been painted so far.
 * @param {{ x: number, y: number }[]} tiles
 * @param {number} pieceId
 * @returns {number}  0-25
 */
export function getPieceProgress(tiles, pieceId) {
  const pieceTiles = getPieceTiles(pieceId);
  return pieceTiles.filter(pt =>
    tiles.some(t => t.x === pt.x && t.y === pt.y)
  ).length;
}
