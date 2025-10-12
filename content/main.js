// content/main.js

(function() {

  class PromptUi {
    constructor(modalTitle) {
      this.modalHTML = `
          <div id="modal-overlay" class="modal-overlay">
            <div class="custom-modal">
              <div class="modal-header">${
                modalTitle || "Eco-Scan AI Assistant"
              }</div>
              <div class="modal-content"></div>
              <div class="buttons-container">
                <button id="copy-button">Copy Raw Text</button>
                <button id="cancel-button">Close</button>
              </div>
            </div>
          </div>
        `;
  
      this.modalCSS = `
          .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483647; 
          }
    
          .custom-modal {
            background-color: #fff;
            padding: 20px;
            width: 90%;
            max-width: 700px;
            min-height: 200px;
            max-height: 80vh; 
            color: black;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            border: 1px solid #ccc;
            display: flex;
            flex-direction: column;
          }
    
          .modal-content {
            overflow-y: auto;
            flex-grow: 1; 
            padding: 10px 0;
          }
          
          .modal-content code {
               display: block;
               white-space: pre-wrap;
               word-break: break-all;
               background-color: #f4f4f4;
               padding: 10px;
               border-radius: 4px;
          }
  
          .modal-header {
            font-size: 24px;
            font-weight: bold;
            color: #1e88e5; 
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
    
          .buttons-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            gap: 8px;
          }
    
          .buttons-container button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
          }
    
          #copy-button {
            background-color: #4CAF50; 
            color: #fff;
          }
          #copy-button:hover {
            background-color: #45a049;
          }
    
          #cancel-button {
            background-color: #f44336; 
            color: #fff;
          }
          #cancel-button:hover {
            background-color: #d32f2f;
          }
        `;
  
      this.loadingSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><radialGradient id='a12' cx='.66' fx='.66' cy='.3125' fy='.3125' gradientTransform='scale(1.5)'><stop offset='0' stop-color='#000000'></stop><stop offset='.3' stop-color='#000000' stop-opacity='.9'></stop><stop offset='.6' stop-color='#000000' stop-opacity='.6'></stop><stop offset='.8' stop-color='#000000' stop-opacity='.3'></stop><stop offset='1' stop-color='#000000' stop-opacity='0'></stop></radialGradient><circle transform-origin='center' fill='none' stroke='url(#a12)' stroke-width='15' stroke-linecap='round' stroke-dasharray='200 1000' stroke-dashoffset='0' cx='100' cy='100' r='70'><animateTransform type='rotate' attributeName='transform' calcMode='spline' dur='2' values='360;0' keyTimes='0;1' keySplines='0 0 1 1' repeatCount='indefinite'></animateTransform></circle><circle transform-origin='center' fill='none' opacity='.2' stroke='#000000' stroke-width='15' stroke-linecap='round' cx='100' cy='100' r='70'></circle></svg>`;
    }
  
    initialize(_textResult) {
      if (document.querySelector('div[id^="ai-assistant-modal-"]')) {
          return; 
      }
  
      this.modal = document.createElement("div");
      this.modal.id = "ai-assistant-modal-" + Date.now();
      const style = document.createElement("style");
      style.textContent = this.modalCSS;
  
      this.shadowRoot = this.modal.attachShadow({ mode: "open" });
  
      this.shadowRoot.innerHTML = this.modalHTML;
      this.shadowRoot.appendChild(style);
  
      this.modalContent = this.shadowRoot.querySelector(".modal-content");
      this.copyButton = this.shadowRoot.querySelector("#copy-button");
      this.cancelButton = this.shadowRoot.querySelector("#cancel-button");
  
      this.copyButton.onclick = () => {
        const textResult = _textResult || "";
        navigator.clipboard.writeText(textResult);
        this.hideModal();
      };
  
      this.cancelButton.onclick = () => this.hideModal();
  
      document.body.appendChild(this.modal);
    }
  
    showModal(content, textResult) {
      this.initialize(textResult);
  
      if (typeof marked !== 'undefined') {
          const htmlContent = marked.parse(content);
          this.modalContent.innerHTML = htmlContent;
      } else {
          this.modalContent.innerHTML = `<p>${content}</p>`;
      }
  
      this.shadowRoot.querySelector("#modal-overlay").style.display = "flex";
    }
  
    hideModal() {
      const modalOverlay = this.shadowRoot?.querySelector("#modal-overlay");
      if (modalOverlay) {
          modalOverlay.style.display = "none";
          this.modalContent.innerHTML = "";
      }
      this.modal?.remove();
    }
  
    showLoading() {
      const LOADING_ID = "loading-indicator";
      if (document.getElementById(LOADING_ID)) return;
  
      const loadingIndicator = document.createElement("div");
      Object.assign(loadingIndicator, {
        id: LOADING_ID,
        innerHTML: this.loadingSvg,
      });
  
      Object.assign(loadingIndicator.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "50px",
        height: "50px",
        zIndex: "2147483647",
        borderRadius: "10px",
        padding: "8px",
        background: "white",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)"
      });
  
      document.body.appendChild(loadingIndicator);
    }
  
    hideLoading() {
      const loadingIndicator = document.getElementById("loading-indicator");
      if (loadingIndicator) {
        document.body.removeChild(loadingIndicator);
      }
    }
  }
  

  
  class PromptHandler {
    constructor(message) {
      this.screenshotDataUrl = message.screenshot;
      this.tabId = message.tabId;
      this.promptUi = new PromptUi(message.title); 
    }
  
    dataUrlToGenerativePart(dataUrl) {
      const parts = dataUrl.split(',');
      if (parts.length < 2) {
          throw new Error("Invalid Data URL format.");
      }
      const mimeTypeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
      const base64Data = parts[1];
      
      return {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };
    }
  
    createGeminiVisionPayload() {
      const promptText = `
        You are an expert in highly critical product analysis for environmental impact. 
        Analyze the provided Amazon product page screenshot with a strong bias toward sustainability.
        
        For *every* distinct product visible on the page, detect it and provide a brief analysis.
        
        The score must prioritize: 
        1. **Renewability**: (e.g., natural fibers, wood, paper get higher scores).
        2. **Recyclability**: (e.g., single-material packaging/product gets higher scores; complex electronics/mixed materials get low scores).
        3. **Durability/Longevity**: (e.g., disposable items get low scores).
        
        The response must be in clean Markdown format and clearly list the following for each product.
        **Do not include any text outside of the analysis list.**
  
        1. **Product Name/Description:** A concise name based on the image.
        2. **Estimated Carbon Emission:** Provide a relative score (e.g., Very Low, Low, Medium, High) and a short justification based on the product's likely material, energy-intensive manufacturing, and international shipping.
        3. **Eco-Friendly Score:** Provide a score out of 5 stars (e.g., ⭐⭐⭐) and a short justification based on the three criteria above (Renewability, Recyclability, Durability).
  
        Example output structure (use this exact structure):
        
        ### Product 1: Bulk Plain Paper Towels
        * **Estimated Carbon Emission:** Low. (Made from pulp, but manufacturing/shipping volume adds carbon cost.)
        * **Eco-Friendly Score:** ⭐⭐⭐⭐ (High score due to renewable source (paper) and high recyclability, but lower due to single-use nature.)
  
        ### Product 2: Wireless Bluetooth Earbuds
        * **Estimated Carbon Emission:** High. (Contains lithium batteries, rare-earth metals, and complex, non-recyclable plastic components.)
        * **Eco-Friendly Score:** ⭐ (Very low score due to non-renewable materials, poor recyclability, and known short lifespan of electronic devices.)
      `;
  
      try {
          const imagePart = this.dataUrlToGenerativePart(this.screenshotDataUrl);
          
          return {
            contents: [
              {
                parts: [
                  imagePart,
                  { text: promptText }
                ],
              },
            ],
          };
      } catch (e) {
          console.error("Error creating payload:", e);
          return null;
      }
    }
  
    handle() {
      const payload = this.createGeminiVisionPayload();
  
      if (!payload) {
          this.promptUi.showModal(`<p>Error: Could not create the image analysis payload.</p>`);
          return;
      }
  
      this.promptUi.showLoading();
  
      chrome.runtime.sendMessage(
        { 
          action: "callGeminiVisionApi", 
          payload: payload,
          tabId: this.tabId
        }
      );
    }
  }

  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "startEcoScan") {
          const handler = new PromptHandler(request);
          handler.handle();
          return false; 
      }
      
      if (request.action === "ecoScanResult") {
          const promptUi = new PromptUi("Eco-Scan Analysis Result"); 
          promptUi.hideLoading();
  
          if (request.success) {
              promptUi.showModal(request.data, request.data);
          } else {
              promptUi.showModal(`<p>Analysis Failed: ${request.error}</p>`, request.error);
          }
          return false; 
      }
  });

})();
