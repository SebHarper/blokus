import {populatePieces, populatePlayerTrayState} from './pieces.js';
import {createPieceElements, createCellElements} from './renderer.js'
import {gameState, initialiseBoard, renderBoard, testEnccodeDecode} from './board.js';
import {bindEventHandlers} from './interaction.js';


$(document).ready(function() {
	populatePieces();
	createPieceElements();
	populatePlayerTrayState();

	initialiseBoard();
	createCellElements();

	renderBoard();

	bindEventHandlers();
});