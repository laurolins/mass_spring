// mass-spring system for the 1-skeleton of
// equal sized edges

//------------------------------------------------------------------------------
// Util
//------------------------------------------------------------------------------

function alignRight(st, n) {
    if (st.length < n) {
        return Array(n - st.length).join(" ") + st;
    }
    else {
        return st;
    }
}

function alignLeft(st, n) {
    if (st.length < n) {
        return st + Array(n - st.length).join(" ");
    }
    else {
        return st;
    }
}

//------------------------------------------------------------------------------
// Vector
//------------------------------------------------------------------------------

function Vector(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
}

Vector.prototype.get = function(i) {
    if (i == 0)
        return this.x;
    else if (i==1)
        return this.y;
    else if (i==2)
        return this.z;
    else
        return 1.0;
}

Vector.prototype.clone = function() {
    return new Vector(this.x, this.y, this.z);
}

Vector.prototype.rotate = function(angle_deg, index) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    // debugger;

    var theta     = angle_deg * Math.PI / 180.0;
    var cos_theta = Math.cos(theta);
    var sin_theta = Math.sin(theta);

    if (index == 0) {
        this.y = y * cos_theta + z * sin_theta;
        this.z = z * cos_theta - y * sin_theta;
    }
    else if (index == 1) {
        this.x = x * cos_theta + z * sin_theta;
        this.z = z * cos_theta - x * sin_theta;
    }
    else if (index == 2) {
        this.x = x * cos_theta + y * sin_theta;
        this.y = y * cos_theta - x * sin_theta;
    }
}

Vector.prototype.sub = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
}

Vector.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
}

Vector.prototype.cross = function(other) {
    var u = this;
    var v = other;

    var xx =   u.y * v.z - u.z * v.y;
    var yy = - u.x * v.z + u.z * v.x;
    var zz =   u.x * v.y - u.y * v.x;

    this.x = xx;
    this.y = yy;
    this.z = zz;

    return this;
}


