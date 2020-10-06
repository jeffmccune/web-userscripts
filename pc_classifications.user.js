// ==UserScript==
// @name         Personal Capital Holding Classifications
// @namespace    jeffmccune
// @version      1.0.0
// @updateUrl    https://github.com/jeffmccune/web-userscripts/raw/master/pc_classifications.user.js
// @downloadUrl  https://github.com/jeffmccune/web-userscripts/raw/master/pc_classifications.user.js
// @description  Download holding classification data
// @author       Jeff McCune
// @match        https://home.personalcapital.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// Reference: https://github.com/kostyan5/web-userscripts/blob/master/personal_capital.js

(async () => {
  'use strict';

  var processed = false;
  var holdings = {};

  const myClasses = {
    'U.S. Stocks': 'Stocks',
    'Intl Stocks': 'Stocks',
    'U.S. Bonds': 'Bonds',
    'Intl Bonds': 'Bonds',
    'Alternatives': 'Alternatives',
    'Cash': 'Cash',
    'Unclassified': 'Alternatives',
  }

  // Return an object with properties parent and element where the
  // button should be inserted. using parent.insertBefore(btnNode, element)
  function findInsertionPoint(id = 'manualClassificationsLink') {
    let nav = document.getElementById(id)
    if (nav == null) {
      return null
    }
    let element = nav.parentNode
    let parent = element.parentNode
    if (typeof parent == "undefined") {
      return null
    }
    return {
      "parent": parent,
      "element": element
    }
  }

  function resolveInsertionPoint() {
    return findInsertionPoint() || new Promise((resolve, reject) => {
      let tries = 20
      let timerId = setTimeout(function tickResolveInsertionPoint() {
        tries--;
        let loc = findInsertionPoint()
        if (loc != null) {
          resolve(loc);
          return;
        }
        if (tries > 0) {
          // Reschedule the timer.
          timerId = setTimeout(tickResolveInsertionPoint, 100);
        } else {
          reject(new Error('Could not resolve insertion point.'));
        }
      }, 100)
    }).catch((err) => {
      console.log(err)
    });
  }

  // Create a new button element
  function newButton(id, txt, func = () => {
    alert('Not implemented')
  }) {
    let div = document.createElement('div')
    div.setAttribute('class', "pc-layout__item")
    let btn = document.createElement('a')
    btn.setAttribute('id', id)
    btn.setAttribute('class', 'pc-btn pc-btn--small')
    btn.setAttribute('type', 'button')
    btn.innerHTML = txt
    btn.addEventListener("click", func, false)
    div.appendChild(btn)
    return div
  }

  // Wait for the button insertion point
  async function addButtons() {
    const insertPoint = await resolveInsertionPoint();
    if (typeof insertPoint != "undefined") {
      let b1 = newButton('dlHoldingsJson', 'JSON', () => {
        download(JSON.stringify(holdings, undefined, 4), 'holdings.json', 'text/json')
      })
      insertPoint.parent.insertBefore(b1, insertPoint.element)
      /* DISABLED until CSV Handling is implemented
      let b2 = newButton('download-holdings-csv', 'CSV', () => { download("one,two,three", "holdings.csv", 'txt/csv') })
      insertPoint.parent.insertBefore(b2, insertPoint.element)
      */
    }
  }

  function tryAddButtons() {
    if (location.href.indexOf("/portfolio/allocation") > -1) {
      // Buttons are added asynchronously
      addButtons();
    }
  }

  // Download a file
  // JSON.stringify(data, undefined, 4)
  function download(data, filename = 'download.json', type = 'text/json') {
    if (!data) {
      console.error('No data provided to download()')
      return;
    }

    let blob = new Blob([data], {
      type: type
    })
    let e = document.createEvent('MouseEvents')
    let a = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = [type, a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, unsafeWindow, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
  }


  function processHoldings(response) {
    // The SPA calls getHoldings twice for some reason, we only need the data once.
    if (processed) return;
    processed = true;
    holdings = JSON.parse(response);
  }

  // This is intended to keep the button on the page when navigating to and from app#/portfolio/allocation
  // If the button isn't showing up, look here.
  window.addEventListener(
    "hashchange",
    function() {
      tryAddButtons();
    },
    false
  );
  window.addEventListener(
    "load",
    function() {
      tryAddButtons();
    },
    false
  );

  // intercept getHoldings api call
  (function(open) {
    XMLHttpRequest.prototype.open = function() {
      this.addEventListener("readystatechange", function() {
        if (this.readyState == 4 && this.responseURL.endsWith('/api/invest/getHoldings')) {
          processHoldings(this.response);
        }
      }, false);
      open.apply(this, arguments);
    };
  })(XMLHttpRequest.prototype.open);
})();
