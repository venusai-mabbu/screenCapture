const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const toggleModeBtn = document.getElementById("toggleMode");
const clearTasksBtn = document.getElementById("clearTasks");
const downloadBtn = document.getElementById("downloadBtn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let isDark = localStorage.getItem("darkMode") === "true";

if (isDark) document.body.classList.add("dark");



function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

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
function addTask(val)
{
  tasks.push(val);
  saveTasks();
  taskInput.value = "";
  renderTasks();
  alert(val);
}
// === Add Task ===
addTaskBtn.addEventListener("click", () => {
  const val = taskInput.value.trim();
  if (!val) return;
  addTask(val);
  
});

taskInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addTaskBtn.click();
});

// === Dark Mode ===
toggleModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark);
});

// === Clear Tasks ===
clearTasksBtn.addEventListener("click", () => {
  tasks = [];
  saveTasks();
  renderTasks();
});

// === Drag Over ===
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

// === Download as Word ===
downloadBtn.addEventListener("click", () => {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  if (tasks.length === 0) {
    alert("No tasks to download!");
    return;
  }

  let content = `Task List\n\n`;
  tasks.forEach((task, i) => {
    content += `${i + 1}. ${task}\n`;
  });

  let blob = new Blob([content], { type: "application/msword" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tasks.doc";
  link.click();
});

renderTasks();


//inject logic

// document.getElementById('injectIframe').addEventListener('click', async () => {
//   // Get the active tab
//   const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
//   if (!tab) {
//     console.error('No active tab found');
//     return;
//   }

//   try {
//     // Execute the content script in the active tab
//     await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       files: ['injectIframe.js']
//     });
    
//     // Update button text to show success
//     const button = document.getElementById('injectIframe');
//     const originalText = button.textContent;
//     button.textContent = 'Launched Successfully!';
//     button.style.backgroundColor = '#34a853';
    
//     // Reset button after 2 seconds
//     setTimeout(() => {
//       button.textContent = originalText;
//       button.style.backgroundColor = '';
//       window.close();
//     }, 500);
    
//     // Optional: Close popup after injection
    
//   } catch (error) {
//     console.error('Error Launching Extension:', error);
    
//     // Show error on button
//     const button = document.getElementById('injectIframe');
//     button.textContent = 'Error - Try Again';
//     button.style.backgroundColor = '#ea4335';
    
//     setTimeout(() => {
//       button.textContent = 'Launch Extension';
//       button.style.backgroundColor = '';
//     }, 2000);
//   }
// });