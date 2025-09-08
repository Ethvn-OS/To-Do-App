document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("task-modal");
    const form = document.getElementById("task-form");
    const taskName = document.getElementById("task-name");
    const taskDesc = document.getElementById("task-desc");
    const withTask = document.getElementById("with-task");
    const noTask = document.getElementById("no-task");

    // Open modal
    document.getElementById("add-task-btn").addEventListener("click", () => {
        modal.style.display = "flex";
        taskName.value = "";
        taskDesc.value = "";
        taskName.focus();
    });

    // Close modal
    document.getElementById("cancel-btn").addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Handle form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const itemName = taskName.value.trim();
        const itemDescription = taskDesc.value.trim();
        const userId = localStorage.getItem("user_id"); // from login

        if (!itemName || !itemDescription || !userId) {
            alert("Task name, description, and user must be provided!");
            return;
        }

        try {
            const response = await fetch("https://todo-list.dcism.org/addItem_action.php", {
                method: "POST",
                /*headers: {
                    "Content-Type": "application/json"
                },*/
                body: JSON.stringify({
                    item_name: itemName,
                    item_description: itemDescription,
                    user_id: userId
                })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            }catch(err){
                console.error("Could not parse JSON:", err, text);
                alert("Server returned invalid response.");
                return;
            }

            console.log("Server JSON:", data);

            if (data.status === 200) {
                alert("Task added successfully!");
                noTask.style.display = "none";

                const taskEl = document.createElement("li");
                taskEl.innerHTML = `<strong>${data.data.item_name}</strong><br>${data.data.item_description}`;
                withTask.appendChild(taskEl);

                modal.style.display = "none";
            } else {
                alert("Failed to add task: " + (data.message || "Unknown error"));
            }

        } catch (err) {
            console.error("Fetch error:", err);
            alert("Could not connect to the server.");
        }
    });

    // Close modal if user clicks outside
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});


// JQUERY AND AJAX
/*
$(document).ready(function () {
    const $modal = $("#task-modal");
    const $form = $("#task-form");
    const $taskName = $("#task-name");
    const $taskDesc = $("#task-desc");
    const $withTask = $("#with-task");
    const $noTask = $("#no-task");

    // Open modal
    $("#add-task-btn").on("click", function () {
        $modal.css("display", "flex");
        $taskName.val("");
        $taskDesc.val("");
        $taskName.focus();
    });

    // Close modal
    $("#cancel-btn").on("click", function () {
        $modal.hide();
    });

    // Handle form submit
    $form.on("submit", function (e) {
        e.preventDefault();

        const itemName = $taskName.val().trim();
        const itemDescription = $taskDesc.val().trim();

        if (!itemName || !itemDescription) {
            alert("Task name and description are required!");
            return;
        }

        // AJAX POST to server with exact keys PHP expects
        $.ajax({
            url: "https://todo-list.dcism.org/addItem_action.php",
            type: "POST",
            data: {
                item_name: itemName,           // exactly matches PHP $_POST['item_name']
                item_description: itemDescription, // exactly matches $_POST['item_description']
                user_id: localStorage.getItem("user_id")                    // exactly matches $_POST['user_id']
            },
            success: function (response) {
                console.log("Raw server response:", response);

                let data;
                try {
                    // Extract JSON in case PHP outputs warnings first
                    const jsonStart = response.lastIndexOf("{");
                    data = JSON.parse(response.slice(jsonStart));
                } catch (err) {
                    console.error("❌ Could not parse JSON:", err, response);
                    alert("⚠️ Server returned invalid response.");
                    return;
                }

                if (data.status === 200) {
                    alert("✅ Task added successfully!");
                    $noTask.hide();

                    const $task = $(`
                        <div>
                            <p>
                                <strong>${data.data.item_name}</strong><br>
                                ${data.data.item_description}
                            </p>
                        </div>
                    `);
                    $withTask.append($task);
                    $modal.hide();
                } else {
                    alert("❌ Failed to add task: " + (data.message || "Unknown error"));
                }
            },
            error: function (xhr, status, error) {
                console.error("AJAX error:", status, error);
                alert("⚠️ Could not connect to the server.");
            }
        });
    });

    // Close modal if user clicks outside
    $(window).on("click", function (e) {
        if (e.target === $modal[0]) {
            $modal.hide();
        }
    });
});
*/