// ==UserScript==
// @name         Console Save
// @namespace    jeffmccune
// @updateUrl    https://github.com/jeffmccune/web-userscripts/raw/master/consolesave.user.js
// @downloadUrl  https://github.com/jeffmccune/web-userscripts/raw/master/consolesave.user.js
// @version      1.0.1
// @description  Save an object in the console
// @author       Jeff McCune
// @match        https://home.personalcapital.com/*
// @grant        none
// ==/UserScript==

(function(console){

    console.save = function(data, filename){

        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 4)
        }

        var blob = new Blob([data], {type: 'text/json'}),
            e    = document.createEvent('MouseEvents'),
            a    = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    }
})(console)
