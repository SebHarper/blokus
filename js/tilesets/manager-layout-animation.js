import {searchPieceTray} from "./layout-tidy.js";
import {makeTrayPortrait} from "./tray-utils.js";

// Development-only preview animation. Enable here when experimenting with layouts.
const ENABLED = true;
let stopManagerAnimation = () => {};

export function refreshManagerLayoutAnimation(grid, getTileset, createTilesetPreview) {
	stopManagerAnimation();
	if (ENABLED) animateVisibleTilesets(grid, getTileset, createTilesetPreview);
}

function animateVisibleTilesets(grid, getTileset, createTilesetPreview) {
	const visible = new Set();
	const previews = new Map();
	let stopped = false;
	let running = false;
	let activeCard = null;
	let controller = null;

	const observer = new IntersectionObserver(entries => {
		for (const entry of entries) {
			if (entry.isIntersecting) visible.add(entry.target);
			else {
				visible.delete(entry.target);
				if (activeCard === entry.target) controller?.abort();
			}
		}
		if (!running && visible.size > 0 && !document.hidden) void run();
	}, {threshold: 0.1});

	function pauseWhenHidden() {
		if (document.hidden) controller?.abort();
		else if (!running && visible.size > 0) void run();
	}
	document.addEventListener("visibilitychange", pauseWhenHidden);
	for (const card of grid.children) observer.observe(card);

	stopManagerAnimation = () => {
		stopped = true;
		controller?.abort();
		observer.disconnect();
		document.removeEventListener("visibilitychange", pauseWhenHidden);
		visible.clear();
	};

	async function run() {
		running = true;
		try {
			while (!stopped && !document.hidden && visible.size > 0) {
					// Give each visible card a short, abortable search slice.
				for (const card of [...visible]) {
					if (stopped || document.hidden) break;
					if (!card.isConnected) {
						visible.delete(card);
						observer.unobserve(card);
						continue;
					}
					if (!visible.has(card)) continue;
					const tileset = getTileset(card.getAttribute("data-tileset-id"));
					if (tileset === null) continue;
					const tray = previews.get(card) ?? tileset.tray.map(row => Array.from(row));
					activeCard = card;
					const searchController = new AbortController();
					controller = searchController;
					const stopSearch = setTimeout(() => searchController.abort(), 100);

					try {
						await searchPieceTray(tray, bestTray => {
							if (stopped || document.hidden || !visible.has(card) || !card.isConnected || bestTray === null || bestTray.length === 0) return;
							const portrait = makeTrayPortrait(bestTray);
							if (previews.get(card) === bestTray) return;
							previews.set(card, bestTray);
							$(card).children(".tileset-preview").replaceWith(createTilesetPreview(portrait));
						}, searchController.signal);
					} finally {
						clearTimeout(stopSearch);
					}
				}
				await new Promise(resolve => setTimeout(resolve, 0));
			}
		} catch (error) {
			console.error("Could not animate tileset layouts", error);
		} finally {
			activeCard = null;
			controller = null;
			running = false;
		}
	}
}

