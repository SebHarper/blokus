const MAX_TRAY_SIZE = 20;

export async function searchPieceTray(tray, onBestTray, signal) {
	return runContinuousPackingSearch(tray, onBestTray, signal);
}

async function runContinuousPackingSearch(tray, onBestTray, signal) {
	const search = searchLayouts(tray);
	let bestTray = tray;
	let pendingBestTray = null;
	let lastUiYield = performance.now();

	while (true) {
		if (signal?.aborted) {
			search.return();
			onBestTray?.(bestTray);
			return bestTray;
		}

		const step = search.next();

		if (step.done) {
			if (step.value !== null) bestTray = step.value;
			break;
		}

		if (step.value.type === "improvement") {
			bestTray = step.value.tray;
			pendingBestTray = bestTray;
		}

		if (performance.now() - lastUiYield < 12) continue;

		if (pendingBestTray !== null) onBestTray?.(pendingBestTray);
		pendingBestTray = null;
		await new Promise(requestAnimationFrame);
		lastUiYield = performance.now();
	}

	onBestTray?.(bestTray);
	return bestTray;
}

// Search strategy: explore layouts and expose safe interruption points.
function* searchLayouts(tray) {
	const pieces = getPieces(tray);
	if (pieces.length === 0) return tray;

	for (const piece of pieces) piece.forms = getPieceForms(piece.cells);

	let bestTray = isValidPieceTray(tray) ? cropTray(tray) : null;
	let bestScore = bestTray === null ? Infinity : getPieceTrayScore(bestTray);
	let currentTray = bestTray;
	let currentScore = bestScore;
	let attempt = 0;

	if (bestTray !== null) yield {type: "improvement", tray: bestTray};

	while (true) {
		let candidate;

		// Keep independent restarts, but spend most attempts improving the incumbent.
		if (bestTray !== null && attempt++ % 5 !== 4) {
			candidate = yield* refineLayout(currentTray, pieces);
		} else {
			candidate = yield* searchRandomLayout(pieces, bestTray);
		}

		if (candidate !== null) {
			candidate = cropTray(candidate);
			const score = getPieceTrayScore(candidate);

			if (score <= currentScore) {
				currentScore = score;
				currentTray = candidate;
			}

			if (score < bestScore) {
				bestScore = score;
				bestTray = candidate;
				yield {type: "improvement", tray: bestTray};
				continue;
			}
		}

		yield {type: "checkpoint"};
	}
}

function* searchRandomLayout(pieces, bestTray) {
	const width = getRandomSize(pieces, "col");
	const randomHeight = getRandomSize(pieces, "row");
	const targetArea = bestTray === null ? null : bestTray.length * bestTray[0].length;
	const height = width === null || randomHeight === null || targetArea === null
		? randomHeight
		: Math.min(randomHeight, Math.max(5, Math.ceil(targetArea / width)));

	if (width === null || height === null) return null;

	return yield* searchLayout(pieces, createEmptyTray(width, height), 0, {nodes: 0, limit: 160});
}

function* refineLayout(bestTray, pieces) {
	const tray = copyTray(bestTray);
	const shuffled = pieces.slice();

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	const count = Math.random() < 0.7 ? 1 : Math.min(3, pieces.length);
	const removed = shuffled.slice(0, count);
	const ids = new Set();

	for (let i = 0; i < removed.length; i++) ids.add(removed[i].id);

	for (const row of tray) {
		for (let col = 0; col < row.length; col++) {
			if (ids.has(row[col])) row[col] = " ";
		}
	}

	return yield* searchLayout(removed, tray, 0, {nodes: 0, limit: 160});
}

function* searchLayout(pieces, tray, index, state) {
	if (index === pieces.length) return tray;
	if (state.nodes++ >= state.limit) return null;

	const piece = pieces[index];
	const placements = rankPlacements(getPlacements(piece, tray), tray);

	for (let i = 0; i < placements.length; i++) {
		const placement = placements[i];

		placeForm(tray, placement.form, placement.row, placement.col, piece.id);
		yield {type: "checkpoint"};

		const candidate = yield* searchLayout(pieces, tray, index + 1, state);
		if (candidate !== null) return candidate;

		removeForm(tray, placement.form, placement.row, placement.col);
	}

	return null;
}

function rankPlacements(placements, tray) {
	const bounds = getTrayBounds(tray);

	for (let i = 0; i < placements.length; i++) {
		const placement = placements[i];
		placement.rank = getPlacementArea(placement, bounds) + (Math.random() * 8);
	}

	placements.sort((a, b) => a.rank - b.rank);
	return placements;
}

function getTrayBounds(tray) {
	let minRow = tray.length;
	let minCol = tray[0].length;
	let maxRow = -1;
	let maxCol = -1;

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			if (tray[row][col] === " ") continue;
			minRow = Math.min(minRow, row);
			minCol = Math.min(minCol, col);
			maxRow = Math.max(maxRow, row);
			maxCol = Math.max(maxCol, col);
		}
	}

	return {minRow: minRow, minCol: minCol, maxRow: maxRow, maxCol: maxCol};
}

