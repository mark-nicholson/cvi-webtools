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
    
    /*getOrigin() {
        return [this.ox, this.oy];
    }

    setOrigin(x,y) {
        this.ox = x;
        this.oy = y;
    }
    
    setScale(s) {
        this.scale = s;
    }*/
    
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
        
        /* catch infinite slope! */
        if ((this.p2.x() - this.p1.x()) == 0) {
            this.x_intercept = new Point(this.p1.x(), 0);
            this.y_intercept = new Point(0, NaN);
        }
        else {
            this.m = (this.p2.y() - this.p1.y()) / (this.p2.x() - this.p1.x());
            this.b = this.p2.y() - this.m * this.p2.x();

            this.x_intercept = new Point(-this.b / this.m, 0);
            this.y_intercept = new Point(0, this.m * 0 + this.b);
        }
        
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
    constructor(name, builder, merchant, innovator, banker) {
        this.name = name;
        this.builder = builder;
        this.merchant = merchant;
        this.innovator = innovator;
        this.banker = banker;
    }
    
    /* meta values */
    intuitiveType() {
        return this.builder + this.merchant;
    }
    independentType(){
        return this.builder + this.innovator;
    }
    practicalType() {
        return this.builder + this.banker;
    }
    creativeType() {
        return this.merchant + this.innovator;
    }
    communityType() {
        return this.merchant + this.banker;
    }
    cognitiveType() {
        return this.innovator + this.banker;
    }
    
    toString() {
        return "CVI[{0}: {1}, {2}, {3}, {4} ]".format(
            this.name, this.builder, this.merchant, this.innovator, this.banker)
    }
    
    /*
     * Provide a Point instanrce for each attribute
     */
    builderPoint() {
        return new Point(-this.builder, -this.builder);
    }

    merchantPoint() {
        return new Point(this.merchant, -this.merchant);
    }

    innovatorPoint() {
        return new Point(this.innovator, this.innovator);
    }

    bankerPoint() {
        return new Point(-this.banker, this.banker);
    }
    
    /*
     * Provide a Line instance for the relevant relations
     */
    builderBankerLine() {
        return new Line(this.builderPoint(), this.bankerPoint());
    }

    merchantBuilderLine() {
        return new Line(this.merchantPoint(), this.builderPoint());
    }
    
    innovatorMerchantLine() {
        return new Line(this.innovatorPoint(), this.merchantPoint());
    }
    
    bankerInnovatorLine() {
        return new Line(this.bankerPoint(), this.innovatorPoint());
    }
    
    /*
     * Sets of points which describe each quadrant
     */
    builderPoints() {
        return [
            this.merchantBuilderLine().yIntercept(),
            this.builderPoint(),
            this.builderBankerLine().xIntercept()
        ];
    }

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
    constructor(name, profiles) {        
        /* go through the motions... */
        super(name, 0, 0, 0, 0);
        
        /* remember the individual profiles */
        this.profiles = profiles;
        this._update();
    }
    
    /* recalculate the group profile parameters */
    _update() {
        var i, pr, inn=0, mer=0, ban=0, bui=0;

        for (i in this.profiles) {
            pr = this.profiles[i];
            bui += pr.builder;
            mer += pr.merchant;
            inn += pr.innovator;
            ban += pr.banker;
        }
        
        /* update the average */
        if (this.profiles.length > 0) {
            this.builder = bui / this.profiles.length;
            this.merchant = mer / this.profiles.length;
            this.innovator = inn / this.profiles.length;
            this.banker = ban / this.profiles.length;
        }
        else {
            this.builder = 0;
            this.merchant = 0
            this.innovator = 0;
            this.banker = 0;
        }
    }
    
    addProfile(p) {
        var i;
        
        /* dupe check */
        for (i in this.profiles) {
            if (p.name == this.profiles[i].name) {
                console.log("addProfile(): found duplicate of '" + p.name + "'.");
                return false;
            }
        }
        
        /* incorporate it */
        this.profiles.push(p);

        /* aggregate the values */
        this._update();
        
        return true;
    }
    
    removeProfile(p) {
        var i;
        
        /* find it... */
        for (i in this.profiles) {
            if (p.name == this.profiles[i].name) {
                console.log("removeProfile(): found '" + p.name + "'. Removing it.");
                this.profiles.splice(i, 1);
                break;
            }
        }

        /* aggregate the values */
        this._update();        
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
        this.erase();
        
        /* create a new playground */
        this.svg = SVG(svgDivID).size(700, 700);
        
        /* set the general params */
        this.scale = this.svg.width() / 2 / CVIProfile.maxScore;
        this.origin = new Point(
            this.svg.width() / 2, this.svg.height() / 2);
    }
    
    /* scrub the SVG area clean */
    erase() {
        console.log("erase()");
        var svgDiv = document.getElementById(this.svgDivID);
        while (svgDiv.childElementCount > 0)
            svgDiv.removeChild(svgDiv.firstChild);        
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
            'title-location': [ 0.8, 0.3 ]
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
            'title-location': [ 0.8, 1.1 ]
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
            'title-location': [ 0.2, 1.1 ]
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
            'title-location': [ 0.2, 0.3 ]
        }

    }

    /*
     * setup the quadrants structure
     */
    _get_quadrants(cviProfile) {
        var qi, pi, pts;
        var quads = [
            this.builderQuadrantInfo(),
            this.merchantQuadrantInfo(),
            this.innovatorQuadrantInfo(),
            this.bankerQuadrantInfo()
        ];

        /* add the reference points */
        if (cviProfile) {
            quads[0].points = cviProfile.builderPoints();
            quads[1].points = cviProfile.merchantPoints();
            quads[2].points = cviProfile.innovatorPoints();
            quads[3].points = cviProfile.bankerPoints();
        }

        /* done */
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

            w = CVIProfile.maxScore;
            h = CVIProfile.maxScore;
            x = 0;
            if (qInfo[0] < 0)
                x -= w;
            y = 0;
            if (qInfo[1] < 0)
                y -= h;

            this.bgGroup.rect(w, h).move(x,y).fill(cssColour);
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
        var f1Size = 2;
        var f2Size = 1.5;
        
        for (qi in quads) {
            qInfo = quads[qi];
            
            /* figure out the parameters */
            att = qInfo['title'].toLowerCase();
            title = qInfo['title'] + " ";
            if (Number.isInteger(cviProfile[att]))
                title += cviProfile[att];
            else
                title += cviProfile[att].toFixed(2);
        
            xLoc = CVIProfile.maxScore * qInfo['title-location'][0];
            yLoc = CVIProfile.maxScore * qInfo['title-location'][1];

            if (qInfo['quadrant'][0] < 0)
                xLoc -= CVIProfile.maxScore;
            if (qInfo['quadrant'][1] < 0)
                yLoc -= CVIProfile.maxScore;

            /* configure the action */
            this.textGroup.text(title)
                .move(xLoc, yLoc-f1Size/1.5)
                .fill('black')
                .font( {
                    family: 'Arial',
                    size: f1Size,
                    anchor: 'middle'
                });

            this.textGroup.text("[" + qInfo['core-value'] + "]")
                .move(xLoc, yLoc+f1Size/1.5)
                .fill('black')
                .font( {
                    family: 'Arial',
                    size: f2Size,
                    anchor: 'middle'
                });
        }
    }

    /* reduce the true point size by the likely scaling to maintain perspective */
    renderReferencePoints(pList) {
        var pi, pt;
        for (pi in pList) {
            pt = pList[pi];
            this.polyGroup
                .circle(4/this.scale)
                .move(pt.x()-2/this.scale, pt.y()-2/this.scale)
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
        
        var pgPts = [ [0, 0] ];
        for (pi in qInfo['points']) {
            pt = qInfo['points'][pi];
            pgPts.push( [pt.x(), pt.y()] );
        }
        this.polyGroup.polygon(pgPts)
            .fill(gradient);
        
        if (drawBorder) {
            this.polyGroup.line(
                qInfo['points'][0].x(), qInfo['points'][0].y(),
                qInfo['points'][1].x(), qInfo['points'][1].y()
            ).stroke({ width: 3/this.scale, color: CVIRender.borderColour });

            this.polyGroup.line(
                qInfo['points'][1].x(), qInfo['points'][1].y(),
                qInfo['points'][2].x(), qInfo['points'][2].y()
            ).stroke({ width: 3/this.scale, color: CVIRender.borderColour });

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

        /* setup an SVG group for each construct. 
         *  Note: declaration order is critical! The order they are 
         *  declared is the LAYER they are rendered. */
        
        /* group for entire image */
        this.allGroup = this.svg.group();
        
        /* subgroups for testing and segregation */
        this.bgGroup = this.allGroup.group();
        this.polyGroup = this.allGroup.group();
        this.textGroup = this.allGroup.group();
        this.coordGroup = this.allGroup.group();
        
        /* identify the input */
        if (data instanceof CVIGroupProfile) {
            //console.log("Render(): Is a CVIGroupProfile");
            profiles = [];
            for (pi in data.profiles)
                profiles.push(data.profiles[pi]);
            profiles.push(data);            
            cviProfile = data;
        }
        else if (data instanceof CVIProfile) {
            //console.log("Render(): Is a CVIProfile");
            profiles = [ ];
            cviProfile = data;
        }
        else {
            /* should be a list */
            //console.log("Render(): received list")
            cviProfile = data.shift();
            profiles = data;
        }
        
        /* install the backgrounds for each quadrant */
        this.renderQuandrantBackgrounds();

        /* overlay the profiles */
        for (pi in profiles) {
            profile = profiles[pi];
            //console.log("Rendering: " + profile.name);
            
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

        /* do one big scaling of the whole image */
        this.allGroup
            .scale(this.scale)
            .translate(this.origin.x(), this.origin.y());
    }

    /*
    * draw coordinate lines
    */
    renderCoordinateLines() {
        this.coordGroup
            .line(0, -CVIProfile.maxScore,0, CVIProfile.maxScore)
            .stroke({ width: 6/this.scale, color: 'white' });

        this.coordGroup
            .line(CVIProfile.maxScore, 0, -CVIProfile.maxScore, 0)
            .stroke({ width: 6/this.scale, color: 'white' });
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
    var cviMark = new CVIProfile('Mark Nicholson', 14, 21, 29, 8);
    var cviKaren = new CVIProfile('Karen Nicholson', 16, 29, 14, 13);
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
    }
    
    /* render the single one */
    if (profiles.length == 1) {
        cviRender.render( profiles[0] );
        return;
    }
    
    /* render the group */
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
