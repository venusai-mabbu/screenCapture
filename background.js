chrome.runtime.onInstalled.addListener(() => {
  console.log("ScreenCapture installed!");
});

// Icon paths
const DEFAULT_ICON = {
  "16": "icons/icon.png",
  "32": "icons/icon.png",
  "48": "icons/icon.png",
  "128": "icons/icon.png"
};
const ACTIVE_ICON = {
  "16": "icons/icon_active.png",
  "32": "icons/icon_active.png",
  "48": "icons/icon_active.png",
  "128": "icons/icon_active.png"
};

// Track extension state
let isActive = false;

// Update icon for all tabs
function updateIconForAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((t) => {
      chrome.action.setIcon({ path: isActive ? ACTIVE_ICON : DEFAULT_ICON, tabId: t.id });
    });
  });
}

// Toggle extension
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;

  isActive = !isActive;
  console.log("Extension is now", isActive ? "active" : "inactive");

  updateIconForAllTabs();

  // Inject content scripts if not already injected
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["extract.js", "cropper.js"]
  }, () => {
    // Notify tab to toggle listeners
    chrome.tabs.sendMessage(tab.id, { action: "toggleListeners", active: isActive });
  });

  chrome.sidePanel.open({ tabId: tab.id });
});

// Messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "saveSelection") {
    chrome.storage.local.get(["tasks"], (result) => {
      const existingTasks = result.tasks || [];
      existingTasks.push(msg.text);
      chrome.storage.local.set({ tasks: existingTasks }, () => {
        sendResponse({ status: "saved" });
      });
    });
    return true;
  } else if (msg.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) sendResponse({ error: chrome.runtime.lastError.message });
      else sendResponse({ screenshot: dataUrl });
    });
    return true;
  }
});
