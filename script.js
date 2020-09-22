// Cat-Tuong Tu

var _PDF_DOC,
	_CURRENT_PAGE,
	_TOTAL_PAGES,
	_HIGHLIGHT_COLOR = "yellow",
	_PAGE_RENDERING_IN_PROGRESS = 0,
	_PACER_MODE = false,
	_IS_PACING = false,
	_TEXT_LAYER = document.querySelector("#text-layer"),
	_CANVAS = document.querySelector("#pdf-canvas"),
	_PDF_LINK,
	_START_PAGE = 1,
	_END_PAGE = 1,
	_WORDS_PER_MINUTE = 350;

var textItems;
var separateWords;
var _SAVE_START_END = document.querySelector(
	"#save-start-end"
);
_SAVE_START_END.disabled = true;

// INITIALIZE AND LOAD PDF
async function showPDF(pdf_url) {
	document.querySelector("#pdf-loader").style.dislpay =
		"block";

	// GET HANDLE OF PDF DOCUMENT
	try {
		_PDF_DOC = await pdfjsLib.getDocument({ url: pdf_url })
			.promise;

		// TOTAL PAGES IN PDF
		_TOTAL_PAGES = _PDF_DOC.numPages;
		_END_PAGE = _TOTAL_PAGES;

		// HIDE THE PDF LOADER AND SHOW PDF CONTAINER
		document.querySelector("#pdf-loader").style.display =
			"none";
		document.querySelector("#pdf-contents").style.display =
			"block";
		document.querySelector(
			"#page-count-container"
		).style.display = "inline-block";
		document.querySelector(
			"#pdf-total-pages"
		).innerHTML = _TOTAL_PAGES;

		// SHOW THE FIRST PAGE
		showPage(1);

		// PAGE SELECTOR
		document.querySelector("#total-pages").innerHTML =
			"/" + _TOTAL_PAGES;

		// ENABLE BUTTON
		_SAVE_START_END.disabled = false;
	} catch (error) {
		alert(error.message);
	}
}

async function showPage(page_no) {
	_PAGE_RENDERING_IN_PROGRESS = 1;
	_CURRENT_PAGE = page_no;

	// DISABLE PREVIOUS & NEXT BUTTONS WHILE LOADING
	document.querySelector("#pdf-next").disabled = true;
	document.querySelector("#pdf-prev").disabled = true;

	document.querySelector("#pdf-canvas").style.display =
		"none";
	document.querySelector("#text-layer").style.display =
		"none";

	// update current page
	document.querySelector(
		"#pdf-current-page"
	).innerHTML = page_no;

	try {
		var page = await _PDF_DOC.getPage(page_no);
	} catch (error) {
		alert(error.message);
	}

	// ORIGINAL WIDTH OF THE PDF PAGE AT SCALE 1
	var pdf_original_width = page.getViewport({ scale: 1 })
		.width;

	// AS THE CANVAS IS OF A FIXED WIDTH WE NEED TO ADJUST THE SCALE
	// OF THE VIEWPORT WHERE PAGE IS RENDERED
	var scale_required = {
		scale: _CANVAS.width / pdf_original_width,
	};

	// GET VIEWPORT TO RENDER THE PAGE AT REQUIRED SCALE
	var viewport = page.getViewport(scale_required);

	// SET CANVAS HEIGHT SAME AS VIEWPORT HEIGHT
	_CANVAS.height = viewport.height;

	var render_context = {
		canvasContext: _CANVAS.getContext("2d"),
		viewport: viewport,
	};

	// RENDER THE PAGE CONTENTS INTO THE CANVAS

	try {
		await page.render(render_context).promise;
	} catch (error) {
		alert(error.message);
	}

	// CLEARS THE TEXT LAYER BEFORE USING IT
	document.querySelector("#text-layer").innerHTML = "";

	// SHOWS BOTH CANVAS AND TEXT LAYER
	_CANVAS.style.display = "block";
	_TEXT_LAYER.style.display = "block";

	// GRABS TEXT LAYER
	page
		.render(render_context)
		.promise.then(function () {
			// RETURNS A PROMISE THAT RESOLVES WITH TEXT CONTENT
			return page.getTextContent();
		})
		.then(function (textContent) {
			// CANVAS OFFSET LEFT AND TOP
			var canvas_offset_left = _CANVAS.offsetLeft;
			var canvas_offset_top = _CANVAS.offsetTop;

			// CANVAS HEIGHT
			var canvas_height = _CANVAS.height;

			// CANVAS WIDTH
			var canvas_width = _CANVAS.width;

			// ASSIGN CSS TO TEXT LAYER
			_TEXT_LAYER.style.left = canvas_offset_left + "px";
			_TEXT_LAYER.style.top = canvas_offset_top + "px";
			_TEXT_LAYER.style.height = canvas_height + "px";
			_TEXT_LAYER.style.width = canvas_width + "px";

			textItems = textContent.items;
			var finalString = "";
			var line = 0;

			// CONCATENATE THE STRINGS TO MAKE A FINAL STRING
			for (var i = 0; i < textItems.length; i++) {
				if (line != textItems[i].transform[5]) {
					if (line != 0) {
						finalString += "<br/><br/>";
					}

					line = textItems[i].transform[5];
				}
				var item = textItems[i];

				finalString += item.str;
			}

			// DENOTE separateWords FOR HIGHLIGHTING
			separateWords = finalString;
			_TEXT_LAYER.innerHTML = finalString;
		});

	_PAGE_RENDERING_IN_PROGRESS = 0;

	// RE-ENABLE PREVIOUS & NEXT BUTTONS
	document.querySelector("#pdf-next").disabled = false;
	document.querySelector("#pdf-prev").disabled = false;

	// SWITCHES DISPLAY BETWEEN PACER MODE AND ORIGINAL PDF MODE
	if (!_PACER_MODE) {
		_CANVAS.style.opacity = "1.0";
		_TEXT_LAYER.style.opacity = "0.0";
	} else {
		_CANVAS.style.opacity = "0.0";
		_TEXT_LAYER.style.opacity = "1.0";
	}
}

