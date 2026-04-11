import {gameState, clearBoard, getPiecePreview, canPlacePiece, placePiece, EMPTY_HELD_PIECE, getFrontierCells} from './board.js';
import {pieces, computeHeldPieceGeometry, populatePlayerTrayState, calcPlayerScores} from './pieces.js';
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

	// placePieceFromGhost();
	placePiece(gameState.ghostCells, gameState.currentPlayer);

	renderer.updateCursorPiece(e, null);
	renderer.markTrayPieceUsed(pieceID);

	renderer.renderBoard();

	finalizePiecePlacement(pieceID);

	calcPlayerScores();
	renderer.updatePlayerScores();

	advanceTurn();
};

function advanceTurn() {

	const startPlayer = gameState.currentPlayer;

	do {
		gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.playerCount;

		for (let p = 0; p < gameState.playerCount; p++) {
			getFrontierCells(p);
		}

		if (gameState.currentPlayer === startPlayer) {
			alert("Game over - no player can move!");
			return;
		}

	} while (!playerHasMove(gameState.currentPlayer));

	renderer.changeTrayPlayer(gameState.currentPlayer);
	renderer.updatePlayerLabel();
	renderer.highlightCurrentPlayer();
}

function playerHasMove(player) {
	if (!gameState.hadFirstMove[player]) return true;

	const frontier = gameState.frontierCells[player];

	let numValidMoves = 0;
	let bestMoves = [];

	for (const pieceID in gameState.playerTrays[player]) {
		if (!gameState.playerTrays[player][pieceID]) continue;

		for (const geometry of pieces[pieceID].geometries) {
			for (const [fr, fc] of frontier) {
				for (const [cr, cc] of geometry.cells) {
					const ar = fr - cr + geometry.offset[0];
					const ac = fc - cc + geometry.offset[1];

					let validMove = getPiecePreview(geometry, ar, ac);
					if (validMove.length > 0) {
						numValidMoves++;

						let score = validMove.length;
						
						bestMoves.push({
							pieceID,
							geometry,
							ar,
							ac,
							score
						});
					}
				}
			}
		}
	}

	if (numValidMoves === 0) return false;

	bestMoves.sort((a, b) => b.score - a.score);

	return true;
}

function finalizePiecePlacement(pieceID) {

	gameState.playerTrays[gameState.currentPlayer][pieceID] = false;

	gameState.hadFirstMove[gameState.currentPlayer] = true;

	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.selectedPiece = null;
	gameState.heldPieceGeometry = null;
	gameState.ghostCells = [];
};

function handleGameReset(e) {
	clearBoard();
	renderer.renderBoard();
	resetGameState();
	populatePlayerTrayState();
	renderer.resetTrayUI();
	renderer.updateCursorPiece(e, null);

	calcPlayerScores();

	renderer.updatePlayerLabel();
	renderer.updatePlayerScores();
	renderer.highlightCurrentPlayer();
}

function resetGameState() {
	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.heldPieceGeometry = null;
	gameState.selectedPiece = null;
	gameState.hadFirstMove = [false, false, false, false];
	gameState.currentPlayer = 0;
	gameState.frontierCells = [[], [], [], []];
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

	if (!mouseInside($("#game"), gameState.mouse.x, gameState.mouse.y)) return;

	if (!gameState.heldPiece.pieceID) return;

	const cell = getCellUnderCursor2();

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


const SNAP_PIXELS = 20;

function getCellUnderCursor2() {
	const el = document.elementFromPoint(gameState.mouse.x, gameState.mouse.y);
	const cellEl = $(el).closest(".cell");

	if (!cellEl.length) return cellEl;

	const row = parseInt(cellEl.data("row"));
	const col = parseInt(cellEl.data("col"));

	// 1. Check current cell first
	if (isValidPlacement(row, col)) {
		return cellEl;
	}

	// 2. Check 4 directions
	const directions = [
		{ r: row - 1, c: col }, // up
		{ r: row + 1, c: col }, // down
		{ r: row, c: col - 1 }, // left
		{ r: row, c: col + 1 }, // right
		{ r: row + 1, c: col + 1 }, // t-right
		{ r: row + 1, c: col - 1 }, // t-left
		{ r: row - 1, c: col + 1 }, // b-right
		{ r: row - 1, c: col - 1 }  // b-left
	];

	let bestCell = null;
	let bestDist = Infinity;

	for (const d of directions) {
		if (!isValidPlacement(d.r, d.c)) continue;

		const candidate = $(`.cell[data-row="${d.r}"][data-col="${d.c}"]`);
		if (!candidate.length) continue;

		// distance to mouse (for picking nearest)
		const rect = candidate[0].getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;

		const dist = Math.hypot(cx - gameState.mouse.x, cy - gameState.mouse.y);

		if (dist < bestDist && dist <= SNAP_PIXELS) {
			bestDist = dist;
			bestCell = candidate;
		}
	}

	// 3. Return best valid neighbour or fallback
	return bestCell || cellEl;
}

function isValidPlacement(row, col) {
	const preview = getPiecePreview(gameState.heldPieceGeometry, row, col);
	return preview && preview.length;
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

	$(".blokus-button").on("mouseenter", function () {
		const player = parseInt($(this).data("player"));

		if (isNaN(player)) return;

		const cells = gameState.frontierCells[player];
		renderer.displayFrontierCells(cells);
		renderer.changeTrayPlayer(player);

	});

	$("#playerScoreContainer").on("mouseleave", function () {
		renderer.clearFrontierCells();
		renderer.changeTrayPlayer(gameState.currentPlayer);
	});

	// using buttons to switch screen view
	$("#game-view").click(() => renderer.showView("#gameContainer"));
	$("#settings-view").click(() => renderer.showView("#settingsContainer"));
	$("#tileset-view").click(() => renderer.showView("#tilesetOptionsContainer"));

	renderer.updatePlayerLabel();
};
