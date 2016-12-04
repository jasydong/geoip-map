// app
window.onload = function () {
  var map = createMap('global');
  var delay = 0;
  var active = document.getElementById('active-number');
  var controls = document.querySelectorAll('#controls .btn');

  map.object.classList.add('fadeIn');
  //place markers
  map.initMarkers(onlineMapData);

  //controls
  if (controls.length) {
      var length = controls.length;

      for (var i=0; i<length; i++) {
        controls[i].onclick = function() {
            for (var k=0; k<controls.length; k++) {
                //var index = parseInt(k);
                controls[k].classList.remove('active');
            }
            this.classList.add('active');

            //初始化
            delay = 0;
            map.markers.active = 0;
            //map.markers.object.innerHTML = '';
            //map.markers.list = {};
            map.markers.citylist.innerHTML = '';
            map.markers.forEach(function(ele){
                var obj = ele.object;
                obj.classList.remove('fadeIn');

            });

            var btn = this;
            setTimeout(function(){
                map.object.classList.remove('fadeIn');
                map.markers.object.innerHTML = '';
                map.markers.list = {};

                setTimeout(function(){
                    if (btn.innerHTML == 'G') {
                        map = createMap('global');
                    } else if (btn.innerHTML == 'C') {
                        map = createMap('china');
                    }
                    map.object.classList.add('fadeIn');
                    map.initMarkers(onlineMapData);
                }, 400);
            }, 400);

            //map.initMarkers(onlineMapData);
        };
      }
  }

  function createMap(type) {
    var map = {};
    var mapVector = (type == 'china') ? chinaMapVector:globalMapVector;
    map.mapType = type;
    map.object = document.getElementById('map');
    map.size = {
        width: 0,
        height: 0,
        original: { width: 554, height: 359 }
    };
    map.offset = { x: 0, y: 0 }
    map.margin = 10
    map.markers = {
      object: document.getElementById('markers')
    , list: {}
    , citylist: document.getElementById('citylist')
    , active: 0
    , add: function (marker) {
        this.list[marker.city] = marker;
        this.append(marker);
        active.innerHTML = map.markers.active;
      }
    , append: function (marker) {
        var self = this;
        this.active += marker.total;
        this.object.appendChild(marker.object);
        this.citylist.appendChild(marker.citylist.object);
        this.citylist.insertBefore(marker.citylist.object, this.citylist.firstChild);
        marker.citylist.object.onmouseover = marker.object.onmouseover = function () {
          marker.object.classList.add('hovered');
        }
        marker.citylist.object.onmouseout = marker.object.onmouseout = function () {
          marker.object.classList.remove('hovered');
        }
      }
    , forEach: function (fn) {
        var self = this;
        Object.keys(this.list).forEach(function (key) {
          fn(self.list[key]);
        })
      }
    , paint: function () {
        this.forEach(function (marker) {
          marker.paint();
        })
      }
    }
    map.placeMarker = function (geo) {
        var marker;

        if (!(geo.city in this.markers.list)) {
            marker = new Marker(geo);
            marker.paint();
            marker.setScale(geo.total);
            //marker fadein
            delay += 50;
            setTimeout(function(){map.markers.add(marker);marker.fadeIn();}, delay);
        }
    }
    map.object.style.position = 'absolute';
    map.object.style.margin = map.margin + 'px';

    //create map
    map.paper = Raphael(map.object);
    map.paper.path(mapVector).attr({
        stroke: "#444",
        'stroke-width': 1.05
    });

    map.initMarkers = function(markersData) {
        for (var k in markersData) {
            if (!k) {continue;}
            markersData[k]['city'] = k;
            map.placeMarker(markersData[k]);
        }
    };

    function Marker (geo) {
      this.total = geo.total;
      this.latlon = geo.ll;
      this.city = geo.city;
      
      this.object = document.createElement('div');
      this.object.className = 'marker';
      this.location = {
        object: document.createElement('div')
      }
      var html =
      '<div class="data">'
      + '<div class="total">Online: ' + geo.total + '</div>'
      + '<div class="location">'
      + (geo.city ? geo.city + ', ' : '') + (geo.country ? geo.country : 'CN')
      + '</div>'
      + '</div>';
      this.object.innerHTML = html;

      this.citylist = {
        object: document.createElement('div')
      };
      this.citylist.object.className = 'city';
      this.citylist.object.innerHTML = (geo.city ? '<span class="city">' + geo.city + '</span> ' : '');
      this.citylist.object.innerHTML += this.total + ' <span class="country"></span>';
    }

    Marker.prototype.paint = function () {
        var coords = map.latLongToPx(this.latlon);
        this.object.style.left = coords.x + 'px';
        this.object.style.top = coords.y + 'px';
    };

    Marker.prototype.fadeIn = function() {
        this.object.classList.add('fadeIn');
    }

    Marker.prototype.setScale = function (num) {
        var scale = 1;

        if (num>=10000) {
            scale = 1.2;
        } else if (num>=1000) {
            scale = 1.1;
        } else if (num>=100) {
            scale = 1;
        } else {
            scale = 0.8;
        }

        this.object.style.transform = 'scale('+scale+')';
    };

    map.latLongToPx = function (latlon) {
        if (map.mapType == 'global') {
            var px = globalMapLatLongToPx(latlon[0], latlon[1], map.size.width, map.size.height);
        } else {
            var px = chinaMapLatLongToPx(latlon[0], latlon[1], map.size.width, map.size.height);
        }
        return {
          x: px.x - map.margin,
          y: px.y - map.margin 
        }
    }

    function onresize () {
      map.viewport = {
        width: window.innerWidth - (map.margin * 2),
        height: window.innerHeight - (map.margin * 2)
      };
      map.paper.setSize(map.viewport.width, map.viewport.height);
      map.paper.canvas.style.height = map.viewport.height;
      map.paper.setViewBox(0, 0, map.size.original.width, map.size.original.height);
      var ratio = map.size.original.width / map.size.original.height;
      var newRatio = map.viewport.width / map.viewport.height;
      if (ratio > newRatio) {
        map.size.width = map.viewport.width;
        map.size.height = map.viewport.width / ratio;
        map.offset.x = 0;
        map.offset.y = (map.viewport.height - map.size.height) / 2;
      } else {
        map.size.height = map.viewport.height;
        map.size.width = map.viewport.height * ratio;
        map.offset.y = 0;
        map.offset.x = (map.viewport.width - map.size.width) / 2;
      }
      map.object.style.left = map.offset.x + 'px';
      map.object.style.top = map.offset.y + 'px';
      map.markers.paint();
    }

    onresize();
    var resizeTimeout;
    window.onresize = function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        onresize();
      }, 200);
    };

    return map;
  }

  ;(function tick () {
    //window.requestAnimFrame(tick);
  }());
}

window.requestAnimFrame = (function () {
  return window.requestAnimationFrame  
      || window.webkitRequestAnimationFrame 
      || window.mozRequestAnimationFrame    
      || window.oRequestAnimationFrame      
      || window.msRequestAnimationFrame     
      || function (callback, el) {
        return window.setTimeout(callback, 1000 / 60)
      }
}());
