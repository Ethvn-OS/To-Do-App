window.onload = function() {
        const select = document.querySelector('select');
        getToDo(select);
};

function signUp(event) {
    event.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const rawData = JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        confirm_password: confirmPassword
    });

    fetch('https://todo-list.dcism.org/signup_action.php', {
        method: 'POST',
        body: rawData
    })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            alert(result.message);
            if(result.status === 200) {
                window.location.href = "index.html";
            }
        })
        .catch(error => console.error('Error:', error));
}

function logIn() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    fetch(`https://todo-list.dcism.org/signin_action.php?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        document.getElementById('error-message').innerHTML = data.message;
        if (data.status === 200) {
            alert(data.message);
            localStorage.setItem('user_id', data.data.id);
            window.location.href = "ismissedhome.html";
        }
    });
}

function getToDo(selectValue) {
    const val = selectValue.value;

    const userID = localStorage.getItem('user_id');
    console.log(userID);

    fetch(`https://todo-list.dcism.org/getItems_action.php?status=${encodeURIComponent(val)}&user_id=${encodeURIComponent(userID)}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.length > 0) {
            document.getElementById('with-task').style.display = 'block';
        } else {
            document.getElementById('no-task').style.display = 'block';
        }
    });
}