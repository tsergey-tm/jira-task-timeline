const openBtn = document.getElementById("openBtn");

openBtn.addEventListener("click", () => {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
        const tab = tabs[0];
        if (tab) {
            processUrl(new URL(tab.url));
        } else {
            alert("There are no active tabs")
        }
    })
})

chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (tab && checkUrl(new URL(tab.url)).ok) {
        openBtn.textContent = "Open Jira Issue timeline viewer";
        openBtn.disabled = false;
    } else {
        openBtn.disabled = true;
        openBtn.textContent = "Can't find Jira issue";
    }
})

function processUrl(url) {

    let checkUrlRes = checkUrl(url);
    if (!checkUrlRes.ok) {
        alert("Can't find Jira issue");
        return;
    }

    let uri = "chrome-extension://" + chrome.runtime.id + "/index.html#base=" + encodeURI(checkUrlRes.jiraBaseUrl) + "&issue=" + checkUrlRes.jiraIssue;
    window.open(uri, '_blank').focus();
}

function checkUrl(url) {

    console.log("Url: " + url);
    let res = {};
    const match7 = url.href.match(/^(.*)\/browse\/([A-Z]+-[0-9]+)$/);
    if (match7 != null) {
        res.ok = true;
        res.jiraVer = "7";
        res.jiraBaseUrl = match7[1];
        res.jiraIssue = match7[2];
        return res;
    }

    res.ok = false;
    return res;
}
