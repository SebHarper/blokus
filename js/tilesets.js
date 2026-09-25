import {pieceTray} from "./pieces.js";

const CLASSIC_TILESET_ID = "classic";

const tilesets = [];
let selectedTilesetId = null;
let nextTilesetNumber = 1;

export function initialiseTilesets() {
	tilesets.length = 0;

	tilesets.push({
		id: CLASSIC_TILESET_ID,
		name: "Classic",
		tray: copyTray(pieceTray),
		builtIn: true
	});

	selectedTilesetId = CLASSIC_TILESET_ID;
	nextTilesetNumber = 1;
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

	return saveTileset(`${sourceTileset.name} copy`, sourceTileset.tray);
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
