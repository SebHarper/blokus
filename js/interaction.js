import {EMPTY_HELD_PIECE} from './constants.js';
import {gameState, placePiece, setGameSettings, initialiseBoard, encodeCoord} from './board.js';
import {getPiecePreview, canPlacePiece, getFrontierCells} from './rules.js'
import {pieces, computeHeldPieceGeometry, populatePlayerTrayState, calcPlayerScores, setPieceTray} from './pieces.js';
import {getSelectedTileset} from './tilesets/manager.js';
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
	if (gameState.phase !== "running") return;

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

	computeHeldPieceGeometry();

	renderer.updateCursorPiece(e, pieceID);
	renderer.highlightTrayPiece(pieceID);
}

function handleCellClick(e) {
	if (gameState.phase !== "running") return;

	if (!canPlacePiece()) return;

	const pieceID = gameState.heldPiece.pieceID

	const placedCells = gameState.ghostCells.slice();
	placePiece(placedCells, gameState.currentPlayer);

	renderer.updateCursorPiece(e, null);
	renderer.markTrayPieceUsed(pieceID);

	renderer.renderBoard();

	finalizePiecePlacement(pieceID);

	calcPlayerScores();
	renderer.updatePlayerScores();

	advanceTurn(placedCells);
};

function advanceTurn(placedCells) {

	const startPlayer = gameState.currentPlayer;

	updateFrontierCells(startPlayer, placedCells);
	const playerCanMove = updatePlayerMoveAvailability();
	let nextPlayerCanMove = false;

	do {
		gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.playerCount;

		nextPlayerCanMove = playerCanMove[gameState.currentPlayer];
		if (nextPlayerCanMove) break;

	} while (gameState.currentPlayer !== startPlayer);

	if (!nextPlayerCanMove) {
		finishGame();
		return;
	}

	renderer.changeTrayPlayer(gameState.currentPlayer);
	renderer.updatePlayerLabel();
	renderer.highlightCurrentPlayer();
}


function updateFrontierCells(placingPlayer, placedCells) {
	getFrontierCells(placingPlayer);

	const occupiedCells = new Set();
	for (let i = 0; i < placedCells.length; i++) {
		occupiedCells.add(encodeCoord(placedCells[i][0], placedCells[i][1]));
	}

	for (let player = 0; player < gameState.playerCount; player++) {
		if (player === placingPlayer) continue;

		const frontier = gameState.frontierCells[player];
		const updatedFrontier = [];

		for (let i = 0; i < frontier.length; i++) {
			const [row, col] = frontier[i];
			if (occupiedCells.has(encodeCoord(row, col))) continue;

			updatedFrontier.push(frontier[i]);
		}

		gameState.frontierCells[player] = updatedFrontier;
	}
}

function updatePlayerMoveAvailability() {
	const playerCanMove = [];
	let playerOutChanged = false;

	for (let player = 0; player < gameState.playerCount; player++) {
		if (gameState.playersOut[player]) {
			playerCanMove[player] = false;
			continue;
		}

		playerCanMove[player] = playerHasMove(player);
		if (playerCanMove[player]) continue;

		gameState.playersOut[player] = true;
		playerOutChanged = true;
	}

	if (playerOutChanged) renderer.updatePlayerScores();

	return playerCanMove;
}

function finishGame() {
	const result = getGameResult();

	gameState.phase = "finished";
	gameState.gameResult = result;
	dropHeldPiece();
	renderer.clearFrontierCells();
	renderer.updateGamePhase();
	renderer.showGameEndMessage(result);
}

function getGameResult() {
	let lowestRemaining = Infinity;
	const winners = [];

	for (let player = 0; player < gameState.playerCount; player++) {
		const remaining = gameState.playerScores[player];

		if (remaining < lowestRemaining) {
			lowestRemaining = remaining;
			winners.length = 0;
			winners.push(player);
		} else if (remaining === lowestRemaining) {
			winners.push(player);
		}
	}

	return {winners, remaining: lowestRemaining};
}

function playerHasMove(player) {
	if (!gameState.hadFirstMove[player]) return true;

	const frontier = gameState.frontierCells[player];

	for (const pieceID in gameState.playerTrays[player]) {
		if (!gameState.playerTrays[player][pieceID]) continue;

		for (const geometry of pieces[pieceID].geometries) {
			for (const [fr, fc] of frontier) {
				for (const [cr, cc] of geometry.cells) {
					const ar = fr - cr + geometry.offset[0];
					const ac = fc - cc + geometry.offset[1];

					let validMove = getPiecePreview(geometry, ar, ac, player);
					if (validMove.length > 0) {
						return true;
					}
				}
			}
		}
	}

	return false;
}

export function findBestMove(player) {
	if (!gameState.hadFirstMove[player]) return null;

	const frontier = gameState.frontierCells[player];
	let bestMove = null;

	for (const pieceID in gameState.playerTrays[player]) {
		if (!gameState.playerTrays[player][pieceID]) continue;

		for (const geometry of pieces[pieceID].geometries) {
			for (const [fr, fc] of frontier) {
				for (const [cr, cc] of geometry.cells) {
					const ar = fr - cr + geometry.offset[0];
					const ac = fc - cc + geometry.offset[1];
					const cells = getPiecePreview(geometry, ar, ac, player);

					if (cells.length === 0) continue;

					const score = cells.length;
					if (bestMove !== null && score <= bestMove.score) continue;

					bestMove = {pieceID, geometry, ar, ac, cells, score};
				}
			}
		}
	}

	return bestMove;
}

