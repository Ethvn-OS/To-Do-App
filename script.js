window.onload = function() {
    // Only auto-run on login page where login inputs exist
    var loginEmail = document.getElementById('loginEmail');
    var loginPass = document.getElementById('loginPass');
    if (loginEmail && loginPass) {
        const select = document.querySelector('select');
        if (select) {
            getToDo(select);
        }
    }
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
        alert(data.message);
        if (data.status === 200) {
            localStorage.setItem('user_id', data.data.id);
            window.location.href = "ismissedhome.html";
        }
    });
}

function getToDo(selectValue) {
    const val = selectValue ? selectValue.value : 'active';
    const userID = localStorage.getItem('user_id');
    if (!userID) return;
    // Delegate to new renderer in addToDo.js
    if (typeof window.fetchAndRenderTasks === 'function') {
        window.fetchAndRenderTasks();
    }
}