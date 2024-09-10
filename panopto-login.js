// ==UserScript==
// @name         Panopto Login
// @namespace    http://github.com/dsumjham
// @version      0.1
// @description  Automatically fill in DSU email address and procede to ADFS when prompted with the Panopto redirect page
// @author       Mike
// @match        https://login.panopto.com/*
// @match        https://dsu.hosted.panopto.com/Panopto/Pages/Auth/Login.aspx*
// @updateURL    https://raw.githubusercontent.com/DSUmjham/userscripts/main/panopto-login.js
// @downloadURL  https://raw.githubusercontent.com/DSUmjham/userscripts/main/panopto-login.js
// @grant        none
// ==/UserScript== 

(function() {
    'use strict';

    function setAngularInputValue (targetInput, newValue) {
        targetInput.value = newValue;
        const event = new Event('input', { bubbles: true });

        targetInput.dispatchEvent(event);
    }

    
    var email_address = "a@dsu.edu";
    var mat_input = document.getElementById("mat-input-0");
    
    // required info/elements for login.panopto.com/*
    if (mat_input != null) {
        setAngularInputValue(mat_input, email_address);
        document.getElementsByClassName("next-button mat-button-override mat-raised-button")[0].click();
    }
    // click the login button on dsu.hosted.panopto.com/*
    else {
        document.getElementById("PageContentPlaceholder_loginControl_externalLoginButton").click();
    }
}
)();