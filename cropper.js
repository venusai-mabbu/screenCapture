// content.js
let isSelecting = false;
let startX, startY, endX, endY;
let selectionBox;
let statusMessage;

// --- DOM Utilities ---

// Creates the movable selection box
function createSelectionBox() {
    selectionBox = document.createElement("div");
    selectionBox.id = "qrc-selection";
    // Inline styling for essential positioning and high Z-index
    selectionBox.style.cssText = `
        position: absolute;
        z-index: 2147483647; /* Max z-index */
        pointer-events: none; /* Allows mouse events to pass through */
        display: none;
    `;
    document.body.appendChild(selectionBox);
}

// Creates a temporary status message
function showStatus(text, duration = 1000) {
    if (!statusMessage) {
        statusMessage = document.createElement("div");
        statusMessage.id = "qrc-status";
        document.body.appendChild(statusMessage);
    }
    statusMessage.textContent = text;
    statusMessage.style.display = 'block';
    
    // Automatically hide after duration
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, duration);
}

// Triggers the download of a data URL
function downloadImage(dataUrl, filename = `Screenshot-${Date.now()}.png`) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    // Must be appended to the body to work in some browsers/contexts
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Interaction Logic ---

// 1. MOUSE DOWN: Start Selection (Ctrl + LeftClick)
document.addEventListener("mousedown", (e) => {
    // Only proceed if Ctrl key is pressed and it's the left mouse button (0)
    if (!e.ctrlKey || e.button !== 0) return; 
    
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent accidental clicks on page elements

    if (!selectionBox) createSelectionBox();

    isSelecting = true;
    // Get coordinates relative to the full document (important for scrolling)
    startX = e.clientX + window.scrollX;
    startY = e.clientY + window.scrollY;

    // Initialize and display the box
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";
    selectionBox.style.display = "block";
});

// 2. MOUSE MOVE: Update Selection Box
document.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;
    
    // Get current drag coordinates relative to the document
    endX = e.clientX + window.scrollX;
    endY = e.clientY + window.scrollY;

    // Calculate top-left corner and dimensions
    const rectX = Math.min(startX, endX);
    const rectY = Math.min(startY, endY);
    const rectW = Math.abs(startX - endX);
    const rectH = Math.abs(startY - endY);

    selectionBox.style.left = `${rectX}px`;
    selectionBox.style.top = `${rectY}px`;
    selectionBox.style.width = `${rectW}px`;
    selectionBox.style.height = `${rectH}px`;
});

// 3. MOUSE UP: End Selection, Capture, Crop, and Download
document.addEventListener("mouseup", (e) => {
    if (!isSelecting) return;
    
    isSelecting = false;
    // Hide the selection box immediately
    if (selectionBox) selectionBox.style.display = "none";

    endX = e.clientX + window.scrollX;
    endY = e.clientY + window.scrollY;

    // Check if the selected area is too small (e.g., just a click)
    if (Math.abs(startX - endX) < 10 || Math.abs(startY - endY) < 10) {
        showStatus("Selection area too small. Please drag to select a region.", 1500);
        return;
    }
    
    showStatus("Capturing screen...", 3000);

    // Request the full visible tab screenshot from the background service worker
    chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
        if (res && res.screenshot) {
            cropAndDownload(res.screenshot, startX, startY, endX, endY);
        } else if (res && res.error) {
            showStatus(`Error: ${res.error}`, 3000);
        } else {
            showStatus("Capture failed due to unknown error.", 3000);
        }
    });
});

// --- Cropping Logic ---

/**
 * Handles scaling, cropping, and downloading the high-res screenshot.
 * @param {string} dataUrl - The high-resolution full viewport screenshot.
 * @param {number} x1, y1, x2, y2 - The coordinates of the selection box (screen pixels + scroll).
 */
function cropAndDownload(dataUrl, x1, y1, x2, y2) {
    const img = new Image();
    
    img.onload = () => {
        // 1. Determine Scaling Factors (DPI/Retina screens)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const imageWidth = img.width;
        const imageHeight = img.height;

        const scaleX = imageWidth / viewportWidth;
        const scaleY = imageHeight / viewportHeight;

        // 2. Calculate Scaled (High-Res) Crop Area
        const cropX = Math.min(x1, x2) * scaleX;
        const cropY = Math.min(y1, y2) * scaleY;
        const cropW = Math.abs(x1 - x2) * scaleX;
        const cropH = Math.abs(y1 - y2) * scaleY;

        // 3. Create Canvas for Cropping
        const canvas = document.createElement("canvas");
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext("2d");

        // 4. Draw Cropped Region
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // 5. Download
        const croppedDataUrl = canvas.toDataURL("image/png");
        alert("Screenshot captured and downloaded!");
        downloadImage(croppedDataUrl);
       
        showStatus("Screenshot downloaded!", 1500);
    };
    
    img.onerror = () => {
        showStatus("Error loading captured image.", 3000);
    };

    img.src = dataUrl;
}
