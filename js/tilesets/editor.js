import {buildPieceTrayFromCells} from "./builder.js";
import {makeTrayPortrait} from "./tray-utils.js";
import {getPieceTrayScore, removeDuplicatePieces, searchPieceTray} from "./layout-tidy.js";

let optimisationController = null;

const CELL_SIZE = 20;
const BORDER_SIZE = 20;
const MIN_GRID_SIZE = 5;
const MAX_GRID_SIZE = 20;
const DEFAULT_EDITOR_OPTIONS = {
	removeDuplicates: false
};

const editorState = {
	// The existing classic tray is 12 columns by 17 rows.
	rows: 17,
	cols: 12,
	cells: [],
	selectedTilesetId: null,
	saveTilesetId: null,
	name: "Untitled tileset",
	removeDuplicates: DEFAULT_EDITOR_OPTIONS.removeDuplicates,
	isResizing: false,
	isOptimising: false,
	isPainting: false,
	paintValue: false,
	history: []
};

export function initialiseTilesetEditor() {
	editorState.cells = createEmptyGrid(editorState.rows, editorState.cols);
	renderEditorGrid();

	$("#tilesetOptionsContainer").on("mousedown", ".tileset-editor-cell", function (e) {
		e.preventDefault();
		if (editorState.isOptimising) return;

		const row = Number($(this).attr("data-row"));
		const col = Number($(this).attr("data-col"));

		editorState.isPainting = true;
		editorState.paintValue = !editorState.cells[row][col];
		saveEditorHistory();
		setEditorCell(row, col, editorState.paintValue);
	});

	$("#tilesetOptionsContainer").on("mouseenter", ".tileset-editor-cell", function () {
		if (!editorState.isPainting) return;

		const row = Number($(this).attr("data-row"));
		const col = Number($(this).attr("data-col"));
		setEditorCell(row, col, editorState.paintValue);
	});

	$("#tilesetOptionsContainer").on("mousedown", "#tilesetResizeHandle", function (e) {
		e.preventDefault();
		if (editorState.isOptimising) return;
		editorState.isPainting = false;
		saveEditorHistory();
		editorState.isResizing = true;
		resizeFromMousePosition(e);
	});

	$("#tilesetOptionsContainer").on("input", "#tilesetEditorName", function () {
		editorState.name = $(this).val();
	});

	$("#tilesetOptionsContainer").on("change", "#tilesetRemoveDuplicates", function () {
		editorState.removeDuplicates = $(this).is(":checked");
	});

	$("#tilesetOptionsContainer").on("click", ".tileset-editor-optimise-button", function () {
		optimiseEditorLayout();
	});

	$("#tilesetOptionsContainer").on("pointerleave", ".tileset-editor-optimise-button", cancelOptimisation);
	$(window).on("blur.tilesetOptimisation", cancelOptimisation);
	$(document).on("visibilitychange.tilesetOptimisation", function () {
		if (document.hidden) cancelOptimisation();
	});
	$(document).on("keydown.tilesetOptimisation", function (e) {
		if (e.key === "Escape") cancelOptimisation();
	});


	$("#tilesetOptionsContainer").on("click", ".tileset-editor-clear-button", function () {
		if (editorState.isOptimising) return;
		saveEditorHistory();
		clearTilesetEditor();
	});

	$("#tilesetOptionsContainer").on("click", ".tileset-editor-randomise-button", function () {
		if (editorState.isOptimising) return;
		saveEditorHistory();
		randomiseTilesetEditor();
	});

	$("#tilesetOptionsContainer").on("click", ".tileset-editor-undo-button", function () {
		if (editorState.isOptimising) return;
		undoTilesetEditor();
	});

	$(document).on("mousemove.tilesetEditor", function (e) {
		if (!editorState.isResizing) return;
		resizeFromMousePosition(e);
	});

	$(document).on("mouseup.tilesetEditor", function () {
		editorState.isResizing = false;
		editorState.isPainting = false;
	});
}

export function openTilesetEditor(tileset = null, saveTilesetId = null, name = null) {
	if (tileset === null) {
		resetTilesetEditor();
		return;
	}

	loadTilesetIntoEditor(tileset);
	editorState.selectedTilesetId = tileset.id;
	editorState.saveTilesetId = saveTilesetId;
	editorState.name = name === null ? tileset.name : name;
	applyDefaultEditorOptions();
	editorState.history = [];
	renderEditorGrid();
}

