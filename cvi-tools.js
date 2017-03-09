/*
 * CVI Tools
 *   Classes to render Core-Values-Index profiles in HTML5
 */

/* be formal about it */
"use strict";

/* extend the string so it can do an sprintf type conversion */
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
/* Static Class data */
CVIProfile.maxScore = 30;

class CVIGroupProfile extends CVIProfile {
    constructor(name, profileList) {
        var i, inn=0, mer=0, ban=0, bui=0;

        /* aggregate the values */
        for (i in profileList) {
            var p = profileList[i];
            mer += p.merchant;
            inn += p.innovator;
            ban += p.banker;
            bui += p.builder;
        }
        
        /* average them out */
        super(name,
              mer / profileList.length,
              inn / profileList.length,
              ban / profileList.length,
              bui / profileList.length);
        
        /* remember the individual profiles */
        this.profiles = profileList;        
    }
}


/*
 * CVIRender - Class to support the creation of a canvas drawing
 *             of the CVI profiles provided.
 */
class CVIRender {

    constructor(svgDivID) {
        this.svgDivID = svgDivID;

        /* clear out any previous renders */
        var svgDiv = document.getElementById(svgDivID);
        while (svgDiv.childElementCount > 0)
            svgDiv.removeChild(svgDiv.firstChild);
        
        /* create a new playground */
        this.svg = SVG(svgDivID).size(700, 700);

        /* set the general params */
        this.scale = this.svg.width() / 2 / CVIProfile.maxScore;
        this.origin = new Point(
            this.svg.width() / 2, this.svg.height() / 2);
    }

    merchantQuadrantInfo() {
        return {
            'quadrant': [ 1, -1 ],
            'points': [],
            'title': "Merchant",
            'core-value': "Love",
            'fill-colour': [
                CVIRender.merchantLightColour,
                CVIRender.merchantDarkColour
            ],
            'title-location': [ 0.9, 0.05 ]
        }
    }
    
    innovatorQuadrantInfo() {
        return {
            'quadrant': [ 1, 1 ],
            'points': [],
            'title': "Innovator",
            'core-value': "Wisdom",
            'fill-colour': [
                CVIRender.innovatorLightColour,
                CVIRender.innovatorDarkColour                
            ],
            'title-location': [ 0.9, 0.95 ]
        }
    }
    
    bankerQuadrantInfo() {
        return {
            'quadrant': [ -1, 1 ],
            'points': [],
            'title': "Banker",
            'core-value': "Knowledge",
            'fill-colour': [
                CVIRender.bankerLightColour,
                CVIRender.bankerDarkColour
            ],
            'title-location': [ 0.1, 0.95 ]
        }
    }
    
    builderQuadrantInfo() {
        return {
            'quadrant': [ -1, -1 ],
            'points': [],
            'title': "Builder",
            'core-value': "Power",
            'fill-colour': [
                CVIRender.builderLightColour,
                CVIRender.builderDarkColour
            ],
            'title-location': [ 0.1, 0.05 ]
        }

    }

    /*
     * setup the quadrants structure
     */
    _get_quadrants(cviProfile) {
        var qi, pi, pts;
        var quads = [
            this.merchantQuadrantInfo(),
            this.innovatorQuadrantInfo(),
            this.bankerQuadrantInfo(),
            this.builderQuadrantInfo()
        ];

        /* add the reference points */
        if (!cviProfile)
            return quads;
        
        quads[0].points = cviProfile.merchantPoints();
        quads[1].points = cviProfile.innovatorPoints();
        quads[2].points = cviProfile.bankerPoints();
        quads[3].points = cviProfile.builderPoints();

        /* translate the points */
        for (qi in quads) {
            pts = quads[qi].points;
            for (pi in pts) {
                pts[pi].setOrigin(this.origin.x(), this.origin.y());
                pts[pi].setScale(this.scale);
            }
        }
        
        return quads;
    }
    
    /*
     * Create the background squares for each quadrant.
     */
    renderQuandrantBackgrounds() {
        var qi, qInfo, x, y, w, h;
        var cssColour = CVIRender.quadrantBackgroundColour;
        var quads = this._get_quadrants(null);
        
        for (qi in quads) {
            qInfo = quads[qi].quadrant;
            
            w = this.svg.width()/2;
            h = this.svg.height()/2;
            x = 0;
            if (qInfo[0] > 0)
                x = w;
            y = 0
            if (qInfo[1] > 0)
                y = h;

            this.svg.rect(w, h).move(x,y).fill(cssColour);
        }
    }
    
