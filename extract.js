function getSelectedContent() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const selectedText = selection.toString().trim();
        if (selectedText.length > 0) return selectedText;
    }
    return null;
}

// Listen for text selection
document.addEventListener("mouseup", () => {
    setTimeout(() => {
        const content = getSelectedContent();
        if (!content) return;

        // Send selected text to background script to save
        chrome.runtime.sendMessage(
            { type: "saveSelection", text: content },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message:", chrome.runtime.lastError.message);
                } else if (response && response.status === "saved") {
                    console.log("Selection saved:", content);
                }
            }
        );
    }, 50);
});
