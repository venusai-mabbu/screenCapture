// extract.js

let textMouseUpListener = null;

function toggleExtractListener(active) {
  if (active) {
    textMouseUpListener = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const text = selection.toString().trim();
        if (!text) return;
        chrome.runtime.sendMessage({ type: "saveSelection", text });
      }, 50);
    };
    document.addEventListener("mouseup", textMouseUpListener);
  } else {
    if (textMouseUpListener) {
      document.removeEventListener("mouseup", textMouseUpListener);
      textMouseUpListener = null;
    }
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleListeners") toggleExtractListener(msg.active);
});