    /*
     * Create the background squares for each quadrant.
     */
    renderTextLayer(cviProfile) {
        var qi, qInfo;
        var cssColour = '.cviCanvas.quadrant-background-colour';
        var quads = this._get_quadrants(null);
        var xLoc, yLoc, title, att;
        
        for (qi in quads) {
            qInfo = quads[qi];
            
            /* figure out the parameters */
            att = qInfo['title'].toLowerCase();
            title = qInfo['title'] + " ";
            if (Number.isInteger(cviProfile[att]))
                title += cviProfile[att];
            else
                title += cviProfile[att].toFixed(2);
            xLoc = this.svg.width() * qInfo['title-location'][0];
            yLoc = this.svg.height() * qInfo['title-location'][1];
            
            /* configure the action */
            this.svg.text(title)
                .move(xLoc, yLoc-10)
                .fill('black')
                .font( {
                    family: 'Arial',
                    size: '20px',
                    anchor: 'middle'
                });

            this.svg.text("[" + qInfo['core-value'] + "]")
                .move(xLoc, yLoc+10)
                .fill('black')
                .font( {
                    family: 'Arial',
                    size: '16px',
                    anchor: 'middle'
                });
        }
    }
    
    renderReferencePoints(pList) {
        var pi, pt;
        for (pi in pList) {
            pt = pList[pi];
            this.svg.circle(4)
                .move(pt.x()-2, pt.y()-2)
                .fill('black');
        }
    }
    
    /*
     * draw polygon
     */
    renderPolygon(qInfo, drawBorder) {
        var gradient, pi, pt;
        
        /* cook up the gradient */
        gradient = this.svg.gradient('linear', function(stop) {
            stop.at(0, qInfo['fill-colour'][0])
            stop.at(1, qInfo['fill-colour'][1])
        });
        
        /* set the gradient direction based on the quadrant */
        if (qInfo['quadrant'][0] > 0 && qInfo['quadrant'][1] > 0)
            gradient.from(0,0).to(1,1);
        else if (qInfo['quadrant'][0] > 0 && qInfo['quadrant'][1] < 0)
            gradient.from(0,1).to(1,0);
        else if (qInfo['quadrant'][0] < 0 && qInfo['quadrant'][1] > 0)
            gradient.from(1,0).to(0,1);
        else  //(qInfo['quadrant'][0] < 0 && qInfo['quadrant'][1] < 0)
            gradient.from(1,1).to(0,0);
        
        var pgPts = [ [this.svg.width()/2, this.svg.height()/2] ];
        for (pi in qInfo['points']) {
            pt = qInfo['points'][pi];
            pgPts.push( [pt.x(), pt.y()] );
        }
        this.svg.polygon(pgPts).fill(gradient);
        
        if (drawBorder) {
            this.svg.line(
                qInfo['points'][0].x(), qInfo['points'][0].y(),
                qInfo['points'][1].x(), qInfo['points'][1].y()
            ).stroke({ width: 3, color: CVIRender.borderColour });

            this.svg.line(
                qInfo['points'][1].x(), qInfo['points'][1].y(),
                qInfo['points'][2].x(), qInfo['points'][2].y()
            ).stroke({ width: 3, color: CVIRender.borderColour });

        }
    }

