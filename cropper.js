// cropper.js

let isSelecting = false;
let startX, startY, endX, endY;
let selectionBox = null;
let cropMouseDown, cropMouseMove, cropMouseUp;

// Create selection box
function createSelectionBox() {
  if (!selectionBox) {
    selectionBox = document.createElement("div");
    selectionBox.id = "qrc-selection";
    selectionBox.style.cssText = `
      position: absolute;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(selectionBox);
  }
}

// Status message
let statusMessage = null;
function showStatus(text, duration = 1000) {
  if (!statusMessage) {
    statusMessage = document.createElement("div");
    statusMessage.id = "qrc-status";
    document.body.appendChild(statusMessage);
  }
  statusMessage.textContent = text;
  statusMessage.style.display = 'block';
  setTimeout(() => statusMessage.style.display = 'none', duration);
}

// Download helper
function downloadImage(dataUrl, filename = `Screenshot-${Date.now()}.png`) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Crop and download
function cropAndDownload(dataUrl, x1, y1, x2, y2) {
  const img = new Image();
  img.onload = () => {
    const scaleX = img.width / window.innerWidth;
    const scaleY = img.height / window.innerHeight;
    const cropX = Math.min(x1, x2) * scaleX;
    const cropY = Math.min(y1, y2) * scaleY;
    const cropW = Math.abs(x1 - x2) * scaleX;
    const cropH = Math.abs(y1 - y2) * scaleY;
    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    downloadImage(canvas.toDataURL("image/png"));
    alert("Screenshot captured and downloaded!");
    showStatus("Screenshot downloaded!", 1500);
  };
  img.src = dataUrl;
}

// Toggle cropper listeners
function toggleCropperListener(active) {
  createSelectionBox();

  if (active) {
    cropMouseDown = (e) => {
      if (!e.ctrlKey || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isSelecting = true;
      startX = e.clientX + window.scrollX;
      startY = e.clientY + window.scrollY;
      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = "0px";
      selectionBox.style.height = "0px";
      selectionBox.style.display = "block";
    };
    cropMouseMove = (e) => {
      if (!isSelecting) return;
      endX = e.clientX + window.scrollX;
      endY = e.clientY + window.scrollY;
      const rectX = Math.min(startX, endX);
      const rectY = Math.min(startY, endY);
      const rectW = Math.abs(startX - endX);
      const rectH = Math.abs(startY - endY);
      selectionBox.style.left = `${rectX}px`;
      selectionBox.style.top = `${rectY}px`;
      selectionBox.style.width = `${rectW}px`;
      selectionBox.style.height = `${rectH}px`;
    };
    cropMouseUp = (e) => {
      if (!isSelecting) return;
      isSelecting = false;
      selectionBox.style.display = "none";
      endX = e.clientX + window.scrollX;
      endY = e.clientY + window.scrollY;
      if (Math.abs(startX - endX) < 10 || Math.abs(startY - endY) < 10) return;
      showStatus("Capturing screen...", 3000);
      chrome.runtime.sendMessage({ action: "captureVisibleTab" }, (res) => {
        if (res?.screenshot) cropAndDownload(res.screenshot, startX, startY, endX, endY);
      });
    };

    document.addEventListener("mousedown", cropMouseDown);
    document.addEventListener("mousemove", cropMouseMove);
    document.addEventListener("mouseup", cropMouseUp);

  } else {
    if (cropMouseDown) document.removeEventListener("mousedown", cropMouseDown);
    if (cropMouseMove) document.removeEventListener("mousemove", cropMouseMove);
    if (cropMouseUp) document.removeEventListener("mouseup", cropMouseUp);
    cropMouseDown = cropMouseMove = cropMouseUp = null;
    if (selectionBox) selectionBox.style.display = "none";
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleListeners") toggleCropperListener(msg.active);
});
