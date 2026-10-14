const rowsEl = document.getElementById('rows');
const headerEl = document.getElementById('header');
const searchEl = document.getElementById('search');
const loadStatus = document.getElementById('loadStatus');
const resultCount = document.getElementById('resultCount');
const tableTitle = document.getElementById('tableTitle');
let currentSheet = 'Main List';
let currentData = [];
let currentColumns = [];
const headerPresets = {
	'Main List': ['Obby Name', 'Difficulty', 'Creator', 'Verifier', 'Gameplay Style', 'Difficulty Source(s)'],
	'Unverified List': ['Obby Name', 'Difficulty', 'Creator', 'Record Holder', 'Gameplay Style', 'Difficulty Source(s)']
};
const columnPresets = {
	'Main List': [{
		name: 'Obby Name',
		index: 1
	}, {
		name: 'Difficulty',
		index: 3
	}, {
		name: 'Creator',
		index: 5
	}, {
		name: 'Verifier',
		index: 4
	}, {
		name: 'Gameplay Style',
		index: 6
	}, {
		name: 'Difficulty Source(s)',
		index: 7
	}],
	'Unverified List': [{
		name: 'Obby Name',
		index: 1
	}, {
		name: 'Difficulty',
		index: 3
	}, {
		name: 'Creator',
		index: 7
	}, {
		name: 'Record Holder',
		index: 5
	}, {
		name: 'Gameplay Style',
		index: 8
	}, {
		name: 'Difficulty Source(s)',
		index: 9
	}]
};
const cardPresets = {
	'Main List': {
		creator: 5,
		by: 4,
		byLabel: 'verified by',
		style: 6,
		quality: 8
	},
	'Unverified List': {
		creator: 7,
		by: 5,
		byLabel: 'record by',
		style: 8,
		quality: 10
	}
};

function cellText(value) {
	if (value === null || value === undefined) return '';
	if (typeof value === 'object') return value.f ?? value.v ?? '';
	return String(value);
}

