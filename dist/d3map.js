var d3map = d3map || {};

(function(){
  "use strict";

  
  d3map.map = function(elem, config){
    var self = this;
    this._layers = [];
    
    var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);
    
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
    
    var svg = d3.select(elem).append('svg')//d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
    this.svg = svg;
    
    var raster = svg.append("g").attr('id', 'raster');
    this.raster = raster;
    
    var vector = svg.append("g").attr('id', 'vector');
    this.vector = vector;
    
    var vector_transform = svg.append("g").attr('id', 'vector_transform');
    this.vector_transform = vector_transform;
    
    var canvas = d3.select(elem).append('canvas')
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
})();;var d3map = d3map || {};

(function(){
  "use strict";
  
  /**
	d3map.layer - base for creating other layers 
  **/
  d3map.Layer = function(_id,_map){
      this._id = _id;
      this._map = _map;
  };
  d3map.Layer.prototype = {
      id: function(){
          return this._id;
      },
      setOpacity: function(value){
        this._opacity = value;
        this.draw();
      },
      setVisibility: function(value){
        this._isvisible = value;
        this.draw();
        this.refresh();
      }
  }; 
})();;var d3map = d3map || {};

(function(){
  "use strict";
/**
	d3map.Rasterlayer 
**/
d3map.Rasterlayer = function(id, map, config){
    d3map.Layer.call(this, id, map);
    this._id = id;
    this._type = config.type;
    this._url = config.url;
    this._layers = config.layers;
    this._map = map;
    this._opacity = 1;
    this._isvisible = true;
};

d3map.Rasterlayer.prototype = Object.create(d3map.Layer.prototype);

d3map.Rasterlayer.prototype.clear = function(){
    var image = this._map.raster.selectAll("."+ this._id).remove();
};
d3map.Rasterlayer.prototype.draw = function(){
    var self = this;
    var tiles = this._map.tiles;
    var raster = this._map.raster;

    var image = raster.selectAll("."+ this._id)
          .data(tiles, function(d) { return d; });
    var imageEnter = image.enter();
      if (this._isvisible){
       imageEnter.append("image")
          .classed(this._id,true)
          .attr("xlink:href", function(d) {
            var url = "";
            if (self._type == 'tms'){
                url = self._url    
                    .replace('{s}',["a", "b", "c", "d"][Math.random() * 4 | 0])
                    .replace('{z}',d[2])
                    .replace('{x}',d[0])
                    .replace('{y}',d[1])
                    //FIXME: why are these curly brackets killed when used with polymer?
                    .replace('%7Bs%7D',["a", "b", "c", "d"][Math.random() * 4 | 0])
                    .replace('%7Bz%7D',d[2])
                    .replace('%7Bx%7D',d[0])
                    .replace('%7By%7D',d[1]);
                    
            }
            else if (self._type == 'wms'){
                //This calculation only works for tiles that are square and always the same size
                var numtiles = 2 << (d[2]-1);
                var tilesize = (20037508.34 * 2) / (numtiles);
                var x = -20037508.34 + (d[0] * tilesize);
                var y = 20037508.34 - ((d[1]+1) * tilesize);//shift 1 down, because we want LOWER left
                var bbox = x + ", "+ y + "," + (x + tilesize) + "," + (y + tilesize);
                url = self._url + 
                     "&bbox=" + bbox + 
                     "&layers=" + self._layers + 
                     "&service=WMS&version=1.1.0&request=GetMap&tiled=true&styles=&width=256&height=256&srs=EPSG:900913&transparent=TRUE&format=image%2Fpng";
            }
            return url; 
          })
          .attr("width", 1)
          .attr("height", 1)
          .attr('opacity', self._opacity)
          .attr("x", function(d) { return d[0]; })
          .attr("y", function(d) { return d[1]; });
      }
      else {
          //Remove all we got
          image.remove();
      }
      image.exit().remove();
};

d3map.Rasterlayer.prototype.refresh = function(){
    var raster = this._map.raster;
    var image = raster.selectAll("."+ this._id);
    image.style('opacity', this._opacity);
    this.draw();
};
})();;var d3map = d3map || {};

