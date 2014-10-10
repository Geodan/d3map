var d3map = d3map || {};

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
})();