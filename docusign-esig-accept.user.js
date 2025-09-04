// ==UserScript==
// @name         DocuSign Auto-Continue (pre-sign popups only)
// @namespace    https://github.com/DSUmjham
// @version      0.3
// @description  Dismiss ERSD/welcome/disclosure popups before signing starts
// @author       Mike Ham
// @match        https://*.docusign.net/*
// @match        https://*.docusign.com/*
// @updateURL    https://raw.githubusercontent.com/DSUmjham/userscripts/main/docusign-esig-accept.js
// @downloadURL  https://raw.githubusercontent.com/DSUmjham/userscripts/main/docusign-esig-accept.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  const LOG = "[DocuSign-PreSign]";

  const qAllDeep = (sel, root = document) => {
    const out = [];
    const walk = (n) => {
      if (!n) return;
      if (n.querySelectorAll) out.push(...n.querySelectorAll(sel));
      const kids = n.querySelectorAll ? n.querySelectorAll("*") : [];
      for (const el of kids) if (el.shadowRoot) walk(el.shadowRoot);
    };
    walk(root);
    return out;
  };
  const qDeep = (sel, root) => qAllDeep(sel, root)[0] || null;

  const isVisible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 0 &&
      r.height > 0 &&
      s.visibility !== "hidden" &&
      s.display !== "none"
    );
  };

  // Only dismiss popups before signing UI shows, so we don't miss anything important
  function signingHasStarted() {
    // Common toolbars/areas once the signing canvas is up
    return Boolean(
      qDeep('[data-qa="signing-toolbar"]') ||
        qDeep('[data-qa="recipient-toolbar"]') ||
        qDeep('[data-qa="finish-button"]') ||
        qDeep('[data-qa="signing-container"]')
    );
  }

  // Identify pre-sign modals (ERSD, welcome, disclosure, cookies, etc.)
  function isPreSignModal(modal) {
    const qa = modal.getAttribute("data-qa") || "";
    const al = (modal.getAttribute("aria-label") || "").toLowerCase();
    const cls = modal.className || "";

    const positiveMatch =
      /ersd|welcome|modal|disclosure|consumer|electronic record|review and continue|cookie/i.test(
        qa
      ) ||
      /review and continue|electronic record|disclosure|welcome|cookie/.test(
        al
      ) ||
      /dsui-modal|olive/i.test(modal.getAttribute("data-dsui-modal") || "") ||
      /css-/.test(cls); // fallback (DocuSign often uses generated css-* classes)

    // avoid destructive/irrelevant dialogs (rare here, but safe)
    const negative =
      /decline|void|reject/i.test(qa) || /decline|void|reject/.test(al);

    return positiveMatch && !negative;
  }

  // ERSD helpers
  function setCheckedAndDispatch(input, checked = true) {
    try {
      const d = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "checked"
      );
      d?.set ? d.set.call(input, checked) : (input.checked = checked);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {}
  }
  function ensureERSDChecked(modal) {
    const cb =
      qDeep('[data-qa="ersd-agree-checkbox"]', modal) ||
      modal.querySelector('[data-qa="ersd-agree-checkbox"]');
    const label =
      qDeep('[data-qa="ersd-agree-checkbox-label"]', modal) || cb?.labels?.[0];
    if (cb && !cb.checked) {
      setCheckedAndDispatch(cb, true);
      label?.click?.();
      cb.click?.();
      return true;
    }
    return !!cb;
  }
  function scrollModalBody(modal) {
    const sels = [
      '[data-qa="ersd-modal-body"]',
      '[data-qa="ersd-modal-body-content"]',
      ".css-qf5tof",
      ".css-ecmkmk",
    ];
    for (const s of sels) {
      const el = qDeep(s, modal) || modal.querySelector(s);
      if (el && typeof el.scrollTop === "number") {
        el.scrollTop = el.scrollHeight;
        el.dispatchEvent(new Event("scroll", { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  function findPositiveButton(scope) {
    return (
      qDeep('[data-qa="ersd-modal-agree"]', scope) ||
      qDeep('button[data-qa*="modal-agree"]', scope) ||
      qDeep('button[data-qa*="continue"]', scope) ||
      qDeep('button[data-qa*="agree"]', scope) ||
      Array.from(qAllDeep("button", scope)).find((b) => {
        const t = (b.innerText || b.textContent || "").trim().toLowerCase();
        return (
          /^(continue|agree|accept|ok|next|start)\b/.test(t) &&
          !/\b(decline|cancel|close|back)\b/.test(t)
        );
      }) ||
      null
    );
  }

  function tryDismiss(modal) {
    if (!isPreSignModal(modal)) return false;

    // ERSD unlock steps
    const touchedERSD = ensureERSDChecked(modal);
    if (touchedERSD) scrollModalBody(modal);
    else scrollModalBody(modal);

    const btn = findPositiveButton(modal);
    if (!btn) return false;

    const clickNow = () => {
      const disabled =
        btn.disabled || btn.getAttribute("aria-disabled") === "true";
      if (!disabled && isVisible(btn)) {
        btn.click();
        return true;
      }
      return false;
    };

    if (clickNow()) return true;

    // wait for enable
    const mo = new MutationObserver(() => {
      ensureERSDChecked(modal);
      scrollModalBody(modal);
      if (clickNow()) mo.disconnect();
    });
    mo.observe(btn, {
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "class"],
    });

    // a few timed retries
    let n = 0;
    const timer = setInterval(() => {
      n++;
      ensureERSDChecked(modal);
      scrollModalBody(modal);
      if (clickNow() || n > 12) clearInterval(timer);
    }, 250);

    return true;
  }

  function sweep() {
    if (signingHasStarted()) return; // only before signing UI is live
    const modals = new Set([
      ...qAllDeep('[role="dialog"][data-qa*="modal"]'),
      ...qAllDeep('[data-dsui-modal="true"]'),
      ...qAllDeep('[data-qa="ersd-modal"]'),
    ]);
    for (const m of modals) if (isVisible(m)) tryDismiss(m);
  }

  // Run as early as possible and keep watching for late popups
  if (document.readyState === "loading") {
    // micro-kick quickly at DOM parse time
    document.addEventListener("DOMContentLoaded", sweep, { once: true });
  }
  sweep();

  const obs = new MutationObserver(() => {
    sweep();
  });
  obs.observe(document.documentElement, { subtree: true, childList: true });
  console.log(LOG, "initialized (pre-sign only).");
})();
