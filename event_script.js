/**
 * Created by Carlos G. Gavidia on 06/06/2017.
 */



//TODO: Temporary values for testing.
var project = "OPENJPA";
var maximumReputation = 1.0;
var inflationPenalty = 0.1;

var projectJql = "project=" + project + "+order+by+created+desc";
var openStatus = "open";
var resolvedStatus = "resolved";
var maxResults = "100";
//TODO: Include the parameter "fields" in the request
//TODO: This requires that the user is already logged in the target JIRA system.
//TODO: We need to figure out how necessary is this maxResults parameter

var host = "https://issues.apache.org/jira";
var searchService = host + "/rest/api/2/search?";
var openIssuesQueryString = "jql=" + projectJql + "&status=" + openStatus + "&maxResults=" + maxResults;

var reputationScore = {};

function startDefaultReputationMap(parsedResponse) {
    "use strict";
    var reporter;
    parsedResponse.issues.forEach(function (issue) {
        reporter = issue.fields.reporter.name;
        reputationScore[reporter] = maximumReputation;
    });
}

function reputationScoresReady() {
    "use strict";
    console.log("READY: reputationScore", reputationScore);
}

function updateReportersReputation(reporterName, potentialInflatedIssues) {
    "use strict";
    if (potentialInflatedIssues.issues.length > 0) {
        console.log("reporterName", reporterName, "potentialInflatedIssues", potentialInflatedIssues);

        // TODO: This is an over-aproximation. We need to refine that the resolver is not the reporter and that the
        // priority changer is the resolver.
        var inflatedIssues = potentialInflatedIssues.issues.length;
        reputationScore[reporterName] = Math.max(0.0, maximumReputation - inflatedIssues * inflationPenalty);
    }
}

function getReportersReputation(reporterName, index, reporterList) {
    "use strict";

    var priorityChangesJql = "reporter=" + reporterName.replace(/@/g, "\\u0040") + "+and+priority+changed+and+status+was+" + resolvedStatus;
    var changedPrioritiesUrl = searchService + "jql=" + priorityChangesJql + "&maxResults=" + maxResults;

    var changedPrioritiesXhr = new XMLHttpRequest();
    changedPrioritiesXhr.onreadystatechange = function () {

        if (changedPrioritiesXhr.readyState === 4 && changedPrioritiesXhr.status === 200) {
            var potentialInflatedIssues = JSON.parse(changedPrioritiesXhr.responseText);

            updateReportersReputation(reporterName, potentialInflatedIssues);
            if (index === reporterList.length - 1) {
                reputationScoresReady();
            }
        }
    };

    changedPrioritiesXhr.open("GET", changedPrioritiesUrl, true);
    changedPrioritiesXhr.send();
}

var openIssuesXhr = new XMLHttpRequest();
var openIssuesUrl = searchService + openIssuesQueryString;
openIssuesXhr.onreadystatechange = function () {
    "use strict";
    if (openIssuesXhr.readyState === 4 && openIssuesXhr.status === 200) {
        var parsedResponse = JSON.parse(openIssuesXhr.responseText);
        console.log("parsedResponse", parsedResponse);

        startDefaultReputationMap(parsedResponse);

        console.log("Default reputationScore", reputationScore);
        Object.keys(reputationScore).forEach(getReportersReputation);
    }

};

openIssuesXhr.open("GET", openIssuesUrl, true);

console.log("Getting open issues using: " + searchService + openIssuesQueryString);
openIssuesXhr.send();