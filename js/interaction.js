import {gameState, CELL, renderBoard, getPiecePreview, attemptPlacePiece, clearBoard} from './board.js';
import {pieces} from './pieces.js';
import {updateCursorPosition, showGhostCells} from './cursor.js';


function showView(view) {
	$("#gameContainer, #settingsContainer, #tilesetOptionsContainer").hide();
	$(view).show();
};

function mouseInside(el, x, y) {
	let o = el.offset();
	return (
		x >= o.left &&
		x <= o.left + el.outerWidth() &&
		y >= o.top &&
		y <= o.top + el.outerHeight()
	);
};

function handlePieceClick(e) {

	let clickedPiece = $(this);

	// options:
	// 1) held piece && clicked piece used
	// 2) held piece && clicked piece not used
	// 3) no held piece && clicked piece used
	// 4) no held piece && clicked piece not used

	// case 1: drop piece
	if (gameState.heldPiece !== null && clickedPiece.hasClass("used")) {
		// console.log("dropping piece!")
		gameState.heldPiece = null;
		gameState.originalPiece.removeClass("used");
		gameState.originalPiece = null;
		$("#cursor-piece").empty().hide();
		return;
	}

	// case 2: replace held piece, continue to pick up clicked piece
	if (gameState.heldPiece !== null && !clickedPiece.hasClass("used")) {
		gameState.originalPiece.removeClass("used");
	}

	// case 3: do nothing
	if (gameState.heldPiece === null && clickedPiece.hasClass("used")) {
		return;
	}

	// case 4: continue to pick up piece
	gameState.originalPiece = clickedPiece;
	gameState.heldPiece = clickedPiece.clone(false);
	//$(this).hide();
	clickedPiece.addClass("used");

	let cursor = $("#cursor-piece");

	cursor
		.empty()
		.append(gameState.heldPiece)
		.show();

	let x_off = cursor.width() / 2;
	let y_off = cursor.height() / 2;

	cursor.css({
		left: e.clientX - x_off,
		top: e.clientY - y_off
	});

};

function handleCellClick(e) {
	attemptPlacePiece();
};

function resetTray() {
	$("#cursor-piece").empty().hide();
	gameState.heldPiece = null;
	gameState.originalPiece = null;

	$("#pieceContainer").children().removeClass("used")
};

function handleGameReset(e) {
	clearBoard();
	resetTray();
}

function handleMouseMove(e) {

	let cursorPiece = $("#cursor-piece");
	let x_off = cursorPiece.width() / 2;
	let y_off = cursorPiece.height() / 2;

	cursorPiece.css({
		left: e.clientX - x_off,
		top: e.clientY - y_off
	});

	if (mouseInside($("#game"), e.pageX, e.pageY)) {

		if (!gameState.heldPiece) return;

		const el = document.elementFromPoint(e.clientX, e.clientY);
		const cell = $(el).closest(".cell");

		if (!cell.length) return;

		const row = parseInt(cell.data("row"));
		const col = parseInt(cell.data("col"));

		// only continue if mouse position enters a new cell
		if (row === gameState.hoverRow && col === gameState.hoverCol) {
			return;
		}
		gameState.hoverRow = row;
		gameState.hoverCol = col;

		const pieceID = gameState.originalPiece.data("id");
		const piece = pieces[pieceID];

		$(".ghost").removeClass("ghost");

		gameState.ghostCells = [];

		let previewCells = getPiecePreview(piece, row, col);

		if (previewCells.length !== 0) {
			for (const [r,c] of previewCells) {

				let cellEl = gameState.cellElements[r][c];

				cellEl.addClass("ghost");
				gameState.ghostCells.push([r, c]);
			}
			cursorPiece.removeClass("invalid");
			cursorPiece.hide();
		} else {
			cursorPiece.addClass("invalid");
			cursorPiece.show();
		}

	} else {
		gameState.ghostCells = [];
		$(".ghost").removeClass("ghost");
		cursorPiece.removeClass("invalid");
		cursorPiece.show();
	}
};

export function bindEventHandlers() {

	$(".piece").click(handlePieceClick);
	$("#game .cell").click(handleCellClick);
	$("#reset-button").click(handleGameReset);
	$(document).mousemove(handleMouseMove);

	// using buttons to switch screen view
	$("#game-view").click(() => showView("#gameContainer"));
	$("#settings-view").click(() => showView("#settingsContainer"));
	$("#tileset-view").click(() => showView("#tilesetOptionsContainer"));
};