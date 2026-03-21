import {rows, cols, gameState} from './board.js';

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

export function populatePieces() {

	// create game pieces dynamically
	// - cell positions normalised relative to upper left of piece bounding box

	for (let i = 0; i < pieceTray.length; i++) {
		let row = pieceTray[i];

		for (let j = 0; j < row.length; j++) {
			if (row[j] != " ") {

				if (!(row[j] in pieces)) {
					pieces[row[j]] = {start: [i, j], cells: [[0,0]], dim: [], offset: []};

				} else {
					let x_off = i - pieces[row[j]].start[0];
					let y_off = j - pieces[row[j]].start[1];
					pieces[row[j]].cells.push([x_off, y_off])
				}
			}
		}
	}
	for (let item in pieces) {

		let p = pieces[item];

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

		// set bounding box
		p.dim = [x_max - x_min + 1, y_max - y_min + 1];

		// set correct origin
		p.start = [
			p.start[0] + x_min + 1,
			p.start[1] + y_min + 1
		];

		// set placement offset
		p.offset = [
			Math.ceil((p.dim[0] / 2) + 0.5),
			Math.ceil((p.dim[1] / 2) + 0.5)
		];
	}
};

export function populatePlayerTrayState() {
	for (let i = 0; i < gameState.playerCount; i++) {
		gameState.playerTrays[i] = {};

		for (const piece in pieces) {
			gameState.playerTrays[i][piece] = true;
		}

	}
};