function finalizePiecePlacement(pieceID) {

	gameState.playerTrays[gameState.currentPlayer][pieceID] = false;

	gameState.hadFirstMove[gameState.currentPlayer] = true;

	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.selectedPiece = null;
	gameState.heldPieceGeometry = null;
	gameState.ghostCells = [];
};

function handleGameReset() {
	startGameWithSelectedTileset();
}

function handleGameView() {
	if (!hasAnyPieceBeenPlaced()) {
		startGameWithSelectedTileset();
	}

	renderer.showView("#gameContainer");
}

function hasAnyPieceBeenPlaced() {
	for (let player = 0; player < gameState.hadFirstMove.length; player++) {
		if (gameState.hadFirstMove[player]) return true;
	}

	return false;
}

export function startGameWithSelectedTileset() {
	if (!initialiseSelectedTileset()) return false;

	resetGameState();
	renderer.clearGameEndMessage();
	gameState.boardState = [];
	gameState.cellElements = [];
	gameState.pieceElements = {};
	gameState.playerTrays = [];

	initialiseBoard();
	populatePlayerTrayState();
	renderer.createCellElements();
	renderer.createPieceElements();
	renderer.createScoreButtons();
	renderer.createCursorReference();
	renderer.updateCursorPiece(null, null);
	renderer.renderBoard();
	calcPlayerScores();
	renderer.updatePlayerLabel();
	renderer.updatePlayerScores();
	renderer.changeTrayPlayer(gameState.currentPlayer);
	renderer.highlightCurrentPlayer();
	gameState.phase = "running";
	renderer.updateGamePhase();

	return true;
}

export function initialiseSelectedTileset() {
	const selectedTileset = getSelectedTileset();

	if (selectedTileset === null) return false;

	if (gameState.activeTilesetId !== selectedTileset.id || gameState.activeTilesetTray !== selectedTileset.tray) {
		setPieceTray(selectedTileset.tray);
		gameState.activeTilesetId = selectedTileset.id;
		gameState.activeTilesetTray = selectedTileset.tray;
	}

	return true;
}

function resetGameState() {
	gameState.phase = "idle";
	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.heldPieceGeometry = null;
	gameState.selectedPiece = null;
	gameState.hadFirstMove = Array(gameState.playerCount).fill(false);
	gameState.currentPlayer = 0;
	gameState.frontierCells = Array.from({length: gameState.playerCount}, () => []);
	gameState.playerScores = Array(gameState.playerCount).fill(0);
	gameState.playersOut = Array(gameState.playerCount).fill(false);
	gameState.gameResult = null;
	gameState.hoverRow = null;
	gameState.hoverCol = null;
}

function applySettings() {
	const settings = {
		playerCount: $("#player-count").val(),
		boardSize: $("#board-size").val(),
		useAnchorCells: $("#use-anchor-cells").val() === "true" ? true : false 
	};

	if (!setGameSettings(settings)) return;

	startGameWithSelectedTileset();
	renderer.showView("#gameContainer");
}

function handleMouseMove(e) {
	if (gameState.phase !== "running") return;

	gameState.mouse.x = e.clientX;
	gameState.mouse.y = e.clientY;

	renderer.moveCursorPiece();

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
		{ r: row + 1, c: col + 1 }, // b-right
		{ r: row + 1, c: col - 1 }, // b-left
		{ r: row - 1, c: col + 1 }, // t-right
		{ r: row - 1, c: col - 1 }  // t-left
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

	if (gameState.selectedPiece) {
		renderer.clearTrayHighlight(gameState.selectedPiece);
	}

	gameState.selectedPiece = null;
	gameState.heldPiece = EMPTY_HELD_PIECE;
	gameState.heldPieceGeometry = null;
	clearGhostState();
	renderer.hideCursorPiece();
}

function handleSettingsView() {
	dropHeldPiece();
	renderer.showView("#settingsContainer");
}

function handleTilesetView() {
	dropHeldPiece();
	renderer.showView("#tilesetSelectorContainer");
}

export function rotateCursor(e) {
	if (gameState.phase !== "running") return;

	if (!gameState.heldPiece.pieceID) return;

	let rot = gameState.heldPiece.rotation;
	rot = (rot + 1) % 4;
	gameState.heldPiece.rotation = rot;

	computeHeldPieceGeometry();
	renderer.transformCursorPiece(e);

	updateGhostPreview(true);
	renderer.renderGhostFromState();
}

export function flipCursor(e) {
	if (gameState.phase !== "running") return;

	if (!gameState.heldPiece.pieceID) return;

	gameState.heldPiece.flipped = !gameState.heldPiece.flipped;

	computeHeldPieceGeometry();
	renderer.transformCursorPiece(e);

	updateGhostPreview(true);
	renderer.renderGhostFromState();
}

export function bindEventHandlers() {

	$("#pieceContainer").click(handlePieceTrayClick);
	$(document).on("click", "#game .cell", handleCellClick);
	$("#reset-button").click(handleGameReset);
	$(document).mousemove(handleMouseMove);

	$(document).on("keydown", function (e) {
		if (e.key === "r") {
			rotateCursor(e);
		} else if (e.key === "f") {
			flipCursor(e);
		}
	});

	$("#playerScoreContainer").on("mouseenter", ".player-score-button", function () {
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
	$("#game-view").click(handleGameView);
	$("#settings-view").click(handleSettingsView);
	$("#tileset-view").click(handleTilesetView);
	$("#apply-settings").click(applySettings);


	renderer.updatePlayerLabel();
};
