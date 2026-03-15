const rows = 20;
const cols = 20;

const baseColor = "#bea9de"
const selectedColor = "#cfbaef";

const gameState = {
	originalPiece: null,
	heldPiece: null,
	boardState: []
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
	"TTTT UU     ",
]

const pieces = {};

function populatePieces() {

	// create game pieces dynamically
	// - cell positions normalised relative to upper left of piece bounding box

	for (let i = 0; i < pieceTray.length; i++) {
		let row = pieceTray[i];

		for (let j = 0; j < row.length; j++) {
			if (row[j] != " ") {


				if (!(row[j] in pieces)) {
					pieces[row[j]] = {start: [i, j], cells: [[0,0]], dim: []};

				} else {
					let x_off = i - pieces[row[j]].start[0];
					let y_off = j - pieces[row[j]].start[1];
					pieces[row[j]].cells.push([x_off, y_off])
				}
			}
		}
	}
	for (let item in pieces) {

		let x_min = 100;
		let x_max = -100;
		let y_min = 100;
		let y_max = -100;

		// pass one: compute bounding box
		for (const cell of pieces[item].cells) {
			x_min = Math.min(cell[0], x_min);
			x_max = Math.max(cell[0], x_max);
			y_min = Math.min(cell[1], y_min);
			y_max = Math.max(cell[1], y_max);
		}

		// pass two: normalise cells (1-indexed)
		for (const cell of pieces[item].cells) {
			cell[0] = cell[0] - x_min + 1;
			cell[1] = cell[1] - y_min + 1;
		}

		// set bounding box
		pieces[item].dim = [x_max - x_min + 1, y_max - y_min + 1];

		// set correct origin
		pieces[item].start = [
			pieces[item].start[0] + x_min + 1,
			pieces[item].start[1] + y_min + 1
		];
	}
	//console.log(pieces);
}

function populateTray() {
	let tray = $("#pieceContainer");

	for (let item in pieces) {
		console.log("creating piece", item);
		let piece = pieces[item];
		let piece_start = piece.start;
		let piece_cells = piece.cells;
		// let piece_dim = piece.dim;

		console.log(`grid-area: ${piece_start[0]} / ${piece_start[1]}`);
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
}

function initialiseBoard() {

	for (let r=0; r < rows; r++) {

		gameState.boardState[r] = [];
		for (let c=0; c < cols; c++) {
			gameState.boardState[r][c] = {selected: false, value: 0}
		}
	}
};

function createCellElements() {

	let boardElement = $("#game");
	boardElement.empty();

	for (let r=0; r < rows; r++) {
		for (let c=0; c < cols; c++) {
			boardElement.append(`<div class="cell" data-row=${r} data-col=${c}></div>`);
		}
	}
};

function renderCell(row, col) {
	let cellState = gameState.boardState[row][col];

	let cell = $(`.cell[data-row="${row}"][data-col="${col}"]`);

	if (cellState.selected) {
		cell.css("background-color", selectedColor);
	} else {
		cell.css("background-color", baseColor);
	}
};

function renderBoard() {
	for (let r=0; r < rows; r++) {
		for (let c=0; c < cols; c++) {
			renderCell(r, c);
		}
	}
};

function handleCellClick(row, col) {
	gameState.boardState[row][col].selected = !gameState.boardState[row][col].selected;

	renderCell(row, col);
};


function clearBoard() {

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			gameState.boardState[r][c].selected = false;
			gameState.boardState[r][c].value = 0;
		}
	}
	renderBoard();
};

function showView(view) {
	$("#gameContainer, #settingsContainer, #tilesetOptionsContainer").hide();
	$(view).show();
}

$(document).ready(function() {

	populatePieces();
	populateTray();

	initialiseBoard(rows, cols);

	createCellElements();
	renderBoard();

	$("#game .cell").click(function() {

		let selector = $(this);

		let row = selector.data("row");
		let col = selector.data("col");

		handleCellClick(row, col);
	});

	$("#reset-button").click(function() {
		clearBoard();
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
			console.log("dropping piece!")
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

		const row = $(this).data("row");
		const col = $(this).data("col");

		gameState.boardState[row][col].selected = true;
		renderCell(row, col);

		$("#cursor-piece").empty().hide();
		gameState.heldPiece = null;
		gameState.originalPiece = null;

	});
});

$(document).mousemove(function(e) {
	
	let p = $("#cursor-piece");
	let x_off = p.width() / 2;
	let y_off = p.height() / 2;
	
	p.css({
		left: e.clientX - x_off,
		top: e.clientY - y_off
	});

});