Vector.prototype.length = function() {
    var v = this;
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

Vector.prototype.scale = function(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
}

Vector.prototype.normalize = function() {
    this.scale(1.0/this.length());
    return this;
}

Vector.prototype.print = function() {
    var k = 12;
    var row = [];
    row.push(alignRight(Number(this.x).toFixed(4), k));
    row.push(alignRight(Number(this.y).toFixed(4), k));
    row.push(alignRight(Number(this.z).toFixed(4), k));
    console.log(row.join(""));
    return this;
}


//------------------------------------------------------------------------------
// Mat
//------------------------------------------------------------------------------

function Matrix() {
    // row based
    this.entries = [ 1.0, 0.0, 0.0, 0.0,
                     0.0, 0.1, 0.0, 0.0,
                     0.0, 0.0, 1.0, 0.0,
                     0.0, 0.0, 0.0, 1.0 ];
}

Matrix.prototype.clone = function() {
    // row based
    var clone_matrix = new Matrix();
    clone_matrix.entries = this.entries.slice(0);
    return clone_matrix;
}

Matrix.prototype.get = function(i, j) {
    return this.entries[i * 4 + j];
}

Matrix.prototype.transform = function(vec) {
    var entries = [];
    for (var i=0;i<4;i++)  {
        var mij = 0.0;
        for (var k=0;k<4;k++) {
            mij += this.get(i,k) * vec.get(k);
        }
        entries.push(mij);
    }

    // debugger;

    return new Vector(entries[0]/entries[3], 
                      entries[1]/entries[3], 
                      entries[2]/entries[3]);
}

Matrix.prototype.perspective = function(n, f, l, r, b, t) {
    // row based
    this.entries = [
        2*n/(r-l) ,           0 ,    (r+l)/(r-l) ,              0 ,
                0 ,   2*n/(t-b) ,    (t+b)/(t-b) ,              0 ,
                0 ,           0 ,   -(f+n)/(f-n) ,   -2*f*n/(f-n) ,
                0 ,           0 ,             -1 ,              0
    ];
    return this;
}

Matrix.prototype.viewport = function(w,h) {
    // row based
    this.entries = [
            w/2.0 ,           0 ,           0 ,              w/2.0   ,
                0 ,       h/2.0 ,           0 ,              h/2.0   ,
                0 ,           0 ,     1.0/2.0 ,              1.0/2.0 ,
                0 ,           0 ,           0,               1.0
    ];
    return this;
}

Matrix.prototype.lookAt = function(eye, target, up) {

    var zaxis = eye.clone().sub(target).normalize();    // The "forward" vector.
    var xaxis = up.clone().cross(zaxis).normalize();    // The "right" vector.
    var yaxis = zaxis.clone().cross(xaxis);             // The "up" vector.

    console.log("xaxis = (" + xaxis.x + ", " + xaxis.y + ", " + xaxis.z + ")");
    console.log("yaxis = (" + yaxis.x + ", " + yaxis.y + ", " + yaxis.z + ")");
    console.log("zaxis = (" + zaxis.x + ", " + zaxis.y + ", " + zaxis.z + ")");


    // Create a 4x4 orientation matrix from the right, up, and forward vectors
    // This is transposed which is equivalent to performing an inverse
    // if the matrix is orthonormalized (in this case, it is).
    this.entries = [
       xaxis.x, xaxis.y, xaxis.z, 0,
       yaxis.x, yaxis.y, yaxis.z, 0,
       zaxis.x, zaxis.y, zaxis.z, 0,
             0,       0,       0, 1
    ];

    // Create a 4x4 translation matrix.
    // The eye position is negated which is equivalent
    // to the inverse of the translation matrix.
    // T(v)^-1 == T(-v)
    var T = new Matrix();
    T.entries = [
           1,      0,     0,    -eye.x,
           0,      1,     0,    -eye.y,
           0,      0,     1,    -eye.z,
           0,      0,     0,         1
    ];

    this.mul(T);
 
    // Combine the orientation and translation to compute
    // the final view matrix
    return this;
}

Matrix.prototype.mul = function(other) {
    var new_entries = []
    for (var i=0;i<4;i++)  {
        for (var j=0;j<4;j++) {
            var mij = 0.0;
            for (var k=0;k<4;k++) {
                mij += this.get(i,k) * other.get(k,j);
            }
            new_entries.push(mij);
        }
    }
    this.entries = new_entries;
    return this;
}

Matrix.prototype.print = function() {
    var k = 12;
    for (var i=0;i<4;i++) {
        var row = [];
        for (var j=0;j<4;j++) {
            row.push(alignRight(Number(this.entries[4*i+j]).toFixed(4), k));
        }
        console.log(row.join(""));
    }
    return this;
}


//------------------------------------------------------------------------------
// Vertex
//------------------------------------------------------------------------------

function Vertex() {
    this.pos = new Vector(Math.random(), Math.random(),Math.random());
    this.edges = [];
    return this;
}

Vertex.prototype.addEdge = function(e) {
    this.edges.push(e);
}

//------------------------------------------------------------------------------
// Edge
//------------------------------------------------------------------------------

function Edge(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
    v1.addEdge(this);
    v2.addEdge(this);
    return this;
}

Edge.prototype.opposite = function(v) {
    if (v == this.v1) {
	return this.v2;
    }
    else if (v == this.v2) {
	return this.v1
    }
    else return null;
}

Edge.prototype.length = function() {
    return this.v1.pos.clone().sub(this.v2.pos).length();
}


//------------------------------------------------------------------------------
// Model
//------------------------------------------------------------------------------

function Model() {

    this.view_parameters = {

        target:      new Vector(0.5,0.5,0.5), // model-view params
        pitch:       0, // x-coordinate
        yaw:         0, // y-coordinate
        roll:        0, // z-coordinate

        side:        3, // projection params
        near:        90,
        mid:         100,
        far:         150,

        vp_width:  500, // viewport params
        vp_height: 500,
    };

    this.updateCamera();

    this.vertices = []
    this.edges    = []




    // cube
    // var spec = [ [0,1], [0,2], [0,4], [1,5], [1,3], 
    //     	 [2,3], [2,6], [3,7], [4,5], [4,6],
    //     	 [5,7], [6,7] ];
    //     for (var i=0;i<spec.length;i++) {
    //         var s = spec[i]
    //         this.edges.push(new Edge(V[s[0]], V[s[1]]));
    //     }


    // 14 hexagons 6 quads
    var num_vertices = 36;
    var spec  = [ [  0,  1,  7, 13, 12,  6 ],
                  [  1,  2,  8, 15, 14,  7 ],
                  [  2,  3,  9, 17, 16,  8 ],
                  [  3,  4, 10, 19, 18,  9 ],
                  [  4,  5, 11, 21, 20, 10 ],
                  [  5,  0,  6, 23, 22, 11 ],
                  [ 12, 13, 25, 31, 30, 24 ],
                  [ 14, 15, 26, 32, 31, 25 ],
                  [ 16, 17, 27, 33, 32, 26 ],
                  [ 18, 19, 28, 34, 33, 27 ],
                  [ 20, 21, 29, 35, 34, 28 ],
                  [ 22, 23, 24, 30, 35, 29 ],
                ];
    

    // 14 hexagons 6 quads
    var num_vertices = 16;
    var spec  = [ [  0,  1,  5,  4         ],
                  [  4,  5,  6,  7,  8,  9 ],
                  [ 10, 11, 12, 13, 14, 15 ],
                  [  8,  7, 11, 10         ],
                  [ 14, 13,  2,  3         ],
                  [  7,  6, 12, 11         ],
                  [  9,  8, 10, 15         ],
                  [  0,  1,  2,  3         ],
                  [  2,  3, 14, 13         ]
                ];

    // initialize a simple cube model
    for (var i=0;i<num_vertices;i++) {
	this.vertices.push(new Vertex());
    }

    var V = this.vertices; // reference

    for (var i=0;i<spec.length;i++) {
	var seq = spec[i];
        var n = seq.length;
        for (var j=1;j<n;j++) {
            this.edges.push(new Edge(V[seq[j-1]], V[seq[j]]));
        }
        if (n > 2) {
            this.edges.push(new Edge(V[seq[n-1]], V[seq[0]]));
        }
    }

    // create an svg
    var svg = d3.select("body")
        .append("svg")
        .attr("width","500px")
        .attr("height","500px")
        .style("background","black");
        
    //This is the accessor function we talked about above
    var lineFunction = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("linear");

    // create an svg line segment for each edge of the model
    for (var i=0;i<this.edges.length;i++) {
        var e  = this.edges[i];
        e.element = svg.append("path")
            .attr("d", lineFunction([
                this.transform_matrix.transform(e.v1.pos),
                this.transform_matrix.transform(e.v2.pos)]
            ))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("fill", "none");
    }


    var that = this;
    svg
        .on("click", function() {
            if (d3.event.shiftKey) {
                that.zoom(-1);
            }
            else {
                that.zoom(1);
            }
        })

    d3.select("body")
        .on("keydown",function() {
 // 37      37      37      37      37      Left arrow
 // 38      38      38      38      38      Up arrow
 // 39      39      39      39      39      Right arrow
 // 40      40      40      40      40      Down arrow
            debugger;
            if (d3.event.keyCode == 37) {
                that.yaw(-1);
            }
            else if (d3.event.keyCode == 39) {
                that.yaw(+1);
            }
            else if (d3.event.keyCode == 38) {
                that.roll(+1);
            }
            else if (d3.event.keyCode == 40) {
                that.roll(+1);
            }
        });

    var that = this;
    this.timer = $.timer(function() { 
        that.update();
    }, 10, true);

}

Model.prototype.updateCamera = function() {

    var p = this.view_parameters;

    // assuming target is defined
    var eye_minus_target = new Vector(0,0,p.mid);
    eye_minus_target.rotate(p.pitch,0);
    eye_minus_target.rotate(p.yaw,1);
    eye_minus_target.rotate(p.roll,2);

    var target = p.target;
    var eye    = target.clone().add(eye_minus_target);
    var up     = new Vector(0,1,0)
    up.rotate(p.pitch, 0);
    up.rotate(p.yaw,   1);
    up.rotate(p.roll,  2);

    console.log("eye")
    eye.print();
    console.log("target")
    target.print();
    console.log("up")
    up.print();

    this.world2camera_matrix = new Matrix();
    this.world2camera_matrix.lookAt(eye, target, up);

    // debugger;

    // projection
    this.projection_matrix = new Matrix();
    this.projection_matrix.perspective(  p.near, p.far, 
                                        -p.side, p.side, 
                                        -p.side, p.side );
    
    // viewport matrix
    this.viewport_matrix = new Matrix();
    this.viewport_matrix.viewport(p.vp_width, p.vp_height);

    // transform matrix
    this.transform_matrix = 
        this.viewport_matrix
        .clone()
        .mul(this.projection_matrix)
        .mul(this.world2camera_matrix);

    console.log("to_camera matrix")
    this.world2camera_matrix.print();
    console.log("projection matrix")
    this.projection_matrix.print();
    console.log("viewport_matrix")
    this.viewport_matrix.print();
    console.log("transform_matrix")
    this.transform_matrix.print();


    // debugger;

}

Model.prototype.zoom = function(argument) {
    if (argument < 0) {
        this.view_parameters.side *= 1.1;
    }
    else { 
        this.view_parameters.side /= 1.1;
    }

    this.updateCamera();
}

Model.prototype.yaw = function(argument) {
    if (argument < 0) {
        this.view_parameters.yaw -= 1;
    }
    else { 
        this.view_parameters.yaw += 1;
    }
    this.updateCamera();
}

Model.prototype.roll = function(argument) {
    if (argument < 0) {
        this.view_parameters.roll -= 1;
    }
    else { 
        this.view_parameters.roll += 1;
    }
    this.updateCamera();
}

Model.prototype.update = function() {
    var natural_length  = 1;
    var spring_constant = 1e-1; 
    var repell_constant = 1e-2; 

    var abs_delta_sum = 0.0;

    for (var i=0;i<this.edges.length;i++) {
	var e  = this.edges[i];
	var len_i = e.length();
	var delta = len_i - natural_length;
	var force = delta * delta * spring_constant;

	// debugger;

	abs_delta_sum += Math.abs(delta);
	
	var du = e.v2.pos.clone().sub(e.v1.pos).normalize().scale(force);
        
        if (delta > 0) {
            e.v1.pos.add(du);
	    e.v2.pos.sub(du);
        }
        else if (delta < 0) {
            e.v1.pos.sub(du);
	    e.v2.pos.add(du);
        }
    }

    console.log("Error by edge = " + (abs_delta_sum/this.edges.length));


    // repell vertex-vertex that are closer than natural length
    for (var i=0;i<this.vertices.length-1;i++) {
        for (var j=i+1;j<this.vertices.length;j++) {

            var vi = this.vertices[i];
            var vj = this.vertices[j];

            // debugger;

            var delta = vj.pos.clone().sub(vi.pos);
            var len   = delta.length();

            // if (len < natural_length) {
            var delta_n = delta.clone().normalize();
            var step = delta_n.clone().scale(repell_constant/(len*len));
            vi.pos.sub(step);
            vj.pos.add(step);
            // }
        }
    }


    // update elements

    // create an svg line segment for each edge of the model

    var lineFunction = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("linear");

    for (var i=0;i<this.edges.length;i++) {
        var e = this.edges[i];
        e.element.attr("d", lineFunction([
                this.transform_matrix.transform(e.v1.pos),
                this.transform_matrix.transform(e.v2.pos)
            ]));
    }
}

Model.prototype.logVertices = function() {
    for (var i=0;i<this.vertices.length;i++) {
	var v  = this.vertices[i];

        // debugger;

        var screen_pos = this.transform_matrix.transform(v.pos);
        console.log("vertices[" + i + "] = (" + screen_pos.x + ", " + screen_pos.y + ")");
    }
}

var model = new Model();

// for (var i=0; i<1; i++) {
//     model.update();
//     model.logVertices();
// }




