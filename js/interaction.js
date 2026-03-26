import {gameState, getPiecePreview, attemptPlacePiece, clearBoard, EMPTY_HELD_PIECE} from './board.js';
import {pieces, computeHeldPieceGeometry, populatePlayerTrayState} from './pieces.js';
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
		if (gameState.heldPiece.pieceID !== null) {
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

	if (gameState.heldPiece.pieceID && !available) {
		dropHeldPiece();
		renderer.updateCursorPiece(e, null);
		return;
	}

	if (gameState.heldPiece.pieceID && available) {
		renderer.clearTrayHighlight(gameState.selectedPiece);
	}

	if (!gameState.heldPiece.pieceID && !available) {
		return;
	}

	gameState.selectedPiece = pieceID;
	gameState.heldPiece = { pieceID: pieceID, rotation:0, flipped:false };

	renderer.updateCursorPiece(e, pieceID);
	renderer.highlightTrayPiece(pieceID);

	computeHeldPieceGeometry();
}

function handleCellClick(e) {
	const piece = attemptPlacePiece();

	if (piece) {
		renderer.updateCursorPiece(e, null);
		renderer.markTrayPieceUsed(piece);
	}
};


function resetGameState() {
	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.heldPieceGeometry = null;
	gameState.selectedPiece = null;
	gameState.hadFirstMove = [false, false, false, false];
}

function handleGameReset(e) {
	clearBoard();
	resetGameState();
	populatePlayerTrayState();
	renderer.resetTrayUI();
}

let lastMouseX = 0;
let lastMouseY = 0;

function handleMouseMove(e) {

	lastMouseX = e.clientX;
	lastMouseY = e.clientY;

	renderer.moveCursorPiece(e);
	if (!mouseInside($("#game"), e.pageX, e.pageY)) return;
	updateGhostPreview(lastMouseX, lastMouseY);
}

function updateGhostPreview(x, y, forceUpdate = false) {

	if (!gameState.heldPiece.pieceID) return;

	const el = document.elementFromPoint(x, y);
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

	if (!forceUpdate && row === gameState.hoverRow && col === gameState.hoverCol) return;

	gameState.hoverRow = row;
	gameState.hoverCol = col;

	const piece = pieces[gameState.heldPiece.pieceID];

	if (!mouseInside($("#game"), x, y)) return;

	const previewCells = getPiecePreview(gameState.heldPieceGeometry, row, col);

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

export function rotateCursor() {

	if (!gameState.heldPiece.pieceID) return;

	let rot = gameState.heldPiece.rotation;
	rot = (rot + 1) % 4;
	gameState.heldPiece.rotation = rot;

	renderer.applyCursorTransform();

	computeHeldPieceGeometry();

	updateGhostPreview(lastMouseX, lastMouseY, true);
}

export function flipCursor() {
	if (!gameState.heldPiece.pieceID) return;

	gameState.heldPiece.flipped = !gameState.heldPiece.flipped;

	renderer.applyCursorTransform();

	computeHeldPieceGeometry();

	updateGhostPreview(lastMouseX, lastMouseY, true);
}

export function bindEventHandlers() {

	$("#pieceContainer").click(handlePieceTrayClick);
	$("#game .cell").click(handleCellClick);
	$("#reset-button").click(handleGameReset);
	$(document).mousemove(handleMouseMove);

	$(document).on("keydown", function (e) {
		if (e.key === "r") {
			rotateCursor(e);
		} else if (e.key === "f") {
			flipCursor();
		}
	});

	// using buttons to switch screen view
	$("#game-view").click(() => showView("#gameContainer"));
	$("#settings-view").click(() => showView("#settingsContainer"));
	$("#tileset-view").click(() => showView("#tilesetOptionsContainer"));
};