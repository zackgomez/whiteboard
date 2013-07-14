function setButtonColors() {
	var colorButtons = document.getElementsByClassName("colorButton");
	for (var i = 0; i < colorButtons.length; i++) {
		colorButtons[i].style.background = colorButtons[i].getAttribute("data-color");
	}
}

setButtonColors();
