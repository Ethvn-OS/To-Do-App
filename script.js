window.onload = function() {
        const select = document.querySelector('select');
        if (select) {
            getToDo(select);
            select.addEventListener('change', function() {
                getToDo(this);
            });
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
            document.getElementById('error-message').innerHTML = result.message;
            console.log(result);
            if(result.status === 200) {
                alert(result.message);
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

    let apiStatus;
    if (val === 'pending') {
        apiStatus = 'active';
    } else if (val === 'completed') {
        apiStatus = 'inactive';
    } else {
        apiStatus = 'active'; 
    }

    $.ajax({
        url: `https://todo-list.dcism.org/getItems_action.php?status=${apiStatus}&user_id=${userID}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log(response);
            
            if (response.status === 200 && response.data && Object.keys(response.data).length > 0) {
                const tasks = Object.values(response.data).map(task => ({
                    id: task.item_id,
                    title: task.item_name,
                    description: task.item_description,
                    status: task.status === 'active' ? 'pending' : 'completed'
                }));
                
                $('#with-task').show();
                $('#no-task').hide();
                renderTasks(tasks);
            } else {
                $('#with-task').hide();
                $('#no-task').show();
            }
        },
        error: function(error) {
            console.error('Error loading tasks:', error);
            $('#with-task').hide();
            $('#no-task').show();
        }
    });
}

function renderTasks(tasks) {
    let taskContainer = $('.task-container');
    if (taskContainer.length === 0) {
        const addButton = $('#addButton');
        $('<div class="task-container"></div>').insertBefore(addButton);
        taskContainer = $('.task-container');
    }
    
    taskContainer.empty();
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskContainer.append(taskElement);
    });
}

function createTaskElement(task) {
    const taskDiv = $(`
        <div class="task-item flex flex-row w-5/6 h-10 bg-white justify-self-center mt-4 rounded-md relative group" data-task-id="${task.id}">
            <input type="checkbox" class="ml-4 accent-red-900" ${task.status === 'completed' ? 'checked' : ''}>
            <p class="ml-4 mt-2 text-black-bean flex-1">${task.title}</p>
            <div class="task-actions absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button onclick="editTask(${task.id})" class="edit-btn w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">✏️</button>
                <button onclick="deleteTask(${task.id})" class="delete-btn w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600">🗑️</button>
            </div>
        </div>
    `);
    
    return taskDiv[0]; 
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        $.ajax({
            url: `https://todo-list.dcism.org/deleteItem_action.php?item_id=${taskId}`,
            method: 'POST',
            dataType: 'json',
            success: function(response) {
                console.log(response);
                if (response.status === 200) {
                    $(`[data-task-id="${taskId}"]`).remove();
                    alert('Task deleted successfully!');
                } else {
                    alert('Error deleting task: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                alert('Error deleting task');
            }
        });
    }
}

function editTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const taskText = taskElement.querySelector('p');
    const currentText = taskText.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'ml-4 mt-1 text-black-bean flex-1 bg-transparent border-b border-black-bean';

    taskText.style.display = 'none';
    taskElement.insertBefore(input, taskText);
    input.focus();
    input.select();
    
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== currentText) {
            updateTask(taskId, newText);
        } else {
            cancelEdit();
        }
    };
    
    const cancelEdit = () => {
        input.remove();
        taskText.style.display = 'block';
    };
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
    
    input.addEventListener('blur', saveEdit);
}

function updateTask(taskId, newText) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const taskTextElement = taskElement.querySelector('p');
    const inputElement = taskElement.querySelector('input[type="text"]');
    
    $.ajax({
        url: 'https://todo-list.dcism.org/editItem_action.php',
        method: 'POST',
        data: JSON.stringify({
            item_name: newText,
            item_description: newText, 
            item_id: taskId
        }),
        dataType: 'json',
        success: function(response) {
            console.log(response);
            if (response.status === 200) {
                taskTextElement.textContent = newText;
                alert('Task updated successfully!');
            } else {
                alert('Error updating task: ' + response.message);
            }
            if (inputElement) {
                inputElement.remove();
            }
            taskTextElement.style.display = 'block';
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            alert('Error updating task');
            if (inputElement) {
                inputElement.remove();
            }
            taskTextElement.style.display = 'block';
        }
    });
}