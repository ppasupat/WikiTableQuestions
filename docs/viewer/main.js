$(function () {

  var tableList, tableToIndex, exampleToTable;
  var currentTableId, currentBatchId, currentDataId;

  function showError(content) {
    $('#table, #examples').empty();
    $('#table').append($('<div class=error>').append(content));
  }
  
  /* AJAX Load the Table */
  function loadTable(batchId, dataId, clean) {
    var path = ('csv/' + batchId + '-csv/' + dataId +
      '-' + (clean ? 'clean' : 'raw') + '.html');
    $.get(path, function (data) {
      if (+$('#batchId').val() !== batchId || +$('#dataId').val() !== dataId)
        return;
      var table = processTable($(data));
      if (clean) table.addClass('clean')
      $('#table').empty().append(table);
    }).error(function (e) {
      showError('<strong>ERROR:</strong> Table (' + batchId + ', ' + dataId 
         + ') cannot be loaded.');
    });
  }

  function processTable(table) {
    table.find('a').attr('href', null);
    table.find('form').submit(function() {return false;});
    table.find('input, button, a').attr('tabindex', -1);
    return table;
  }

  /* AJAX Load the Examples */
  function loadExample(batchId, dataId, exId) {
    var path = ('csv/' + batchId + '-csv/' + dataId + '-data.json');
    $.getJSON(path, function (data) {
      if (+$('#batchId').val() !== batchId || +$('#dataId').val() !== dataId)
        return;
      $('#examples').empty();
      $('#examples').append(createMetadataDiv(data.metadata));
      var foundEx = false;
      data.examples.forEach(function (example) {
        $('#examples').append(createExampleDiv(example));
        if (example.id === 'nt-' + exId)
          foundEx = true;
      });
      if (!foundEx) $('#exId').val('');
    }).error(function (e) {
      $('#examples').empty();
    });
  }

  function createMetadataDiv(metadata) {
    var table = $('<table>');
    table.append($('<tr>')
        .append($('<th>').text('URL'))
        .append($('<td>').append(
            $('<a target=_blank>').text(metadata.url)
            .prop('href', metadata.url))));
    table.append($('<tr>')
        .append($('<th>').text('Title'))
        .append($('<td>').text(metadata.title)));
    table.append($('<tr>')
        .append($('<th>').text('Table #'))
        .append($('<td>').text(metadata.tableIndex)));
    return $('<div class=metadata>').append(table);
  }

  function createExampleDiv(example) {
    var exampleDiv = $('<div class=example>'), answerDiv;
    exampleDiv
      .append($('<div class=ex-id>').text(example.id))
      .append($('<div class=example-inner>')
        .append($('<div class=question-div>')
          .append($('<div class=question>').text(example.utterance)))
        .append(answerDiv = $('<div class=answer-div>')));
    if (typeof example.targetValue === 'string') {
      example.targetValue = [example.targetValue];
    }
    example.targetValue.forEach(function(x) {
      answerDiv.append($('<div class=answer>').text(x)).append(' ');
    });
    return exampleDiv;
  }

  /* Navigation */

  $('#navigator').submit(function () {
    currentBatchId = +$('#batchId').val();
    currentDataId = +$('#dataId').val();
    currentTableId = tableToIndex['' + currentBatchId + '-' + currentDataId];
    var exId = $('#exId').val().length ? +$('#exId').val() : undefined;
    if (currentTableId === undefined) {
      showError('<strong>ERROR:</strong> Table (' 
         + currentBatchId + ', ' + currentDataId
         + ') does not appear in the training data.');
    } else {
      loadTable(currentBatchId, currentDataId,
          $('#cleanTable').prop('checked'));
      loadExample(currentBatchId, currentDataId, exId);
    }
    if (currentBatchId != 0 || currentDataId != 0) {
      var newHash = ('#' + currentBatchId + '-' + currentDataId
        + ($('#cleanTable').prop('checked') ? '' : '-raw'));
      if (history !== undefined) {
        history.replaceState(undefined, undefined, newHash);
      } else {
        window.location.hash = newHash;
      }
    }
    return false;
  });

  $('#exSeeker').submit(function () {
    var exId = $('#exId').val();
    if (!exId.length) return false;
    var tableId = exampleToTable[+exId];
    if (tableId === undefined || tableList[tableId] === undefined) {
      showError('<strong>ERROR:</strong> Example nt-' 
         + exId
         + ' does not appear in the training data.');
    } else {
      var info = tableList[tableId];
      $('#batchId').val(+info[0]);
      $('#dataId').val(+info[1]);
      $('#navigator').submit();
    }
    return false;
  });

  $(window).on('hashchange', function (e) {
    var parts = window.location.hash.slice(1).split('-');
    var batchId = +parts[0], dataId = +parts[1], cleaned = (parts[2] !== 'raw');
    if (batchId === currentBatchId && dataId === currentDataId
      && cleaned === $('#cleanTable').prop('checked')) return;
    $('#batchId').val(batchId);
    $('#dataId').val(dataId);
    $('#cleanTable').prop('checked', cleaned);
    $('#navigator').submit();
  }); 

  $('#navigator input').change(function () {
    $('#navigator').submit();
  });

  $('#prev').click(function () {
    var info = tableList[currentTableId - 1];
    if (info === undefined) info = tableList[1];
    $('#batchId').val(+info[0]);
    $('#dataId').val(+info[1]);
    $('#navigator').submit();
  });

  $('#next').click(function () {
    var info = tableList[currentTableId + 1];
    if (info === undefined) info = tableList[tableList.length - 1];
    $('#batchId').val(+info[0]);
    $('#dataId').val(+info[1]);
    $('#navigator').submit();
  });

  $('#exSeeker input').change(function (e) {
    $('#exSeeker').submit();
  });

  function loadTableList() {
    var path = 'csv/tables.json';
    $.getJSON(path, function (data) {
      tableList = [undefined];
      tableToIndex = {};
      data.tables.forEach(function (batch) {
        var batchId = batch[0];
        batch[1].forEach(function (dataId) {
          tableToIndex['' + batchId + '-' + dataId] = tableList.length;
          tableList.push([batchId, dataId]);
        });
      });
      exampleToTable = data.exampleToTable;
      if (window.location.hash) {
        $(window).trigger('hashchange');
      } else {
        var randomTableId = Math.floor(Math.random() * tableList.length) + 1;
        $('#batchId').val(tableList[randomTableId][0]);
        $('#dataId').val(tableList[randomTableId][1]);
        $('#navigator').submit();
      }
    }).error(function () {
      showError('<strong>ERROR:</strong> Cannot load table list from ' + path);
    });
  }

  /* Window resizing */
  function resizer() {
    $('#wrapper').css('top', $('#header').outerHeight() - 0.5);
    $('#wrapper > div').height($(window).height()
        - $('#header').outerHeight());
  };
  $(window).resize(resizer);
  
  /* Start up */
  (function () {
    loadTableList();
    resizer();
  })();
});
