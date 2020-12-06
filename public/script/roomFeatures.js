/*
* TEXT CHAT
*
* */
let sidebar = document.getElementById('sidebar');

function toggleChat() {

	let chatForm = document.getElementById('chat');
	if (sidebar.classList.contains('active')) {
		sidebar.classList.remove('active');
		chatForm.classList.add('fixed-bottom');
	} else {
		sidebar.classList.add('active');
		setTimeout(function () {
			chatForm.classList.remove('fixed-bottom')
		}, 90);
	}
}

/*
* SELF VIDEO DRAGGABLE
*
* */
//Make the selfStreamDIV element draggagle:
dragElement(document.getElementById("selfStreamDiv"));

function dragElement(elmnt) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	if (document.getElementsByName('selfStream')[0]) {

		document.getElementsByName('selfStream')[0].onmousedown = dragMouseDown;
	} else {

		elmnt.onmousedown = dragMouseDown;
	}

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	console.log("height "+window.screen.height);
	console.log("width "+ window.screen.width);
	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		console.log("top "+(elmnt.offsetTop - pos2));
		console.log("left  "+(elmnt.offsetLeft - pos1));

		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";

		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
		elmnt.style.bottom = ""
		elmnt.style.right = ""
	}

	function closeDragElement() {
		/* stop moving when mouse button is released:*/
		document.onmouseup = null;
		document.onmousemove = null;
	}
}