/*(function () {
    'use strict';

    function about() {
        return "Version 0.1";
    }
    
    function spam() {
        alert("My First Jquery Test");
    }
*/

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

class Point {
    constructor(x, y) {
        this._x = x;
        this._y = y;
        this.ox = 0;
        this.oy = 0;
        this.scale = 1;
    }
    
    copy() {
        var npt = new Point(this._x, this._y);
        npt.ox = this.ox;
        npt.oy = this.oy;
        npt.scale = this.scale;
        return npt;
    }
    
    getOrigin() {
        return [this.ox, this.oy];
    }

    setOrigin(x,y) {
        this.ox = x;
        this.oy = y;
    }
    
    setScale(s) {
        this.scale = s;
    }
    
    x() {
        return this._x * this.scale + this.ox;
    }
    
    y() {
        return this._y * this.scale + this.oy;
    }
    
    toString() {
        return "[{0},{1}] s={2}, o:[{3},{4}] -> [{5},{6}]".format(
                          this._x, this._y, this.scale,
                          this.ox, this.oy,
                          this.x(), this.y());
    }
    dump() {
        console.log(this.toString());
    }
}

class Line {
    constructor(p1, p2) {
        if (p1.ox != p2.ox || p1.oy != p2.oy) {
            return null;
        }
        this.p1 = p1;
        this.p2 = p2;
        this.m = (this.p2.y() - this.p1.y()) / (this.p2.x() - this.p1.x());
        this.b = this.p2.y() - this.m * this.p2.x();
        
        this.x_intercept = new Point(-this.b / this.m, 0);
        this.y_intercept = new Point(0, this.m * 0 + this.b);
    }
    
    toString() {
        return "y = {0}x + {1}  xi:[{2},{3}]  yi:[{4},{5}]".format(
            this.m, this.b,
            this.x_intercept.x(), this.x_intercept.y(),
            this.y_intercept.x(), this.y_intercept.y());
    }
    
    dump() {
        console.log(this.toString());
    }
    
    xIntercept() {
        return this.x_intercept.copy();
    }
    
    yIntercept() {
        return this.y_intercept.copy();
    }
}

class CVIProfile {
    constructor(name, merchant, innovator, banker, builder) {
        this.name = name;
        this.merchant = merchant;
        this.innovator = innovator;
        this.banker = banker;
        this.builder = builder;
    }
    
    getMerchantPoint() {
        return new Point(this.merchant, -this.merchant);
    }

    getInnovatorPoint() {
        return new Point(this.innovator, this.innovator);
    }

    getBuilderPoint() {
        return new Point(-this.builder, -this.builder);
    }

    getBankerPoint() {
        return new Point(-this.banker, this.banker);
    }
}

function cvi_test() {
    var merchantPt = new Point(-21, 21);
    var innovatorPt = new Point(29, 29);
    var builderPt = new Point(-14, -14);
    var bankerPt = new Point(-8, 8);
    var origin = new Point(400, 400);
    
    var merBui = new Line(merchantPt, builderPt);
    var buiBan = new Line(builderPt, bankerPt);
    var banInn = new Line(bankerPt, innovatorPt);
    var innMer = new Line(innovatorPt, merchantPt);
    
    merBui.dump();
    buiBan.dump();
    banInn.dump();
    innMer.dump();
    
    merchantPt.setOrigin(origin);
    innovatorPt.setOrigin(origin);
    innMer.update();
    innMer.dump();
    
    console.log("merchant: [%s,%s]", merchantPt.x(), merchantPt.y());
    merchantPt.setScale(5);
    console.log("merchant: [%s,%s]", merchantPt.x(), merchantPt.y());
    merchantPt.setOrigin(origin);
    console.log("merchant: [%s,%s]", merchantPt.x(), merchantPt.y());
    
    var s = "[{0},{1}]".format(merchantPt.x(), merchantPt.y());
    console.log(s);
}


