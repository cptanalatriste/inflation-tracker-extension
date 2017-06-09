/**
 * Created by Carlos G. Gavidia on 07/06/2017.
 *
 * Popup style taken from: https://codepen.io/ldesanto/full/pEftw/
 * Icons provided here: http://materializecss.com/icons.html
 * And here: https://www.iconfinder.com/icons/1688867/business_management_person_reputation_icon#size=128 */

var issueTableId = "issuesTable";
var tableHeaderId = "tableHeader";
var loadLinkId = "connect";
var optionsLinkId = "options";

//TODO: Temporary values for testing.
var defaultOptions = {
    inflationPenalty: 0.1,
    resolvedStatus: "Resolved",
    maxResults: "20",
    optimalThreshold: 0.7,
    host: "http://myjiraserver",
    projectJql: "project=MYPROJECT+and+status=Open+and+assignee+is+null+order+by+priority+desc,created+desc"
};

//TODO: Also, instructions are pending.
//TODO: Include the parameter "fields" in the request
//TODO: This requires that the user is already logged in the target JIRA system. We need an approapriate error message
//if it not the case
//TODO: We need to figure out how necessary is this maxResults parameter

var jiraRestApi = "/rest/api/2/search?";
var unassignedIssues = null;
var reputationScore = {};
var reporterRequestCounter = 0;
var maximumSummarySize = 50;
var maximumReputation = 1.0;
var extentionOptions = defaultOptions;

// var chrome = null;

function startDefaultReputationMap() {
    "use strict";
    var reporter;
    unassignedIssues.forEach(function (issue) {
        reporter = issue.fields.reporter.name;
        reputationScore[reporter] = maximumReputation;
    });
}

function openIssueInTab(mouseEvent) {
    "use strict";
    console.log("mouseEvent", mouseEvent);

    var source = mouseEvent.target || mouseEvent.srcElement;
    if (source.textContent === "pageview") {
        var issueId = source.id;
        var issueUrl = extentionOptions.host + "/browse/" + issueId;

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            var currentTab = tabs[0];
            chrome.tabs.update(currentTab.id, {url: issueUrl});
        });
    }

}

function addIssuesToHTMLTable(unassigedIssueList) {
    "use strict";

    var issueTable = document.getElementById(issueTableId);
    var tableHeader = document.getElementById(tableHeaderId);

    unassigedIssueList.forEach(function (issueInformation) {
        var issueRow = document.createElement("tr");
        var rowContent = "<td>" + issueInformation.key + "</td><td>" + issueInformation.summary + "</td>";
        rowContent += "<td><i class='material-icons button' title='" + issueInformation.reporter + " reputation is";
        rowContent += " " + issueInformation.reporterScore + "'>" + issueInformation.scoreIcon;
        rowContent += "</i><i class='material-icons button' id='" + issueInformation.key + "' title='Open issue ";
        rowContent += issueInformation.key + "'>pageview</i></td>";

        issueRow.innerHTML = rowContent;
        issueTable.appendChild(issueRow);
    });

    tableHeader.textContent = unassigedIssueList.length + " issues retrieved from " + extentionOptions.host;

    var inboxControls = document.getElementsByTagName("i");

    Array.from(inboxControls).forEach(function (control) {
        control.addEventListener("click", openIssueInTab);
    });

    console.log("Issues loaded!");

}

function reputationScoresReady() {
    "use strict";
    console.log("READY: reputationScore", reputationScore);

    var unassigedIssueList = [];
    unassignedIssues.forEach(function (issue) {
        var reporterScore = reputationScore[issue.fields.reporter.name];
        var reputationIcon = reporterScore >= extentionOptions.optimalThreshold
            ? "thumb_up"
            : "thumb_down";

        var scoreAsPercentage = reporterScore * 100;

        var priorityId = null;
        var priorityName = null;

        if (issue.fields.priority) {
            priorityId = issue.fields.priority.id;
            priorityName = issue.fields.priority.name;
        }

        var rawSummary = issue.fields.summary;
        var trimmedSummary = rawSummary.length > maximumSummarySize
            ? rawSummary.substring(0, maximumSummarySize - 3) + "..."
            : rawSummary;


        unassigedIssueList.push({
            key: issue.key,
            summary: trimmedSummary,
            reporter: issue.fields.reporter.name,
            rawScore: reporterScore,
            reporterScore: scoreAsPercentage.toFixed(2) + "%",
            priorityId: priorityId, //TODO: Not sure if this ID is sorted in the hierarchy
            priorityName: priorityName,
            scoreIcon: reputationIcon
        });
    });

    unassigedIssueList.sort(function (issue, otherIssue) {
        if (issue.rawScore > otherIssue.rawScore) {
            return -1;
        }

        if (issue.rawScore < otherIssue.rawScore) {
            return 1;
        }

        return 0;
    });

    console.log("unassigedIssueList", unassigedIssueList);
    addIssuesToHTMLTable(unassigedIssueList);
}

