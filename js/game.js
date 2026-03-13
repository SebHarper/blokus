const rows = 20;
const cols = 20;

const baseColor = "#bea9de"
const selectedColor = "#cfbaef";

let boardState;

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
	initialiseBoard(rows, cols);
	console.log(boardState);
	
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
	$("#game-view").click(() => showView(".gameContainer"));
	$("#settings-view").click(() => showView(".settingsContainer"));
	$("#tileset-view").click(() => showView(".tilesetOptionsContainer"));

});