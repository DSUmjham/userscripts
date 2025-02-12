// ==UserScript==
// @name         Docusign Electronic Record and Signature Disclosure
// @namespace    http://github.com/DSUmjham
// @version      0.1
// @description  Automatically check the box for "I agree to use electronic records and signatures"
// @author       Mike Ham
// @match        https://*.docusign.net/Signing/?ti=*
// @updateURL    https://raw.githubusercontent.com/DSUmjham/userscripts/main/docusign-esig-accept.js
// @downloadURL  https://raw.githubusercontent.com/DSUmjham/userscripts/main/docusign-esig-accept.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function waitForElement(
    selector,
    callback,
    interval = 500,
    maxAttempts = 50
  ) {
    let attempts = 0;
    const checker = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(checker);
        callback(element);
      } else if (attempts >= maxAttempts) {
        clearInterval(checker);
        console.warn(`Element not found: ${selector}`);
      }
      attempts++;
    }, interval);
  }

  // Wait for the checkbox to exist, then click it
  waitForElement('input[type="checkbox"].css-mvulh6', (checkbox) => {
    checkbox.click(); // Simulate real click
    checkbox.dispatchEvent(new Event("change", { bubbles: true })); // Ensure it registers

    // Now wait for the button and click it
    waitForElement(
      'button[data-qa="ersd-modal-agree"]',
      (button) => {
        if (!button.disabled) {
          button.click();
        } else {
          console.warn("Button is disabled.");
        }
      },
      500
    );
  });
})();
