import {CELL, BOARD_SIZE, RENDER_FRONTIER} from './constants.js';
import {gameState, encodeCoord, decodeCoord} from './board.js';

let { rows, cols } = BOARD_SIZE;

let cardinalNeighbourOffsets = [[0, 1], [1, 0], [0, -1], [-1, 0]];
let diagonalNeighbourOffsets = [[1, 1], [1, -1], [-1, -1], [-1, 1]];

export function getPiecePreview(piece, row, col) {

	if (!piece) return [];

	if (row < 0 || row >= rows || col < 0 || col >= cols) {
		return [];
	}

	let previewCells = [];

	let cardinalAdjacentCells = new Set();
	let diagonalAdjacentCells = new Set();

	let diagonalCheck = false;
	let touchingCorner = false;

	const currentPlayerCell = CELL.PLAYER_1 + gameState.currentPlayer;
	const isFirstMove = !gameState.hadFirstMove[gameState.currentPlayer];

	for (const cellOffset of piece.cells) {
		const r = row + cellOffset[0] - piece.offset[0];
		const c = col + cellOffset[1] - piece.offset[1];

		previewCells.push([r, c]);

		if (r < 0 || r >= rows || c < 0 || c >= cols) {
			return [];
		}

		if (gameState.boardState[r][c] !== CELL.EMPTY) {
			return [];
		}

		// cardinal neighbours [N, E, S, W]
		for (const offset of cardinalNeighbourOffsets) {
			const nr = r + offset[0];
			const nc = c + offset[1];

			if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
				continue;
			}

			let key = encodeCoord(nr, nc);

			cardinalAdjacentCells.add(key);
		}

		// diagonal neighbours [NE, SE, SW, NW]
		for (const offset of diagonalNeighbourOffsets) {
			const nr = r + offset[0];
			const nc = c + offset[1];

			if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
				continue;
			}

			let key = encodeCoord(nr, nc);

			diagonalAdjacentCells.add(key);
		}

		if ((r == 0 || r == rows - 1) && (c == 0 || c == cols - 1)) {
			touchingCorner = true;
		}

	}

	// let onlyCorners = diagonalAdjacentCells.difference(cardinalAdjacentCells);

	// check for any filled adjacent cells
	for (const value of cardinalAdjacentCells) {

		let [r, c] = decodeCoord(value);

		if (r < 0 || r >= rows || c < 0 || c >= cols) {
			continue;
		}

		if (gameState.boardState[r][c] === currentPlayerCell) {
			return [];
		}
	}

	// check piece is diagonally adjacent to another
	for (const value of diagonalAdjacentCells) {

		let [r, c] = decodeCoord(value);

		if (r < 0 || r >= rows || c < 0 || c >= cols) {
			continue;
		}

		if (gameState.boardState[r][c] === currentPlayerCell) {
			diagonalCheck = true;
		}
	}

	if (diagonalCheck || ( touchingCorner && isFirstMove )) {
		return previewCells;
	}

	return [];
};

export function canPlacePiece() {
	if (!gameState.heldPieceGeometry) return false;

	if (gameState.ghostCells.length === 0) return false;

	return true;
}

function hasPlayerNeighbour(r, c, offsets, player) {
	let adjacent = false;

	for (const offset of offsets) {
		const nr = r + offset[0];
		const nc = c + offset[1];

		if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
			continue;
		}

		if (gameState.boardState[nr][nc] === player) {
			adjacent = true;
			break;
		}
	}
	return adjacent;
}

// Frontier cell:
// empty cells diagonally adjacent to the player and not side-adjacent
//
// Player move must contain at least 1 frontier cell
// used for finding number of valid moves player can make
export function getFrontierCells(player) {

	const validCells = [];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (gameState.boardState[r][c] !== CELL.EMPTY) continue;

			let sideAdjacent = hasPlayerNeighbour(r, c, cardinalNeighbourOffsets, player + 1);

			if (sideAdjacent) continue;

			let diagAdjacent = hasPlayerNeighbour(r, c, diagonalNeighbourOffsets, player + 1);

			if (diagAdjacent) {
				validCells.push([r, c]);
			}
		}
	}
	gameState.frontierCells[player] = validCells;
}