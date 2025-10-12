// background/index.js

const DEFAULT_GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";


const HARDCODED_GEMINI_KEY = 'API_KEY'; 
const DEFAULT_KEY_PLACEHOLDER = '**********';

// Helper function to dynamically inject ALL necessary content scripts
async function injectContentScripts(tabId) {
    // Inject marked.min.js first (dependency for UI)
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["lib/marked.min.js"]
    });
    // Inject the consolidated script containing PromptUi, PromptHandler, and the listener
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content/main.js"] 
    });
}

// Listen for the extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.url || !tab.url.includes("amazon.")) {
        console.warn("Not an Amazon page. Aborting Eco-Scan.");
        return; 
    }

    try {
        const screenshotDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'jpeg',
            quality: 90
        });

        // 3. Inject scripts (now consolidated)
        await injectContentScripts(tab.id);

        // 4. Send the data to the newly injected script.
        chrome.tabs.sendMessage(tab.id, {
            action: "startEcoScan",
            title: "Eco-Scan Analysis",
            screenshot: screenshotDataUrl,
            tabId: tab.id
        });
        
    } catch (e) {
        console.error("Eco-Scan activation or script injection failed:", e);
        chrome.tabs.sendMessage(tab.id, {
            action: "ecoScanResult",
            success: false,
            error: "Failed to initialize Eco-Scan scripts on this tab."
        });
    }
});

// Listen for the request to call the Gemini API from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callGeminiVisionApi") {
        callGeminiVisionApi(request.payload, sender.tab.id);
        return true; 
    }
});

// Function to call the Gemini Multimodal API
async function callGeminiVisionApi(payload, tabId) {
    const { DATA } = await chrome.storage.local.get("DATA");
    
    // Use HARDCODED key, falling back to stored key
    // The key is checked against the placeholder 'YOUR_GEMINI_API_KEY_HERE' in the check below.
    const geminiKey = HARDCODED_GEMINI_KEY !== 'YOUR_GEMINI_API_KEY_HERE' 
                     ? HARDCODED_GEMINI_KEY 
                     : DATA?.geminiKey;
                     
    const geminiEndpoint = DATA?.geminiEndpoint || DEFAULT_GEMINI_ENDPOINT;

    // Final check for the key
    if (!geminiKey || geminiKey === DEFAULT_KEY_PLACEHOLDER || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
         chrome.tabs.sendMessage(tabId, {
            action: "ecoScanResult",
            success: false,
            error: "Gemini API Key is missing or default. Please configure it in the extension popup."
        });
        return;
    }

    try {
        const response = await fetch(`${geminiEndpoint}?key=${geminiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No product information detected.";
        
        chrome.tabs.sendMessage(tabId, {
            action: "ecoScanResult",
            success: true,
            data: result
        });

    } catch (error) {
        chrome.tabs.sendMessage(tabId, {
            action: "ecoScanResult",
            success: false,
            error: error.message || "Network error during Gemini API call"
        });
    }
}
