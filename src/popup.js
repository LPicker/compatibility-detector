
// TODO: put these status variables in background.html
var DEFAULT_LOCALE = 'zh-cn'; // TODO: change to en when w3help ready.
var W3HELP_LOCALES = {
  en: true,
  'zh-cn': true
};

var STATUS_BASE = 'base';
var STATUS_ADVANCED = 'advanced';

var w3helpLocale = chrome.i18n.getMessage('@@ui_locale');

// TODO: '@@ui_locale' can be en_GB
if (w3helpLocale)
  w3helpLocale = w3helpLocale.toLowerCase().replace('_', '-');
if (!W3HELP_LOCALES.hasOwnProperty(w3helpLocale))
  w3helpLocale = DEFAULT_LOCALE;
w3helpLocale = 'http://www.w3help.org/' + w3helpLocale;

// ----
// Helper functions

function stringTemplate(param) {
  return param.str.replace(param.regexp || /\${([^{}]*)}/g,
      function(a,b) {
        var r = param.obj[b];
        return (typeof r == 'string') ? r : a ;
      })
}

function $(id) {
  return document.getElementById(id);
}

function bulidHTMLView(templateObject, element) {
  var HTMTemplate = element.innerHTML;
  element.innerHTML = stringTemplate({
    str: HTMTemplate,
    obj: templateObject
  });
}

function log(message) {
  var backgroundPage = chrome.extension.getBackgroundPage();
  backgroundPage.log('(popup.js) ' + message);
}

// ----
// Event handlers

var selectedTabId;
var hasSelectedTabId = false;

var backgroundPage = chrome.extension.getBackgroundPage();

function windowLoad() {
  log('windowLoad begin');
  // HTMLView i18n
  bulidHTMLView({
    popup_cannotDetect: chrome.i18n.getMessage('popup_cannotDetect'),
    popup_loading: chrome.i18n.getMessage('popup_loading'),
    popup_baseDetection: chrome.i18n.getMessage('popup_baseDetection'),
    popup_advancedDetection: chrome.i18n.getMessage(
        'popup_advancedDetection'),
    popup_detecting: chrome.i18n.getMessage('popup_detecting'),
    popup_noProblem: chrome.i18n.getMessage('popup_noProblem'),
    popup_issueDescription: chrome.i18n.getMessage('popup_issueDescription'),
    popup_issueCount: chrome.i18n.getMessage('popup_issueCount'),
    popup_detectionStatus: chrome.i18n.getMessage('popup_detectionStatus'),
    popup_checkboxEffectTip: chrome.i18n.getMessage('popup_checkboxEffectTip')
  }, $('warp'));

  chrome.tabs.getSelected(null, onGetSelectedTab);
}

