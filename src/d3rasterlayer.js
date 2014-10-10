var d3map = d3map || {};

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
})();