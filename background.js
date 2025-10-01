// background.js

// Listener for messages from content scripts (content.js)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Check if the action is to initiate a capture
  if (msg.action === "captureVisibleTab") {
    
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
