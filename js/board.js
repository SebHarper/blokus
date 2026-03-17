export const rows = 20;
export const cols = 20;

export const gameState = {
	originalPiece: null,
	heldPiece: null,
	boardState: [],
	cellElements: [],
	ghostCells: [],
	hoverRow: null,
	hoverCol: null
};

export const CELL = {
	EMPTY: 0,
	FILLED: 1,
	GHOST: 2
};

export function initialiseBoard() {

	for (let r=0; r < rows; r++) {

		gameState.boardState[r] = [];
		for (let c=0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	gameState.boardState[10][10] = CELL.FILLED;
};

export function createCellElements() {

	let boardElement = $("#game");
	boardElement.empty();

	for (let r=0; r < rows; r++) {

		gameState.cellElements[r] = [];

		for (let c=0; c < cols; c++) {

			let cell = $(`<div class="cell"></div>`)
			.attr("data-row", r)
			.attr("data-col", c);

			boardElement.append(cell);
			gameState.cellElements[r][c] = cell;
		}
	}
};

export function renderCell(row, col) {
	let cellState = gameState.boardState[row][col];

	let cell = gameState.cellElements[row][col]

	if (cellState === CELL.EMPTY) {
		cell.addClass("empty");
		cell.removeClass("filled");
		cell.removeClass("ghost");
	}
	else if (cellState === CELL.FILLED){
		cell.removeClass("empty");
		cell.addClass("filled");
		cell.removeClass("ghost");
	}
	else if (cellState === CELL.GHOST){
		cell.removeClass("empty");
		cell.removeClass("filled");
		cell.addClass("ghost");	}
};

export function renderBoard() {

	for (let r=0; r < rows; r++) {
		for (let c=0; c < cols; c++) {
			renderCell(r, c);
		}
	}
};

export function clearBoard() {

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	renderBoard();
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

	let previewCells = [];

	// let cardinalAdjacentCells = [];
	// let diagonalAdjacentCells = [];

	let cardinalAdjacentCells = new Set();
	let diagonalAdjacentCells = new Set();

	let diagonalCheck = false;
	let touchingCorner = false;

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

	let onlyCorners = diagonalAdjacentCells.difference(cardinalAdjacentCells);

	// check for any filled adjacent cells
	for (const value of cardinalAdjacentCells) {

		let r, c;
		[r, c] = decodeCoord(value);

		if (r < 0 || r >= rows || c < 0 || c >= cols) {
			continue;
		}

		if (gameState.boardState[r][c] === CELL.FILLED) {
			return [];
		}
	}

	// check piece is diagonally adjacent to another
	for (const value of diagonalAdjacentCells) {

		let r, c;
		[r, c] = decodeCoord(value);

		if (r < 0 || r >= rows || c < 0 || c >= cols) {
			continue;
		}

		if (gameState.boardState[r][c] === CELL.FILLED) {
			diagonalCheck = true;
		}
	}

	if (diagonalCheck || touchingCorner) {
		return previewCells;
	}

	return [];
};

export function attemptPlacePiece() {

	if (!gameState.heldPiece) return;

	if (gameState.ghostCells.length == 0) return;

	for (const cell of gameState.ghostCells) {
		gameState.boardState[cell[0]][cell[1]] = CELL.FILLED;
	}

	renderBoard();

	$("#cursor-piece").empty().hide();
	gameState.heldPiece = null;
	gameState.originalPiece = null;
};