function xhrRequest(data, form, onloadCallback) {


	var xhr = new XMLHttpRequest();
	xhr.open(form.getAttribute('method'), form.getAttribute('action'));
	xhr.setRequestHeader('Content-Type', 'application/json');
	var start = new Date();

	xhr.onload=function(){
		var end = new Date();
		var duration = 820 - (end.getTime() - start.getTime());
		duration = duration < 0 ? 0 : duration;

		setTimeout(function () {
			onloadCallback(xhr);
		}, duration);
	}
	xhr.send(JSON.stringify(data));
}