// SHOW PDF BUTTON
document
	.getElementById("show-pdf-button")
	.addEventListener("click", function () {
		document.querySelector("#pdf-loader").innerHTML =
			"Loading pdf...";
		try {
			showPDF(
				`https://cors-anywhere.herokuapp.com/${
					document.querySelector("#get-pdf-link-entry")
						.value
				}`
			);
			document.querySelector("#step-1").style.color =
				"#004df9";
		} catch (error) {
			alert(error.message);
		}
	});

// PREVIOUS PAGE FUNCTION
function prevPage() {
	if (_CURRENT_PAGE != 1) showPage(--_CURRENT_PAGE);
}

// NEXT PAGE FUNCTION
function nextPage() {
	if (_CURRENT_PAGE != _TOTAL_PAGES)
		showPage(++_CURRENT_PAGE);
}

// PREVIOUS PAGE BUTTON
document
	.querySelector("#pdf-prev")
	.addEventListener("click", () => {
		prevPage();
	});

// NEXT PAGE BUTTON
document
	.querySelector("#pdf-next")
	.addEventListener("click", () => {
		nextPage();
	});

// ORIGINAL PDF BUTTON
document
	.querySelector("#original-pdf")
	.addEventListener("click", () => {
		_CANVAS.style.opacity = "1.0";
		_TEXT_LAYER.style.opacity = "0.0";
		_PACER_MODE = false;
	});

// START AND END PAGE, CHECKBOX, AND SAVE BUTTON

var _START_PAGE_INPUT = document.querySelector(
	"#start-page"
);
var _END_PAGE_INPUT = document.querySelector("#end-page");
_START_PAGE_INPUT.defaultValue = 1;
_END_PAGE_INPUT.defaultValue = 1;
var _END_PAGE_INPUT = document.querySelector("#end-page");
var _END_PAGE_CHECKBOX = document.querySelector(
	"#end-page-checkbox"
);

_SAVE_START_END.addEventListener("click", () => {
	if (_END_PAGE_CHECKBOX.checked) {
		_START_PAGE = _START_PAGE_INPUT.value;
		_END_PAGE = _TOTAL_PAGES;
	} else {
		_START_PAGE =
			_START_PAGE_INPUT.value > _TOTAL_PAGES ||
			_START_PAGE < 1
				? 1
				: _START_PAGE_INPUT.value;
		_END_PAGE =
			_END_PAGE_INPUT.value > _TOTAL_PAGES
				? _TOTAL_PAGES
				: _END_PAGE_INPUT.value;
	}
	while (_CURRENT_PAGE != _START_PAGE) {
		nextPage();
	}
	document.querySelector("#step-4").style.color = "#004df9";
});

