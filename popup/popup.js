// popup/popup.js

const DEFAULT_KEY = "**********";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

// Load the stored theme preference
chrome.storage.local.get("darkMode", (data) => {
  const toggleModeBtn = document.getElementById("toggleMode");
  if (data.darkMode) {
    document.documentElement.classList.add("dark");
    toggleModeBtn.querySelector("span").innerHTML = "&#9728;"; // Sun icon
  } else {
    document.documentElement.classList.remove("dark");
    toggleModeBtn.querySelector("span").innerHTML = "&#9790;"; // Moon icon
  }
});

const toggleModeBtn = document.getElementById("toggleMode");
toggleModeBtn.addEventListener("click", () => {
  const darkModeEnabled = document.documentElement.classList.toggle("dark");
  const toggleSpan = toggleModeBtn.querySelector("span");

  // Change icon to corresponding mode
  toggleSpan.innerHTML = darkModeEnabled ? "&#9728;" : "&#9790;";
  chrome.storage.local.set({ darkMode: darkModeEnabled });
});

document.getElementById("saveButton").addEventListener("click", () => {
  const geminiKey = document.getElementById("geminiKey").value;
  const geminiEndpoint =
    document.getElementById("geminiEndpoint").value || GEMINI_ENDPOINT;

  chrome.storage.local.get("DATA", ({ DATA = {} }) => {
    // Only save new key if it's not the default placeholder
    const keyToSave = geminiKey !== DEFAULT_KEY ? geminiKey : DATA.geminiKey;
    
    const newData = {
      ...DATA, 
      geminiKey: keyToSave,
      geminiEndpoint,
    };
    
    chrome.storage.local.set(
      {
        DATA: newData,
      },
      () => {
        alert("Configuration saved successfully.");
      }
    );
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const geminiKeyInput = document.getElementById("geminiKey");
  const geminiEndpointInput = document.getElementById("geminiEndpoint");

  chrome.storage.local.get("DATA", (result) => {
    const info = result.DATA;

    if (!info) return;

    // Display placeholder for existing key
    if (info.geminiKey) {
      geminiKeyInput.value = DEFAULT_KEY;
      geminiKeyInput.type = "password";
    }

    if (info.geminiEndpoint) geminiEndpointInput.value = info.geminiEndpoint;
  });
});