export function resetTilesetEditor() {
	editorState.rows = 17;
	editorState.cols = 12;
	editorState.cells = createEmptyGrid(editorState.rows, editorState.cols);
	editorState.selectedTilesetId = null;
	editorState.saveTilesetId = null;
	editorState.name = "Untitled tileset";
	applyDefaultEditorOptions();
	editorState.history = [];
	renderEditorGrid();
}

function applyDefaultEditorOptions() {
	editorState.removeDuplicates = DEFAULT_EDITOR_OPTIONS.removeDuplicates;
}

export function clearTilesetEditor() {
	editorState.cells = createEmptyGrid(editorState.rows, editorState.cols);
	renderEditorGrid();
}

function randomiseTilesetEditor() {
	for (let row = 0; row < editorState.rows; row++) {
		for (let col = 0; col < editorState.cols; col++) {
			editorState.cells[row][col] = Math.random() < 0.4;
		}
	}

	renderEditorGrid();
}

function saveEditorHistory() {
	const cells = [];

	for (let row = 0; row < editorState.cells.length; row++) {
		cells[row] = editorState.cells[row].slice();
	}

	editorState.history.push({
		rows: editorState.rows,
		cols: editorState.cols,
		cells: cells
	});

	if (editorState.history.length > 50) editorState.history.shift();
	updateUndoButton();
}

function undoTilesetEditor() {
	const previousState = editorState.history.pop();
	if (previousState === undefined) return;

	editorState.rows = previousState.rows;
	editorState.cols = previousState.cols;
	editorState.cells = previousState.cells;
	renderEditorGrid();
}

export function getTilesetEditorDraft() {
	return {
		name: editorState.name.trim(),
		tray: buildTilesetFromEditor(),
		saveTilesetId: editorState.saveTilesetId,
		removeDuplicates: editorState.removeDuplicates
	};
}

function cancelOptimisation() {
	optimisationController?.abort();
}

async function optimiseEditorLayout() {
	if (editorState.isOptimising) return;

	const controller = new AbortController();
	optimisationController = controller;
	startTilesetOptimisation();

	try {
		await waitForEditorUpdate();
		const tray = getOptimisationTray();
		const optimisedTray = await searchPieceTray(tray, previewOptimisedTray, controller.signal);
		applyOptimisedEditorLayout(optimisedTray);
	} catch (error) {
		console.error("Could not optimise tileset", error);
		alert("Could not optimise the tileset. Your draft has been kept; please try again.");
	} finally {
		if (optimisationController === controller) optimisationController = null;
		finishTilesetOptimisation();
	}
}

function waitForEditorUpdate() {
	return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

function getOptimisationTray() {
	const tray = buildTilesetFromEditor();
	if (editorState.removeDuplicates) removeDuplicatePieces(tray);
	return tray;
}

function applyOptimisedEditorLayout(tray) {
	const portraitTray = makeTrayPortrait(tray);
	if (!hasEditorLayoutChanged(portraitTray)) return;

	saveEditorHistory();
	loadTilesetIntoEditor({tray: portraitTray});
}

function hasEditorLayoutChanged(tray) {
	if (tray.length !== editorState.rows) return true;

	for (let row = 0; row < tray.length; row++) {
		if (tray[row].length !== editorState.cols) return true;

		for (let col = 0; col < tray[row].length; col++) {
			if ((tray[row][col] !== " ") !== editorState.cells[row][col]) return true;
		}
	}

	return false;
}

function startTilesetOptimisation() {
	editorState.isOptimising = true;
	editorState.isPainting = false;
	editorState.isResizing = false;
	$(".tileset-editor-optimise-button").addClass("is-optimising").attr("aria-busy", "true").find("span").text("Searching...");
	$(".tileset-editor-controls input, .tileset-editor-controls button:not(.tileset-editor-optimise-button), #tilesetEditorBoardActions button").prop("disabled", true);
	$("#tilesetEditorBoard").attr("aria-busy", "true");
	$("#tilesetResizeHandle").hide();
	updateEditorDimensions(editorState.rows, editorState.cols);
}

function previewOptimisedTray(bestTray) {
	if (!editorState.isOptimising) return;
	const previewTray = makeTrayPortrait(bestTray);
	const board = createEditorBoard(previewTray);
	board.attr("aria-busy", "true");
	board.find("#tilesetResizeHandle").hide();
	$("#tilesetEditorBoard").replaceWith(board);
	updateEditorDimensions(previewTray.length, previewTray[0].length, previewTray);
}

function finishTilesetOptimisation() {
	editorState.isOptimising = false;
	renderEditorGrid();
}

function loadTilesetIntoEditor(tileset) {
	const rows = tileset.tray.length;
	let cols = 0;

	for (let row = 0; row < rows; row++) {
		if (tileset.tray[row].length > cols) cols = tileset.tray[row].length;
	}

	editorState.rows = rows;
	editorState.cols = cols;
	editorState.cells = createEmptyGrid(rows, cols);

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < tileset.tray[row].length; col++) {
			editorState.cells[row][col] = tileset.tray[row][col] !== " ";
		}
	}
}

