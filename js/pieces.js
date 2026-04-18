import {BOARD_SIZE} from './constants.js';
import {gameState} from './board.js';

let { rows, cols } = BOARD_SIZE;

//SIZE: 12 x 17
export const pieceTray = [
	"AAA   BB   C",
	"A   D  BBB C",
	"A DDDD     C",
	"       E  CC",
	"FFFFF EEE   ",
	"       E  GG",
	"HH I J   GG ",
	"HH I JJJ G  ",
	"H  I   J   K",
	"     L   KKK",
	"MM LLL N    ",
	"MM  L  N   O",
	"      NNN OO",
	"PPP Q      O",
	"P P QQ RR   ",
	"        RR S",
	"TTTT UU     "
];

export const pieces = {};

export const trayPiecePositions = {};

export const pieceMouseOffsets = {};

export function populatePieces() {

	// create game pieces dynamically
	// - cell positions normalised relative to upper left of piece bounding box

	const tempPieces = {};

	for (let i = 0; i < pieceTray.length; i++) {
		let row = pieceTray[i];

		for (let j = 0; j < row.length; j++) {
			const id = row[j];
			if (id != " ") {

				if (!(id in tempPieces)) {
					tempPieces[id] = {cells: [[0,0]], origin: [i, j]};

				} else {
					let x_off = i - tempPieces[id].origin[0];
					let y_off = j - tempPieces[id].origin[1];
					tempPieces[id].cells.push([x_off, y_off])
				}
			}
		}
	}
	for (let id in tempPieces) {

		let p = tempPieces[id];

		let x_min = 100;
		let x_max = -100;
		let y_min = 100;
		let y_max = -100;

		// pass one: compute bounding box
		for (const cell of p.cells) {
			x_min = Math.min(cell[0], x_min);
			x_max = Math.max(cell[0], x_max);
			y_min = Math.min(cell[1], y_min);
			y_max = Math.max(cell[1], y_max);
		}

		// pass two: normalise cells (1-indexed)
		for (const cell of p.cells) {
			cell[0] = cell[0] - x_min + 1;
			cell[1] = cell[1] - y_min + 1;
		}

		// set piece data
		pieces[id] = {
			cells: p.cells,
			dim: [x_max - x_min + 1, y_max - y_min + 1],
			offset: [
				Math.ceil((x_max - x_min + 1) / 2),
				Math.ceil((y_max - y_min + 1) / 2)
			],
			geometries: [],
			transformMap: {}
		};

		// set piece position in tray
		trayPiecePositions[id] = {
			position: [
				p.origin[0] + x_min + 1,
				p.origin[1] + y_min + 1
			]
		};

		// set piece mouse offset
		pieceMouseOffsets[id] = {
			offset: [
				Math.ceil((x_max - x_min + 1) / 2),
				Math.ceil((y_max - y_min + 1) / 2)
			]
		};

	}
	computePieceGeometries();
};

function sortCoords(coords) {
	coords.sort((a, b) => {
		if (a[0] !== b[0]) return a[0] - b[0];
		return a[1] - b[1];
	});
	return coords;
}

function hashPiece(piece) {
	let pieceRepr = `${piece.dim[0]},${piece.dim[1]}` + "|";

	const sorted_cells = sortCoords(structuredClone(piece.cells));

	for (let i = 0; i < sorted_cells.length; i++) {

		pieceRepr += `${sorted_cells[i][0]},${sorted_cells[i][1]};`
	}
	return pieceRepr;
}

function computePieceGeometries() {
	for (const id in pieces) {

		let seen = new Map();
		let geometries = [];
		let transformMap = {}; 

		for (let flip = 0; flip <2; flip++) {
			let piece = structuredClone(pieces[id]);

			if (flip === 1) piece = flipPiece(piece);

			for (let rot = 0; rot < 4; rot++) {
				const key = hashPiece(piece);

				let geomIndex;

				if (seen.has(key)) {
					geomIndex = seen.get(key);
				} else {
					geomIndex = geometries.length;

					seen.set(key, geomIndex);

					geometries.push({
						cells: structuredClone(piece.cells),
						dim: [piece.dim[0], piece.dim[1]],
						offset: [piece.offset[0], piece.offset[1]]
					});
				}
				transformMap[`${flip}-${rot}`] = geomIndex;

				piece = rotatePiece(piece);
			}
		}
		pieces[id].geometries = geometries;
		pieces[id].transformMap = transformMap;
	}
}


export function populatePlayerTrayState() {
	for (let i = 0; i < gameState.playerCount; i++) {
		gameState.playerTrays[i] = {};

		for (const piece in pieces) {
			gameState.playerTrays[i][piece] = true;
			gameState.playerTrays[i][piece] = true;
		}
	}
};

export function rotatePiece(piece) {
	const [rows, cols] = piece.dim;
	const [rOff, cOff] = piece.offset;

	let new_piece = structuredClone(piece);

	for (let i = 0; i < new_piece.cells.length; i++) {
		const [r, c] = new_piece.cells[i];
		new_piece.cells[i] = [c, rows - r + 1];
	}
	new_piece.dim = [cols, rows];
	new_piece.offset = [cOff, rows - rOff + 1];

	return new_piece;
};

export function flipPiece(piece) {
	const [rows, cols] = piece.dim;
	const [rOff, cOff] = piece.offset;

	let new_piece = structuredClone(piece);

	for (let i = 0; i < new_piece.cells.length; i++) {
		const [r, c] = new_piece.cells[i];
		new_piece.cells[i] = [r, cols - c + 1];
	}
	new_piece.offset = [rOff, cols - cOff + 1];

	return new_piece;
};

export function computeHeldPieceGeometry() {
	const held = gameState.heldPiece;

	if (!held.pieceID) return;

	let pieceDef = pieces[held.pieceID];

	const flip = held.flipped ? 1 : 0;
	const rot = held.rotation;

	const effectiveRot = flip ? (4 - rot) % 4 : rot;

	const key = `${flip}-${effectiveRot}`;
	const geomIndex = pieceDef.transformMap[key];

	gameState.heldPieceGeometry = pieceDef.geometries[geomIndex];
};

export function calcPlayerScores() {

	for (let i = 0; i < gameState.playerCount; i++) {
		let playerScore = 0;

		for (const [piece, playerHasPiece] of Object.entries(gameState.playerTrays[i])) {

			if (playerHasPiece) {
				playerScore += pieces[piece].cells.length;
			}
		}
		gameState.playerScores[i] = playerScore;
	}
}