function showBaseDetectionResult(data) {
  log('showBaseDetectionResult begin');
  $('content').className = 'processing';

  var result = [];

  var KB001 = chrome.i18n.getMessage('bd_aboutRCAorKB') +
      '<a href="' + w3helpLocale + '/kb/001" target="_blank">' +
      chrome.i18n.getMessage('KB001') + '</a>';

  // Process data.documentMode
  if (data.documentMode.pageDTD) {
    result.push('<li>' + chrome.i18n.getMessage('bd_hasDTD'));
    if (data.documentMode.strangeName ||
        data.documentMode.strangePublicId ||
        data.documentMode.strangeSystemId)
      result.push(chrome.i18n.getMessage('bd_strangeDTD'));
    if (data.documentMode.hasCommentBeforeDTD)
      result.push(chrome.i18n.getMessage('bd_makeIEBeInQuirksMode') +
          chrome.i18n.getMessage('bd_aboutRCAorKB') +
          '<a href="' + w3helpLocale + '/causes/HG8001" target="_blank">' +
          chrome.i18n.getMessage('HG8001') + '</a>');
    if (data.documentMode.compatMode.IE ==
        data.documentMode.compatMode.WebKit) {
      var mode = (data.documentMode.compatMode.WebKit == 'S')
          ? '<em>' + chrome.i18n.getMessage('bd_S') + '</em>'
          : '<strong>' + chrome.i18n.getMessage('bd_Q') + '</strong>';
      result.push(chrome.i18n.getMessage('bd_sameDTD',
          ['<em>' + chrome.i18n.getMessage('bd_same') + '</em>', mode]));
      if (data.documentMode.compatMode.WebKit == 'Q') {
        result.push(chrome.i18n.getMessage('bd_inQuirksMode') +
            chrome.i18n.getMessage('bd_reducePossibility') + KB001);
      }
      result.push('</li>');
    } else {
      result.push('<li>' + chrome.i18n.getMessage('bd_differentDTD',
          ['<strong>' + chrome.i18n.getMessage('bd_different') +
          '</strong>']) + chrome.i18n.getMessage('bd_reducePossibility') +
          KB001 + '</li>');
    }

  } else {
    result.push('<li>' + chrome.i18n.getMessage('bd_noDTD',
        ['<strong>' + chrome.i18n.getMessage('bd_Q') + '</strong>']) +
        chrome.i18n.getMessage('bd_reducePossibility') + '</li>');
  }

  // Process data.DOM to HTML
  result.push('<li>' + chrome.i18n.getMessage('bd_nodeCount',
      ['<em>' + data.DOM.count + '</em>']) + '</li>');
  if (data.DOM.IECondComm.length)
    result.push('<li>' + chrome.i18n.getMessage('bd_IECondCommCount',
        ['<strong>' + data.DOM.IECondComm.length + '</strong>']) + '</li>');

  // Process data.LINK to HTML
  result.push('<li>');
  if (data.LINK.totalCount) {
    result.push(chrome.i18n.getMessage('bd_linkTotalCount',
        ['<em>' + data.LINK.totalCount + '</em>']));
    if (data.LINK.notInHeadCount) {
      result.push(chrome.i18n.getMessage('bd_linkNotInHeadCount',
          ['<strong>' + data.LINK.notInHeadCount + '</strong>']));
    } else {
      result.push(chrome.i18n.getMessage('bd_noLinkNotInHead'));
    }
  } else {
    result.push(chrome.i18n.getMessage('bd_noLink'));
  }
  result.push('</li>');

  // Process data.STYLE to HTML
  result.push('<li>');
  if (data.STYLE.totalCount) {
    result.push(chrome.i18n.getMessage('bd_styleTotalCount',
        ['<em>' + data.STYLE.totalCount + '</em>']));
    if (data.STYLE.notInHeadCount) {
      result.push(chrome.i18n.getMessage('bd_styleNotInHeadCount',
          ['<strong>' + data.STYLE.notInHeadCount + '</strong>']));
    } else {
      result.push(chrome.i18n.getMessage('bd_noStyleNotInHead'));
    }
  } else {
    result.push(chrome.i18n.getMessage('bd_noStyle'));
  }
  result.push('</li>');

  // Process data.SCRIPT to HTML
  result.push('<li>');
  if (data.SCRIPT.totalCount) {
    result.push(chrome.i18n.getMessage('bd_scriptTotalCount',
        ['<em>' + data.SCRIPT.totalCount + '</em>']));
    if (data.SCRIPT.notInHeadCount) {
      result.push(chrome.i18n.getMessage('bd_scriptNotInHeadCount',
          ['<strong>' + data.SCRIPT.notInHeadCount + '</strong>']));
    } else {
      result.push(chrome.i18n.getMessage('bd_noScriptNotInHead'));
    }
  } else {
    result.push(chrome.i18n.getMessage('bd_noScript'));
  }
  result.push('</li>');

  // Process data.HTMLBase.HTMLDeprecatedTag to HTML
  var deprecatedTag = [];
  for (var tag in data.HTMLBase.HTMLDeprecatedTag) {
    deprecatedTag.push(tag);
  }
  var deprecatedTagLength = deprecatedTag.length;
  if (deprecatedTagLength) {
    for (var i = 0; i < deprecatedTagLength; ++i) {
      result.push('<li>' + chrome.i18n.getMessage('bd_hasDeprecatedTag',
          ['<strong>' + deprecatedTag[i] + '</strong>']) + '</li>');
    }
  } else {
    result.push('<li>' +
        chrome.i18n.getMessage('bd_noDeprecatedTag') + '</li>');
  }

  // Process data.HTMLBase.HTMLDeprecatedAttribute to HTML
  var tagsHaveDeprecatedAttributes =
      Object.keys(data.HTMLBase.HTMLDeprecatedAttribute);
  var tagsLength = tagsHaveDeprecatedAttributes.length;
  if (tagsLength) {
    for (var i = 0; i < tagsLength; ++i) {
      var tagListString = [];
      var attrs =
          data.HTMLBase.HTMLDeprecatedAttribute[
            tagsHaveDeprecatedAttributes[i]
          ];
      for (var attr in attrs) {
        tagListString.push(attr);
      }
      result.push('<li>' +
          chrome.i18n.getMessage('bd_hasDeprecatedAttribute',
          ['<strong>' + tagsHaveDeprecatedAttributes[i] + '</strong>',
          '<strong>' + tagListString.join(' ') + '</strong>']) + '</li>');
    }
  } else {
    result.push('<li>' +
        chrome.i18n.getMessage('bd_noDeprecatedAttribute') + '</li>');
  }

  // Show result.
  $('base_detection').innerHTML = result.join('');
  $('content').className = '';
}

