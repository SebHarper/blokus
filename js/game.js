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
		var row = pieceTray[i];

		for (let j = 0; j < row.length; j++) {
			if (row[j] != " ") {


				if (!(row[j] in pieces)) {
					pieces[row[j]] = {start: [i, j], cells: [[0,0]], dim: []};

				} else {
					var x_off = i - pieces[row[j]].start[0];
					var y_off = j - pieces[row[j]].start[1];
					pieces[row[j]].cells.push([x_off, y_off])
				}
			}
		}
	}
	for (var item in pieces) {

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

		// pass two: normalise cells
		for (const cell of pieces[item].cells) {
			cell[0] -= x_min;
			cell[1] -= y_min;
		}

		// set bounding box
		pieces[item].dim = [x_max - x_min + 1, y_max - y_min + 1];

		// set correct origin
		pieces[item].start = [
			pieces[item].start[0] + x_min, 
			pieces[item].start[1] + y_min
		];
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

	var boardElement = $('#game');
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
			boardState[r][c].selected = 0;
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

	initialiseBoard(rows, cols);

	createCellElements();
	renderBoard();

	$(".cell").click(function() {

		var selector = $(this);

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

	$(".piece").click(function() {

		heldPiece = $(this).clone();
		$(this).hide();

		$("#cursor-piece")
			.empty()
			.append(heldPiece)
			.show();
	});

});

$(document).mousemove(function(e) {

	$("#cursor-piece").css({
		left: e.clientX - 40,
		top: e.clientY - 40
	});

});