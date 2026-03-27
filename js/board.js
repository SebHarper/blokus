export const rows = 20;
export const cols = 20;

export const gameState = {
	currentPlayer: 0,
	playerCount: 4,
	boardState: [],

	playerTrays: [],

	moveHistory: [],

	hadFirstMove: [false, false, false, false],

	heldPiece: {pieceID: null, rotation: 0, flipped: false},
	heldPieceGeometry: null,
	selectedPiece: null,

	cellElements: [],
	pieceElements: {},

	cursorElement: null,
	cursorFlipElement: null,

	ghostCells: [],
	hoverRow: null,
	hoverCol: null,
	
	mouse: {x: 0, y: 0}
};

export const UIState = {
	
};

window.gameState = gameState;

export const CELL = {
	EMPTY: 0,
	PLAYER_1: 1,
	PLAYER_2: 2,
	PLAYER_3: 3,
	PLAYER_4: 4,
	GHOST: -1
};

export const EMPTY_HELD_PIECE = { pieceID:null, rotation:0, flipped:false };

export function initialiseBoard() {

	for (let r=0; r < rows; r++) {

		gameState.boardState[r] = [];
		for (let c=0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	// gameState.boardState[5][5] = 1;
	// gameState.boardState[5][15] = 2;
	// gameState.boardState[15][5] = 3;
	// gameState.boardState[15][15] = 4;
};

export function clearBoard() {

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
};

function encodeCoord(r, c) {
	return (r * cols) + c;
};

function decodeCoord(value) {
	let rem = value % cols;
	return [Math.floor(value / cols), rem];
};

export function testEnccodeDecode(coord) {
	console.log("Test Commencing");
	console.log("Original coord: ", coord);
	let encoded = encodeCoord(coord[0], coord[1]);
	console.log("Encoded: ", encoded);
	let decoded = decodeCoord(encoded);
	console.log("Decoded: ", decoded);
	console.log("r equal: ", coord[0] == decoded[0]);
	console.log("c equal: ", coord[1] == decoded[1]);
};


let cardinalNeighbourOffsets = [[0, 1], [1, 0], [0, -1], [-1, 0]];
let diagonalNeighbourOffsets = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
let boardCorners = [];


export function getPiecePreview(piece, row, col) {

	if (!piece) return [];

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

export function placePieceFromGhost() {

	for (const cell of gameState.ghostCells) {
		gameState.boardState[cell[0]][cell[1]] = gameState.currentPlayer + 1;
	}

};

export function canPlacePiece() {
	if (!gameState.heldPieceGeometry) return false;

	if (gameState.ghostCells.length === 0) return false;

	return true;
}