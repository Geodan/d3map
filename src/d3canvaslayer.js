var d3map = d3map || {};

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
})();