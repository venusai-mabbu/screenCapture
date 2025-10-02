// content.js

/**
 * Gets the currently selected text and/or HTML content.
 * @returns {{text: string, html: string} | null} The selected content or null if nothing is selected.
 */

function getSelectedContent() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Get plain text
        const selectedText = selection.toString().trim();

        // Get HTML content
        // const dummyDiv = document.createElement("div");
        // dummyDiv.appendChild(range.cloneContents());
        // const selectedHtml = dummyDiv.innerHTML.trim();

        if (selectedText.length > 0) {
            // return {
            //     text: selectedText,
            //     html: selectedHtml
            // };
            return selectedText;
        }
    }
}
// function renderTasks() {
//   taskList.innerHTML = "";
//   tasks.forEach((task, index) => {
//     const li = document.createElement("li");
//     li.setAttribute("draggable", "true");

//     const dragHandle = document.createElement("span");
//     dragHandle.className = "drag-handle";
//     dragHandle.textContent = "☰";

//     const textSpan = document.createElement("span");
//     textSpan.className = "task-text";
//     textSpan.contentEditable = "true";
//     textSpan.textContent = task;
//     textSpan.addEventListener("input", () => {
//       tasks[index] = textSpan.textContent.trim();
//       saveTasks();
//     });

//     const deleteBtn = document.createElement("button");
//     deleteBtn.className = "delete-btn";
//     deleteBtn.textContent = "✕";
//     deleteBtn.addEventListener("click", () => {
//       tasks.splice(index, 1);
//       saveTasks();
//       renderTasks();
//     });

//     li.appendChild(dragHandle);
//     li.appendChild(textSpan);
//     li.appendChild(deleteBtn);
//     taskList.appendChild(li);

//     // Drag events
//     li.addEventListener("dragstart", () => li.classList.add("dragging"));
//     li.addEventListener("dragend", () => {
//       li.classList.remove("dragging");
//       const newTasks = [];
//       document.querySelectorAll("#taskList li .task-text").forEach(el => {
//         newTasks.push(el.textContent.trim());
//       });
//       tasks = newTasks;
//       saveTasks();
//     });
//   });
// }
// Listen for a mouseup event on the document.
// This is the common way to detect when a user has finished dragging a selection.
document.addEventListener("mouseup", () => {
    // Wait a brief moment to ensure the selection is finalized by the browser
    setTimeout(() => {
        const content = getSelectedContent();
        if(!content) return;
        // alert(content);
        //saving to localstorage
        
        
        // renderTasks();
        
        
        if (content) {
            // SEND MESSAGE to the background service worker
            chrome.runtime.sendMessage({ 
                type: "getSelection", 
                content: content,
                url: window.location.href // Also send the URL
            }, (response) => {
                // Optional: handle response from background, e.g., show a status message
                //let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
                //alert(response.text);
                addTask(response.text);
                // tasks.push(content);
                // localStorage.setItem("tasks", JSON.stringify(tasks));
                // alert("after");
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to background:", chrome.runtime.lastError.message);
                } else if (response && response.status === "saved") {
                    console.log("Selection sent and saved by background script.");
                }
            });
        }
    }, 50); // Small delay to capture the selection properly
});