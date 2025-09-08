window.onload = function() {
        if (typeof flushQueuedToasts === 'function') {
            flushQueuedToasts();
        }
        const select = document.querySelector('select');
        if (select) {
            getToDo(select);
            select.addEventListener('change', function() {
                getToDo(this);
            });
        }
};

function ensureToastContainer(){
    let container = document.getElementById('toast-container');
    if(!container){
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type){
    const container = ensureToastContainer();
    const color = type === 'error' ? 'bg-pink-800' : type === 'warning' ? 'bg-pink-700' : 'bg-pink-600';
    const toast = document.createElement('div');
    toast.className = `${color} text-white px-4 py-2 rounded shadow-lg max-w-xs`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        toast.classList.add('transition-opacity');
        toast.classList.add('duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function queueToast(message, type){
    try{
        const key = 'queued_toasts';
        const existing = sessionStorage.getItem(key);
        const list = existing ? JSON.parse(existing) : [];
        list.push({ message, type });
        sessionStorage.setItem(key, JSON.stringify(list));
    }catch(err){
        console.warn('Failed to queue toast:', err);
    }
}

function flushQueuedToasts(){
    try{
        const key = 'queued_toasts';
        const existing = sessionStorage.getItem(key);
        if (!existing) return;
        const list = JSON.parse(existing);
        sessionStorage.removeItem(key);
        if (Array.isArray(list)){
            list.forEach(t => {
                if (t && t.message) showToast(t.message, t.type);
            });
        }
    }catch(err){
        console.warn('Failed to flush queued toasts:', err);
    }
}

function showConfirmModal(options){
    const { title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel' } = options || {};
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center';

        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-md shadow-xl w-11/12 max-w-md p-5';

        const header = document.createElement('div');
        header.className = 'text-lg font-semibold text-black-bean mb-2';
        header.textContent = title;

        const body = document.createElement('div');
        body.className = 'text-sm text-black-bean mb-4';
        body.textContent = message;

        const footer = document.createElement('div');
        footer.className = 'flex justify-end gap-2';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-4 py-2 rounded bg-gray-200 text-black-bean hover:bg-gray-300';
        cancelBtn.textContent = cancelText;

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'px-4 py-2 rounded bg-red-900 text-white hover:bg-red-700';
        confirmBtn.textContent = confirmText;

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
}

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
                queueToast(result.message, 'success');
                window.location.href = "index.html";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Signup failed. Please try again.', 'error');
        });
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
            queueToast(data.message, 'Logged in successfully');
            localStorage.setItem('user_id', data.data.id);
            window.location.href = "ismissedhome.html";
        }
    });
}

