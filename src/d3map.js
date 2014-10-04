var d3map = d3map || {};

(function(){
  "use strict";

  
  d3map.map = function(divid, config){
    var self = this;
    this._layers = [];
    
    var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);
    this.divid = divid;
    var tile = d3.geo.tile()
        .size([width, height]);
    this.tile = tile;
    
    var projection = d3.geo.mercator()
        .scale(( config.zoom << 12 || 1 << 12) / 2 / Math.PI)
        .translate([width / 2, height / 2]);
    this.projection = projection;
    
    var projection2 = d3.geo.mercator()
        .scale(1 / 2 / Math.PI)
        .translate([0, 0]);
    this.projection2 = projection2;
        
    var center = projection(config.center || [0,0]);
    this.center = center;
    
    var path = d3.geo.path()
        .projection(projection);
    this.path = path;
    
    var path_transform = d3.geo.path()
        .projection(projection2);
    this.path_transform = path_transform;
    
    function draw() {
      var tiles = tile
          .scale(zoom.scale())
          .translate(zoom.translate())();
      self.tiles = tiles;
      projection
          .scale(zoom.scale() / 2 / Math.PI)
          .translate(zoom.translate());
     
      vector_transform
      .attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
      .style("stroke-width", 1 / zoom.scale());
      //compare projection with transform option:
      //http://bl.ocks.org/mbostock/5914438
     
      raster
          .attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")");
          
      self.layers().forEach(function(d){
          d.refresh();
      });
    }
    this.draw = draw;
 
    var zoom = d3.behavior.zoom()
        .scale(projection.scale() * 2 * Math.PI)
        .scaleExtent([1 << 8, 1 << 24])
        .translate([width - center[0], height - center[1]])
        .on("zoom", draw);
    this.zoom = zoom;
    
    // With the center computed, now adjust the projection such that
    // it uses the zoom behavior’s translate and scale.
    //projection
    //    .scale(1 / 2 / Math.PI)
    //    .translate([0, 0]);
    
    var svg = d3.select('#'+divid).append('svg')//d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
    this.svg = svg;
    
    var raster = svg.append("g").attr('id', 'raster');
    this.raster = raster;
    
    var vector = svg.append("g").attr('id', 'vector');
    this.vector = vector;
    
    var vector_transform = svg.append("g").attr('id', 'vector_transform');
    this.vector_transform = vector_transform;
    
    var canvas = d3.select('#'+divid).append('canvas')
     .attr("width", width)  
     .attr("height", height);  
    
    svg.call(zoom);
    
    function resize(size){
        this.tile.size(size);
    }
    this.resize = resize;
    
    function layers(){
        return this._layers;
    }
    this.layers = layers;
    
    function addLayer(layer){
        if (!layer.id()){
            console.warn('Not a valid layer. (No ID)');
            return false;
        }
        //Replace existing ID
        this._layers.forEach(function(d){
            if (d.id() == layer.id()){
                layer = d;
                return true;
            }
        });
        this._layers.push(layer);
        return true;
    }
    this.addLayer = addLayer;
    
    function removeLayer(id){
        this._layers.forEach(function(d,i){
            if (d.id() == id){
                this._layers.splice(i,1);
                return true;
            }
        });
        return false;
    }
    this.removeLayer = removeLayer;
    
    /* This shouldn't be in map
    function drawpoint(me){
       var icon = self.vector.append('g').attr('id', 'drawpointer').append('image')
            .attr("xlink:href", self.curUrl)
            .attr("width",30).attr("height",30)
            .attr('x',-100)
            .attr('y',-100);
       //Make the icon follow the pointer
       self.svg.on('mousemove', function(d){
           var loc  = d3.mouse(this);
           icon.attr('x', loc[0] -15);
           icon.attr('y', loc[1] -15);
       });
       //Add an item on click
       self.svg.on('click', function(d){
           var loc = d3.mouse(this);
           self.vector.selectAll('#drawpointer').remove();
           self.svg.on('mousemove',null);
           self.svg.on('click',null);
           var coords = self.projection.invert(loc);
           if (core.project()){
               //Feature is newly created
               if (self.status=='new'){
                   var newid = 'ID' + new Date().getTime();
                   var item = {
                       _id: newid,
                       data: {
                           type: 'feature',
                           id: newid,
                           feature: {
                               type: 'Feature',
                               geometry: {
                                   type: self.curType,
                                   coordinates: coords
                               },
                               style: {
                                   'marker-url': self.curUrl
                               }
                           }
                       }
                   };
                   core.project().items(item).sync();
               }
               else {
                   //Feature only changes coordinates
                   self.feature.geometry.coordinates = coords;
                   core.project().items(self.feature.id).data('feature', self.feature).sync();
                   self.draw();
               }
           }
           else {
               console.warn('Can\'t draw. (No active project)');
           }
       });
    }
    
    function drawline(){
        var npoints = 100;
        var ptdata = [];
        var line = d3.svg.line()
            .interpolate("basis")
            .x(function(d, i) { return d[0]; })
            .y(function(d, i) { return d[1]; });
        var path = self.vector.append('g').attr('id', 'drawpointer')
          .append("path")
            .data([ptdata])
            .attr("class", "line")
            .attr("d", line)
            .style('stroke', self.curStroke)
            .style('stroke-width', '3px')
            .style('fill', self.curFill)
            .style('fill-opacity', 0.3);
        function startDrawing(){
            function dotick(){
                d3.event.preventDefault();
                d3.event.stopPropagation();
                var pt = d3.mouse(this);
                tick(pt);
                //console.log('Move', pt);
            }
            function endDrawing(){
                //console.log('Enddraw');
                self.vector.selectAll('#drawpointer').remove();
                self.svg.on('mousemove',null);
                self.svg.on('touchmove',null);
                self.svg.on('click',null);
                self.svg.on('touchstart', null);
                self.svg.on('touchend', null);
                
                //For simplify.js it is needed to rewrite the array to {x: , y: }
                var linedata = [];
                ptdata.forEach(function(d){
                    linedata.push({x:d[0], y: d[1]});
                });
                linedata = simplify(linedata);
                ptdata = [];
                linedata.forEach(function(d){
                    ptdata.push([d.x, d.y]);
                });
                
                
                if (self.curType == 'Polygon'){
                    ptdata.push(ptdata[0]);//This is different from the linedraw
                }
                
                //Find out clockwise http://stackoverflow.com/questions/14505565/detect-if-a-set-of-points-in-an-array-that-are-the-vertices-of-a-complex-polygon
                function polygonArea(vertices) { 
                    var area = 0;
                    var j = 0;
                    for (var i = 0; i < vertices.length; i++) {
                        j = (i + 1) % vertices.length;
                        area += vertices[i][0] * vertices[j][1];
                        area -= vertices[j][0] * vertices[i][1];
                    }
                    return area / 2;
                }
                var clockwise = polygonArea(ptdata) > 0;
                if (!clockwise){ //if not clockwise drawn, we have to reverse the order of coords
                    ptdata.reverse();
                }
                
                var coords = []; 
                ptdata.forEach(function(d){
                    coords.push(self.projection.invert(d));
                });
                
                //Polygons need an extra array dimension
                if (self.curType == 'Polygon'){
                    coords = [coords];
                }
                
                if (core.project()){
                    //Feature is newly created
                    if (self.status=='new'){
                        var newid = 'ID' + new Date().getTime();
                        var item = {
                            _id: newid,
                            data: {
                                type: 'feature',
                                feature: {
                                    type: 'Feature',
                                    id: newid,
                                    geometry: {
                                        type: self.curType,
                                        coordinates: coords
                                    },
                                    style: {
                                        'stroke': self.curStroke,
                                        'fill': self.curFill
                                    }
                                }
                            }
                        };
                        core.project().items(item).sync();
                    }
                    else {
                        //Feature only changes coordinates
                       self.feature.geometry.coordinates = coords;
                       core.project().items(self.feature.id).data('feature', self.feature).sync();
                       self.draw();
                    }
                }
                else {
                    console.warn('Can\'t draw. (No active project)');
                }
            }
            //console.log('Startdraw');
            self.svg.on("mousemove", dotick);
            self.svg.on("touchmove", dotick);
            self.svg.on('click', endDrawing);
            self.svg.on('touchend', endDrawing);
        }
        self.svg.on("touchmove", function(d){
                console.log('Touchmove',d3.mouse(this));
        });
        self.svg.on('click', startDrawing);
        //self.svg.on('touchstart', startDrawing);
        self.svg.on('touchstart', function(){
                d3.event.preventDefault();
                console.log('Touchstart');
                self.svg.on("touchmove", function(){
                        console.log('Touchmove',d3.mouse(this));
                });
                self.svg.on('touchend', function(){
                        console.log('Touchend');
                        self.svg.on('touchstart', null);
                        self.svg.on('touchend', null);
                        self.svg.on('touchmove', null);
                });
        });
        
        
        function tick(pt) {
          // push a new data point onto the back
          ptdata.push(pt);
          // Redraw the path:
          path.attr("d", function(d) { 
            return line(d);
          });
        }
    }
    
    function draw(msg){
        var self = this;
        //Remove existing drawpointer
        this.vector.selectAll('#drawpointer').remove();
        if (msg.detail){
            this.status = 'new';
            this.curType = msg.detail.type;
            this.curUrl = msg.detail.url;
            this.curStroke = msg.detail.stroke;
            this.curFill = msg.detail.fill || 'none';
        }
        else {
            this.status = 'exists';
            this.feature = msg.feature;
            this.curType = msg.feature.geometry.type;
            this.curUrl = msg.feature.style['marker-url'];
            this.curStroke = msg.feature.style.stroke;
            this.curFill = msg.feature.style.fill || 'none';
        }
        if (this.curType == 'Point') {
            drawpoint();
        }
        else if (this.curType == 'LineString') {
            drawline();
        }
        else if (this.curType == 'Polygon') {
            drawline();
        }
    }
    this.draw = draw;
    */
    return this;
};
})();