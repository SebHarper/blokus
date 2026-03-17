import {populatePieces, populateTray} from './pieces.js';
import {initialiseBoard, createCellElements, renderBoard, testEnccodeDecode} from './board.js';
import {bindEventHandlers} from './interaction.js';

$(document).ready(function() {

	populatePieces();
	populateTray();
	initialiseBoard();
	createCellElements();

	renderBoard();

	bindEventHandlers();

});