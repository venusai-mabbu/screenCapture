const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const toggleModeBtn = document.getElementById("toggleMode");
const clearTasksBtn = document.getElementById("clearTasks");
const downloadBtn = document.getElementById("downloadBtn");

let tasks = [];
let isDark = false;

// Load tasks and dark mode from chrome.storage
function loadData() {
    chrome.storage.local.get(["tasks", "darkMode"], (result) => {
        tasks = result.tasks || [];
        isDark = result.darkMode || false;

        if (isDark) document.body.classList.add("dark");
        renderTasks();
    });
}

// Save tasks to chrome.storage
function saveTasks() {
    chrome.storage.local.set({ tasks });
}

// Render task list
function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.setAttribute("draggable", "true");

        const dragHandle = document.createElement("span");
        dragHandle.className = "drag-handle";
        dragHandle.textContent = "☰";

        const textSpan = document.createElement("span");
        textSpan.className = "task-text";
        textSpan.contentEditable = "true";
        textSpan.textContent = task;
        textSpan.addEventListener("input", () => {
            tasks[index] = textSpan.textContent.trim();
            saveTasks();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.addEventListener("click", () => {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        });

        li.appendChild(dragHandle);
        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);

        // Drag events
        li.addEventListener("dragstart", () => li.classList.add("dragging"));
        li.addEventListener("dragend", () => {
            li.classList.remove("dragging");
            const newTasks = [];
            document.querySelectorAll("#taskList li .task-text").forEach(el => {
                newTasks.push(el.textContent.trim());
            });
            tasks = newTasks;
            saveTasks();
        });
    });
}

// Add task function
function addTask(val) {
    tasks.push(val);
    saveTasks();
    taskInput.value = "";
    renderTasks();
}

// Event listeners
addTaskBtn.addEventListener("click", () => {
    const val = taskInput.value.trim();
    if (!val) return;
    addTask(val);
});

taskInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addTaskBtn.click();
});

toggleModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    isDark = document.body.classList.contains("dark");
    chrome.storage.local.set({ darkMode: isDark });
});

clearTasksBtn.addEventListener("click", () => {
    tasks = [];
    saveTasks();
    renderTasks();
});

// Drag and drop
taskList.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement == null) {
        taskList.appendChild(dragging);
    } else {
        taskList.insertBefore(dragging, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll("li:not(.dragging)")];
    return elements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

// Download tasks as Word
downloadBtn.addEventListener("click", () => {
    if (tasks.length === 0) {
        alert("No tasks to download!");
        return;
    }
    let content = "Task List\n\n";
    tasks.forEach((task, i) => {
        content += `${i + 1}. ${task}\n`;
    });
    const blob = new Blob([content], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tasks.doc";
    link.click();
});

// Add task from content script
function addTaskFromContent(val) {
    if (!val) return;
    addTask(val);
}

// Listen for storage changes (auto-refresh when new tasks are added from other tabs)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.tasks) {
        tasks = changes.tasks.newValue || [];
        renderTasks();
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", loadData);
