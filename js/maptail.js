// config
var config = { timeDiff: 0 };

// visitors
var visitors = 0;
function visitorsInc (num=1) { visitors+=num; }
function visitorsDec (num=1) { visitors-=num; }

// app

function connect (callback) {
  var simpl = require('simpl');
  var client = simpl.createClient();
  client.use(simpl.events());
  client.use(simpl.json());
  client.on('connect', callback);
}

function safe (text) {
  return text
    .split('&').join('&amp;')
    .split('"').join('&quot;')
    .split('<').join('&lt;')
    .split('>').join('&gt;');
}

function ansiToHtml (text) {
  var colors = {
    30: "#777"
  , 31: "red"
  , 32: "#0f0"
  , 33: "yellow"
  , 34: "blue"
  , 35: "magenta"
  , 36: "cyan"
  , 37: "#eee"
  , 38: "#777"
  , 39: "#777"
  }
  return text.replace(/\033\[(?:(\d+);)?(\d+)m/g, function (m, extra, color) {
    var style = 'color:' + (colors[color] || '#777');
    if (extra == 1) {
      style += ';font-weight=bold';
    } else if (extra == 4) {
      style += ';text-decoration=underline';
    }
    return '</span><span style="' + style + '">';
  })
}

window.onload = function () {

  var map = createMap();
  var active = document.getElementById('active-number');

  for (var k in onlineMapData) {
    if (!k) {continue;}
    onlineMapData[k]['city'] = k;console.log(k);
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
    , freeze: false
    , active: 0
    , add: function (marker) {
        this.list[marker.city] = marker;
        if (!this.freeze) {
          this.append(marker);
        } else {
          this.freeze.push(marker);
        }
      }
    , append: function (marker) {
        var self = this;
        this.active += marker.total;
        this.object.appendChild(marker.object);
        this.citylist.appendChild(marker.citylist.object);
        this.citylist.insertBefore(marker.citylist.object, this.citylist.firstChild);
        marker.citylist.object.onmouseover = marker.object.onmouseover = function () {
          clearTimeout(self.freezeTimeout);
          self.freeze = self.freeze || [];
          self.freezeRemove = self.freezeRemove || [];
          marker.object.classList.add('hovered');
        }
        marker.citylist.object.onmouseout = marker.object.onmouseout = function () {
          self.freezeTimeout = setTimeout(function () {
            self.freeze.forEach(self.append.bind(self));
            self.freezeRemove.forEach(self.destroy.bind(self));
            self.freeze = false;
            self.freezeRemove = false;
          }, 170);
          marker.object.classList.remove('hovered');
        }
      }
    , remove: function (marker) {
        if (this.freeze) {
          this.freezeRemove.push(marker)
        } else {
          this.destroy(marker)
        }
      }
    , destroy: function (marker) {
        if (marker.city in this.list) {
          //this.active--;
          try {
            delete this.list[marker.city];
            this.object.removeChild(marker.object);
            //this.citylist.removeChild(marker.citylist.object);
          } catch (e) {}
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
    , age: function () {
        this.forEach(function (marker) {
          //marker.age();
        })
      }
    }
    map.placeMarker = function (geo) {
        var marker;
        geo.date += config.timeDiff;
        if (!(geo.city in this.markers.list)) {
            visitorsInc(geo.total);
            marker = new Marker(geo);
            marker.paint();
            this.markers.add(marker);
            //marker fadein
            setTimeout(function(){marker.fadeIn();}, 1200);
        }
    }
    map.object.style.position = 'absolute';
    map.object.style.margin = map.margin + 'px';

    map.paper = Raphael(map.object);
    map.paper.path(mapVector).attr({
        stroke: "#666",
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
      + '<div class="total">' + geo.total + '</div>'
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

      this.visitorTimeout = setTimeout(visitorsDec, config.maxAge * 1000);
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
    window.requestAnimFrame(tick);
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
