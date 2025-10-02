// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("ScreenCapture installed!");
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "saveSelection") {
        chrome.storage.local.get(["tasks"], (result) => {
            const existingTasks = result.tasks || [];
            existingTasks.push(msg.text);
            chrome.storage.local.set({ tasks: existingTasks }, () => {
                sendResponse({ status: "saved" });
            });
        });
        return true; // Keep channel open for sendResponse
      }

  // Check if the action is to initiate a capture
  else if (msg.action === "captureVisibleTab") {
    
    // Use chrome.tabs.captureVisibleTab to get a high-resolution screenshot
    // The format is set to 'png' for lossless quality.
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId, 
      { format: "png" }, 
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Capture Error:", chrome.runtime.lastError.message);
          sendResponse({ error: "Failed to capture tab." });
          return;
        }
        
        // Send the full screenshot data URL back to the content script for cropping
        sendResponse({ screenshot: dataUrl });
      }
    );

    // Return true to indicate that sendResponse will be called asynchronously
    return true; 
  }
});
