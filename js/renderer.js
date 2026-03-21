import {rows, cols, gameState} from './board.js';
import {pieces, pieceTray} from './pieces.js';


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

export function createPieceElements() {
	let tray = $("#pieceContainer");

	for (let item in pieces) {
		let piece = pieces[item];
		let piece_start = piece.start;
		let piece_cells = piece.cells;

		let piece_div = $("<div>", {
			class: "piece",
			style: `grid-area: ${piece_start[0]} / ${piece_start[1]}`,
			"data-id": item,
			"data-width": piece.dim[0],
			"data-height": piece.dim[1]
		});

		for (const cell of piece_cells) {
			let cell_div = $("<div>", {
				class: "cell",
				style: `grid-area: ${cell[0]} / ${cell[1]}`
			});
			piece_div.append(cell_div);
		}
		tray.append(piece_div);

		gameState.pieceElements[item] = piece_div;
	}
};

export function updateCursorPiece(e, letter) {
	let cursor = $("#cursor-piece");

	// reset element rotation and state rotation
	cursor.css("transform", "none");
	gameState.heldPiece.rotation = 0;


	cursor.hide().empty();

	if (!letter) return;

	let template = gameState.pieceElements[letter];
	let clone = template.clone(false);


	cursor.append(clone).show();

	moveCursorPiece(e);
};

export function moveCursorPiece(e) {

	let cursor = $("#cursor-piece");

	let x_off = cursor.width() / 2;
	let y_off = cursor.height() / 2;

	cursor.css({
		left: e.clientX - x_off,
		top: e.clientY - y_off
	});

};


export function highlightTrayPiece(pieceCode) {
	gameState.pieceElements[pieceCode].addClass("selected");
};

export function clearTrayHighlight(pieceCode) {
	gameState.pieceElements[pieceCode].removeClass("selected");
};


export function markTrayPieceUsed(pieceCode) {
	gameState.pieceElements[pieceCode].addClass("used");
};

export function clearTrayUsed(pieceCode) {
	gameState.pieceElements[pieceCode].removeClass("used");
};


export function renderGhostCells(cells) {

	clearGhostCells();

	for (const [r,c] of cells) {
		gameState.cellElements[r][c].addClass("ghost");
	}
};

export function clearGhostCells() {
	$(".ghost").removeClass("ghost");
};


export function setCursorInvalid(invalid) {

	const cursor = $("#cursor-piece");

	if (invalid) {
		cursor.addClass("invalid");
	} else {
		cursor.removeClass("invalid");
	}
};

export function resetTrayUI() {

	$("#cursor-piece").empty().hide();
	$("#pieceContainer .piece").removeClass("used selected");
};

export function hideCursorPiece() {
	$("#cursor-piece").hide();
}

export function showCursorPiece() {
	$("#cursor-piece").show();
}

export function rotateCursor() {

	// do nothing if no piece in hand
	if (!gameState.heldPiece.piece) return;

	let rot = gameState.heldPiece.rotation;

	rot = (rot + 1) % 4

	gameState.heldPiece.rotation = rot;

	$("#cursor-piece").css("transform", `rotate(${rot*90}deg)`);
};