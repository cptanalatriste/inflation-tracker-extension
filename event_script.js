/**
 * Created by Carlos G. Gavidia on 06/06/2017.
 */

var xhr = new XMLHttpRequest();

function onReadyStateChange() {
    if (xhr.readyState == 4) {
        console.log(xhr.responseText);
    }
}

//TODO(cgavidia): Temporary values for testing.
var project = "OPENJPA";

var jql = "project=" + project + "+order+by+created+desc";
var status = "open";
var maxResults = "5";
//TODO(cgavidia): Include the parameter "fields" in the request

var host = "https://issues.apache.org/jira";
var searchService = host + "/rest/api/2/search?";
var openIssuesQueryString = "jql=" + jql + "&status=" + status + "&maxResults=" + maxResults;

console.log("Getting open issues using: " + searchService + openIssuesQueryString);
xhr.onreadystatechange = onReadyStateChange;
xhr.open("GET", searchService + openIssuesQueryString);
xhr.send();