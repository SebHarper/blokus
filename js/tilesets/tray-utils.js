export function makeTrayPortrait(tray) {
	const width = getTrayWidth(tray);

	if (width <= tray.length) return tray;

	const rotatedTray = [];

	for (let row = 0; row < width; row++) {
		rotatedTray[row] = [];

		for (let col = 0; col < tray.length; col++) {
			const sourceRow = tray.length - col - 1;
			rotatedTray[row][col] = getTrayCell(tray, sourceRow, row);
		}
	}

	return rotatedTray;
}

function getTrayWidth(tray) {
	let width = 0;

	for (let row = 0; row < tray.length; row++) {
		width = Math.max(width, tray[row].length);
	}

	return width;
}

function getTrayCell(tray, row, col) {
	if (col >= tray[row].length) return " ";
	return tray[row][col];
}
