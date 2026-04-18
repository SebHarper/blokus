import {pieces, trayPiecePositions, populatePieces, populatePlayerTrayState, rotatePiece, calcPlayerScores} from './pieces.js';
import {createPieceElements, createCellElements, createCursorReference, createScoreButtons} from './renderer.js'
import {gameState, initialiseBoard, testEncodeDecode} from './board.js';
import {bindEventHandlers} from './interaction.js';
import {renderBoard, updatePlayerScores, highlightCurrentPlayer} from './renderer.js'


$(document).ready(function() {
	populatePieces();
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