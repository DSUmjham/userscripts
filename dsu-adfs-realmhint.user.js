// ==UserScript==
// @name         DSU ADFS Realm Finder
// @namespace    http://github.com/DSUmjham
// @version      0.1
// @description  Automatically fill in DSU email address when prompted with the ADFS realm finder page
// @author       Mike Ham
// @match        https://adfs.sdbor.edu/*
// @updateURL    https://raw.githubusercontent.com/DSUmjham/userscripts/main/dsu-adfs-realmhint.user.js
// @downloadURL  https://raw.githubusercontent.com/DSUmjham/userscripts/main/dsu-adfs-realmhint.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var email_address = "@dsu.edu";
    document.getElementById("emailInput").value = email_address;
    document.getElementsByName("HomeRealmByEmail")[0].click();
})();