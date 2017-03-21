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
        for (c = 2, m = table.rows[r].cells.length; c < m; c++)
            profile.push(parseInt(table.rows[r].cells[c].innerHTML));
        
        /* remember it */
        eData.push(profile);
    }

    blob = new Blob(
        [ JSON.stringify(eData) ],
        { type: "application/json;charset=utf-8"}
    );
    saveAs(blob, "cvi-data.json");
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

function saveSVG() {
    var blob = new Blob(
        [ cviRender.svg.svg() ],
        {type: 'image/svg+xml;charset=utf-8'}
    );
    saveAs(blob, 'cvi-image.svg');
}

function savePNG() {
    _exportImage('PNG');
}

function saveJPG() {
    _exportImage('JPG');
}

function _exportImage(imageFormat) {
    if (!cviRender) {
        alert("No image has been rendered.")
        return;
    }

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
    else {
        alert("Unknown image format: " + imageFormat);
        return;
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

function importJSONFile(fileObj) {
    var reader = new FileReader();
    reader.readAsText(fileObj, "UTF-8");
    reader.onerror = function() { alert('Unable to read ' + file.fileName); };
    reader.onload = function (evt) {
        var fileData = evt.target.result;
        var data, idx;

        try {
            data = JSON.parse(fileData);
            for (idx in data) {
                __addTableRow(data[idx]);
            }
        } catch(e) {
            alert("Failed to parse JSON file: " + e);
            return;
        }
    }
}

function importCSVFile(fileObj) {
    var reader = new FileReader();
    reader.readAsText(fileObj, "UTF-8");
    reader.onerror = function() { alert('Unable to read ' + file.fileName); };
    reader.onload = function (evt) {
        var fileData = evt.target.result;
        var idx, dataRow;
        var ri, ci, cvsRow, cvsRows, cvsCell, cvsCells;

        /* assume txt/csv */
        try {
            cvsRows = fileData.split("\n");
            
            for (ri in cvsRows) {
                cvsRow = cvsRows[ri];
                dataRow = [];
                
                /* skip the header - identify as best we can */
                if (cvsRow.match(/innovator/gi) && 
                    cvsRow.match(/banker/gi) && 
                    cvsRow.match(/merchant/gi) && 
                    cvsRow.match(/builder/gi))
                    continue;
                
                cvsCells = cvsRow.split(",");
                
                for (ci in cvsCells) {
                    cvsCell = cvsCells[ci].replace(/"/g, '');
                    if (ci == 0)
                        dataRow.push(cvsCell);
                    else
                        dataRow.push(parseInt(cvsCell));
                }
                
                __addTableRow(dataRow);
            }

        } catch(e) {
            alert("Failed to parse CSV file: " + e);
            return;
        }
    }
}

function fileUpload() {
    var jData, fileObj, reader, fidx;
    var fileInput = document.getElementById('uploadFile2');
    var fileList = fileInput.files;
    
    for (fidx = 0; fidx < fileList.length; fidx++) {
        fileObj = fileList[fidx];
        
        if (fileObj.name.endsWith('.json')) {
            importJSONFile(fileObj);
        }
        else if (fileObj.name.endsWith('.xls') || fileObj.name.endsWith('.xls')) {
            alert("Importing data from MS-Excel is not supported.  Sorry.")
        }
        else {
            importCSVFile(fileObj);
        }
    }
    
    /* reset the tools */
    fileInput.value = null;
}

function deleteControl() {
    var tr = $(this).closest('tr');
    var row = cviDataTable.row(tr);
    var d = row.data();
    var p = new CVIProfile(d[1], d[2], d[3], d[4], d[5]);
    groupCviProfile.removeProfile(p);

    row.remove().draw(false);
    
    /* render based on the count */
    switch (groupCviProfile.profiles.length ) {
        case 0:
            cviRender.render(groupCviProfile);
            break;
        case 1:
            cviRender.render(groupCviProfile.profiles[0]);
            break;
        default:
            cviRender.render(groupCviProfile);
    }
}


/* removes rows from the table */
function deleteRows(e, dt, node, config) {
    var rows = cviDataTable.rows( { selected:true } );
    
    /* unhook them from the group profile */
    rows.data().each( function(d) {
        var p = new CVIProfile(d[1], d[2], d[3], d[4], d[5]);
        groupCviProfile.removeProfile(p);
    });
    
    /* pop them from the table */
    rows.remove().draw(false);
    
    /* render based on the count */
    switch (groupCviProfile.profiles.length ) {
        case 0:
            cviRender.render(groupCviProfile);
            break;
        case 1:
            cviRender.render(groupCviProfile.profiles[0]);
            break;
        default:
            cviRender.render(groupCviProfile);
    }
    
    return;
}
    
function addTableRow() {
    console.log("addTableRow()");
    var i, box, plural;
    var items = [];
    var missing = [];
    var tags = [
        "newName", "newBuilder", "newMerchant",
        "newInnovator", "newBanker"
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
    console.log("Params: ", items.toString());
    
    items[1] = parseInt(items[1]);
    items[2] = parseInt(items[2]);
    items[3] = parseInt(items[3]);
    items[4] = parseInt(items[4]);
    
    __addTableRow(items);
    
    /* clear out the adder fields */
    for (i in tags) {
        box = document.getElementById(tags[i]);
        box.value = '';
    }
}

/* Expecting 'items' to be complete  and valid */
function __addTableRow(items) {
    var tweak = [ '' ];
    var rowNode = cviDataTable
        .row.add( tweak.concat(items) )
        .draw()
        .node();
    
    /* add centering support for cvi-params */
    $(rowNode).addClass('td-cvi-param');
    
    var children = $(rowNode).children();

    /* set the delete-control class and add the glyph */
    children[0].classList.add('delete-control');
    //children[0].innerHTML = '<button type="button" class="btn btn-default"><small><span class="glyphicon glyphicon-remove"</span></small></button>';
    children[0].innerHTML = '<button type="button" class="btn btn-default btn-sm"><i class="fa fa-times"></i></button>';
    
    /* add the class to the rest of the cells */
    for (var i=1; i < children.length; i++) {
        children[i].classList.add('cvi-draw-control');
    }
    
    /* it is the classes which bind the callback */
    
}

function rowClick() {
    var table = cviDataTable;

    /* make sure we don't manage a header or footer */
    var curRow = table.row( this );
    var curData = curRow.data();
    if (!curData || curData.length != 6) {
        //console.log("rowClick() got a non-table row")
        return;
    }

    /* manage the selection, record sel/desel and highlight row */
    var preselected = $(this).hasClass('selected');
    $(this).toggleClass('selected');
    
    /* generate the profile */
    var curProfile = new CVIProfile(curData[1], curData[2], curData[3], curData[4], curData[5]);
    //console.log("rowClick(): " + curProfile.toString());

    /* add or remove it... */
    if (preselected)
        groupCviProfile.removeProfile(curProfile);
    else
        groupCviProfile.addProfile(curProfile);
    
    /* render based on the count */
    switch (groupCviProfile.profiles.length ) {
        case 0:
            cviRender.render(groupCviProfile);
            break;
        case 1:
            cviRender.render(groupCviProfile.profiles[0]);
            break;
        default:
            cviRender.render(groupCviProfile);
    }

    return;
}
