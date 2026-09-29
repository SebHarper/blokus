import {DEFAULT_TILESETS} from "./default-tilesets.js";
import {buildPieceTrayFromCells} from "./tileset-builder.js";

const CLASSIC_TILESET_ID = "classic";

const tilesets = [];
let selectedTilesetId = null;
let nextTilesetNumber = 1;

export function initialiseTilesets() {
	tilesets.length = 0;

	for (let i = 0; i < DEFAULT_TILESETS.length; i++) {
		const tileset = DEFAULT_TILESETS[i];

		tilesets.push({
			id: tileset.id,
			name: tileset.name,
			tray: copyTray(tileset.tray),
			builtIn: true
		});
	}

	selectedTilesetId = CLASSIC_TILESET_ID;
	nextTilesetNumber = 1;

	addRandomTestTilesets(32);

	$("#tilesetSelectorContainer").on("click", ".tileset-select-button", function () {
		const id = $(this).closest(".tileset-card").attr("data-tileset-id");

		if (!selectTileset(id)) return;

		const card = $(`.tileset-card[data-tileset-id="${id}"]`);

		$(".tileset-card.selected").removeClass("selected");
		card.addClass("selected");
		card.prependTo(".tileset-card-grid");
	});

	$("#tilesetSelectorContainer").on("click", ".tileset-delete-button", function () {
		const card = $(this).closest(".tileset-card");
		const id = card.attr("data-tileset-id");
		const wasSelected = card.hasClass("selected");

		if (!deleteTileset(id)) return;

		card.remove();

		if (wasSelected) {
			const classicCard = $(`.tileset-card[data-tileset-id="${CLASSIC_TILESET_ID}"]`);
			classicCard.addClass("selected");
			classicCard.prependTo(".tileset-card-grid");
		}
	});
}

function addRandomTestTilesets(count) {
	for (let i = 0; i < count; i++) {
		const rows = 5 + Math.floor(Math.random() * 16);
		const cols = 5 + Math.floor(Math.random() * 16);
		const tray = createRandomTray(rows, cols);

		saveTileset(`Custom ${i + 1}`, tray);
	}
}

function createRandomTray(rows, cols) {
	const cells = [];

	for (let row = 0; row < rows; row++) {
		cells[row] = [];

		for (let col = 0; col < cols; col++) {
			cells[row][col] = Math.random() < 0.4;
		}
	}

	return buildPieceTrayFromCells(cells);
}

export function renderTilesetManager() {
	const container = $("#tilesetSelectorContainer");
	container.empty();

	const header = $("<div>", {class: "tileset-manager-header"});
	header.append("<h2>Tilesets</h2>");
	header.append($("<button>", {
		class: "tileset-new-button",
		type: "button",
		title: "Create a tileset",
		text: "+"
	}));
	container.append(header);

	const cardGrid = $("<div>", {class: "tileset-card-grid"});
	const selectedTileset = getSelectedTileset();

	if (selectedTileset !== null) {
		cardGrid.append(createTilesetCard(selectedTileset));
	}

	for (let i = 0; i < tilesets.length; i++) {
		if (tilesets[i].id === selectedTilesetId) continue;

		cardGrid.append(createTilesetCard(tilesets[i]));
	}

	container.append(cardGrid);
}

export function getTilesets() {
	return tilesets;
}

export function getTileset(id) {
	for (let i = 0; i < tilesets.length; i++) {
		if (tilesets[i].id === id) return tilesets[i];
	}

	return null;
}

export function getSelectedTileset() {
	return getTileset(selectedTilesetId);
}

export function selectTileset(id) {
	if (getTileset(id) === null) return false;

	selectedTilesetId = id;
	return true;
}