function cvi() {
    "use strict";
    var c = document.getElementById("cviCanvas");
    var ctx = c.getContext("2d");
    
    /* have everyone understand the same size */
    ctx.width = c.width;
    ctx.height = c.height;
    
    /* set the general params */
    var scale = c.width / 2 / 30;
    var origin = new Point(c.width / 2, c.height / 2);
    
    /* this data will be pulled from somewhere */
    var cviProfile = new CVIProfile('Mark Nicholson', 21, 29, 8, 14);
    
    /* create the hard points */
    var merchantPt = cviProfile.getMerchantPoint();
    var innovatorPt = cviProfile.getInnovatorPoint();
    var builderPt = cviProfile.getBuilderPoint();
    var bankerPt = cviProfile.getBankerPoint();
    
    /* setup the lines in between */
    var merBui = new Line(merchantPt, builderPt);
    var buiBan = new Line(builderPt, bankerPt);
    var banInn = new Line(bankerPt, innovatorPt);
    var innMer = new Line(innovatorPt, merchantPt);

    var quads = [
        {
            'quadrant': [ 1, -1 ],
            'points': [ merBui.yIntercept(), cviProfile.getMerchantPoint(),  innMer.xIntercept() ],
            'title': "Merchant "+ cviProfile.merchant,
            'core-value': "[Love]",
            'fill-colour': [ '#345AA3', '#D5DDEC' ], // gradient from: #D5DDEC -> #345AA3
            'title-location': [ 0.9, 0.1 ]
        },
        {
            'quadrant': [ 1, 1 ],
            'points': [ innMer.xIntercept(), cviProfile.getInnovatorPoint(), banInn.yIntercept() ],
            'title': "Innovator " + cviProfile.innovator,
            'core-value': "[Wisdom]",
            'fill-colour': [ '#D55EEA', '#F6DCFB' ], // gradient from: #F6DCFB -> #D55EEA
            'title-location': [ 0.9, 0.9 ]
        },
        {
            'quadrant': [ -1, 1 ],
            'points': [ banInn.yIntercept(), cviProfile.getBankerPoint(),    buiBan.xIntercept() ],
            'title': "Banker " + cviProfile.banker,
            'core-value': "[Knowledge]",
            'fill-colour': [ '#32842D', '#C1DCBF' ], // gradient from: #C1DCBF -> #32842D
            'title-location': [ 0.1, 0.9 ]
        },
        {
            'quadrant': [ -1, -1 ],
            'points': [ buiBan.xIntercept(), cviProfile.getBuilderPoint(),   merBui.yIntercept() ],
            'title': "Builder " + cviProfile.builder,
            'core-value': "[Power]",
            'fill-colour': [ '#F03230', '#FBC9C8' ], // gradient from: #FBC9C8 -> #F03230
            'title-location': [ 0.1, 0.1 ]
        }
    ];
    
    var qi, pi, pts, pt, qInfo;
    
    /* translate the points */
    for (qi in quads) {
        pts = quads[qi]['points'];
        for (pi in pts) {
            pts[pi].setOrigin(origin.x(), origin.y());
            pts[pi].setScale(scale);
        }
    }

    var addRect = true;
    
    /* draw quadrants */
    for (qi in quads) {
        qInfo = quads[qi];
        
        /* draw shaded rectangle */
        ctx.beginPath();
        ctx.rect(c.width/2 + 3*qInfo['quadrant'][0],
                 c.height/2 + 3*qInfo['quadrant'][1],
                 c.width/2 * qInfo['quadrant'][0],
                 c.height/2 * qInfo['quadrant'][1]);
        ctx.fillStyle = '#E6E6E6';
        ctx.closePath();
        ctx.fill();
        
        /* draw polygon */
        var grd = ctx.createLinearGradient(origin.x(),
                                           origin.y(), 
                                           qInfo['points'][1].x(),
                                           qInfo['points'][1].y());
        grd.addColorStop(0, qInfo['fill-colour'][1]);
        grd.addColorStop(1, qInfo['fill-colour'][0]);
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.moveTo(origin.x(), origin.y());
        for (pi in qInfo['points']) {
            pt = qInfo['points'][pi];
            ctx.lineTo(pt.x(), pt.y());
        }
        ctx.closePath();
        ctx.fill();
        
        /* add text */
        ctx.font = "20px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(qInfo['title'], 
                     c.width * qInfo['title-location'][0], 
                     c.height * qInfo['title-location'][1]); 
        ctx.font = "16px Arial";
        ctx.fillText(qInfo['core-value'], 
                     c.width * qInfo['title-location'][0], 
                     c.height * qInfo['title-location'][1] + 20);
        
        /* draw points */
        for (pi in qInfo['points']) {
            pt = qInfo['points'][pi];
            ctx.beginPath();
            ctx.arc(pt.x(), pt.y(), 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'black';
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /* draw coordinate lines */
    ctx.beginPath()
    ctx.moveTo(c.width / 2, 0);
    ctx.lineTo(c.width / 2, c.height);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'white';

    ctx.stroke();

    ctx.moveTo(0, c.height / 2);
    ctx.lineTo(c.width, c.height / 2);
    ctx.stroke();

}

/*}()
);*/