function getToDo(selectValue) {
    const val = selectValue.value;
    const userID = localStorage.getItem('user_id');
    console.log(userID);

    let apiStatuses = [];
    if (val === 'pending') {
        apiStatuses = ['active'];
    } else if (val === 'completed') {
        apiStatuses = ['inactive'];
    } else { 
        apiStatuses = ['active', 'inactive'];
    }

    console.log(apiStatuses);

    let allTasks = [];
    let requests = apiStatuses.map(status =>
        $.ajax({
            url: `https://todo-list.dcism.org/getItems_action.php?status=${status}&user_id=${userID}`,
            method: 'GET',
            dataType: 'json'
        })
    );

    $.when(...requests).done(function() {
        let responseArgs = arguments;
        let responseList = [];
        if (apiStatuses.length === 1) {
            responseList = [responseArgs];
        } else {
            responseList = Array.from(responseArgs);
        }

        responseList.forEach(response => {
            if (!response || !response[0]) return;
            let data = response[0];
            if (data.status === 200 && data.data && Object.keys(data.data).length > 0) {
                const tasks = Object.values(data.data).map(task => ({
                    id: task.item_id,
                    title: task.item_name,
                    description: task.item_description,
                    status: task.status === 'active' ? 'pending' : 'completed'
                }));
                allTasks = allTasks.concat(tasks);
            }
        });

        if (allTasks.length > 0) {
            $('#no-task').hide();
            renderTasks(allTasks);
        } else {
            $('#no-task').show();
            renderTasks([]);
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
    
    if (tasks.length > 0) {
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskContainer.append(taskElement);
        });
    } else {
        taskContainer.append('<div id="no-task" class="ml-7 text-sm text-black-bean"><em>No tasks found.</em></div>');
    }
}

function createTaskElement(task) {
    const taskDiv = $(`
        <div class="task-item p-3 flex flex-row w-5/6 h-auto bg-white justify-self-center mt-4 rounded-md relative group" data-task-id="${task.id}">
            <input type="checkbox" class="ml-4 accent-red-900 task-checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="toggleTaskStatus(${task.id}, this)">
            <div class="task-text flex-1 min-w-0 pr-16 overflow-hidden">
                <p class="ml-4 mt-2 text-black-bean flex-1 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}">${task.title}</p>
                <em class="ml-4 mt-1 text-[#8b5e3c] text-sm flex-1 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}">${task.description}</em>
            </div>

            <div class="task-actions absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button onclick="editTask(${task.id})" class="edit-btn w-6 h-6 bg-pink-200 text-white rounded text-xs hover:bg-pink-700">✏️</button>
                <button onclick="deleteTask(${task.id})" class="delete-btn w-6 h-6 bg-red-900 text-white rounded text-xs hover:bg-red-500">🗑️</button>
            </div>
        </div>
    `);

    
    return taskDiv[0]; 
}

function toggleTaskStatus(taskId, checkbox) {
    const isChecked = checkbox.checked;
    const newStatus = isChecked ? 'inactive' : 'active'; // inactive = completed, active = pending
    
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const taskText = taskElement.querySelector('p').textContent;

    $.ajax({
        url: 'https://todo-list.dcism.org/statusItem_action.php',
        method: 'POST',
        data: JSON.stringify({
            item_id: taskId,
            // item_name: taskText,
            // item_description: taskText,
            status: newStatus
        }),
        // contentType: 'application/json',
        dataType: 'json',
        success: function(response){
            console.log('Raw API response:', response);

            let parsedResponse;
            try{
                if(typeof response === 'object'){
                    parsedResponse = response; 
                }else{
                    parsedResponse = JSON.parse(response);
                }
            }catch(parseError){
                console.error('Failed to parse response as JSON:', parseError);
                console.error('Response was:', response);
                checkbox.checked = !isChecked;
                showToast('Server returned invalid response. Check console for more details.', 'error');
                return;
            }

            console.log('Parsed response:', parsedResponse);
            
            if(parsedResponse.status === 200){
                console.log(`Task ${taskId} status updated to: ${newStatus}`);
                const selectElement = document.querySelector('select');
                getToDo(selectElement);

                const statusMessage = isChecked ? 'completed' : 'pending';
                showToast(`Task moved to ${statusMessage}`, 'success');
            }else{
                checkbox.checked = !isChecked; 
                showToast('Error updating task status: ' + (parsedResponse.message || 'Unknown error'), 'error');
                console.error('API Error:', parsedResponse);
            }
        },
        error: function(xhr, status, error){
            console.error('AJAX Error Details:');
            console.error('Status:', status);
            console.error('Error:', error);
            console.error('Response Text:', xhr.responseText);
            console.error('Status Code:', xhr.status);

            checkbox.checked = !isChecked; 
            showToast('Error updating task status. Check console for details.', 'error');
        }
    });
}

function deleteTask(taskId) {
    showConfirmModal({ title: 'Delete Task', message: 'Are you sure you want to delete this task?', confirmText: 'Delete', cancelText: 'Cancel' }).then((confirmed) => {
    if (!confirmed) return;
        $.ajax({
            url: `https://todo-list.dcism.org/deleteItem_action.php?item_id=${taskId}`,
            method: 'POST',
            dataType: 'json',
            success: function(response) {
                console.log(response);
                if (response.status === 200) {
                    $(`[data-task-id="${taskId}"]`).remove();
                    showToast('Task deleted successfully!', 'success');
                    const select = document.querySelector('select');
                    if (select) {
                        getToDo(select);
                    }
                } else {
                    showToast('Error deleting task: ' + response.message, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                showToast('Error deleting task', 'error');
            }
        });
    });
}

function editTask(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const titleElement = taskElement.querySelector('p');
    const descriptionElement = taskElement.querySelector('em');
    const currentTitle = titleElement ? titleElement.textContent.trim() : '';
    const currentDescription = descriptionElement ? descriptionElement.textContent.trim() : '';

    const existingTitleInput = taskElement.querySelector('.task-edit-input-title');
    const existingDescInput = taskElement.querySelector('.task-edit-input-description');
    if (existingTitleInput || existingDescInput) {
        const focusTarget = existingTitleInput || existingDescInput;
        focusTarget.focus();
        focusTarget.select();
        return;
    }

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = currentTitle;
    titleInput.placeholder = 'Task title';
    titleInput.className = 'ml-4 mt-2 text-black-bean w-full bg-transparent border-b border-black-bean box-border task-edit-input-title overflow-hidden truncate';

    const descriptionInput = document.createElement('input');
    descriptionInput.type = 'text';
    descriptionInput.value = currentDescription;
    descriptionInput.placeholder = 'Task description';
    descriptionInput.className = 'ml-4 mt-1 text-black-bean text-sm w-full bg-transparent border-b border-black-bean box-border task-edit-input-description overflow-hidden truncate';

    if (titleElement) titleElement.style.display = 'none';
    if (descriptionElement) descriptionElement.style.display = 'none';

    if (titleElement && titleElement.parentNode) {
        titleElement.parentNode.insertBefore(titleInput, titleElement);
    }
    if (descriptionElement && descriptionElement.parentNode) {
        descriptionElement.parentNode.insertBefore(descriptionInput, descriptionElement);
    }

    titleInput.focus();
    titleInput.select();

    let finished = false;
    const finishOnce = (fn) => {
        if (finished) return;
        finished = true;
        fn();
    };

    const saveEdit = () => finishOnce(() => {
        const newTitle = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();

        const finalTitle = newTitle || currentTitle;
        const finalDescription = newDescription || currentDescription;

        if (finalTitle === currentTitle && finalDescription === currentDescription) {
            cancelEdit();
            return;
        }

        updateTask(taskId, finalTitle, finalDescription);
    });

    const cancelEdit = () => finishOnce(() => {
        titleInput.remove();
        descriptionInput.remove();
        if (titleElement) titleElement.style.display = 'block';
        if (descriptionElement) descriptionElement.style.display = 'block';
    });

    const handleKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    };

    titleInput.addEventListener('keydown', handleKey);
    descriptionInput.addEventListener('keydown', handleKey);

    const blurState = { title: false, desc: false };
    const trySaveOnBlur = () => {
        if (blurState.title && blurState.desc) {
            saveEdit();
        }
    };
    titleInput.addEventListener('blur', () => { blurState.title = true; setTimeout(trySaveOnBlur, 0); });
    descriptionInput.addEventListener('blur', () => { blurState.desc = true; setTimeout(trySaveOnBlur, 0); });
}

function updateTask(taskId, newTitle, newDescription) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const titleElement = taskElement.querySelector('p');
    const descriptionElement = taskElement.querySelector('em');
    const inputElements = taskElement.querySelectorAll('input[type="text"]');
    
    $.ajax({
        url: 'https://todo-list.dcism.org/editItem_action.php',
        method: 'POST',
        data: JSON.stringify({
            item_name: newTitle,
            item_description: newDescription,
            item_id: taskId
        }),
        dataType: 'json',
        success: function(response) {
            console.log('Raw API response (edit):', response);
            let parsedResponse = response;
            try {
                if (typeof response !== 'object') {
                    parsedResponse = JSON.parse(response);
                }
            } catch (e) {
                console.error('Failed to parse edit response as JSON:', e);
                showToast('Server returned invalid response.', 'error');
                inputElements.forEach((el) => el.remove());
                if (titleElement) titleElement.style.display = 'block';
                if (descriptionElement) descriptionElement.style.display = 'block';
                return;
            }

            const statusCode = Number(parsedResponse.status);
            if (statusCode === 200) {
                if (titleElement) titleElement.textContent = newTitle;
                if (descriptionElement) descriptionElement.textContent = newDescription;
                showToast('Task updated successfully!', 'success');
            } else {
                showToast('Error updating task: ' + (parsedResponse.message || 'Unknown error'), 'error');
            }
            inputElements.forEach((el) => el.remove());
            if (titleElement) titleElement.style.display = 'block';
            if (descriptionElement) descriptionElement.style.display = 'block';
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error (edit) Details:');
            console.error('Status:', status);
            console.error('Error:', error);
            console.error('Response Text:', xhr.responseText);
            console.error('Status Code:', xhr.status);
            $.ajax({
                url: 'https://todo-list.dcism.org/editItem_action.php',
                method: 'POST',
                data: {
                    item_name: newTitle,
                    item_description: newDescription,
                    item_id: taskId
                },
                dataType: 'json',
                success: function(resp2) {
                    console.log('Fallback form POST response (edit):', resp2);
                    const status2 = resp2 ? Number(resp2.status) : 0;
                    if (status2 === 200) {
                        if (titleElement) titleElement.textContent = newTitle;
                        if (descriptionElement) descriptionElement.textContent = newDescription;
                        showToast('Task updated successfully!', 'success');
                    } else {
                        showToast('Error updating task: ' + ((resp2 && resp2.message) || 'Unknown error'), 'error');
                    }
                    inputElements.forEach((el) => el.remove());
                    if (titleElement) titleElement.style.display = 'block';
                    if (descriptionElement) descriptionElement.style.display = 'block';
                },
                error: function() {
                    showToast('Error updating task. Check console for details.', 'error');
                    inputElements.forEach((el) => el.remove());
                    if (titleElement) titleElement.style.display = 'block';
                    if (descriptionElement) descriptionElement.style.display = 'block';
                }
            });
        }
    });
}

function logOut(){
    localStorage.removeItem('user_id');
    queueToast('Logged out successfully', 'success');
    window.location.href = "index.html";
    console.log(userID);
}