function getPlacementArea(placement, bounds) {
	const height = getPieceSize(placement.form, "row");
	const width = getPieceSize(placement.form, "col");
	const minRow = Math.min(bounds.minRow, placement.row);
	const minCol = Math.min(bounds.minCol, placement.col);
	const maxRow = Math.max(bounds.maxRow, placement.row + height - 1);
	const maxCol = Math.max(bounds.maxCol, placement.col + width - 1);

	return (maxRow - minRow + 1) * (maxCol - minCol + 1);
}

export function removeDuplicatePieces(tray) {
	const pieceCells = {};
	const pieceOrder = [];

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			const id = tray[row][col];

			if (id === " ") continue;
			if (!(id in pieceCells)) {
				pieceCells[id] = [];
				pieceOrder.push(id);
			}

			pieceCells[id].push([row, col]);
		}
	}

	const seenShapes = new Set();

	for (let i = 0; i < pieceOrder.length; i++) {
		const id = pieceOrder[i];
		const shape = getPieceShapeKey(pieceCells[id]);

		if (seenShapes.has(shape)) {
			for (let cell = 0; cell < pieceCells[id].length; cell++) {
				const [row, col] = pieceCells[id][cell];
				tray[row][col] = " ";
			}
		} else {
			seenShapes.add(shape);
		}
	}
}

function getPieces(tray) {
	const piecesById = {};

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			const id = tray[row][col];

			if (id === " ") continue;
			if (!(id in piecesById)) piecesById[id] = [];

			piecesById[id].push([row, col]);
		}
	}

	const pieces = [];

	for (const id in piecesById) {
		pieces.push({id: id, cells: normaliseCells(piecesById[id])});
	}

	pieces.sort((a, b) => b.cells.length - a.cells.length);
	return pieces;
}

function normaliseCells(cells) {
	let minRow = Infinity;
	let minCol = Infinity;

	for (let i = 0; i < cells.length; i++) {
		minRow = Math.min(minRow, cells[i][0]);
		minCol = Math.min(minCol, cells[i][1]);
	}

	const normalisedCells = [];

	for (let i = 0; i < cells.length; i++) {
		normalisedCells.push([cells[i][0] - minRow, cells[i][1] - minCol]);
	}

	return normalisedCells;
}

function getPieceShapeKey(cells) {
	const keys = [];

	for (let flip = 0; flip < 2; flip++) {
		for (let rotation = 0; rotation < 4; rotation++) {
			const shape = [];

			for (let i = 0; i < cells.length; i++) {
				let row = cells[i][0];
				let col = cells[i][1];

				if (flip) col = -col;

				for (let turn = 0; turn < rotation; turn++) {
					const previousRow = row;
					row = col;
					col = -previousRow;
				}

				shape.push([row, col]);
			}

			keys.push(getNormalisedShapeKey(shape));
		}
	}

	keys.sort();
	return keys[0];
}

function getNormalisedShapeKey(cells) {
	const normalisedCells = normaliseCells(cells);
	normalisedCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	let key = "";

	for (let i = 0; i < normalisedCells.length; i++) {
		key += `${normalisedCells[i][0]},${normalisedCells[i][1]};`;
	}

	return key;
}

function getRandomSize(pieces, axis) {
	let minimum = 5;

	for (let i = 0; i < pieces.length; i++) {
		const size = getPieceSize(pieces[i].cells, axis);
		minimum = Math.max(minimum, size);
	}

	if (minimum > MAX_TRAY_SIZE) return null;

	return minimum + Math.floor(Math.random() * (MAX_TRAY_SIZE - minimum + 1));
}

function getPieceSize(cells, axis) {
	const index = axis === "row" ? 0 : 1;
	let maximum = 0;

	for (let i = 0; i < cells.length; i++) {
		maximum = Math.max(maximum, cells[i][index]);
	}

	return maximum + 1;
}

function getPieceForms(cells) {
	const forms = [];
	const keys = new Set();

	for (let flip = 0; flip < 2; flip++) {
		for (let rotation = 0; rotation < 4; rotation++) {
			const form = [];

			for (let i = 0; i < cells.length; i++) {
				let row = cells[i][0];
				let col = cells[i][1];

				if (flip) col = -col;

				for (let turn = 0; turn < rotation; turn++) {
					const previousRow = row;
					row = col;
					col = -previousRow;
				}

				form.push([row, col]);
			}

			const normalisedForm = normaliseCells(form);
			normalisedForm.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
			let key = "";

			for (let i = 0; i < normalisedForm.length; i++) {
				key += `${normalisedForm[i][0]},${normalisedForm[i][1]};`;
			}

			if (keys.has(key)) continue;

			keys.add(key);
			forms.push(normalisedForm);
		}
	}

	return forms;
}

