import {pieces, trayPiecePositions, setPieceTray, populatePlayerTrayState, rotatePiece, calcPlayerScores} from './pieces.js';
import {createPieceElements, createCellElements, createCursorReference, createScoreButtons} from './renderer.js'
import {gameState, initialiseBoard} from './board.js';
import {bindEventHandlers} from './interaction.js';
import {renderBoard, updatePlayerScores, highlightCurrentPlayer} from './renderer.js'
import {initialiseTilesetEditor} from './tileset-editor.js';
import {initialiseTilesets, renderTilesetManager, getSelectedTileset} from './tilesets.js';


$(document).ready(function() {
	initialiseTilesets();
	setPieceTray(getSelectedTileset().tray);
	renderTilesetManager();
	initialiseTilesetEditor();
	createPieceElements();
	populatePlayerTrayState();

	initialiseBoard();
	createCellElements();
	createCursorReference();

	createScoreButtons();

	renderBoard();

	calcPlayerScores();
	updatePlayerScores();
	highlightCurrentPlayer();

	bindEventHandlers();
});