function escapeHTML(value) {
	return String(value).replace(/[&<>"']/g, char => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	} [char]));
}

function cssClassExists(className) {
	for (const sheet of document.styleSheets) {
		try {
			for (const rule of sheet.cssRules) {
				if (rule.selectorText?.split(",").some(selector => selector.trim() === `.${className}`)) {
					return true;
				}
			}
		} catch (e) {}
	}
	return false;
}

function difficultyClass(value) {
	const text = String(value).toLowerCase();
	const match = text.match(/tier\s*(\d+)/i);
	if (!match) return 'tier-unknown';
	const tier = Number(match[1]);
	if (!cssClassExists(`tier-${tier}`)) return 'tier-unknown';
	return `tier-${tier}`;
}

function getDisplayRows() {
	const query = searchEl.value.trim().toLowerCase();
	return currentData.filter(row => !query || row.some(value => cellText(value).toLowerCase().includes(query)));
}

function difficultyMarkup(row) {
	const tier = cellText(row[2]).trim();
	const dir = cellText(row[3]).trim();
	if (!tier && !dir) return '<span class="emptyValue">—</span>';
	return `${escapeHTML(tier)}${dir ? `<span class="tierDir">${escapeHTML(dir)}</span>` : ''}`;
}

function renderTable() {
	hideCard();
	const columns = currentColumns;
	headerEl.innerHTML = `<tr><th class="rowNumberHead">#</th>${columns.map(col => `<th>${escapeHTML(col.name)}</th>`).join('')}</tr>`;
	const filtered = getDisplayRows();
	const body = filtered.map(row => {
		const sourceIndex = currentData.indexOf(row);
		const cells = columns.map(col => {
			if (col.name === 'Difficulty') {
				const value = [cellText(row[2]), cellText(row[3])].filter(part => part.trim()).join(' ');
				return `<td class="difficultyCell ${difficultyClass(value)}" title="${escapeHTML(value)}">${difficultyMarkup(row)}</td>`;
			}
			const value = cellText(row[col.index]);
			const content = value.trim() ? escapeHTML(value) : '<span class="emptyValue">—</span>';
			return `<td title="${escapeHTML(value)}">${content}</td>`;
		}).join('');
		return `<tr data-i="${sourceIndex}" tabindex="0"><td class="rowNumber">${sourceIndex + 1}</td>${cells}</tr>`;
	}).join('');
	const empty = `<tr><td class="emptyState" colspan="${columns.length + 1}">No obbies match this search.</td></tr>`;
	rowsEl.innerHTML = filtered.length ? body : empty;
	resultCount.textContent = `${filtered.length.toLocaleString()} ${filtered.length === 1 ? 'entry' : 'entries'}${searchEl.value.trim() ? ' matching your search' : ''}`;
}
const card = document.getElementById('obbyCard');
const cardEls = {
	img: document.getElementById('cardImg'),
	name: document.getElementById('cardName'),
	meta: document.getElementById('cardMeta'),
	creator: document.getElementById('cardCreator'),
	by: document.getElementById('cardBy'),
	grade: document.getElementById('cardGrade')
};
const noHover = window.matchMedia('(hover: none)');
let cardRow = null;

function gradeClass(grade) {
	const letter = grade.trim().charAt(0).toUpperCase();
	if (letter === 'S') return 'grade-s';
	if (letter === 'A') return 'grade-a';
	if (letter === 'B') return 'grade-b';
	if (letter === 'C') return 'grade-c';
	if (letter === 'D') return 'grade-d';
	if (letter === 'F') return 'grade-f';
	if (letter === 'V') return 'grade-vro';
	return '';
}

function setCardImage(name) {
	const base = 'img/obbyicons/';
	const tries = [`${base}${encodeURIComponent(name)}.png`, `${base}${encodeURIComponent(name.toLowerCase())}.png`, 'img/placeholder.svg'];
	const img = cardEls.img;
	img.onerror = () => {
		tries.shift();
		if (tries.length) img.src = tries[0];
		else img.onerror = null;
	};
	img.src = tries[0];
}

function fillCard(row) {
	const preset = cardPresets[currentSheet];
	const name = cellText(row[1]).trim() || 'Unnamed obby';
	const tier = [cellText(row[2] || "Tier ?"), cellText("[" + (row[3] || "?") + "]")].filter(part => part.trim()).join(' ').trim() || 'Tier ? [?]';
	const style = cellText(row[preset.style]).trim() || '?';
	const creator = cellText(row[preset.creator]).trim();
	const by = cellText(row[preset.by]).trim();
	const grade = cellText(row[preset.quality]).trim();
	cardEls.name.textContent = name;
	cardEls.meta.textContent = `${tier}`;
	cardEls.creator.textContent = `by ${creator || 'unknown'}`;
	cardEls.by.textContent = by ? `${preset.byLabel} ${by}` : (currentSheet === 'Main List' ? 'verifier unknown' : 'unverified');
	cardEls.grade.textContent = grade;
	cardEls.grade.className = `cardGrade ${gradeClass(grade)}`.trim();
	setCardImage(name);
}

function placeCard(x, y) {
	const gap = 14;
	const w = card.offsetWidth;
	const h = card.offsetHeight;
	let left = x - w - gap;
	if (left < 8) left = x + gap + 8;
	let top = y + gap + 6;
	if (top + h > window.innerHeight - 8) top = y - h - gap;
	left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
	top = Math.max(8, top);
	card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

function showCard(tr, x, y) {
	if (tr !== cardRow) {
		cardRow = tr;
		fillCard(currentData[Number(tr.dataset.i)]);
	}
	card.hidden = false;
	placeCard(x, y);
}

function hideCard() {
	cardRow = null;
	card.hidden = true;
}
rowsEl.addEventListener('pointermove', event => {
	if (event.pointerType !== 'mouse') return;
	const tr = event.target.closest('tr[data-i]');
	if (tr) showCard(tr, event.clientX, event.clientY);
	else hideCard();
});
rowsEl.addEventListener('pointerleave', event => {
	if (event.pointerType === 'mouse') hideCard();
});
rowsEl.addEventListener('click', event => {
	if (!noHover.matches) return;
	const tr = event.target.closest('tr[data-i]');
	if (!tr || tr === cardRow) hideCard();
	else showCard(tr, event.clientX, event.clientY);
});
rowsEl.addEventListener('focusin', event => {
	const tr = event.target.closest('tr[data-i]');
	if (!tr) return;
	const rect = tr.getBoundingClientRect();
	showCard(tr, rect.left + Math.min(rect.width / 2, 320), rect.top + rect.height / 2);
});
rowsEl.addEventListener('focusout', hideCard);
window.addEventListener('scroll', hideCard, true);
window.addEventListener('resize', hideCard);
document.addEventListener('keydown', event => {
	if (event.key === 'Escape') hideCard();
});
async function getSheetData(sheetName) {
	const sheetUrl = `https://docs.google.com/spreadsheets/d/1Hs6U4uMSsxPDwMlaIUdkCBS5a1pQQ6t8YcxBitpEuaE/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
	const response = await fetch(sheetUrl);
	if (!response.ok) throw new Error(`Spreadsheet request failed (${response.status})`);
	const text = await response.text();
	const start = text.indexOf('{');
	const end = text.lastIndexOf('}');
	if (start < 0 || end < start) throw new Error('Spreadsheet returned an unexpected response.');
	const json = JSON.parse(text.slice(start, end + 1));
	return (json.table.rows || []).map(row => (row.c || []).map(cell => cell ? (cell.f ?? cell.v ?? '') : ''));
}
async function loadSheet(sheetName) {
	currentSheet = sheetName;
	document.querySelectorAll('.sidebarButton').forEach(button => {
		const active = button.dataset.sheet === sheetName;
		button.classList.toggle('active', active);
		button.setAttribute('aria-pressed', String(active));
	});
	tableTitle.textContent = sheetName === 'Main List' ? 'Vortex Obby List' : 'Unverified Vortex Obby List';
	loadStatus.textContent = 'Loading spreadsheet…';
	loadStatus.className = 'loadStatus';
	rowsEl.innerHTML = '';
	try {
		const data = await getSheetData(sheetName);
		currentData = data.filter(row => row.some(value => cellText(value).trim() !== ''));
		currentColumns = columnPresets[sheetName];
		renderTable();
		loadStatus.textContent = `Last Updated · ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
		loadStatus.classList.add('loaded');
	} catch (error) {
		console.error('Unable to load obby spreadsheet:', error);
		currentData = [];
		currentColumns = columnPresets[sheetName];
		renderTable();
		loadStatus.textContent = 'Could not load the spreadsheet. Check your connection and try again.';
		loadStatus.classList.add('error');
		resultCount.textContent = 'Spreadsheet unavailable';
	}
}
document.querySelectorAll('.sidebarButton[data-sheet]').forEach(button => {
	button.addEventListener('click', () => {
		if (button.dataset.sheet !== currentSheet) loadSheet(button.dataset.sheet);
	});
});
searchEl.addEventListener('input', renderTable);
document.querySelector('.settings').addEventListener('click', () => {
	document.querySelector('.viewSettings').classList.toggle('compact');
});
loadSheet(currentSheet);
