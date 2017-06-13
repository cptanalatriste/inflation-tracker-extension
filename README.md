# JIRA Inflation Tracker
Some reporters inflate priority to get their issues fixed. When they do that, you as a developer can spend time on issues that are less important than other open issues. This Chrome Extension helps you identify reporters who do this.

## Installation
The Chrome Extension is still under development. To install it, download the code from this repository and load it as an unpacked extension [following this procedure.](https://developer.chrome.com/extensions/getstarted#unpacked). 

## Features
After installing the extension, the inflation tracker button will be available in your browser. After clicking it you will see the following:

![alt text](https://github.com/cptanalatriste/inflation-tracker-extension/blob/master/img/screenshots/start.PNG?raw=true "Extension start")

Immediately after installing the extension you should configure the options according to the characteristics of your bug reporting process. Here's a brief descriptions of the options available:

* JIRA host: The URL of your JIRA system. For example, tha Apache Software Foundation uses https://issues.apache.org/jira 
* Inflation penalty: The extensions works based on the concept of "Reporter Reputation". If the priority assigned by a bug reporter is changed later during the patch development process, his reputation score is diminished. This parameter defines the penalty per infraction.
* Maximum results per request: Under the hood, the extension makes heavy usage of JIRA's REST API: This parameter defines the maximum number of issues returned per request.
* Minimum acceptable reputation: Each reporter gets a "thumbs up" or "thumbs down" label based on their reputation score. This parameter defines the minimum reputation score for a "thumbs up" label.
* Project: The name of the project you're working on.
* When you finish working on an issue, you update the status to: We use this information to identify the "important" priority corrections that impact the score. For example, if this parameter is set to "Resolved" —the default— any priority correction made by a "Resolver" will impact the reporter's reputation.

Once you have set proper values for all this parameters, you can click on the "Load Issues" button to obtain a list of *open an unassigned issues sorted by reporter reputation, reported priority and creation date:* 

![alt text](https://github.com/cptanalatriste/inflation-tracker-extension/blob/master/img/screenshots/issues.PNG?raw=true "Issues Loaded")

Per issue, you can see the reputation score of the reporter in the "Score" column. Also, we provide a "View" button —the magnifier glass— which can open the issue on the current active tab. After the issues have loaded the "Reputation Report" button is activated, which shows the list of reporters for the issues in the inbox sorted by reputation, including their "thumbs up" status:

![alt text](https://github.com/cptanalatriste/inflation-tracker-extension/blob/master/img/screenshots/reporters.PNG?raw=true "Reputation Report")


## Inflation Tracker as a JIRA Plugin
We also developed an inflation tracker implemented as a JIRA Plugin: as such, it requires JIRA administration rights to install it. It is also under development, but if you're interested [you can check it here.](https://github.com/cptanalatriste/inflation-tracker).


## Questions, issues or support?
Feel free to contact me at c.gavidia@cs.ucl.ac.uk .