function createEmptyGrid(rows, cols) {
	const grid = [];

	for (let row = 0; row < rows; row++) {
		grid[row] = [];

		for (let col = 0; col < cols; col++) {
			grid[row][col] = false;
		}
	}

	return grid;
}

function resizeEditorGrid(rows, cols) {
	const resizedGrid = createEmptyGrid(rows, cols);
	const copyRows = Math.min(rows, editorState.rows);
	const copyCols = Math.min(cols, editorState.cols);

	for (let row = 0; row < copyRows; row++) {
		for (let col = 0; col < copyCols; col++) {
			resizedGrid[row][col] = editorState.cells[row][col];
		}
	}

	editorState.rows = rows;
	editorState.cols = cols;
	editorState.cells = resizedGrid;
	renderEditorGrid();
}

function resizeFromMousePosition(e) {
	const board = $("#tilesetEditorBoard");
	const boardRect = board[0].getBoundingClientRect();
	const contentLeft = boardRect.left + BORDER_SIZE;
	const contentTop = boardRect.top + BORDER_SIZE;

	let cols = Math.round((e.clientX - contentLeft) / CELL_SIZE);
	let rows = Math.round((e.clientY - contentTop) / CELL_SIZE);

	cols = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, cols));
	rows = Math.max(MIN_GRID_SIZE, Math.min(MAX_GRID_SIZE, rows));

	if (rows === editorState.rows && cols === editorState.cols) return;

	resizeEditorGrid(rows, cols);
}

function setEditorCell(row, col, value) {
	if (editorState.cells[row][col] === value) return;

	editorState.cells[row][col] = value;
	renderEditorCell(row, col);
}

function renderEditorGrid() {
	const container = $("#tilesetOptionsContainer");

	container.empty();

	const layout = $("<div>", {class: "tileset-editor-layout"});
	const boardContainer = $("<div>", {class: "tileset-editor-board-container"});
	boardContainer.append(createEditorBoard());
	boardContainer.append($("<div>", {id: "tilesetEditorDimensions"}));
	layout.append(boardContainer);
	layout.append(createEditorControls());
	container.append(layout);
	updateEditorDimensions(editorState.rows, editorState.cols);
}

function updateEditorDimensions(rows, cols, tray = null) {
	const dimensions = `${cols} x ${rows}`;

	if (!editorState.isOptimising) {
		$("#tilesetEditorDimensions").text(dimensions);
		return;
	}

	const currentTray = tray === null ? buildTilesetFromEditor() : tray;
	const volume = cols * rows;
	const score = getPieceTrayScore(currentTray).toLocaleString("en-GB").slice(4);
	$("#tilesetEditorDimensions").text(`${dimensions} | Volume: ${volume} | Score: ${score}`);
}

