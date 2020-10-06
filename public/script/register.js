document.getElementById('registerForm').onsubmit((e) => {
	e.preventDefault();
});

function registerButton() {

	var fullName = document.getElementById('fullName');
	var email = document.getElementById('email');
	var password = document.getElementById('password');
	var repeatPassword = document.getElementById('repeatPassword');
	var registerForm = document.getElementById('registerForm');
	var xhr = new XMLHttpRequest();
	console.log(registerForm.getAttribute('action'));
	xhr.open(registerForm.getAttribute('method'), registerForm.getAttribute('action'));
	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.send(JSON.stringify({
		user: {
			fullName: fullName.value,
			email: email.value,
			password: password.value,
			repeatPassword: repeatPassword.value
		}
	}));


}
