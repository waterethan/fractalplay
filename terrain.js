/*
* Copyright (c) 2012 Ethan Gutierrez.
*
*  This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*
*
* 
*
*/



function Terrain(size,viewportWidth,viewportHeight)
{ this.size = size || 1020;
  this.canvas = document.createElement('canvas');
  this.canvas.height = viewportHeight || this.size;
  this.canvas.width = viewportWidth || this.size;
  this.points = [];
  this.seaLevel = 17;
  this.elevationScalar = 20;
  this.zoom = 100;
  this.angleX = 0;
  this.angleY = 0;
  this.angleZ = 0;
}

Terrain.prototype.rotateX = function(degrees)
{ var angle = degrees || Math.PI/4;
  angle = angle * Math.PI/180;
  this.angleX = angle;
}

Terrain.prototype.rotateY = function(degrees)
{ var angle = degrees || Math.PI/4;
  angle = angle * Math.PI/180;
  this.angleY = angle;
}

Terrain.prototype.rotateZ = function(degrees)
{ var angle = degrees || Math.PI/4;
  angle = angle * Math.PI/180;
  this.angleZ = angle;
}
Terrain.prototype.generate = function(detail)
{ this.detail = detail || 30;
  var f = new Fractal(this.detail);
  f.plasma();
  f.generate();
  for (var i=0;i<this.detail;i++)
  { this.points[i] = [];
    for (var j=0;j<this.detail;j++)
    {
      this.points[i][j] = f.points[i][j] * 34 - this.seaLevel;
    }
    
  }
}

Terrain.prototype.getColor = function(i,j)
{ temp = [];
	// Get elevations from four corners
			temp[0] = this.points[i][j];
			temp[1] = this.points[i][j+1];
			temp[2] = this.points[i+1][j+1];
			temp[3] = this.points[i+1][j];
			function sortNumber(a,b) { return a - b; }
			// Sort elevations
			temp.sort(sortNumber);
      
      
			// If the maximum height is below sea level, colour it a shade of blue dependant on the depth
			if (temp[3] < 0) {
				return  'rgb(0,0,'+Math.floor(192+(temp[3] * 8))+')';
			} else {

				// Maximum is at or above sea level.  If the others are below, set the colour to yellow (sand)
				if (temp[2] < 0) {
					return 'rgb(238,214,175)';
				} else {
					if (temp[3] > 8) {
						col = Math.min(Math.floor(temp[0] * 8) + 50, 255);
						return 'rgb('+col+','+col+','+col+')';
					} else {
						slope = (temp[3] - temp[0]);
						col = Math.min(Math.floor((slope * 16) + (temp[0] * 4)), 155);
						return 'rgb('+col+','+(col+100)+','+col+')';
					}
				}
			}
}

Terrain.prototype.render = function()
{ var tctx = this.canvas.getContext('2d');
  var matrix = new TWO.V(1);
      matrix.rotate(this.angleX,0);
			matrix.rotate(this.angleY,1);
      matrix.rotate(this.angleZ,2);
			matrix.translate(0,0,1000);
  tctx.clearRect(0,0,this.canvas.width,this.canvas.height);
  tctx.save();
  tctx.translate(this.canvas.width/2,this.canvas.height/2);
  var zScalar = this.elevationScalar;
  var step = 1;
			var gridSize = this.size/this.detail;
      var start = Math.floor(this.detail/2);
      var end = start - 1;
			for (var i=-start; i<end; i++)
      {
				for ( var j=-start; j<end; j++)
        { var surface = new TWO.Face();
          
					surface.p3d[0] = i*gridSize;
					surface.p3d[1] = j*gridSize;
					surface.p3d[2] = (Math.max(this.points[i+start][j+start], 0) * zScalar);
					surface.p3d[3] = i*gridSize;
					surface.p3d[4] = (j+step)*gridSize;
					surface.p3d[5] = (Math.max(this.points[i+start][j+start+step], 0) * zScalar);
					surface.p3d[6] = (i+step)*gridSize;
					surface.p3d[7] = (j+step)*gridSize;
					surface.p3d[8] = (Math.max(this.points[i+start+step][j+start+step], 0) * zScalar);
					surface.p3d[9] = (i+step)*gridSize;
					surface.p3d[10] = j*gridSize;
					surface.p3d[11] = (Math.max(this.points[i+start+step][j+start], 0) * zScalar);
			
					surface.p3d = matrix.transformArray(surface.p3d);
					surface.scale(this.zoom);
					surface.color = this.getColor(i+start,j+start);
          //surface.texture = 'none';
          surface.draw(tctx); 				
        }
      }
      tctx.restore();
      //reset angles so as not to keep rotating every render
      this.angleX = 0;
      this.angleY = 0;
      this.angleZ = 0;
}

Terrain.prototype.draw = function (canvasContext,xCord,yCord, width, height)
{   var xC = xCord || 0,
        yC = yCord || 0,
        w = width || this.canvas.width, //can compromise image quality for quick render for example
        h = height || this.canvas.height,
        rotation = this.rotation || 0,
        cContext = canvasContext || ctx;
    cContext.save();
     cContext.translate(xC + w/2, yC + h/2);
      cContext.rotate(rotation * pi/180);
       cContext.drawImage(this.canvas, - w/2, - h/2, w, h);
    cContext.restore();
}