/**
 * Change pop-up page's status.
 */
function setStatus(status) {
  log('setStatus: ' + status);
  var body = document.body;
  switch (status) {
    case 'disabled':
      body.className = 'disabled';
      break;
    case 'loading':
      body.className = 'loading';
      break;
    case STATUS_BASE:
      body.className = 'base';
      break;
    case STATUS_ADVANCED:
      body.className = 'advanced';
      break;
  }
}

function getDetectionResult(tabId) {
  return backgroundPage.getDetectionResult(tabId);
}

function detectProblems(tabId) {
  chrome.tabs.sendRequest(tabId, {type: 'DetectProblems'});
}

function runBaseDetection() {
  if (!hasSelectedTabId)
    return;

  log('runBaseDetection begin');
  chrome.tabs.sendRequest(selectedTabId, {type: 'runBaseDetection'},
      showBaseDetectionResult);
};

function advancedDetection() {
  if (!hasSelectedTabId)
    return;

  var detectionResult = getDetectionResult(selectedTabId);
  // If detection finished, then show result from cache.
  if (detectionResult.detected) {
    var problems = detectionResult.problems;
    if (Object.keys(problems).length == 0) {
      showNoProblemResult();
    } else {
      for (var typeId in problems) {
        var problem = problems[typeId];
        updateDetectionResult(selectedTabId, typeId, problem);
        updateSummary(problem.severity);
      }
      setDetectionFinishedMessage();
      restoreAnnotationCheck();
    }
  } else {
    detectProblems(selectedTabId);
  }
}

function setDetectionFinishedMessage() {
  $('detectionStatus').innerHTML = chrome.i18n.getMessage('detectionFinished');
}

/**
 * @param {error | warning} type
 */
function updateSummary(type) {
  if (!hasSelectedTabId) {
    // TODO: cache the request and use it when hasSelectedTabId
    return;
  }

  var detectionResult = getDetectionResult(selectedTabId);
  var number = (type == 'warning')? 'totalWarnings' : 'totalErrors';
  var summary = chrome.i18n.getMessage(type + 'ProblemsSummary',
      [detectionResult[number]]);
  var allProblemsSummary = chrome.i18n.getMessage('allProblemsSummary',
      [detectionResult.totalProblems]);
  $(type + 'ProblemsSummary').innerHTML = summary;
  $('allProblemsSummary').innerHTML = allProblemsSummary;
}

function updateDetectionResult(senderTabId, typeId, problem) {
  if (!hasSelectedTabId) {
    // TODO: cache the request and use it when hasSelectedTabId
    return;
  }

  if (selectedTabId != senderTabId)
    return;

  var detectionResult = getDetectionResult(selectedTabId);
  var occurrencesNumber = problem.occurrencesNumber;

  var severity = problem.severity;
  $('content').className = '';
  $('detectionResult').style.display = 'block';
  $(severity + 'Area').style.display = 'block';
  var table = $(severity + 'Problems').firstElementChild;
  var problemRow = $(typeId);
  if (problemRow) {
    problemRow.cells[2].innerText = occurrencesNumber;
  } else {
    var row = document.createElement('tr');
    row.setAttribute('id', typeId);
    table.appendChild(row);
    insertCell(row, problem.occurrencesNumber);
    insertCell(row, problem.description);
    var checkbox = insertCell(row, '<input type="checkbox" name="' +
        severity + '" class="issue">').firstElementChild;
    checkbox.addEventListener('click', toggleCheckProblem, false);
  }

  function insertCell(row, html) {
    var cell = row.insertCell(0);
    cell.innerHTML = html;
    return cell;
  }
}

