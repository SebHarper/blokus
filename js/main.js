import {bindEventHandlers, startGameWithSelectedTileset} from './interaction.js';
import {initialiseTilesetEditor} from './tilesets/editor.js';
import {initialiseTilesets, renderTilesetManager} from './tilesets/manager.js';


$(document).ready(function() {
	initialiseTilesets();
	renderTilesetManager();
	initialiseTilesetEditor();
	startGameWithSelectedTileset();

	bindEventHandlers();
});
