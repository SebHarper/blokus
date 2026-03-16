const rows = 20;
const cols = 20;

const baseColor = "#bea9de"
const selectedColor = "#cfbaef";

const gameState = {
	originalPiece: null,
	heldPiece: null,
	boardState: [],
	cellElements: [],
	ghostCells: [],
	hoverRow: null,
	hoverCol: null
};

const CELL = {
	EMPTY: 0,
	FILLED: 1,
	GHOST: 2
};

//SIZE: 12 x 17
const pieceTray = [
	"AAA   BB   C",
	"A   D  BBB C",
	"A DDDD     C",
	"       E  CC",
	"FFFFF EEE   ",
	"       E  GG",
	"HH I J   GG ",
	"HH I JJJ G  ",
	"H  I   J   K",
	"     L   KKK",
	"MM LLL N    ",
	"MM  L  N   O",
	"      NNN OO",
	"PPP Q      O",
	"P P QQ RR   ",
	"        RR S",
	"TTTT UU     "
];

const pieces = {};

function populatePieces() {

	// create game pieces dynamically
	// - cell positions normalised relative to upper left of piece bounding box

	for (let i = 0; i < pieceTray.length; i++) {
		let row = pieceTray[i];

		for (let j = 0; j < row.length; j++) {
			if (row[j] != " ") {

				if (!(row[j] in pieces)) {
					pieces[row[j]] = {start: [i, j], cells: [[0,0]], dim: [], offset: []};

				} else {
					let x_off = i - pieces[row[j]].start[0];
					let y_off = j - pieces[row[j]].start[1];
					pieces[row[j]].cells.push([x_off, y_off])
				}
			}
		}
	}
	for (let item in pieces) {
		
		let p = pieces[item];

		let x_min = 100;
		let x_max = -100;
		let y_min = 100;
		let y_max = -100;

		// pass one: compute bounding box
		for (const cell of p.cells) {
			x_min = Math.min(cell[0], x_min);
			x_max = Math.max(cell[0], x_max);
			y_min = Math.min(cell[1], y_min);
			y_max = Math.max(cell[1], y_max);
		}

		// pass two: normalise cells (1-indexed)
		for (const cell of p.cells) {
			cell[0] = cell[0] - x_min + 1;
			cell[1] = cell[1] - y_min + 1;
		}

		// set bounding box
		p.dim = [x_max - x_min + 1, y_max - y_min + 1];

		// set correct origin
		p.start = [
			p.start[0] + x_min + 1,
			p.start[1] + y_min + 1
		];
		
		// set placement offset
		p.offset = [
			Math.ceil((p.dim[0] / 2) + 0.5),
			Math.ceil((p.dim[1] / 2) + 0.5)
		];
	}
};

function populateTray() {
	let tray = $("#pieceContainer");

	for (let item in pieces) {
		let piece = pieces[item];
		let piece_start = piece.start;
		let piece_cells = piece.cells;

		let piece_div = $("<div>", {
			class: "piece",
			style: `grid-area: ${piece_start[0]} / ${piece_start[1]}`,
			"data-id": item,
			"data-width": piece.dim[0],
			"data-height": piece.dim[1]
		});

		for (const cell of piece_cells) {
			let cell_div = $("<div>", {
				class: "cell",
				style: `grid-area: ${cell[0]} / ${cell[1]}`
			});
			piece_div.append(cell_div);
		}
		tray.append(piece_div);
	}
};

function initialiseBoard() {

	for (let r=0; r < rows; r++) {

		gameState.boardState[r] = [];
		for (let c=0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
};

function createCellElements() {

	let boardElement = $("#game");
	boardElement.empty();

	for (let r=0; r < rows; r++) {
		
		gameState.cellElements[r] = [];
		
		for (let c=0; c < cols; c++) {

			let cell = $(`<div class="cell"></div>`)
			.attr("data-row", r)
			.attr("data-col", c);

			boardElement.append(cell);
			gameState.cellElements[r][c] = cell;
		}
	}
};

function renderCell(row, col) {
	let cellState = gameState.boardState[row][col];

	let cell = gameState.cellElements[row][col]

	if (cellState === CELL.EMPTY) {		
		cell.addClass("empty");
		cell.removeClass("filled");
		cell.removeClass("ghost");
	}
	else if (cellState === CELL.FILLED){
		cell.removeClass("empty");
		cell.addClass("filled");
		cell.removeClass("ghost");		
	}
	else if (cellState === CELL.GHOST){
		cell.removeClass("empty");
		cell.removeClass("filled");
		cell.addClass("ghost");	}
};

function renderBoard() {
	for (let r=0; r < rows; r++) {
		for (let c=0; c < cols; c++) {
			renderCell(r, c);
		}
	}
};

function resetTray() {
	$("#cursor-piece").empty().hide();
	gameState.heldPiece = null;
	gameState.originalPiece = null;

	$("#pieceContainer").children().removeClass("used")
};

function clearBoard() {

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			gameState.boardState[r][c] = CELL.EMPTY;
		}
	}
	renderBoard();
};