function showNoProblemResult() {
  $('content').className = '';
  $('noProblemFoundInfo').style.display = 'block';
}

function restoreAnnotationCheck() {
  if (!hasSelectedTabId)
    return;

  var detectionResult = getDetectionResult(selectedTabId);
  var annotatedReasons = detectionResult.annotatedReasons;
  Object.keys(annotatedReasons).forEach(function(reason) {
    $(reason).firstElementChild.firstElementChild.checked = true;
  });
  restoreCheckAll(document.getElementsByName('warning'), 'warning');
  restoreCheckAll(document.getElementsByName('error'), 'error');

  function restoreCheckAll(checkboxes, type) {
    for (var i = 0, length = checkboxes.length; i < length; ++i) {
      if (!checkboxes[i].checked)
        return;
    }
    $(type + 'CheckAll').checked = true;
  }
}

function onGetSelectedTab(tab) {
  selectedTabId = tab.id;
  hasSelectedTabId = true;

  var detectionResult = getDetectionResult(selectedTabId);
  if (detectionResult.showAdvanced) {
    setStatus(STATUS_ADVANCED);
    advancedDetection();
  } else {
    setStatus(STATUS_BASE);
    runBaseDetection();
  }

  // Change the tab panel.
  log('$tab.addEventListener click');
  $('tab').addEventListener('click', function(event) {
    var currentDetecionType = document.body.className;
    var status = event.target.className;
    log('$tab click fired, status=' + status);
    if (status && currentDetecionType != status) {
      // TODO: modify this
      var detectionResult = getDetectionResult(selectedTabId);
      detectionResult.showAdvanced = (status == 'advanced');
      if (detectionResult.showAdvanced) {
        setStatus(STATUS_ADVANCED);
        advancedDetection();
      } else {
        setStatus(STATUS_BASE);
        runBaseDetection();
      }
    }
  });

  $('errorCheckAll').addEventListener('click', function() {
    toggleCheckAllProblems(this, 'error');
  }, false);

  $('warningCheckAll').addEventListener('click', function() {
    toggleCheckAllProblems(this, 'warning');
  }, false);
}

/**
 * Update annotation status
 * @param {Array} checkboxes
 */
function updateAnnotatedStatus(checkboxes) {
  if (!hasSelectedTabId)
    return;
  var detectionResult = getDetectionResult(selectedTabId);
  var annotatedReasons = detectionResult.annotatedReasons;
  checkboxes.forEach(function(checkbox) {
    var reason = checkbox.parentNode.parentNode.id;
    if (annotatedReasons[reason] && !checkbox.checked)
      delete annotatedReasons[reason];
    else if (!annotatedReasons[reason] && checkbox.checked)
      annotatedReasons[reason] = true;
  });
  return Object.keys(annotatedReasons);
}

/**
 * Handle one checkbox click event.
 */
function toggleCheckProblem() {
  var checkbox = this;
  var annotatedReasons = updateAnnotatedStatus([checkbox]);
  backgroundPage.annotate(annotatedReasons);
  updateCheckAllStatus(checkbox);
}

/**
 * Handle check all or check no checkbox click event.
 * @param {Element} checkAll
 * @param {String} type
 */
function toggleCheckAllProblems(checkAll, type) {
  var checkboxes =
      Array.prototype.slice.call(document.getElementsByName(type));
  var checked = checkAll.checked;
  checkboxes.forEach(function(checkbox) {
    checkbox.checked = checked;
  });
  var problems = updateAnnotatedStatus(checkboxes);
  backgroundPage.annotate(problems);
}

function updateCheckAllStatus(checkbox) {
  var checkAll = $(checkbox.name + 'CheckAll');
  if (checkbox.checked) {
    var checkboxes = document.getElementsByName(checkbox.name);
    for (var i = 0, length = checkboxes.length; i < length; ++i) {
      if (!checkboxes[i].checked) {
        return;
      }
    }
    checkAll.checked = true;
  } else {
    checkAll.checked = false;
  }
}

window.addEventListener('load', windowLoad, false);