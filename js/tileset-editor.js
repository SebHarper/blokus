const CELL_SIZE = 20;
const BORDER_SIZE = 20;
const MIN_GRID_SIZE = 5;
const MAX_GRID_SIZE = 20;

const editorState = {
	// The existing classic tray is 12 columns by 17 rows.
	rows: 17,
	cols: 12,
	cells: [],
	selectedTilesetId: null,
	isResizing: false,
	isPainting: false,
	paintValue: false
};

export function initialiseTilesetEditor() {
	editorState.cells = createEmptyGrid(editorState.rows, editorState.cols);
	renderEditorGrid();

	$("#tilesetOptionsContainer").on("mousedown", ".tileset-editor-cell", function (e) {
		e.preventDefault();

		const row = Number($(this).attr("data-row"));
		const col = Number($(this).attr("data-col"));

		editorState.isPainting = true;
		editorState.paintValue = !editorState.cells[row][col];
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
		editorState.isPainting = false;
		editorState.isResizing = true;
		resizeFromMousePosition(e);
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

export function openTilesetEditor(tileset = null) {
	if (tileset === null) {
		resetTilesetEditor();
		return;
	}

	// Loading saved tilesets will be added with the save flow.
}

export function resetTilesetEditor() {
	editorState.rows = 17;
	editorState.cols = 12;
	editorState.cells = createEmptyGrid(editorState.rows, editorState.cols);
	editorState.selectedTilesetId = null;
	renderEditorGrid();
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
	const boardWidth = (editorState.cols * CELL_SIZE) + (BORDER_SIZE * 2);
	const boardHeight = (editorState.rows * CELL_SIZE) + (BORDER_SIZE * 2);

	container.empty();

	// container.append("<h2>Tileset editor</h2>");

	const board = $("<div>", {id: "tilesetEditorBoard"}).css({
		"--editor-cols": editorState.cols,
		"--editor-rows": editorState.rows,
		width: `${boardWidth}px`,
		height: `${boardHeight}px`
	});

	for (let row = 0; row < editorState.rows; row++) {
		for (let col = 0; col < editorState.cols; col++) {
			const cell = $("<div>", {class: "cell tileset-editor-cell"})
				.attr("data-row", row)
				.attr("data-col", col);

			if (editorState.cells[row][col]) cell.addClass("p1");

			board.append(cell);
		}
	}

	board.append($("<div>", {id: "tilesetResizeHandle", title: "Drag to resize the tileset grid"}));
	container.append(board);
}

function renderEditorCell(row, col) {
	const cell = $(`#tilesetEditorBoard .tileset-editor-cell[data-row="${row}"][data-col="${col}"]`);

	cell.toggleClass("p1", editorState.cells[row][col]);
}
