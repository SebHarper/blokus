import {pieces, populatePieces, populatePlayerTrayState, rotatePiece} from './pieces.js';
import {createPieceElements, createCellElements, createCursorReference} from './renderer.js'
import {gameState, initialiseBoard, renderBoard, testEnccodeDecode} from './board.js';
import {bindEventHandlers} from './interaction.js';


$(document).ready(function() {
	populatePieces();
	createPieceElements();
	populatePlayerTrayState();

	initialiseBoard();
	createCellElements();
	createCursorReference();

	renderBoard();

	bindEventHandlers();
});