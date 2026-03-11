function addCells() {
	
	var board = $('#game');

	for (let i=0; i < 400; i++ ) {
		board.append('<div class="cell"></div>');
	}
};

$(document).ready(function() {
	addCells();
	
	$(".cell").click(function() {

		console.log("cell clicked")

		var selector = $(this);
		
		if (selector.hasClass("selected-cell")) {
			selector.removeClass("selected-cell");
		} else {
			selector.addClass("selected-cell");
		}
	});	
});