function showView(view) {
	$("#gameContainer, #settingsContainer, #tilesetOptionsContainer").hide();
	$(view).show();
};

function getPiecePreview(piece, row, col) {

	let previewCells = [];

	for (const cellOffset  of piece.cells) {
		const r = row + cellOffset[0] - piece.offset[0];
		const c = col + cellOffset[1] - piece.offset[1];

		previewCells.push([r, c]);

		if (r < 0 || r >= rows || c < 0 || c >= cols) {
			return [];
		}

		if (gameState.boardState[r][c] !== CELL.EMPTY) {
			return [];
		}

		previewCells.push([r, c]);
	}
	return previewCells;
};

$(document).ready(function() {

	populatePieces();
	populateTray();

	initialiseBoard(rows, cols);

	createCellElements();
	renderBoard();

	$("#reset-button").click(function() {
		clearBoard();
		resetTray();
	});

	// using buttons to switch screen view
	$("#game-view").click(() => showView("#gameContainer"));
	$("#settings-view").click(() => showView("#settingsContainer"));
	$("#tileset-view").click(() => showView("#tilesetOptionsContainer"));


	$(".piece").click(function(e) {

		let clickedPiece = $(this);

		// options:
		// 1) held piece && clicked piece used
		// 2) held piece && clicked piece not used
		// 3) no held piece && clicked piece used
		// 4) no held piece && clicked piece not used

		// case 1: drop piece
		if (gameState.heldPiece !== null && clickedPiece.hasClass("used")) {
			// console.log("dropping piece!")
			gameState.heldPiece = null;
			gameState.originalPiece.removeClass("used");
			gameState.originalPiece = null;
			$("#cursor-piece").empty().hide();
			return;
		}

		// case 2: replace held piece, continue to pick up clicked piece
		if (gameState.heldPiece !== null && !clickedPiece.hasClass("used")) {
			gameState.originalPiece.removeClass("used");
		}

		// case 3: do nothing
		if (gameState.heldPiece === null && clickedPiece.hasClass("used")) {
			return;
		}

		// case 4: continue to pick up piece
		gameState.originalPiece = clickedPiece;
		gameState.heldPiece = clickedPiece.clone(false);
		//$(this).hide();
		clickedPiece.addClass("used");

		let cursor = $("#cursor-piece");

		cursor
			.empty()
			.append(gameState.heldPiece)
			.show();

		let x_off = cursor.width() / 2;
		let y_off = cursor.height() / 2;

		cursor.css({
			left: e.clientX - x_off,
			top: e.clientY - y_off
		});	
	});

	$("#game .cell").click(function() {

		if (!gameState.heldPiece) return;

		if (gameState.ghostCells.length == 0) return;

		for (const cell of gameState.ghostCells) {
			gameState.boardState[cell[0]][cell[1]] = CELL.FILLED;
		}

		renderBoard();

		$("#cursor-piece").empty().hide();
		gameState.heldPiece = null;
		gameState.originalPiece = null;

	});

	$(document).mousemove(function(e) {

		let cursorPiece = $("#cursor-piece");
		let x_off = cursorPiece.width() / 2;
		let y_off = cursorPiece.height() / 2;

		cursorPiece.css({
			left: e.clientX - x_off,
			top: e.clientY - y_off
		});

		if (mouseInside($("#game"), e.pageX, e.pageY)) {

			if (!gameState.heldPiece) return;

			const el = document.elementFromPoint(e.clientX, e.clientY);
			const cell = $(el).closest(".cell");

			if (!cell.length) return;

			const row = parseInt(cell.data("row"));
			const col = parseInt(cell.data("col"));

			// only continue if mouse position enters a new cell
			if (row === gameState.hoverRow && col === gameState.hoverCol) {
				return;
			}
			gameState.hoverRow = row;
			gameState.hoverCol = col;

			const pieceID = gameState.originalPiece.data("id");
			const piece = pieces[pieceID];

			$(".ghost").removeClass("ghost");

			gameState.ghostCells = [];

			let previewCells = getPiecePreview(piece, row, col);

			if (previewCells.length !== 0) {
				for (const [r,c] of previewCells) {

					let cellEl = gameState.cellElements[r][c];

					cellEl.addClass("ghost");
					gameState.ghostCells.push([r, c]);
				}
				cursorPiece.removeClass("invalid");
				cursorPiece.hide();
			} else {
				cursorPiece.addClass("invalid");
				cursorPiece.show();
			}

		} else {
			gameState.ghostCells = [];
			$(".ghost").removeClass("ghost");
			cursorPiece.removeClass("invalid");
			cursorPiece.show();
		}
	});
});


function mouseInside(el, x, y) {
	let o = el.offset();
	return (
		x >= o.left &&
		x <= o.left + el.outerWidth() &&
		y >= o.top &&
		y <= o.top + el.outerHeight()
	);
};