(function(){
  "use strict";
        
  /**
	d3map.layer 
  **/
  d3map.Vectorlayer = function(id, map, config){
      d3map.Layer.call(this,id, map);
  };
  //Base the prototype on d3map.layer
  d3map.Vectorlayer.prototype = Object.create(d3map.Layer.prototype);
  
  /**
    layer.draw();
  **/
  d3map.Vectorlayer.prototype.draw = function(){

  };

  /**
    layer.refresh() - relocated the features after zoom
  **/
  d3map.Vectorlayer.prototype.refresh = function(){
    
  };


  /** 
	layer.data(features) - adds/replaces features for specific layer
  **/
  d3map.Vectorlayer.prototype.data = function(data){

  };
})();;var d3map = d3map || {};

(function(){
  "use strict";
        
  /**
	d3map.layer 
  **/
  d3map.vectorlayer2 = function(id, map, config){
    _.extend(this, d3map.layer);
	this._data = config.data;
	this._id = id;
	this._map = map;
	this._r = config.r;
	this._type = config.type || 'path';
	this._maxzoom = config.maxzoom;
	this._minzoom = config.minzoom;
	this._labels = config.labels || false;
	this._labelconfig = config.labelconfig;
	this._style = config.style || {};
	this._g = this._map.vector_transform.append('g').attr('id',this._id); //now we have a layer to add data on
	this._onmouseover = config.onmouseover;
	this._onclick = config.onclick;
	this._mouseoverContent = config.mouseoverContent;
	this._opacity = config.opacity || 1;
	this._isvisible = config.visible || true;
  };

  d3map.vectorlayer2.prototype.clear = function(){
      var entities = this._map.vector_transform.select('#' + this._id).selectAll(".entity").remove();
  };
  
  d3map.vectorlayer2.prototype.redraw = function(){
	var projection = this._map.projection;
	this.projection = projection;
	var pointprojection = this._map.pointprojection;
	var clicked = this._map.clicked;
	var path = this._map.path_transform;
	var self = this;
	var style = this._style;
	var labels = this._labels;
	var labelconfig = this._labelconfig;
	var tooltipdiv = d3.select('#'+self._map.divid)
	    .append('div')
	    .attr('id', 'tooltipdiv')
	    .style('position', 'absolute');
	var mouseover = function(d){
        if (!d.origopac){
            d.origopac = d3.select(this).style('opacity');
        }
        d3.select(this)
            .transition().duration(100)
            .style('opacity',d.origopac * 0.2);
        
        var content = '';
        _(d.properties).each(function(value,key){
                content = content + '<b>' + key + '</b>' + value + '<br>';
        });
        tooltipdiv.transition()        
            .duration(200)      
            .style("opacity", 0.9);      
        tooltipdiv.html(content + "<br/>")  
            .style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY - 28) + "px");
    };
    
    var mouseout = function(d){
        d3.select(this)
            .transition().duration(100)
            .style('opacity',d.origopac);
        tooltipdiv.transition()        
            .duration(500)      
            .style("opacity", 0);
        tooltipdiv.transition().delay(1500)
            .style('top', '-100px');
    };
	
    var click = function(d){
        //do nothing.....
    };
    
	 //Build up the element
    var build = function(d){
      var entity = d3.select(this);
      //Point/icon feature
      if (d.style && d.style['marker-url'] && d.geometry.type == 'Point'){ 
          var x = projection(d.geometry.coordinates)[0];
          var y = projection(d.geometry.coordinates)[1];
          var img = entity.append("image")
                //.transition().duration(500)
                .on("click", click)
                .on('mouseover',mouseover)
                .on('mouseout',mouseout);
      }
      //Path feature
      else{
        var path = entity.append("path")
            .attr("d",pathStyler(d))
            //.transition().duration(500)
            .on("click", click)
            .on('mouseover',mouseover)
            .on('mouseout',mouseout);
      }
    };
        
    //A per feature styling method
    var styling = function(d){
      var entity = d3.select(this);
      //Point/icon feature
      if (d.style && d.style['marker-url'] && d.geometry.type == 'Point'){ 
          var x = projection(d.geometry.coordinates)[0];
          var y = projection(d.geometry.coordinates)[1];
          var img = entity.select("image")
                .attr("xlink:href", function(d){
                        return d.style['marker-url'];
                })
                .classed("nodeimg",true)
                .attr("width", 32)
                .attr("height", 37)
                .style('opacity',function(d){ //special case: opacity for icon
                        return d.style.opacity || style.opacity || 1;
                });
         
      }
      //Path feature
      else{                 
        var path = entity.select("path");
        _(style).each(function(val, key) { 
            if (key == 'stroke-width'){return;} //since stroke-width is handled in the transform of vector_transform, disregard it here
            //First check for generic layer style
            path.style(key,function(d){
                
                    if (typeof(style[key]) == "function") {
                        var f = style[key];
                        return  f(d);
                    }
                    else {//..or by generic style string
                        return style[key]; 
                    }
            });
        });
        //Now apply style in feature
        _(d.style).each(function(val, key){
                path.style(key,val);
        });
      }
    };
    //A per feature styling method
    var textstyling = function(d){
        var obj = this;
        _(labelconfig.style).each(function(val, key) { //First check for generic layer style
            d3.select(obj).style(key,function(d){
                if (d.labelconfig && d.labelconfig.style && d.labelconfig.style[key]){
                    return d.labelconfig.style[key]; //Override with features style if present
                }
                else {	
                    return labelconfig.style[key]; //Apply generic style
                }
            });
        });
        //Now apply remaining styles of feature (possible doing a bit double work from previous loop)
        if (d.labelconfig && d.labelconfig.style) { //If feature has style information
            _(d.labelconfig.style).each(function(val, key){ //run through the styles
                d3.select(obj).style(key,d.labelconfig.style[key]); //and apply them
            });
        }
    };
    //Some path specific styles (point radius, label placement eg.)
    var pathStyler = function(d){ 
        if (d.style && d.style.radius){
            path.pointRadius(d.style.radius);
        }
        else if (style && style.radius){
            path.pointRadius(style.radius);
        }
        return path(d);
    };
    this.pathStyler = pathStyler;
    //Calculating the location of the label, based on settings
    var textLocation = function(d){
        var textLocation = path.centroid(d);
        var bounds = path.bounds(d);
        if (style && style.textlocation){
            switch(style.textlocation){
              case 'ul':
                textLocation[0] = bounds[0][0];
                textLocation[1] = bounds[0][1];
                break;
              case 'ur':
                textLocation[0] = bounds[1][0];
                textLocation[1] = bounds[1][1];
                break;
              //TODO: add other positions
            }
        }
        else {
            textLocation[1] = textLocation[1] + 20; //a bit down..
        }
        return textLocation;
    };
    this.textLocation = textLocation;
	//TODO move out of core
    var labelgenerator = function(d){
        if (labelconfig.field && d.properties){
            var str = d.properties[labelconfig.field];
            if (str && str.length > 10) {
                  return str.substr(0,16) + "..."; //Only first 16 chars
            }
            else {
                return str;
            }
        }
        else {
            return d.id;
        }
    };
	this.labelgenerator = labelgenerator;
    
    
    var entities = this._map.vector_transform.select('#' + this._id).selectAll(".entity")
        .data(this._data, function(d) {
            return d.id;
        });
        
    if (this._isvisible){
        //On enter
        var newentity = entities.enter()
            .append("g")
            .classed('entity',true)
            .attr('id',function(d){
                    return 'entity'+ d.id;
            });
        newentity.each(build);
       
        if (labels){
            var label = newentity.append('g')
                .classed('place-label',true);
            //On new:	
            label
                .append('text')
                .attr("x",function(d) {return textLocation(d)[0] ;})
                .attr("y",function(d) {return textLocation(d)[1] ;})
                .attr('text-anchor', 'left')
                .style('stroke','white')
                .style('stroke-width','3px')
                .style('stroke-opacity',0.8)
                .text(function(d){return labelgenerator(d);});
            label
                .append('text')
                .attr("x",function(d) {return textLocation(d)[0] ;})
                .attr("y",function(d) {return textLocation(d)[1] ;})
                .attr('text-anchor', 'left')
                .each(textstyling)
                .text(function(d){return labelgenerator(d);});
      } //End of new label
   }
   else {
       entities.remove();
   }
   
  //On update
  entities.each(styling);

  //On exit
  entities.exit().remove().transition().duration(500);
  this.refresh(); //position the features
};

