import {CELL, DEFAULT_SETTINGS, EMPTY_HELD_PIECE} from './constants.js';

export const gameState = {
	currentPlayer: 0,
	playerCount: DEFAULT_SETTINGS.playerCount,
	settings: {...DEFAULT_SETTINGS},
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

export function getBoardSize() {
	return {
		rows: gameState.settings.boardSize,
		cols: gameState.settings.boardSize
	};
}

export function setGameSettings(settings) {
	const playerCount = Number(settings.playerCount);
	const boardSize = Number(settings.boardSize);
	const pieceTrayLayout = settings.pieceTrayLayout === "compact" ? "compact" : "classic";

	if (![2, 3, 4].includes(playerCount)) return false;
	if (![14, 20, 26].includes(boardSize)) return false;

	gameState.settings = {playerCount, boardSize, pieceTrayLayout};
	gameState.playerCount = playerCount;
	return true;
}


export function initialiseBoard() {
	const {rows, cols} = getBoardSize();

	for (let r=0; r < rows; r++) {

		gameState.boardState[r] = [];
		for (let c=0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	if (gameState.anchorCells) addAnchorCells();
};

function addAnchorCells() {
	const {rows, cols} = getBoardSize();
	const inset = Math.max(1, Math.floor(rows / 4));
	const anchors = [
		[inset, inset],
		[inset, cols - inset - 1],
		[rows - inset - 1, inset],
		[rows - inset - 1, cols - inset - 1]
	];
	const playerAnchors = gameState.playerCount === 2
		? [anchors[0], anchors[3]]
		: gameState.playerCount === 3
			? [anchors[0], anchors[1], anchors[3]]
			: anchors;

	for (let player = 0; player < gameState.playerCount; player++) {
		const [row, col] = playerAnchors[player];
		gameState.boardState[row][col] = player + 1;
	}
}

export function clearBoard() {
	const {rows, cols} = getBoardSize();

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	if (gameState.anchorCells) addAnchorCells();
};

export function encodeCoord(r, c) {
	return (r * getBoardSize().cols) + c;
};

export function decodeCoord(value) {
	const cols = getBoardSize().cols;
	let rem = value % cols;
	return [Math.floor(value / cols), rem];
};

export function testEncodeDecode(coord) {
	console.log("Test Commencing");
	console.log("Original coord: ", coord);
	let encoded = encodeCoord(coord[0], coord[1]);
	console.log("Encoded: ", encoded);
	let decoded = decodeCoord(encoded);
	console.log("Decoded: ", decoded);
	console.log("r equal: ", coord[0] == decoded[0]);
	console.log("c equal: ", coord[1] == decoded[1]);
};

export function placePiece(cells, player) {
	for (const [r, c] of cells) {
		gameState.boardState[r][c] = player + 1;
	}
}