// Tab helpers for the `tabs` / `tab` shortcodes (layouts/shortcodes/tabs.html).
//
// This file used to be a copy of the hugo-theme-learn script, which needs perfect-scrollbar, featherlight and
// the theme's menu markup. The site loads none of those, so the copy threw `perfectScrollbar is not a function`
// and `featherlight is not a function` on every page, and read localStorage without a guard. Only the tab
// behaviour is used by the site, so only that is kept. The theme itself is not edited.

var TAB_SELECTIONS_KEY = 'tabSelections';

function readTabSelections() {
    try {
        var json = window.localStorage.getItem(TAB_SELECTIONS_KEY);
        var selections = json ? JSON.parse(json) : {};
        return selections && typeof selections === 'object' ? selections : {};
    } catch (e) {
        // storage blocked or holding invalid JSON
        return {};
    }
}

function saveTabSelection(tabGroup, tabId) {
    try {
        var selections = readTabSelections();
        selections[tabGroup] = tabId;
        window.localStorage.setItem(TAB_SELECTIONS_KEY, JSON.stringify(selections));
    } catch (e) {
        // storage blocked or full: the tab still switches, it is just not remembered
    }
}

function switchTab(tabGroup, tabId) {
    var allTabItems = jQuery("[data-tab-group='" + tabGroup + "']");
    var targetTabItems = jQuery("[data-tab-group='" + tabGroup + "'][data-tab-item='" + tabId + "']");

    // Only a click on a tab button (the inline onclick) needs to keep the button in place and to save the
    // choice; restoreTabSelections calls this from the page-ready event, where window.event is not a click.
    var clickEvent = window.event;
    var isButtonEvent = !!clickEvent && clickEvent.type === 'click' && !!clickEvent.target && !!clickEvent.target.getBoundingClientRect;

    var yposButton;
    if (isButtonEvent) {
        // save button position relative to viewport
        yposButton = clickEvent.target.getBoundingClientRect().top;
    }

    allTabItems.removeClass("active");
    targetTabItems.addClass("active");

    if (isButtonEvent) {
        // reset screen to the same position relative to the clicked button to prevent a page jump
        var yposButtonDiff = clickEvent.target.getBoundingClientRect().top - yposButton;
        window.scrollTo(window.scrollX, window.scrollY + yposButtonDiff);

        saveTabSelection(tabGroup, tabId);
    }
}

function restoreTabSelections() {
    var selections = readTabSelections();
    Object.keys(selections).forEach(function (tabGroup) {
        switchTab(tabGroup, selections[tabGroup]);
    });
}

jQuery(document).ready(function () {
    restoreTabSelections();
});