export function saveTileset(name, tray, id = null) {
	if (!Array.isArray(tray) || tray.length === 0) return null;

	if (id !== null) {
		const existingTileset = getTileset(id);

		if (existingTileset !== null && !existingTileset.builtIn) {
			existingTileset.name = name;
			existingTileset.tray = copyTray(tray);
			return existingTileset;
		}
	}

	const tileset = {
		id: `custom-${nextTilesetNumber}`,
		name: name,
		tray: copyTray(tray),
		builtIn: false
	};

	nextTilesetNumber++;
	tilesets.push(tileset);
	return tileset;
}

export function copyTileset(id) {
	const sourceTileset = getTileset(id);

	if (sourceTileset === null) return null;

	return saveTileset(getCopyName(sourceTileset.name), sourceTileset.tray);
}

export function deleteTileset(id) {
	const tileset = getTileset(id);

	if (tileset === null || tileset.builtIn) return false;

	for (let i = 0; i < tilesets.length; i++) {
		if (tilesets[i].id === id) {
			tilesets.splice(i, 1);
			break;
		}
	}

	if (selectedTilesetId === id) {
		selectedTilesetId = CLASSIC_TILESET_ID;
	}

	return true;
}

function copyTray(tray) {
	const copiedTray = [];

	for (let row = 0; row < tray.length; row++) {
		if (typeof tray[row] === "string") {
			copiedTray.push(tray[row]);
		} else {
			copiedTray[row] = [];

			for (let col = 0; col < tray[row].length; col++) {
				copiedTray[row][col] = tray[row][col];
			}
		}
	}

	return copiedTray;
}

function getCopyName(name) {
	const copySuffix = / copy\(\d+\)$/;
	const baseName = name.replace(copySuffix, "");
	let copyNumber = 1;

	while (tilesetNameExists(`${baseName} copy(${copyNumber})`)) {
		copyNumber++;
	}

	return `${baseName} copy(${copyNumber})`;
}

function tilesetNameExists(name) {
	for (let i = 0; i < tilesets.length; i++) {
		if (tilesets[i].name === name) return true;
	}

	return false;
}

function createTilesetCard(tileset) {
	const card = $("<div>", {class: "tileset-card"})
		.attr("data-tileset-id", tileset.id);

	if (tileset.id === selectedTilesetId) {
		card.addClass("selected");
	}

	card.append($("<h3>", {text: tileset.name}));
	card.append(createTilesetPreview(tileset.tray));

	const actions = $("<div>", {class: "tileset-card-actions"});
	actions.append($("<button>", {
		class: "tileset-select-button",
		type: "button",
		text: "Select"
	}));
	actions.append($("<button>", {type: "button", text: "Edit"}));
	actions.append($("<button>", {type: "button", text: "Copy"}));

	const deleteButton = $("<button>", {
		class: "tileset-delete-button",
		type: "button",
		text: "Delete"
	});
	if (tileset.builtIn) deleteButton.prop("disabled", true);
	actions.append(deleteButton);
	card.append(actions);

	return card;
}

function createTilesetPreview(tray) {
	const dimensions = getTrayDimensions(tray);
	const preview = $("<div>", {class: "tileset-preview"});
	const grid = $("<div>", {class: "tileset-preview-grid"}).css({
		"--preview-cols": dimensions.cols,
		"--preview-rows": dimensions.rows
	});

	for (let row = 0; row < dimensions.rows; row++) {
		for (let col = 0; col < dimensions.cols; col++) {
			const cell = $("<div>", {class: "tileset-preview-cell"});
			const value = getTrayCell(tray, row, col);

			if (value !== " ") cell.addClass("filled");
			grid.append(cell);
		}
	}

	preview.append(grid);
	return preview;
}

function getTrayDimensions(tray) {
	let cols = 0;

	for (let row = 0; row < tray.length; row++) {
		if (tray[row].length > cols) cols = tray[row].length;
	}

	return {rows: tray.length, cols: cols};
}

function getTrayCell(tray, row, col) {
	if (row >= tray.length || col >= tray[row].length) return " ";
	return tray[row][col];
}
