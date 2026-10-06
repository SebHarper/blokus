import {pieces, trayPiecePositions, populatePlayerTrayState, rotatePiece, calcPlayerScores} from './pieces.js';
import {createPieceElements, createCellElements, createCursorReference, createScoreButtons} from './renderer.js'
import {gameState, initialiseBoard} from './board.js';
import {bindEventHandlers, initialiseSelectedTileset} from './interaction.js';
import {renderBoard, updatePlayerScores, highlightCurrentPlayer} from './renderer.js'
import {initialiseTilesetEditor} from './tilesets/editor.js';
import {initialiseTilesets, renderTilesetManager} from './tilesets/manager.js';


$(document).ready(function() {
	initialiseTilesets();
	initialiseSelectedTileset();
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