// PACER MODE BUTTON
document
	.querySelector("#pacer-mode")
	.addEventListener("click", () => {
		_CANVAS.style.opacity = "0.0";
		_TEXT_LAYER.style.opacity = "1.0";
		_PACER_MODE = true;
		document.querySelector("#step-2").style.color =
			"#004df9";
	});

// CYAN HIGHLIGHT
document
	.querySelector("#cyan-color")
	.addEventListener("click", () => {
		_HIGHLIGHT_COLOR = "cyan";
		document.querySelector("#step-5").style.color =
			"#004df9";
	});

// YELLOW HIGHLIGHT
document
	.querySelector("#yellow-color")
	.addEventListener("click", () => {
		_HIGHLIGHT_COLOR = "yellow";
		document.querySelector("#step-5").style.color =
			"#004df9";
	});

// WORDS PER MINUTE RANGE
var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = slider.value;

slider.oninput = function () {
	output.innerHTML = this.value;
	_WORDS_PER_MINUTE = this.value;
	document.querySelector("#step-3").style.color = "#004df9";
};

// PAGINATION CONTROL
let enterPage = document.querySelector("#enter-page");
let goToPage = document.querySelector("#go-to-page");
goToPage.disabled = false;
goToPage.addEventListener("click", () => {
	while (_CURRENT_PAGE != enterPage.value) {
		if (_CURRENT_PAGE < enterPage.value) nextPage();
		else prevPage();
	}
});

// PACING CONTROLLER

let delayInMilliseconds;

function pacePage(wpm) {
	console.log("Pacing...");
	let originalText = _TEXT_LAYER.innerHTML;
	let mainText = _TEXT_LAYER;
	let allWords = mainText.innerHTML;
	allWords = allWords.trim();
	let allWordsArray = allWords.split(" ");
	let allWordsArrayNoEmpty = [];
	for (var i = 0; i < allWordsArray.length; i++) {
		if (allWordsArray[i] !== "") {
			allWordsArrayNoEmpty.push(allWordsArray[i]);
		}
	}
	let millisecPerWord = 1 / (wpm / 60000);
	let index = 0;
	let temp = "";

	function pace() {
		// If index > 0
		if (index > 0) {
			// restore the the previous word back to no-text
			allWordsArrayNoEmpty[index - 1] = temp;
		}
		// update temp
		temp = allWordsArrayNoEmpty[index];
		// add highlight to the current word
		allWordsArrayNoEmpty[
			index
		] = `<span class="highlight" style="background-color: ${_HIGHLIGHT_COLOR}">${temp}</span>`;
		// join and display
		mainText.innerHTML = allWordsArrayNoEmpty.join(" ");

		// increment index
		index++;
		if (index === allWordsArrayNoEmpty.length) {
			clearInterval(read);
		}
	}

	let read = setInterval(pace, millisecPerWord);

	delayInMilliseconds =
		millisecPerWord * allWordsArrayNoEmpty.length + 500;

	// STOP BUTTON
	document
		.querySelector("#stop")
		.addEventListener("click", () => {
			clearInterval(read);
			_TEXT_LAYER.innerHTML = originalText;
		});
}

// START PACING BUTTON
let playButton = document.querySelector("#play");
let startPacing = document.querySelector("#start-pacing");
startPacing.addEventListener("click", () => {
	startPacing.disabled = true;
	if (_START_PAGE == 1 && _END_PAGE == 1) {
		pacePage(_WORDS_PER_MINUTE);
	} else {
		goToPage.disabled = true;
		playButton.disabled = true;
		paceMultiplePages();
		playButton.disabled = false;
	}
	startPacing.disabled = false;
});

// PLAY BUTTON
playButton.addEventListener("click", () => {
	if (_START_PAGE == 1 && _END_PAGE == 1) {
		pacePage(_WORDS_PER_MINUTE);
	}
	playButton.disabled = true;
	paceMultiplePages();
	playButton.disabled = false;
});

async function paceMultiplePages() {
	document.querySelector("#step-5").style.color = "#004df9";
	document.querySelector("#step-6").style.color = "#004df9";

	let counter = 0;
	while (counter < _END_PAGE) {
		pacePage(_WORDS_PER_MINUTE);

		// IMPLEMENT DELAY
		await delay(delayInMilliseconds);

		nextPage();

		await delay(500);
		counter++;
	}
	goToPage.disabled = false;
	showPage(_CURRENT_PAGE);
}

async function delay(ms) {
	// return await for better async stack trace support in case of errors.
	return await new Promise((resolve) =>
		setTimeout(resolve, ms)
	);
}
