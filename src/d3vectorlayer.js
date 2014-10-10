var d3map = d3map || {};

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
})();