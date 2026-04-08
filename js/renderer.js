import {CELL, rows, cols, gameState, RENDER_FRONTIER} from './board.js';
import {pieces} from './pieces.js';


export function createCellElements() {

	let boardElement = $("#game");
	boardElement.empty();

	boardElement.css({
		"--rows": rows,
		"--cols": cols
	});

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

export function createPieceElements() {
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
				class: "cell p1",
				style: `grid-area: ${cell[0]} / ${cell[1]}`
			});
			piece_div.append(cell_div);
		}
		tray.append(piece_div);

		gameState.pieceElements[item] = piece_div;
	}
};

export function createScoreButtons() {
	const container = $("#playerScoreContainer");

	for (let i = 0; i < gameState.playerCount; i++) {
		let label = $(`<span class="score-label">P${i + 1}: 0</span>`);

		let player_div = $(`
			<div class="blokus-button" data-player="${i}">
				<div class="cell p${i+1}"></div>
			</div>
		`);

		player_div.append(label);
		container.append(player_div);

		gameState.scoreElements[i] = [player_div, label];
	}
}

export function createCursorReference() {
	gameState.cursorElement = $("#cursor-piece");
}

export function updateCursorPiece(e, letter) {
	let cursor = gameState.cursorElement;

	// reset element rotation and state rotation
	cursor.css("transform", "none");
	gameState.heldPiece.rotation = 0;

	cursor.hide().empty();

	if (!letter) return;

	let template = gameState.pieceElements[letter];
	let clone = template.clone(false);

	cursor.append(clone).show();

	moveCursorPiece(e);
};



export function moveCursorPiece(e) {

	let cursor = gameState.cursorElement;

	let x_off = cursor.width() / 2;
	let y_off = cursor.height() / 2;

	cursor.css({
		left: e.clientX - x_off,
		top: e.clientY - y_off
	});

};


export function highlightTrayPiece(pieceCode) {
	gameState.pieceElements[pieceCode].addClass("selected");
};

export function clearTrayHighlight(pieceCode) {
	gameState.pieceElements[pieceCode].removeClass("selected");
};


export function markTrayPieceUsed(pieceCode) {
	gameState.pieceElements[pieceCode].addClass("used");
};

export function clearTrayUsed(pieceCode) {
	gameState.pieceElements[pieceCode].removeClass("used");
};

export function changeTrayPlayer(player) {

	const playerTray = gameState.playerTrays[player];

	for (const pieceCode in playerTray) {
		let available = playerTray[pieceCode];
		let el = gameState.pieceElements[pieceCode];

		el.removeClass("used selected");

		if (!available) {
			el.addClass("used");
		}

		el.children().removeClass("p1 p2 p3 p4");
		el.children().addClass(`p${player + 1}`);
	}
};


export function renderGhostCells(cells) {

	clearGhostCells();

	const playerClass = `p${gameState.currentPlayer + 1}`;

	const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

	for (const [r,c] of cells) {
		const el = gameState.cellElements[r][c];

		el.addClass("ghost").addClass(playerClass);

		if (!cellSet.has(`${r-1},${c}`)) el.addClass("ghost-top");
		if (!cellSet.has(`${r+1},${c}`)) el.addClass("ghost-bottom");
		if (!cellSet.has(`${r},${c-1}`)) el.addClass("ghost-left");
		if (!cellSet.has(`${r},${c+1}`)) el.addClass("ghost-right");
	}
};

export function clearGhostCells() {
	$(".ghost").removeClass("ghost p1 p2 p3 p4");
	$(".cell").removeClass("ghost-top ghost-bottom ghost-left ghost-right")
};


export function setCursorInvalid(invalid) {

	const cursor = gameState.cursorElement;

	if (invalid) {
		cursor.addClass("invalid");
	} else {
		cursor.removeClass("invalid");
	}
};

export function resetTrayUI() {

	const pieces = $("#pieceContainer .piece");

	pieces.removeClass("used selected");

	const children = pieces.children(".cell");

	children.removeClass("p1 p2 p3 p4");
	children.addClass("p1");


/* 	$("#pieceContainer .piece")
		.removeClass("used selected")
		.children(".cell")
		.removeClass("p1 p2 p3 p4")
		.addClass("p1"); */
};

export function hideCursorPiece() {
	gameState.cursorElement.hide();
}

export function showCursorPiece() {
	gameState.cursorElement.show();
}

export function applyCursorTransform() {
	const rot = gameState.heldPiece.rotation;
	const flipped = gameState.heldPiece.flipped;
	const scaleX = flipped ? -1 : 1;

	// change rotation direction depending on flipped state
	// - this ensures shape always rotates clockwise
	const rotationDegrees = flipped ? -rot * 90 : rot * 90;


	gameState.cursorElement.css("transform", `scaleX(${scaleX}) rotate(${rotationDegrees}deg)`);
}

export function showView(view) {
	$("#gameContainer, #settingsContainer, #tilesetOptionsContainer").hide();
	$(view).show();
};

export function renderCell(row, col) {
	let cellState = gameState.boardState[row][col];
	let cell = gameState.cellElements[row][col];

	cell.removeClass("empty ghost p1 p2 p3 p4");

	if (cellState === CELL.EMPTY) {
		cell.addClass("empty");
	}
	else if (cellState >= CELL.PLAYER_1 && cellState <= CELL.PLAYER_4){
		cell.addClass(`p${cellState}`);
	}
	else if (cellState === CELL.GHOST) {
		cell.addClass("ghost");
	}
};

export function renderBoard() {

	for (let r=0; r < rows; r++) {
		for (let c=0; c < cols; c++) {
			renderCell(r, c);
		}
	}
};

export function renderGhostFromState() {

	const ghostCells = gameState.ghostCells;

	if (ghostCells.length) {
		renderGhostCells(ghostCells);
		setCursorInvalid(false);
		hideCursorPiece();
	} else {
		clearGhostCells();
		setCursorInvalid(true);
		showCursorPiece();
	}
}

export function updatePlayerLabel() {
	const label = $("#playerLabel");

	label.text(`Player ${gameState.currentPlayer + 1}`);
}

export function displayFrontierCells(cells) {
	if (!RENDER_FRONTIER) return;

	$(".cell").removeClass("frontier");

	for (const [r, c] of cells) {
		$(`.cell[data-row=${r}][data-col=${c}]`)
			.addClass("frontier")
	}
};

export function clearFrontierCells() {
	$(".cell").removeClass("frontier");
};

export function updatePlayerScores() {

	for (let i = 0; i < gameState.playerCount; i++) {
		gameState.scoreElements[i][1].text(`P${i + 1}: ${89 - gameState.playerScores[i]}`);
	}
}

export function highlightCurrentPlayer () {

	$(".player-highlight").removeClass("player-highlight");
	gameState.scoreElements[gameState.currentPlayer][0].addClass("player-highlight");
}