/**
 * Created by Carlos G. Gavidia on 07/06/2017.
 *
 * Popup style taken from: https://codepen.io/ldesanto/full/pEftw/
 */

var issueTableId = "issuesTable";


//TODO: Temporary values for testing.
var project = "OPENJPA";
var maximumReputation = 1.0;
var inflationPenalty = 0.1;
var openStatus = "open";
var resolvedStatus = "resolved";
var maxResults = "20";

var projectJql = "project=" + project + "+order+by+created+desc";

//TODO: Include the parameter "fields" in the request
//TODO: This requires that the user is already logged in the target JIRA system. We need an approapriate error message
//if it not the case
//TODO: We need to figure out how necessary is this maxResults parameter

var host = "https://issues.apache.org/jira";
var searchService = host + "/rest/api/2/search?";
var openIssuesQueryString = "jql=" + projectJql + "&status=" + openStatus + "&maxResults=" + maxResults;

var unassignedIssues = null;
var reputationScore = {};

function startDefaultReputationMap() {
    "use strict";
    var reporter;
    unassignedIssues.forEach(function (issue) {
        reporter = issue.fields.reporter.name;
        reputationScore[reporter] = maximumReputation;
    });
}

function addIssuesToHTMLTable(unassigedIssueList) {
    "use strict";

    var issueTable = document.getElementById("issuesTable");
    unassigedIssueList.forEach(function (issueInformation) {
        var issueRow = document.createElement("tr");
        var rowContent = "<td>" + issueInformation.key + "</td><td>" + issueInformation.summary + "</td>";
        rowContent += "<td><i class='button edit'>edit</i><i class='button delete'>delete</i></td>";

        issueRow.innerHTML = rowContent;
        issueTable.appendChild(issueRow);
    });

    console.log("Issues loaded!");

}

function reputationScoresReady() {
    "use strict";
    console.log("READY: reputationScore", reputationScore);

    var unassigedIssueList = [];
    unassignedIssues.forEach(function (issue) {
        unassigedIssueList.push({
            key: issue.key,
            summary: issue.fields.summary,
            reporter: issue.fields.reporter.name,
            reporterScore: reputationScore[issue.fields.reporter.name],
            priorityId: issue.fields.priority.id, //TODO: Not sure if this ID is sorted in the hierarchy
            priorityName: issue.fields.priority.name
        });
    });

    unassigedIssueList.sort(function (issue, otherIssue) {
        if (issue.reporterScore > otherIssue.reporterScore) {
            return -1;
        }

        if (issue.reporterScore < otherIssue.reporterScore) {
            return 1;
        }

        return 0;
    });

    console.log("unassigedIssueList", unassigedIssueList);
    addIssuesToHTMLTable(unassigedIssueList);
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

function queryIssuesFromServer() {
    "use strict";

    var openIssuesXhr = new XMLHttpRequest();
    var openIssuesUrl = searchService + openIssuesQueryString;
    openIssuesXhr.onreadystatechange = function () {
        if (openIssuesXhr.readyState === 4 && openIssuesXhr.status === 200) {
            unassignedIssues = JSON.parse(openIssuesXhr.responseText).issues;
            console.log("unassignedIssues", unassignedIssues);

            startDefaultReputationMap();

            console.log("Default reputationScore", reputationScore);
            Object.keys(reputationScore).forEach(getReportersReputation);
        }

    };

    openIssuesXhr.open("GET", openIssuesUrl, true);

    console.log("Getting open issues using: " + searchService + openIssuesQueryString);
    openIssuesXhr.send();
}

console.log("Loading popup script ...");
document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    queryIssuesFromServer();
});