function createEditorBoard(previewTray = null) {
	const rows = previewTray === null ? editorState.rows : previewTray.length;
	const cols = previewTray === null ? editorState.cols : previewTray[0].length;
	const boardWidth = (cols * CELL_SIZE) + (BORDER_SIZE * 2);
	const boardHeight = (rows * CELL_SIZE) + (BORDER_SIZE * 2);

	const board = $("<div>", {id: "tilesetEditorBoard"}).css({
		"--editor-cols": cols,
		"--editor-rows": rows,
		width: `${boardWidth}px`,
		height: `${boardHeight}px`
	});

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const cell = $("<div>", {class: "cell tileset-editor-cell"})
				.attr("data-row", row)
				.attr("data-col", col);

			const filled = previewTray === null ? editorState.cells[row][col] : previewTray[row][col] !== " ";
			if (filled) cell.addClass("p1");

			board.append(cell);
		}
	}

	board.append($("<div>", {id: "tilesetResizeHandle", title: "Drag to resize the tileset grid"}));
	board.append(createEditorBoardActions());
	return board;
}

function createEditorBoardActions() {
	const actions = $("<div>", {id: "tilesetEditorBoardActions"});

	actions.append($("<button>", {
		class: "tileset-editor-clear-button",
		type: "button",
		title: "Clear grid",
		"aria-label": "Clear editor"
	}).append($("<i>", {class: "fa-solid fa-xmark", "aria-hidden": "true"})));
	actions.append($("<button>", {
		class: "tileset-editor-randomise-button",
		type: "button",
		title: "Randomise grid",
		"aria-label": "Randomise editor"
	}).append($("<i>", {class: "fa-solid fa-shuffle", "aria-hidden": "true"})));
	actions.append($("<button>", {
		class: "tileset-editor-undo-button",
		type: "button",
		title: "Undo",
		"aria-label": "Undo",
		disabled: editorState.history.length === 0
	}).append($("<i>", {class: "fa-solid fa-arrow-rotate-left", "aria-hidden": "true"})));

	return actions;
}

function createEditorControls() {
	const controls = $("<div>", {class: "tileset-editor-controls"});
	controls.append("<h2>Tileset editor</h2>");
	controls.append($("<label>", {for: "tilesetEditorName", text: "Display name"}));
	controls.append($("<input>", {
		id: "tilesetEditorName",
		type: "text",
		value: editorState.name
	}));

	const removeDuplicates = $("<label>", {class: "tileset-editor-option"});
	removeDuplicates.append($("<input>", {
		id: "tilesetRemoveDuplicates",
		type: "checkbox",
		checked: editorState.removeDuplicates
	}));
	removeDuplicates.append("Remove duplicate pieces");
	controls.append(removeDuplicates);

	const optimiseLayout = $("<div>", {class: "tileset-editor-optimise-option"});
	optimiseLayout.append($("<button>", {
		class: "tileset-editor-optimise-button",
		type: "button"
	}).append($("<span>", {text: "Optimise layout"})));
	controls.append(optimiseLayout);

	const actions = $("<div>", {class: "tileset-editor-actions"});
	actions.append($("<button>", {
		class: "tileset-editor-discard-button",
		type: "button",
		text: "Discard"
	}));
	actions.append($("<button>", {
		class: "tileset-editor-save-button",
		type: "button",
		text: "Save"
	}));
	controls.append(actions);

	return controls;
}

function updateUndoButton() {
	$(".tileset-editor-undo-button").prop("disabled", editorState.history.length === 0);
}

function renderEditorCell(row, col) {
	const cell = $(`#tilesetEditorBoard .tileset-editor-cell[data-row="${row}"][data-col="${col}"]`);

	cell.toggleClass("p1", editorState.cells[row][col]);
	buildTilesetFromEditor();
}

function printTileset(ts) {
	const labels = {};
	let output = "";

	for (const row of ts) {
		for (const cell of row) {
			if (typeof cell === "string" && cell.startsWith("p_")) {
				const index = Number(cell.slice(2));
				labels[cell] = String.fromCharCode(65 + index);
			}
		}
	}

	for (let i = 0; i < ts.length; i++) {
		for (let j = 0; j < ts[i].length; j++) {
			const cell = ts[i][j];

			if (labels[cell]) {
				output += labels[cell];
			} else {
				output += cell;
			}

			output += ".";
		}

		output += "\n";
	}

	console.log(output);
}

function buildTilesetFromEditor() {
	const tilesetCopy = buildPieceTrayFromCells(editorState.cells);
	// DEBUG - visualise pieces in terminal
	// printTileset(tilesetCopy);

	return tilesetCopy;
}
