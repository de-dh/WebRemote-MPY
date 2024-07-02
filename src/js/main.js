
        // Block input for all buttons
        function blockInput(state) {
            $('button').each(function (index, element) {
                $(element).attr('disabled', state);
            });

            if (state) {
                $('#reloadAll').off('click');
                $('#reloadAll span').removeClass('click');
            } else {
                $('#reloadAll span').addClass('click');
                $('#reloadAll').on('click', function () {
                    printMessage('Loading records and config.');
                    flushTable();
                    loadAll();
                });
            }

        } // /blockInput

        // Print status messages
        function printMessage(msg, fgColor = 'hsl(207, 64%, 38%)') {
            $('#statusText').html(msg);
            $('#statusText').css({ 'color': fgColor });
        }// /printMessage


        function deletRecord(rName) {
            const recordName = rName;
            printMessage('Deleting: ' + recordName, 'yellow');
            jQuery.ajax({
                url: '/delete',
                type: 'POST',
                data: JSON.stringify({ name: recordName }),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    printMessage(recordName + ' deleted.');
                },
                error: function (data) {
                    printMessage('Error: No record found.', 'red');
                },
                complete: function () {
                    loadAll();
                }
            });
        } // Delete - End

        function playRecord(rName) {
            const recordName = rName;
            printMessage('Transmitting: ' + recordName, 'yellow');
            jQuery.ajax({
                url: '/play',
                type: 'POST',
                data: JSON.stringify({ name: recordName }),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    printMessage(recordName + ' transmitted.');
                },
                error: function (data) {
                    printMessage('Error! No record found.', 'red');
                }
            });
        } // Play - End



        function insertTableRow(rID, rName, markNew) {
            const dataRecordID = rID;
            const dataRecordName = rName;
            const tableBody = $('#dataTableBody');

            const row = $('<tr></tr>');
            const cellsContent = [dataRecordID, dataRecordName, null];
            const buttonsText = ['Play', 'Delete'];

            let cells = [];
            let buttons = [];

            // Add class to row for highlighting new record 
            if (markNew === true) {
                row.addClass('new');
            }

            // Create td and button elements
            for (let i = 0; i <= 2; i++) {
                if (cellsContent[i] !== null) {
                    cells.push($('<td></td>').text(cellsContent[i]));
                } else {
                    cells.push($('<td></td>'));
                }
            }

            for (let i = 0; i <= 1; i++) {
                buttons.push($('<button></button>').text(buttonsText[i]));
            }

            // Callbacks for Play and Delete Buttons
            buttons[0].click(function () {
                //alert('Play ID: ' + dataRecordID + '\nRecord ID:' + dataRecordName);
                playRecord(dataRecordName);
            });

            buttons[1].click(function () {
                //alert('Delete ID: ' + dataRecordID + '\nRecord ID:' + dataRecordName);
                if (confirm('Delete record\n' + dataRecordName + '?') == true) {
                    deletRecord(dataRecordName);
                } else {
                    return false;
                }
            });

            // Append DOM-Elements to tbody
            buttons.forEach((item, index, arr) => {
                cells[2].append(item);
            });

            cells.forEach((item, index, arr) => {
                row.append(item);
            });

            tableBody.append(row);

        } // /insertTableRow

        function flushTable() {
            let tableBody = $('#dataTableBody');
            tableBody.empty();
        } // /flushTable

        function recordSignal() {
            let recordInputName = $('#recordName').val();
            printMessage('Recording: Waiting for ' + recordInputName + '.', 'yellow');

            jQuery.ajax({
                url: '/record',
                type: 'POST',
                data: JSON.stringify({ name: recordInputName }),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    printMessage(recordInputName + ' recorded.');
                    $('#recordName').val('');
                    loadRecords(recordInputName);
                },
                error: function (data) {
                    printMessage('Error! No signal detected.', 'red');
                }
            });
            //AJAX
        }


        // Load records for display in table
        function loadRecords(newRecord, callbackFunction) {
            jQuery.ajax({
                url: '/data',
                type: 'GET',
                dataType: 'json',
                success: function (data) {

                    if (Object.keys(data).length === 0) {
                        printMessage('No records found.', 'red');
                        return false;
                    }

                    // Clear table content
                    flushTable();

                    Object.keys(data).forEach((item, index) => {
                        insertTableRow(index + 1, item, (newRecord === item) ? true : false);
                    });

                },
                error: function (data) {
                    printMessage('Error: No recorded signals available in database.', 'red');
                },
                complete: function (data) {
                    if (callbackFunction) {
                        callbackFunction();
                    }
                }
            });
        } // load data


        function loadConfig(callbackFunction) {
            jQuery.ajax({
                url: '/config',
                type: 'GET',
                dataType: 'json',
                success: function (data) {

                    if (Object.keys(data).length === 0) {
                        printMessage('No records found.', 'yellow');
                        return false;
                    }

                    let freeMemoryInfo = $('#recordInfoFreeMemory');
                    let freeMemoryFileName = $('#recordInfoFileName');

                    let memInfoText = data['memFreePercent'] + '<br>';
                    memInfoText += '(' + data['memFree'] + 'kB ';
                    memInfoText += 'of ' + data['memComplete'] + 'kB unused)';

                    freeMemoryInfo.html(memInfoText);
                    freeMemoryFileName.html(data['fileName']);

                },
                error: function (data) {
                    printMessage('Error: No config.', 'red');
                },
                complete: function (data) {
                    if (callbackFunction) {
                        callbackFunction();
                    }
                }
            });
        }

        // Load records and config
        function loadAll(callbackFunction) {
            loadRecords('None', function () {
                loadConfig(function () {
                    if (callbackFunction) {
                        callbackFunction();
                    }
                });
            });
        }


        // Boot
        $(document).ready(function () {



            // Attach event handlers

            // Record signal when form is submitted
            $('#recordForm').submit(function (event) {
                event.preventDefault();
                recordSignal();
            }); // /submit

            $(document).on('ajaxSend', function () {
                blockInput(true);
            });

            $(document).on('ajaxStop', function () {
                blockInput(false);
            });



            printMessage('Loading records and config.');
            loadAll(function () {
                printMessage('Ready');
            });


        }); // /Boot