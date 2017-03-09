/*
 * Support to manage the dynamic table for the CVI profiles
 */

function getTable() {
    return document.getElementById("cviTable");
}

function getTableBody() {
    return getTable().getElementsByTagName('tbody')[0];
}

function exportInfo() {
    var table = getTableBody();
    var eData = [];
    var r, n, c, m, profile, blob;
    
    /* export all rows in the table body */
    for (r = 0, n = table.rows.length; r < n; r++) {
        
        profile = [];

        /* pass on name */
        profile.push(table.rows[r].cells[1].innerHTML);

        /* convert "13" into its INT form */
        for (c = 2, m = table.rows[r].cells.length-1; c < m; c++)
            profile.push(parseInt(table.rows[r].cells[c].innerHTML));
        
        /* remember it */
        eData.push(profile);
    }

    blob = new Blob(
        [ JSON.stringify(eData) ],
        { type: "application/json;charset=utf-8"}
    );
    saveAs(blob, "cvi-data.js");
}


function triggerDownload (imgURI, fname) {
  var evt = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true
  });

  var a = document.createElement('a');
  a.setAttribute('download', fname);
  a.setAttribute('href', imgURI);
  a.setAttribute('target', '_blank');

  a.dispatchEvent(evt);
}

function exportImage() {
    if (!cviRender) {
        alert("No image has been rendered.")
        return;
    }
    
    var imageFormat = document.getElementById('imageFormat').value;
    
    if (imageFormat == 'SVG') {
        var blob = new Blob(
            [ cviRender.svg.svg() ],
            {type: 'image/svg+xml;charset=utf-8'}
        );
        saveAs(blob, 'cvi-image.svg');
    }
    else if (imageFormat == 'PNG' || imageFormat == 'JPG') {
        var canvas = document.getElementById('canvas');
        canvas.width = cviRender.svg.width();
        canvas.height = cviRender.svg.height();
        var ctx = canvas.getContext('2d');
        var data = cviRender.svg.svg();
        var DOMURL = window.URL || window.webkitURL || window;

        var img = new Image();
        var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svgBlob);
        var mimeType = 'image/png';
        var fname = 'cvi-image';
        if (imageFormat == 'JPG') {
            mimeType = 'image/jpeg';
            fname = fname + '.jpg';
        }
        else if (imageFormat == 'PNG') {
            mimeType = 'image/png';
            fname = fname + '.png';
        }

        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);

            var imgURI = canvas
                .toDataURL(mimeType)
                .replace(mimeType, 'image/octet-stream');

            triggerDownload(imgURI, fname);
        };

        img.src = url;
    }
    else {
        alert("Unknown Image Format.");
    }
}

function loadTestData() {
    var items = [
        ['Mark Nicholson T', 21, 29, 8, 14],
        ['Karen Nicholson T', 29, 14, 13, 16]
    ];
    
    for (var i in items) {
        __addTableRow(items[i]);
    }
}

/* for debug */
//window.onload = loadTestData;
    
    
function fileUpload() {
    var jData, fileObj, reader, fidx;
    var fileInput = document.getElementById('uploadFile');
    var fileList = fileInput.files;
    
    for (fidx = 0; fidx < fileList.length; fidx++) {
        fileObj = fileList[fidx];
        
        reader = new FileReader();
        reader.readAsText(fileObj, "UTF-8");
        reader.onload = function (evt) {
            try {
                jData = JSON.parse(evt.target.result);
                for (var ji in jData) {
                    __addTableRow(jData[ji]);
                }
            } catch(e) {
                alert("Failed to parse file '" + fileObj.name + "': " + e);
                return;
            }
        }
        reader.onerror = function (evt) {
            alert("error reading file");
            return;
        }
    }
    
    /* reset the tools */
    fileInput.value = null;
}
    
function delAllRows() {
    var table = getTableBody();
    for (var r = table.rows.length-1; r >= 0; r--)
        table.deleteRow(r);
    
    /* update the drawing in case we nuked a profile */
    tableScan();
}

function delRow(rowId) {
    var table = getTableBody();
    var row = document.getElementById(rowId);

    table.deleteRow( row.rowIndex - 1 );
    
    /* update the drawing in case we nuked a profile */
    tableScan();
}
    
function addTableRow() {
    var i, box, plural;
    var items = [];
    var missing = [];
    var tags = [
        "newName", "newMerchant",
        "newInnovator", "newBanker", "newBuilder"
    ];
    
    for (i in tags) {
        box = document.getElementById(tags[i]);
        if (box && box.value) {
            items.push(box.value);
            continue;
        }
        missing.push(tags[i].slice(3,20));
    }
    
    /* sanity check */
    if (items.length < tags.length) {
        plural = '';
        if (missing.length > 1)
            plural = 's';
        alert("Cannot add row. '{0}' parameter{1} not provided.".format(missing, plural));
        return;
    }
    
    /* install the row */
    __addTableRow(items);
    
    /* clear out the adder fields */
    for (i in tags) {
        box = document.getElementById(tags[i]);
        box.value = '';
    }
}

var rowID = 3333;
function uniqueRowID() {
    return "cviRow"+rowID++; 
}
    
/* Expecting 'items' to be complete  and valid */
function __addTableRow(items) {
    var tableRef = getTableBody();
    var newRow, newCell, checkbox, delBtn;
    
    // Insert a row in the table at the last row
    newRow = tableRef.insertRow(tableRef.rows.length);
    newRow.id = uniqueRowID();

    // Insert a cell in the row at index 0
    newCell = newRow.insertCell(0);
    checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.onclick = tableScan;
    newCell.appendChild(checkbox);
    
    /* set the data */
    newCell = newRow.insertCell(1);
    newCell.appendChild(document.createTextNode(items[0]));
    newCell = newRow.insertCell(2);
    newCell.appendChild(document.createTextNode(items[1]));
    newCell = newRow.insertCell(3);
    newCell.appendChild(document.createTextNode(items[2]));
    newCell = newRow.insertCell(4);
    newCell.appendChild(document.createTextNode(items[3]));
    newCell = newRow.insertCell(5);
    newCell.appendChild(document.createTextNode(items[4]));

    /* set the delete button */
    newCell = newRow.insertCell(6);
    delBtn = document.createElement('button');
    delBtn.onclick = function() { delRow(newRow.id); };
    delBtn.innerHTML = "&times;";
    newCell.appendChild(delBtn);
}

function tableScan() {
    var folks = [];
    var table = document.getElementById("cviTable");
    var groupName = "Meeting";
    var n, r, c, m, profile, svgDiv;
    
    for (r = 1, n = table.rows.length; r < n; r++) {
        profile = [];
        if (!table.rows[r].cells[0].childNodes[0].checked)
            continue;

        /* pass on name */
        profile.push(table.rows[r].cells[1].innerHTML);

        /* convert "13" into its INT form */
        for (c = 2, m = table.rows[r].cells.length; c < m; c++) {
            profile.push(parseInt(table.rows[r].cells[c].innerHTML));
        }
        
        /* remember it */
        folks.push(profile);
    }

    /* render the data */
    if (folks.length > 0) {
        cviTool(groupName, folks);
    }
    else {
        svgDiv = document.getElementById('svgDivID');
        while (svgDiv.childElementCount > 0)
            svgDiv.removeChild(svgDiv.firstChild);
    }
}
