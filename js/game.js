const rows = 20;
const cols = 20;

const baseColor = "#bea9de"
const selectedColor = "#cfbaef";

let boardState;

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
			style: `grid-area: ${piece_start[0]} / ${piece_start[1]}`
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

	boardState = [];
	for (let r=0; r < rows; r++) {

		boardState[r] = [];
		for (let c=0; c < cols; c++) {
			boardState[r][c] = {selected: false, value: 0}
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
	let cellState = boardState[row][col];

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
	boardState[row][col].selected = !boardState[row][col].selected;

	renderCell(row, col);
};


function clearBoard() {

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			boardState[r][c].selected = false;
			boardState[r][c].value = 0;
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

	let heldPiece = null;

	$(".piece").click(function(e) {

		heldPiece = $(this).clone();
		$(this).hide();
		
		let cursor = $("#cursor-piece");
		
		cursor
			.empty()
			.append(heldPiece)
			.show();
		
		let x_off = cursor.width() / 2;
		let y_off = cursor.height() / 2;

		cursor.css({
			left: e.clientX - x_off,
			top: e.clientY - y_off
		});
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