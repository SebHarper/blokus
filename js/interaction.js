import {gameState, getPiecePreview, attemptPlacePiece, clearBoard, EMPTY_HELD_PIECE} from './board.js';
import {pieces} from './pieces.js';
import * as renderer from "./renderer.js";


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


function handlePieceTrayClick(e) {

	const pieceEl = $(e.target).closest(".piece");

	if (!pieceEl.length) {
		if (gameState.heldPiece.piece !== null) {
			dropHeldPiece();
			renderer.updateCursorPiece(e, null);
		}
		return;
	}

	const pieceID = pieceEl.data("id");
	let tray = gameState.playerTrays[gameState.currentPlayer];

	const selected = gameState.selectedPiece;
	const available = gameState.playerTrays[gameState.currentPlayer][pieceID];

	if (selected === pieceID) {
		dropHeldPiece();
		renderer.updateCursorPiece(e, null);
		return;
	}

	if (gameState.heldPiece.piece && !available) {
		dropHeldPiece();
		renderer.updateCursorPiece(e, null);
		return;
	}

	if (gameState.heldPiece.piece && available) {
		renderer.clearTrayHighlight(gameState.selectedPiece);
	}

	if (!gameState.heldPiece.piece && !available) {
		return;
	}

	gameState.selectedPiece = pieceID;
	gameState.heldPiece = { piece: pieceID, rotation:0, flipped:false };

	renderer.updateCursorPiece(e, pieceID);
	renderer.highlightTrayPiece(pieceID);

}

function handleCellClick(e) {
	const piece = attemptPlacePiece();

	if (piece) {
		renderer.updateCursorPiece(e, null);
		renderer.markTrayPieceUsed(piece);
	}
};


function resetTray() {
	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.selectedPiece = null;

	renderer.resetTrayUI();
}

function handleGameReset(e) {
	clearBoard();
	resetTray();
}


function handleMouseMove(e) {

	renderer.moveCursorPiece(e);

	if (!mouseInside($("#game"), e.pageX, e.pageY)) return;

	if (!gameState.heldPiece.piece) return;

	const el = document.elementFromPoint(e.clientX, e.clientY);
	const cell = $(el).closest(".cell");

	if (!cell.length) {
		gameState.ghostCells = [];
		gameState.hoverRow = null;
		gameState.hoverCol = null;
		renderer.clearGhostCells();
		renderer.setCursorInvalid(false);
		return;
	}

	const row = parseInt(cell.data("row"));
	const col = parseInt(cell.data("col"));

	if (row === gameState.hoverRow && col === gameState.hoverCol) return;

	gameState.hoverRow = row;
	gameState.hoverCol = col;

	const piece = pieces[gameState.heldPiece.piece];

	const previewCells = getPiecePreview(piece, row, col);

	gameState.ghostCells = previewCells;

	if (previewCells.length) {
		renderer.renderGhostCells(previewCells);
		renderer.setCursorInvalid(false);
		renderer.hideCursorPiece();
	} else {
		renderer.clearGhostCells();
		renderer.setCursorInvalid(true);
		renderer.showCursorPiece();
	}
}

function dropHeldPiece() {

	if (!gameState.selectedPiece) return;

	renderer.clearTrayHighlight(gameState.selectedPiece);

	gameState.selectedPiece = null;
	gameState.heldPiece = EMPTY_HELD_PIECE;
}

export function bindEventHandlers() {

	$("#pieceContainer").click(handlePieceTrayClick);
	$("#game .cell").click(handleCellClick);
	$("#reset-button").click(handleGameReset);
	$(document).mousemove(handleMouseMove);
	
	$(document).on("keydown", function (e) {
		if (e.key === "r") {
			renderer.rotateCursor();
			console.log(pieces[gameState.selectedPiece]);
		}
	});

	// using buttons to switch screen view
	$("#game-view").click(() => showView("#gameContainer"));
	$("#settings-view").click(() => showView("#settingsContainer"));
	$("#tileset-view").click(() => showView("#tilesetOptionsContainer"));
};