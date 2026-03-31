import {pieces, populatePieces, populatePlayerTrayState, rotatePiece, calcPlayerScores} from './pieces.js';
import {createPieceElements, createCellElements, createCursorReference, createScoreLabels} from './renderer.js'
import {gameState, initialiseBoard, testEnccodeDecode} from './board.js';
import {bindEventHandlers} from './interaction.js';
import {renderBoard, updatePlayerScores} from './renderer.js'


$(document).ready(function() {
	populatePieces();
	createPieceElements();
	populatePlayerTrayState();

	initialiseBoard();
	createCellElements();
	createCursorReference();

	createScoreLabels();

	renderBoard();

	calcPlayerScores();
	updatePlayerScores();

	bindEventHandlers();
});