function createEmptyTray(width, height) {
	const tray = [];

	for (let row = 0; row < height; row++) {
		tray[row] = [];

		for (let col = 0; col < width; col++) {
			tray[row][col] = " ";
		}
	}

	return tray;
}

function copyTray(tray) {
	const copy = [];

	for (let row = 0; row < tray.length; row++) {
		copy[row] = tray[row].slice();
	}

	return copy;
}

function getPlacements(piece, tray) {
	const placements = [];

	for (let formIndex = 0; formIndex < piece.forms.length; formIndex++) {
		const form = piece.forms[formIndex];

		for (let row = 0; row < tray.length; row++) {
			for (let col = 0; col < tray[row].length; col++) {
				if (!canPlaceForm(tray, form, row, col)) continue;
				placements.push({form: form, row: row, col: col});
			}
		}
	}

	return placements;
}

function canPlaceForm(tray, form, startRow, startCol) {
	for (let i = 0; i < form.length; i++) {
		const row = startRow + form[i][0];
		const col = startCol + form[i][1];

		if (row < 0 || row >= tray.length || col < 0 || col >= tray[row].length) return false;

		for (let neighbourRow = row - 1; neighbourRow <= row + 1; neighbourRow++) {
			for (let neighbourCol = col - 1; neighbourCol <= col + 1; neighbourCol++) {
				if (neighbourRow < 0 || neighbourRow >= tray.length) continue;
				if (neighbourCol < 0 || neighbourCol >= tray[neighbourRow].length) continue;
				if (tray[neighbourRow][neighbourCol] !== " ") return false;
			}
		}
	}

	return true;
}

function placeForm(tray, form, startRow, startCol, id) {
	for (let i = 0; i < form.length; i++) {
		tray[startRow + form[i][0]][startCol + form[i][1]] = id;
	}
}

function removeForm(tray, form, startRow, startCol) {
	placeForm(tray, form, startRow, startCol, " ");
}

function cropTray(tray) {
	let minRow = tray.length;
	let maxRow = -1;
	let minCol = tray[0].length;
	let maxCol = -1;

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			if (tray[row][col] === " ") continue;

			minRow = Math.min(minRow, row);
			maxRow = Math.max(maxRow, row);
			minCol = Math.min(minCol, col);
			maxCol = Math.max(maxCol, col);
		}
	}

	const croppedTray = [];

	for (let row = minRow; row <= maxRow; row++) {
		croppedTray.push(tray[row].slice(minCol, maxCol + 1));
	}

	return croppedTray;
}

function isValidPieceTray(tray) {
	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			const id = tray[row][col];
			if (id === " ") continue;

			for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
				for (let colOffset = -1; colOffset <= 1; colOffset++) {
					if (rowOffset === 0 && colOffset === 0) continue;

					const neighbourRow = row + rowOffset;
					const neighbourCol = col + colOffset;

					if (neighbourRow < 0 || neighbourRow >= tray.length) continue;
					if (neighbourCol < 0 || neighbourCol >= tray[neighbourRow].length) continue;

					const neighbourId = tray[neighbourRow][neighbourCol];
					if (neighbourId !== " " && neighbourId !== id) return false;
				}
			}
		}
	}

	return true;
}

export function getPieceTrayScore(tray) {
	const area = tray.length * tray[0].length;
	const emptyCellMetrics = getEmptyCellMetrics(tray);

	// Area still matters most, but a layout with a large loose empty region should
	// lose to one whose empty cells are held between pieces or the tray wall.
	return (area * 1000000)
		+ (emptyCellMetrics.unattached * 1000)
		+ (emptyCellMetrics.weaklySupported);
}

function getEmptyCellMetrics(tray) {
	let unattached = 0;
	let weaklySupported = 0;

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			if (tray[row][col] !== " ") continue;

			const pieceContacts = getPieceContactCount(tray, row, col);
			const wallContacts = getWallContactCount(tray, row, col);

			if (pieceContacts === 0) unattached++;
			if (pieceContacts + wallContacts <= 1) weaklySupported++;
		}
	}

	return {unattached: unattached, weaklySupported: weaklySupported};
}

function getPieceContactCount(tray, row, col) {
	let contacts = 0;
	const neighbours = [[-1, 0], [0, 1], [1, 0], [0, -1]];

	for (let i = 0; i < neighbours.length; i++) {
		const neighbourRow = row + neighbours[i][0];
		const neighbourCol = col + neighbours[i][1];

		if (neighbourRow < 0 || neighbourRow >= tray.length) continue;
		if (neighbourCol < 0 || neighbourCol >= tray[neighbourRow].length) continue;
		if (tray[neighbourRow][neighbourCol] !== " ") contacts++;
	}

	return contacts;
}

function getWallContactCount(tray, row, col) {
	let contacts = 0;

	if (row === 0) contacts++;
	if (row === tray.length - 1) contacts++;
	if (col === 0) contacts++;
	if (col === tray[row].length - 1) contacts++;

	return contacts;
}