/**
    layer.refresh() - relocated the features after zoom
**/
d3map.vectorlayer2.prototype.refresh = function(){
    var self = this;
    var entities = this._map.vector_transform.select('#' + this._id).selectAll(".entity");
    var path = this._map.path_transform;
    var zoom = this._map.zoom;
    var textLocation = this.textLocation;
    var labels = this._labels;
    var pathStyler = this.pathStyler;
    /*
    entities.each(function(d,i){
        var entity = d3.select(this);
        
        var x = path.centroid(d)[0];
        var y = path.centroid(d)[1];
        
        if (d.style && d.style['marker-url'] && d.geometry.type == 'Point'){
            entity.select('image')
                .attr("x",x-12.5)
                .attr("y",y-25);
        }
        else{
            entity.select('path') //Only 1 path per entity
                .attr("d",pathStyler(d));
        }
        
        if (labels){
            var opacity = 1;
            if (self._labelconfig && self._labelconfig.minzoom && self._map.zoom.scale() < self._labelconfig.minzoom){
                opacity =0;
            }
            entity.select('.place-label')
                .style('opacity',opacity)
                .selectAll('text')
                .attr("x", textLocation(d)[0] )
                .attr("y", textLocation(d)[1] );
        }
    });
    */
};


/** 
	layer.data(features) - adds/replaces features for specific layer
**/
d3map.vectorlayer2.prototype.data = function(data){
	var projection = this._map.projection;
	var pointprojection = this._map.pointprojection;
	var clicked = this._map.clicked;
	var self = this;
	var style = this._style;
	this._data = data;
	this.redraw();
};
})();;var d3map = d3map || {};

