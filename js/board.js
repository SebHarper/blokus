import {BOARD_SIZE, CELL, EMPTY_HELD_PIECE} from './constants.js';

let { rows, cols } = BOARD_SIZE;

export const gameState = {
	currentPlayer: 0,
	playerCount: 2,
	boardState: [],

	playerTrays: [],

	playerScores: [0,0,0,0],

	moveHistory: [],

	hadFirstMove: [false, false, false, false],

	anchorCells: true,

	heldPiece: {pieceID: null, rotation: 0, flipped: false},
	heldPieceGeometry: null,
	selectedPiece: null,

	cellElements: [],
	pieceElements: {},
	
	scoreElements: {},

	cursorElement: null,

	ghostCells: [],
	hoverRow: null,
	hoverCol: null,

	mouse: {x: 0, y: 0},

	frontierCells: [[], [], [], []],

};

export const UIState = {
	
};

export function initialiseBoard() {

	for (let r=0; r < rows; r++) {

		gameState.boardState[r] = [];
		for (let c=0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	if (gameState.anchorCells) addAnchorCells();
};

function addAnchorCells() {
	gameState.boardState[5][5] = 1;
	gameState.boardState[5][15] = 2;
	gameState.boardState[15][5] = 3;
	gameState.boardState[15][15] = 4;
}

export function clearBoard() {

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	if (gameState.anchorCells) addAnchorCells();
};

export function encodeCoord(r, c) {
	return (r * cols) + c;
};

export function decodeCoord(value) {
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