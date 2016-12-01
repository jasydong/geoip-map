// app
window.onload = function () {

  var map = createMap();
  var active = document.getElementById('active-number');

  //place markers
  for (var k in onlineMapData) {
    if (!k) {continue;}
    onlineMapData[k]['city'] = k;
    map.placeMarker(onlineMapData[k]);
  }

  function createMap () {
    var map = {};
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
            //marker fadein
            setTimeout(function(){map.markers.add(marker);marker.fadeIn();}, 1200 + Math.floor(Math.random()*1500));
        }
    }
    map.object.style.position = 'absolute';
    map.object.style.margin = map.margin + 'px';

    map.paper = Raphael(map.object);
    map.paper.path(mapVector).attr({
        stroke: "#444",
        'stroke-width': 1.05
    });

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
        this.object.className = 'marker fadeIn';
    }

    map.latLongToPx = function (latlon) {
        var px = latLongToPx(latlon[0], latlon[1], map.size.width, map.size.height)
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