(function(){
  "use strict";
        
  /**
	d3map.layer 
  **/
  d3map.canvaslayer = function(id, map, config){
    _.extend(this, d3map.layer);
	this._data = config.data;
	this._id = id;
	this._map = map;
	this._r = config.r;
	this._type = config.type || 'path';
	this._maxzoom = config.maxzoom;
	this._minzoom = config.minzoom;
	this._labels = config.labels || false;
	this._labelconfig = config.labelconfig;
	this._style = config.style || {};
	this._g = this._map.vector.append('g').attr('id',this._id); //now we have a layer to add data on
	this._onmouseover = config.onmouseover;
	this._onclick = config.onclick;
	this._mouseoverContent = config.mouseoverContent;
	this._opacity = config.opacity || 1;
	this._isvisible = config.visible || true;
  };

  d3map.canvaslayer.prototype.clear = function(){
      
  };
  
  d3map.canvaslayer.prototype.redraw = function(){
      var canvas = this._map.canvas;
	  var context = canvas.node().getContext("2d");
  };

  /**
      layer.refresh() - relocated the features after zoom
  **/
  d3map.canvaslayer.prototype.refresh = function(){
      
  };


  /** 
  	layer.data(features) - adds/replaces features for specific layer
  **/
  d3map.canvaslayer.prototype.data = function(data){
  	var projection = this._map.projection;
  	var pointprojection = this._map.pointprojection;
  	var clicked = this._map.clicked;
  	var self = this;
  	var style = this._style;
  	this._data = data;
  	this.redraw();
  };
})();;//Replacing editpopup:
var Cop = window.Cop || {};
Cop_utils = {};

