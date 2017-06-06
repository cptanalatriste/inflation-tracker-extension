/**
 * Created by Carlos G. Gavidia on 06/06/2017.
 */



//TODO: Temporary values for testing.
var project = "OPENJPA";

var jql = "project=" + project + "+order+by+created+desc";
var status = "open";
var maxResults = "5";
//TODO: Include the parameter "fields" in the request
//TODO: This requires that the user is already logged in the target JIRA system.

var host = "https://issues.apache.org/jira";
var searchService = host + "/rest/api/2/search?";
var openIssuesQueryString = "jql=" + jql + "&status=" + status + "&maxResults=" + maxResults;

console.log("Getting open issues using: " + searchService + openIssuesQueryString);

var xmlHttpRequest = new XMLHttpRequest();
var url = searchService + openIssuesQueryString;
xmlHttpRequest.onreadystatechange = function () {
    "use strict";
    if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 200) {
        var parsedResponse = JSON.parse(xmlHttpRequest.responseText);
        console.log("parsedResponse", parsedResponse);

        var reporters = {};
        var reporter;

        parsedResponse.issues.forEach(function (issue) {
            console.log("issue", issue);

            reporter = issue.fields.reporter.name;
            reporters[reporter] = true;
        });

        console.log("reporters", reporters);
    }

};

xmlHttpRequest.open("GET", url, true);
xmlHttpRequest.send();