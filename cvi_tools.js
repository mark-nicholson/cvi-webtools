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
        
        /* meta values */
        this.intuitiveType = this.builder + this.merchant;
        this.independentType = this.builder + this.innovator;
        this.practicalType = this.builder + this.banker;
        this.creativeType = this.merchant + this.innovator;
        this.communityType = this.merchant + this.banker;
        this.cognitiveType = this.innovator + this.banker;
    }
    
    /*
     * Provide a Point instanrce for each attribute
     */
    merchantPoint() {
        return new Point(this.merchant, -this.merchant);
    }

    innovatorPoint() {
        return new Point(this.innovator, this.innovator);
    }

    builderPoint() {
        return new Point(-this.builder, -this.builder);
    }

    bankerPoint() {
        return new Point(-this.banker, this.banker);
    }
    
    /*
     * Provide a Line instance for the relevant relations
     */
    merchantBuilderLine() {
        return new Line(this.merchantPoint(), this.builderPoint());
    }
    
    builderBankerLine() {
        return new Line(this.builderPoint(), this.bankerPoint());
    }

    bankerInnovatorLine() {
        return new Line(this.bankerPoint(), this.innovatorPoint());
    }
    
    innovatorMerchantLine() {
        return new Line(this.innovatorPoint(), this.merchantPoint());
    }
    
    /*
     * Sets of points which describe each quadrant
     */
    merchantPoints() {
        return [
            this.merchantBuilderLine().yIntercept(),
            this.merchantPoint(),
            this.innovatorMerchantLine().xIntercept()
        ];
    }
    
    innovatorPoints() {
        return [
            this.innovatorMerchantLine().xIntercept(),
            this.innovatorPoint(),
            this.bankerInnovatorLine().yIntercept()
        ];
    }

    builderPoints() {
        return [
            this.merchantBuilderLine().yIntercept(),
            this.builderPoint(),
            this.builderBankerLine().xIntercept()
        ];
    }

    bankerPoints() {
        return [
            this.bankerInnovatorLine().yIntercept(),
            this.bankerPoint(),
            this.builderBankerLine().xIntercept()
        ];
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
    var cviMark = new CVIProfile('Mark Nicholson', 21, 29, 8, 14);
    var cviKaren = new CVIProfile('Karen Nicholson', 29, 14, 13, 16);
    var cviProfile = cviKaren; //[ cviKaren, cviMark ];
    
    /* data to render the image */
    var quads = [
        {
            'quadrant': [ 1, -1 ],
            'points': cviProfile.merchantPoints(),
            'title': "Merchant "+ cviProfile.merchant,
            'core-value': "[Love]",
            'fill-colour': [ '#345AA3', '#D5DDEC' ],
            'title-location': [ 0.9, 0.05 ]
        },
        {
            'quadrant': [ 1, 1 ],
            'points': cviProfile.innovatorPoints(),
            'title': "Innovator " + cviProfile.innovator,
            'core-value': "[Wisdom]",
            'fill-colour': [ '#D55EEA', '#F6DCFB' ],
            'title-location': [ 0.9, 0.95 ]
        },
        {
            'quadrant': [ -1, 1 ],
            'points': cviProfile.bankerPoints(),
            'title': "Banker " + cviProfile.banker,
            'core-value': "[Knowledge]",
            'fill-colour': [ '#32842D', '#C1DCBF' ],
            'title-location': [ 0.1, 0.95 ]
        },
        {
            'quadrant': [ -1, -1 ],
            'points': cviProfile.builderPoints(),
            'title': "Builder " + cviProfile.builder,
            'core-value': "[Power]",
            'fill-colour': [ '#F03230', '#FBC9C8' ],
            'title-location': [ 0.1, 0.05 ]
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
        
        /*
         * draw polygon
         */
        
        /* configure gradient */
        var grd = ctx.createLinearGradient(origin.x(),
                                           origin.y(), 
                                           qInfo['points'][1].x(),
                                           qInfo['points'][1].y());
        grd.addColorStop(0, qInfo['fill-colour'][1]);
        grd.addColorStop(1, qInfo['fill-colour'][0]);
        
        /* add lines to form the polygon for each profile */
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.moveTo(origin.x(), origin.y());
        for (pi in qInfo['points']) {
            pt = qInfo['points'][pi];
            ctx.lineTo(pt.x(), pt.y());
        }
        ctx.closePath();
        ctx.fill();
        
        /*
         * add text
         */
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
        
        /*
         * draw points
         */
        for (pi in qInfo['points']) {
            pt = qInfo['points'][pi];
            ctx.beginPath();
            ctx.arc(pt.x(), pt.y(), 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'black';
            ctx.closePath();
            ctx.fill();
        }
    }
    
    /*
     * draw coordinate lines
     */
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