function getResolver(changeLogHistories) {
    "use strict";
    var resolver = null;
    changeLogHistories.some(function (history) {
        var changer = history.author.name;

        history.items.some(function (changeItem) {

            if (changeItem.field === "status" && changeItem.toString === extentionOptions.resolvedStatus) {
                resolver = changer;
                return true;
            }
        });

        if (resolver) {
            return true;
        }
    });

    return resolver;
}

function getResolverPriority(changeLogHistories, resolver) {
    "use strict";
    var resolverPriority = null;

    changeLogHistories.some(function (history) {

        if (history.author.name === resolver) {
            history.items.some(function (changeItem) {
                if (changeItem.field === "priority") {
                    resolverPriority = changeItem.toString;
                    return true;
                }
            });

            if (resolverPriority) {
                return true;
            }
        }
    });

    return resolverPriority;
}

function getOriginalPriority(changeLogHistories) {
    "use strict";
    var originalPriority = null;
    changeLogHistories.some(function (history) {
        history.items.some(function (changeItem) {
            if (changeItem.field === "priority") {
                originalPriority = changeItem.fromString;
                return true;
            }
        });

        if (originalPriority) {
            return true;
        }
    });

    return originalPriority;

}

function isInflatedIssue(issue) {
    "use strict";
    var changeLogHistories = issue.changelog.histories;

    var resolver = null;
    var resolverPriority = null;
    var originalPriority = null;
    var isInflated = false;
    resolver = getResolver(changeLogHistories);

    if (resolver) {
        resolverPriority = getResolverPriority(changeLogHistories, resolver);
    }

    if (resolverPriority) {
        originalPriority = getOriginalPriority(changeLogHistories);
    }

    console.log("issue", issue, "resolver", resolver, "resolverPriority", resolverPriority, "originalPriority", originalPriority);

    if (resolverPriority && (resolverPriority !== originalPriority)) {
        isInflated = true;
    }

    return isInflated;

}

function updateReportersReputation(reporterName, potentialInflatedIssues) {
    "use strict";
    if (potentialInflatedIssues.issues.length > 0) {
        console.log("reporterName", reporterName, "potentialInflatedIssues", potentialInflatedIssues);

        // TODO: This is an over-aproximation. We need to refine that the resolver is not the reporter and that the
        // priority changer is the resolver.
        var inflatedIssues = 0;
        potentialInflatedIssues.issues.forEach(function (issue) {
            if (isInflatedIssue(issue)) {
                inflatedIssues += 1;
            }
        });

        reputationScore[reporterName] = Math.max(0.0, maximumReputation - inflatedIssues * extentionOptions.inflationPenalty);
        console.log("reporterName", reporterName, "inflatedIssues", inflatedIssues, "reputationScore[reporterName]", reputationScore[reporterName]);

    }
}

function getReportersReputation(reporterName) {
    "use strict";

    var searchService = extentionOptions.host + jiraRestApi;

    var priorityChangesJql = "reporter=" + reporterName.replace(/@/g, "\\u0040") + "+and+priority+changed+and+status+was+" + extentionOptions.resolvedStatus;
    priorityChangesJql += "+and+status+was+not+" + extentionOptions.resolvedStatus + "+by+" + reporterName;

    //TODO: Analyse if its necesessary using max results here.
    var changedPrioritiesUrl = searchService + "jql=" + priorityChangesJql + "&maxResults=" + extentionOptions.maxResults + "&expand=changelog";

    var changedPrioritiesXhr = new XMLHttpRequest();
    changedPrioritiesXhr.onreadystatechange = function () {

        if (changedPrioritiesXhr.readyState === 4 && changedPrioritiesXhr.status === 200) {
            var potentialInflatedIssues = JSON.parse(changedPrioritiesXhr.responseText);

            updateReportersReputation(reporterName, potentialInflatedIssues);
            reporterRequestCounter -= 1;
            if (reporterRequestCounter === 0) {
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

    var searchService = extentionOptions.host + jiraRestApi;
    var openIssuesQueryString = "jql=" + extentionOptions.projectJql + "&maxResults=" + extentionOptions.maxResults;
    var openIssuesUrl = searchService + openIssuesQueryString;
    var tableHeader = document.getElementById(tableHeaderId);

    tableHeader.textContent = "Loading issues from " + extentionOptions.host;

    openIssuesXhr.onreadystatechange = function () {
        if (openIssuesXhr.readyState === 4 && openIssuesXhr.status === 200) {
            unassignedIssues = JSON.parse(openIssuesXhr.responseText).issues;
            console.log("unassignedIssues", unassignedIssues);

            startDefaultReputationMap();

            console.log("Default reputationScore", reputationScore);
            reporterRequestCounter = Object.keys(reputationScore).length;
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

    var loadLink = document.getElementById(loadLinkId);
    var optionsLink = document.getElementById(optionsLinkId);


    chrome.storage.sync.get(defaultOptions, function (storedParameters) {
        extentionOptions = storedParameters;
        console.log("extentionOptions", extentionOptions);

        loadLink.addEventListener("click", function () {
            chrome.permissions.request({
                origins: [extentionOptions.host]
            }, function (granted) {
                if (granted) {
                    queryIssuesFromServer();
                }
            });
        });
    });


    optionsLink.addEventListener("click", function () {
        chrome.runtime.openOptionsPage();
    });

});