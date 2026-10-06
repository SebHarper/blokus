const NEIGHBOUR_OFFSETS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function buildPieceTrayFromCells(cells) {
	const tray = copyCells(cells);
	let pieceIndex = 0;

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			if (tray[row][col] !== true) continue;

			const pieceCells = floodFill(tray, row, col);

			for (let i = 0; i < pieceCells.length; i++) {
				const [pieceRow, pieceCol] = pieceCells[i];
				tray[pieceRow][pieceCol] = `p_${pieceIndex}`;
			}

			pieceIndex++;
		}
	}

	for (let row = 0; row < tray.length; row++) {
		for (let col = 0; col < tray[row].length; col++) {
			if (tray[row][col] === false) tray[row][col] = " ";
		}
	}

	return tray;
}

function copyCells(cells) {
	const copiedCells = [];

	for (let row = 0; row < cells.length; row++) {
		copiedCells[row] = [];

		for (let col = 0; col < cells[row].length; col++) {
			copiedCells[row][col] = cells[row][col];
		}
	}

	return copiedCells;
}

function floodFill(cells, startRow, startCol) {
	const outputCells = [];
	const stack = [[startRow, startCol]];
	const visited = new Set();

	visited.add(`${startRow},${startCol}`);

	while (stack.length > 0) {
		const [row, col] = stack.pop();
		outputCells.push([row, col]);

		for (let i = 0; i < NEIGHBOUR_OFFSETS.length; i++) {
			const [rowOffset, colOffset] = NEIGHBOUR_OFFSETS[i];
			const nextRow = row + rowOffset;
			const nextCol = col + colOffset;

			if (!isInBounds(cells, nextRow, nextCol)) continue;
			if (cells[nextRow][nextCol] !== true) continue;

			const key = `${nextRow},${nextCol}`;

			if (visited.has(key)) continue;

			visited.add(key);
			stack.push([nextRow, nextCol]);
		}
	}

	return outputCells;
}

function isInBounds(cells, row, col) {
	return row >= 0 && row < cells.length && col >= 0 && col < cells[row].length;
}