    /*
     * render()
     *  Draw out the image.
     *    Input can be a cviProfile, cviGroupProfile or List of cviProfiles.
     */
    render(data) {
        var pi, qi, quads, qInfo;
        var profile, profiles;
        var cviProfile;
        
        /* identify the input */
        if (data instanceof CVIGroupProfile) {
            console.log("Is a CVIGroupProfile");
            profiles = [];
            for (pi in data.profiles)
                profiles.push(data.profiles[pi]);
            profiles.push(data);            
            cviProfile = data;
        }
        else if (data instanceof CVIProfile) {
            console.log("Is a CVIProfile");
            profiles = [ ];
            cviProfile = data;
        }
        else {
            /* should be a list */
            cviProfile = data.shift();
            profiles = data;
        }
        
        /* install the backgrounds for each quadrant */
        this.renderQuandrantBackgrounds();
        
        for (pi in profiles) {
            profile = profiles[pi];
            console.log("Rendering: " + profile.name);
            
            quads = this._get_quadrants(profile);

            /* draw quadrants */
            for (qi in quads) {
                qInfo = quads[qi];
                this.renderPolygon(qInfo, false);
                this.renderReferencePoints(qInfo['points']);
            }
        }
        
        /*
         * add in the top frame
         */
        var drawBorder = (profiles.length != 0);
        quads = this._get_quadrants(cviProfile);
        for (qi in quads) {
            qInfo = quads[qi];
            this.renderPolygon(qInfo, drawBorder);
            this.renderReferencePoints(qInfo['points']);
        }
        

        /* overlay the headings */
        this.renderTextLayer(cviProfile);
        
        /* draw the white coordinate lines */
        this.renderCoordinateLines();
    }

    /*
    * draw coordinate lines
    */
    renderCoordinateLines() {
        this.svg.line(
            this.svg.width()/2, 0,
            this.svg.width()/2, this.svg.height()
        ).stroke({ width: 6, color: 'white' });

        this.svg.line(
            0, this.svg.height()/2,
            this.svg.width(), this.svg.height()/2
        ).stroke({ width: 6, color: 'white' });
    }
}
/* statics */
CVIRender.quadrantBackgroundColour = '#E6E6E6';
CVIRender.merchantLightColour = '#D5DDEC';
CVIRender.merchantDarkColour = '#345AA3';
CVIRender.innovatorLightColour = '#F6DCFB';
CVIRender.innovatorDarkColour = '#D55EEA';
CVIRender.bankerLightColour = '#C1DCBF';
CVIRender.bankerDarkColour = '#32842D';
CVIRender.builderLightColour = '#FBC9C8';
CVIRender.builderDarkColour = '#F03230';
CVIRender.borderColour = '#afafaf';

/*
 * Entry point for html to call
 */
function cvi(name) {
    
    /* this data will be pulled from somewhere */
    var cviMark = new CVIProfile('Mark Nicholson', 21, 29, 8, 14);
    var cviKaren = new CVIProfile('Karen Nicholson', 29, 14, 13, 16);
    var cviGroup = new CVIGroupProfile('Nicholsons',
                                       [cviMark, cviKaren]);
    var cviProfile;
    if (name == 'karen')
        cviProfile = cviKaren;
    else if (name == 'mark')
        cviProfile = cviMark;
    else
        cviProfile = cviGroup;
    
    /* setup the renderer */
    var cviRender = new CVIRender("cviCanvas");

    /* do it */
    cviRender.render( cviProfile );
    return;
}

/* global instance of renderer */
var cviRender = null;

function cviTool(name, folks) {
    if (!folks || folks.length == 0)
        return;

    /* setup the renderer */
    cviRender = new CVIRender("svgDivID");

    /* create the profiles */
    var profiles = [];
    for (var f in folks) {
        console.log(folks[f]);
        var p = new CVIProfile(folks[f][0],
                               folks[f][1],
                               folks[f][2],
                               folks[f][3],
                               folks[f][4]);
        profiles.push(p);
        console.log("Profile: %s", p.toString());
    }
    
    /* render the single one */
    if (profiles.length == 1) {
        cviRender.render( profiles[0] );
        return;
    }
    
    console.log("%s: %s", name, profiles);
    var group = new CVIGroupProfile(name, profiles);
    cviRender.render( group );
}

/******************************************************************************
 *
 *                      Test tools
 *
 *****************************************************************************/


class Tester {
    //var class_var_def = 3;
    //global_instance_var = 4;
    constructor() {
        this.cons_var = 2;
    }
}
Tester.myStaticProperty = "yes";

function cvi_test() {
 
    var s = "15";
    var p;
    
    var t = new Tester();
    //console.log("class_var_def: " + t.class_var_def);
    //console.log("global_instance_var: " + t.global_instance_var);
    console.log("con_var: " + t.cons_var);
    console.log("staticProp: " + Tester.myStaticProperty);
}
