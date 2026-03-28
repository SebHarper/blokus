import {gameState, clearBoard, getPiecePreview, placePieceFromGhost, canPlacePiece, EMPTY_HELD_PIECE} from './board.js';
import {pieces, computeHeldPieceGeometry, populatePlayerTrayState} from './pieces.js';
import * as renderer from "./renderer.js";


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

	if (!canPlacePiece()) return;

	const pieceID = gameState.heldPiece.pieceID

	placePieceFromGhost();

	renderer.updateCursorPiece(e, null);
	renderer.markTrayPieceUsed(pieceID);

	renderer.renderBoard();

	finalizePiecePlacement(pieceID);

	renderer.changeTrayPlayer();

	renderer.changePlayerLabel();
};

function finalizePiecePlacement(pieceID) {

	gameState.playerTrays[gameState.currentPlayer][pieceID] = false;

	gameState.hadFirstMove[gameState.currentPlayer] = true;

	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.selectedPiece = null;
	gameState.heldPieceGeometry = null;
	gameState.ghostCells = [];

	gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.playerCount;
};


function resetGameState() {
	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.heldPieceGeometry = null;
	gameState.selectedPiece = null;
	gameState.hadFirstMove = [false, false, false, false];
	gameState.currentPlayer = 0;
}

function handleGameReset(e) {
	clearBoard();
	renderer.renderBoard();
	resetGameState();
	populatePlayerTrayState();
	renderer.resetTrayUI();
	renderer.updateCursorPiece(e, null);
}

function handleMouseMove(e) {

	gameState.mouse.x = e.clientX;
	gameState.mouse.y = e.clientY;

	renderer.moveCursorPiece(e);

	if (!mouseInside($("#game"), e.pageX, e.pageY)) return;

	updateGhostPreview();
	renderer.renderGhostFromState();
}

function updateGhostPreview(forceUpdate = false) {

	if (!gameState.heldPiece.pieceID) return;
	
	const cell = getCellUnderCursor();

	if (!cell.length) {
		clearGhostState();
		return;
	}

	const row = parseInt(cell.data("row"));
	const col = parseInt(cell.data("col"));

	if (forceUpdate === false && row === gameState.hoverRow && col === gameState.hoverCol) return;

	gameState.hoverRow = row;
	gameState.hoverCol = col;

	if (!mouseInside($("#game"), gameState.mouse.x, gameState.mouse.y)) return;

	const previewCells = getPiecePreview(gameState.heldPieceGeometry, row, col);

	gameState.ghostCells = previewCells;
}

function getCellUnderCursor() {
	const el = document.elementFromPoint(gameState.mouse.x, gameState.mouse.y);
	const cellEl = $(el).closest(".cell");

	return cellEl;
}

function clearGhostState() {
	gameState.ghostCells = [];
	gameState.hoverRow = null;
	gameState.hoverCol = null;
	renderer.clearGhostCells();
	renderer.setCursorInvalid(false);
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

	updateGhostPreview(true);

	renderer.renderGhostFromState();
}

export function flipCursor() {
	if (!gameState.heldPiece.pieceID) return;

	gameState.heldPiece.flipped = !gameState.heldPiece.flipped;

	renderer.applyCursorTransform();

	computeHeldPieceGeometry();

	updateGhostPreview(true);

	renderer.renderGhostFromState();
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
	$("#game-view").click(() => renderer.showView("#gameContainer"));
	$("#settings-view").click(() => renderer.showView("#settingsContainer"));
	$("#tileset-view").click(() => renderer.showView("#tilesetOptionsContainer"));

	renderer.changePlayerLabel();
};