Cop_utils.menuconfig = {
     "name": "root",
     "children": [{
       "name": "model.populator",
          icon: './css/img/users_icon.png',
          label: "Populatie",
          size: 1
      },{
          "name": "edit.geom",        
          icon: './css/img/pencil_icon.png',
          label: 'Bewerken',
          value: 1
     },{
          "name": "delete",
          icon: './css/img/clipboard_cut_icon.png',
          label: 'Verwijderen',
          value: 1
     },{
          "name": "edit.text",
          icon: './css/img/text_letter_t_icon.png',
          label: "Tekst",
          size: 1
     }//,{
     //     "name": "share",
     //     icon: './css/img/share_2_icon.png',
     //     label: "Delen",
     //     size: 1
     //},{
     //    "name": "model.smoke",
     //     icon: './css/img/cloud_icon.png',
     //     label: "Rookpluim",
     //     size: 1
     //}
     ]
};

Cop_utils.menu = function(feat, event, container, element, config){
    var self = this;
    var fid = feat.id;
    d3.selectAll('.popup').remove(); //Remove any old menu's
    var feature = feat;
    var menuconfig = config.menuconfig;

    var g, svg;
    this._svg = svg = container;
    g = svg.append('g');
    var loc = d3.mouse(element); //Wrong on firefox
    var center = {x: event.layerX, y: event.layerY};
    
    if (navigator.userAgent.match('Firefox')){
        loc[0] = loc[0] + 10;
        loc[1] = loc[1] + 10;
    }
    if (navigator.userAgent.match('MSIE')){
        loc[0] = loc[0] - 140;
        loc[1] = loc[1] + 2;
    }
    
    g.attr('class','popup')
        .attr("transform", function(z){
            var x = loc[0];
            var y = loc[1];
            return "translate(" + x + "," + y + ")";
        });
  
    var data = menuconfig; 
    width = 150;
    height = 150;
    var radius = Math.min(width, height) / 2;
    var partition = d3.layout.partition()
        .sort(null)
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return d.value || 1; });
    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y * 0.7); })
        .outerRadius(function(d) {
            return Math.sqrt((d.y + d.dy)*1.5);
    });
    
    var color = d3.scale.category10();
    var entity = g.append('g');

   if (entity.attr('selected') == 'true'){
    entity.select('.popup').remove();
    entity.attr('selected','false');
   }
   else {
    entity.attr('selected','true');
    
    var chart = entity.append('g')
        .classed('pie popup',true)
        .attr('width',width)
        .attr('height',height)
        .append('g')
        .attr('class','zoomable');
        
     var g = chart.datum(data).selectAll("arc1")
        .data(partition.nodes)
        .enter().append("g")
        .attr("class", "arc1")
        .on('click', function(d){
             entity.remove();
             d3.event.stopPropagation();//Prevent the map from firing click event as well
             var name = d.name;
             self.trigger(name, {fid: fid, layer: feature, obj: element});
        })
        .on('mouseover', function(d){ //Mouseover menulabel
            d3.select(this)
                 .append("text")
                  .classed('menu_shadow',true)
                  //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                  .attr("dy", 0)
                  .attr("dx", 0)
                  .text(function(d) { 
                          return d.label; 
                  });
            d3.select(this)
             .append("text")
              .classed('menu',true)
              //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
              .attr("dy", 0)
              .attr("dx", 0)
              .text(function(d) { 
                      return d.label; 
              });
              
        })
        .on('mouseout', function(d){
            d3.select(this)
                .style('opacity',1)
                .selectAll('text').remove();
        });
        
    g.append("path")
        .style('opacity',0)
        .transition()
        .style('opacity',1)
        .attr("d", function(d){
            return arc(d);
        })
        
        .style("stroke", "#fff")
        .style("fill", function(d) {
            if (d.name == 'root') {
                return 'none';
            }
            else if (d.parent && d.parent.name == 'P'){
                return 'none';
            }
            else if (d.parent && d.parent.name == 'root'){
                return color(d.name);
            }
            else{ 
                return color(d.name);
            }
        });
        
        
    g.append("svg:image")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
       .attr('x',-9)
       .attr('y',-12)
       .attr('width', 20)
       .attr('height', 24)
       .attr("xlink:href",function(d){
               return d.icon;
       });
    //g.append("text")
    //  .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    //  .attr("dy", ".35em")
    //  .style("text-anchor", "middle")
    //  .text(function(d) { 
    //          return d.name; 
    //  });
   }
};
//Adding some Backbone event binding functionality to the store
//_.extend(Cop_utils.menu.prototype, Events);

