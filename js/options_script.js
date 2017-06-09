/**
 * Created by Carlos G. Gavidia on 08/06/2017.
 */

var saveButtonId = "save";
var statusId = "status";

var defaultOptions = {
    inflationPenalty: 0.1,
    resolvedStatus: "Resolved",
    maxResults: "20",
    optimalThreshold: 0.7,
    host: "http://myjiraserver",
    projectJql: "project=MYPROJECT+and+status=Open+and+assignee+is+null+order+by+created+desc,priority+desc"
};

// var chrome = null;

function saveOptions() {
    "use strict";

    var parameterValues = {};
    Object.keys(defaultOptions).forEach(function (parameter) {
        parameterValues[parameter] = document.forms[0][parameter].value;
    });

    console.log("parameterValues", parameterValues);
    chrome.storage.sync.set(parameterValues, function () {
        var status = document.getElementById(statusId);
        status.textContent = "Options saved!";
        status.classList.add("info");

        setTimeout(function () {
            status.textContent = "";
            status.classList.remove("info", "success", "warning", "error");
        }, 750);
    });
}

function restoreOptions() {
    "use strict";
    chrome.storage.sync.get(defaultOptions, function (storedParameters) {
        Object.keys(defaultOptions).forEach(function (parameter) {
            console.log("parameter", parameter, "document.forms[0][parameter]", document.forms[0][parameter]);
            document.forms[0][parameter].value = storedParameters[parameter];
        });

    });
}

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    var saveButton = document.getElementById(saveButtonId);
    saveButton.addEventListener("click", saveOptions);

    restoreOptions();
});