Cop_utils.populator = function(feature){
 //TODO   
};

Cop_utils.editText = function(feature,entity){
    
};

Cop_utils.textbox = function(feature,obj){
    var _this = this;
    var self = this.map;
    //d3.selectAll('.popup').remove(); //Remove any old menu's
    d3.select(obj).on('mouseout', function(d){
          d3.selectAll('.textbox').remove();
    });
    var loc = d3.mouse(obj); //Wrong on firefox
    var divloc = [d3.event.screenX ,d3.event.screenY ];
    var item = self.core.project().items(feature.properties.key); //TODO
    var name = feature.properties.name || "";
    var desc = feature.properties.desc || "";
    var ownername = feature.properties.owner || "Anoniem";
    //var mygroups = self.core.project().myGroups();
    var groupnames = "";
    if (item.permissions('edit')){
        var editgroups = item.permissions('edit').groups;
        $.each(editgroups,function(i,d){
            var name = self.core.project().groups(d).data('name'); //TODO
            if (name != 'public') { //Keep public out of here
                groupnames = groupnames + name;
            }
        });
    }
    
    var allgroups = self.core.project().groups(); //TODO
    var grouparr = [];
    $.each(allgroups, function(i,d){
         grouparr.push(d._id);
    });
    
    var div = d3.select('body').append('div')
        .style('left',divloc[0] + 25 +  'px')
        .style('top',divloc[1] + -100 + 'px')
        .classed("textbox popup share ui-draggable", true);
    var sheader = div.append('div')
        .classed('sheader', true)
        .attr('title','Dit object is gemaakt door');
    sheader.append('span')
        .classed('group ' + groupnames,true); //TODO add own groups here
    sheader.append('span').html(groupnames  + " <small>(" + ownername + ")</small>");
    var scontent = div.append('div')
        .classed('scontent', true);
    desc = desc.replace(/\r\n?|\n/g, '<br />');
    scontent.append('div').classed('ssubheader', true).html(desc);
    sfooter = div.append('div')
        .classed('sfooter',true)
        .attr('id','permissionlist')
        .html("Gedeeld met:");//TODO dont use ids;
    if (item.permissions('view')){
        var itemgroups = item.permissions('view').groups;
        var blokje = d3.select('#permissionlist').selectAll('.permission').data(itemgroups);
        blokje.enter()
            .append('span')
            .attr('class',function(d){
                var groupname = self.core.project().groups(d).data('name');
                return 'group ' + groupname;
            });
    }
        
};

Cop_utils.ripple = function(feature, object, context){
    console.log(context._map);
    
    var map = context._map;
    var width = map.getSize().x;
    var height = map.getSize().y;
    var loc = d3.mouse(object); //Wrong on firefox
    var svg = d3.select('.leaflet-popup-pane').append("svg");
    svg.attr('class','popup');
    svg.attr("width", width);
    svg.attr("height", height);
    var circle = svg.append('circle')
        .attr('r',10).attr('cx',loc[0]).attr('cy',loc[1])
        .style('fill','none').style('stroke','green')
        .transition().duration(2000).attr('r',500)
        .transition().duration(500).style('opacity',0).remove().call(function(d){
                d3.selectAll('.popup').transition().duration(1000).remove();
        });
    
};
