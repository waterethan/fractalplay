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
* Midpoint Displacement algorithm taken from Piotr Rochala (http://rocha.la/)
* Used here by permission under the DWTFYW Public License 2 in plasma.js
* 
*
*/

// Cache some constants that will be useful.
var phi = 1.6180339887,
    log2 = Math.log(2),
    pi = Math.PI,
    toRad = pi/180;
    

/**
 * Fractal algorithms and their smoothing functions often take numbers out of bounds
 * so it is nice to have a binding function.  This can be done in so many ways I would
 * like to discuss the reason for the choice I have made.
 * Adding a method to the built-in Number class is slow but easiest to write (great for outside of fractal loops).
 *
 *
 * Example:
 * Number.prototype.clamp = function(min, max)
 * {
 *    var that = this;  //localization optomizes somewhat but not much
 *    if (that < min) {that = min};
 *    if (that > max) {that = max};
 *    return that;
 * };
 *
 * Example:
 * Number.prototype.clamp = function(min, max)
 * {
 *    return Math.min(Math.max(this, min), max); //internal Math class is even slower than Number class compounding speed issues
 * };
 * 
 * 
 * Both return a number whose value is limited to the given range [min, max].
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * 
 * usage: limit the output of this computation to between 0 and 255
 * 	
 * 	(x * 255).clamp(0, 255)
 * 	
 * usage: limit a smoothing variable to between 0 and 1 
 * 	smoothing = smoothing.clamp(0,1);
 * 
 * Having an external function is faster than Number.clamp
 * but still not as fast as writing this out each time
 * and performance in fractals cen become very important in recursion.
 * Yet it is important to note that the speed of overall render could
 * be limited by the draw iinstead of the generation and such
 * micro-optimization is rarely noticeable by the end user. 
 *
 * 
 * 
 */
bind = function(number, max, min)
{ var m = min || 0,
      M = max || 1;
  return (number < m) ? m : (number > M) ? M : number;
};

/**
 * 
 * Returns a number whose value is limited to the given range [max, min].
 * @param {Number} number The number to bind
 * @param {Number} min The lower boundary of the output range, default: 0
 * @param {Number} max The upper boundary of the output range, default: 1
 * 
 * Example: limit the output of number x to between 0 and 255
 * 	
 * 	bind(x,255);
 * 	
 * Example: limit the output of x between -30 and 400
 *
 * bind(x, 400, -30);
 *
 * Example: limit the output of x to between 0 and 1
 *
 * bind(x);
 *
 *
 *I cut and paste this and replace #,m,M with the appropriate numbers:
 * 
 *    = (# < m) ?  m: (# > M) ?  M: #;
 * 
 */




/* Create Fractal class with its own canvas and context. 
 * @param {Number} width of canvas, non-zero, not required, default: 200;
 * @param {Number} height of canvas, non-zero, not required, default: width;
*/

Fractal = function (width, height)
{ this.canvas = document.createElement('canvas');
  this.context = this.canvas.getContext('2d');
  this.width = width || 200;
  this.height = height || this.width;
  this.canvas.width = width || 200;
  this.canvas.height = height || this.canvas.width;
  this.algorithm = algorithms.mj;
  this.speed = 1;
  this.algo = 'normal';
  this.iterations = 32;
  this.points = [];
  this.xs = -0.5; // x Shift
  this.ys = 0; // y Shift
  this.color =
  { it: 0, red:255, green: 255, blue:255, gamma: 13};
  this.scalar = { a: 1, b: 1, c: 1, d: 1, x: 0.5, y: 0.5};
  this.zoom = {x: 1, y: 1};
  this.j = 1;
  this.j1 = 0;
  this.j2 = 0;
  this.crop = 0; // iterations to skip, positive values fill black, negative no imageData.
  this.rotation = 0;
  this.showTime = true;
  this.type = 'mandelbrot';
  this.lastRender = 'n/a';
  this.getColor = function(c, type, mod0,mod1,mod2) //not in use
  {
    var red = 0, green = 0, blue = 0;

    switch (type)
    {
      case 1:
        
        if (c < 0.3)
          {return {r:0,g:0,b:255}}
        red = green = blue = c;
        

        //blue = 1;
        
        break;
      case 0:
        //r
        if (c < 0.5)
          red = c * 2;
        else
          red = (1.0 - c) * 2;

        //g
        if (c >= 0.3 && c < 0.8)
          green = (c - 0.3) * 2;
        else if (c < 0.3)
          green = (0.3 - c) * 2;
        else
          green = (1.3 - c) * 2;

        //b
        if (c >= 0.5)
          blue = (c - 0.5) * 2;
        else
          blue = (0.5 - c) * 2;
        break;
      default:
        red = green = blue = c;
        break;
    }
    return {
      r: bind(~~(red * mod0),255),
      g: bind(~~(green * mod1),255),
      b: bind(~~(blue * mod2),255)
    };
  }
}

/* Plan to cleanup the class by pulling many of the properties into an init function
Fractal.prototype.init = function(type)
{ var t = type || 'mandelbrot'
  switch (t)
  {
    case 'mandelbrot' :
      this.reposition(0,0);
      this.scalar.c = c || 1;
      this.scalar.b = this.scalar.a = this.scalar.d = this.j = 1;
      this.j1 = this.j2 = 0;
  }
}

*/

Fractal.prototype.toRGB = function(red,green,blue,iterations,gamma) //all color values required, number of iterations to color, leave empty or 'all' for entire fractal
{ this.color =
  { it: iterations || 'all',
    red: red,
    green: green,
    blue: blue,
    gamma: gamma || 13,
    
  };
};

Fractal.prototype.stroke = function(style)
    { var start = Date.now();
          type = style || this.type;
          it = this.iterations,
          gradient = it,
          w = this.canvas.width,
          h = this.canvas.height,
          r = this.color.red,
          g = this.color.green,
          b = this.color.blue;
      if (type == 'plasma')
      { gradient = this.color.gamma;
      }
      if (type == 'terrain')
    {
      this.context.fillRect(0,0,w,h);
      this.context.save();
        this.context.translate(0,h/2);
          
          this.context.strokeStyle = 'rgba(' + r +',' + g +',' + b +',1)';
          this.context.lineWidth = this.scalar.c;
          for (var i=0; i<=it; ++i)
          {
            this.context.lineTo(i*w/it,this.points[i]);
          }
          this.context.stroke();
      this.context.restore();
    } else if (type == 'plasmatest') //very slow;
      { for (var x = 0; x < this.canvas.width; x++)
        {
        for (var y = 0; y < this.canvas.height; y++)
          {
        //get color for each pixel
          var color = this.getColor(this.points[x][y], 1, r, g, b);
        
          this.context.fillStyle = "rgb("+color.r+","+color.g+","+color.b+")";
          this.context.fillRect(x, y, 1, 1);
        
          }
        }
      } else if (type == 'tree1')
      { this.context.fillRect(0,0,w,h);
        //this.canvas.width = this.scalar.a * this.scalar.a;
      this.context.lineWidth   = 1;
      this.context.beginPath();
      this.generate(this.canvas.width/2, this.canvas.height, this.angle, this.iterations, this.crop, this.scalar.a);
      this.context.closePath();
      this.lastRender = Date.now() - start;
      this.context.strokeStyle = 'rgba(' + r +',' + g +',' + b +',1)';
      this.context.stroke();
      }
      else
      { var crop = this.crop,
          gamma = this.color.gamma,
          fill = this.fill || 0,
          imgd = this.context.createImageData(w,h),
          pix = imgd.data,
          color = (this.color.it == 'all') ? it - fill : this.color.it;
          
        for (var x = 0; x < w; x++)
        {
        for (var y = 0; y < h; y++)
          { var i = this.points[x][y] * gradient,
                p = (h * y + x) * 4;
        
          
          if (i < Math.abs(crop))
          { if (crop > 0)
            { pix[p] = 0;    // red
              pix[p+1] = 0;  // green
              pix[p+2] = 0;  // blue
              pix[p+3] = 255;// alpha
            }
          } else if ( i < color)
          {  
            pix[p] =  i/gamma * r;   // red
            pix[p+1] =  i/gamma * g; // green
            pix[p+2] =  i/gamma * b; // blue
            pix[p+3] = 255;          // alpha
          } else if (i > it - fill)
          { pix[p] = 0;//r; color fill to be implemented   // red
            pix[p+1] = 0;//g;  // green
            pix[p+2] = 0;//b;  // blue
            pix[p+3] = 255;// alpha
          } else
          { //smoothing is only visible for first 10-15 iterations
            pix[p] = i % 8 * 32;    // red
            pix[p+1] = i % 16 * 16; // green
            pix[p+2] = i % 32 * 8;  // blue
            pix[p+3] = 255;         // alpha
          }
          }
        }
        this.context.putImageData(imgd, 0,0);
      }
      this.lastStroke = Date.now() - start;
    }

Fractal.prototype.reposition = function(X,Y) //percent of canvas
{ var ys = Y || 0;
  this.xs += X;
  this.ys += ys;
}

Fractal.prototype.scale = function(X,Y) //percent of fractal
{ var sy = Y || X;
  this.scalar.x += X;
  this.scalar.y += sy;
  this.zoom = {x: 100/this.scalar.x, y: 100/this.scalar.y}
}

Fractal.prototype.smoothe = function(toggle)
{ if (toggle == "off" || toggle == "false" || toggle == "normal")
    {this.algo = 'normal'}
  else
  {this.algo = 'smoothee'};
}


Fractal.prototype.mandelbrot = function(c) //non zero scalar -1 for tricorn; default 1;
{ this.xs = -0.5;
  this.ys = 0;
  this.scalar.c = c || 1;
  this.scalar.b = this.scalar.a = this.scalar.d = this.j = 1;
  this.j1 = this.j2 = 0;
  this.type = 'mandelbrot';
}

Fractal.prototype.plasma = function(texture, roughness)
{ this.roughness = roughness || 0.5;
  this.type = 'plasma';
  this.algorithm = algorithms.midpoint;
  this.algo = 'normal';
  this.texture = texture || 'plasma';
  this.preDraw = true;
  this.color.it = 'all';
  this.addTexture = function (texture)
  {
    
  }
}
Fractal.prototype.julia = function(j1,j2)
{ this.xs = this.ys = this.j = 0;
  this.scalar.b = this.scalar.c = this.scalar.d = this.scalar.a = 1;
  this.j1 = j1;
  this.j2 = j2;
  this.type = 'julia';
}

Fractal.prototype.terrain = function (displacement, sharpness, lineWidth) // 
{
  this.points = [];
  this.algorithm = algorithms.midpoint2d;
  this.algo = 'normal';
  this.type = 'terrain';
  this.scalar.a = displacement || 40;
  this.scalar.b = sharpness || 0.5;
  this.scalar.c = lineWidth || 1;
}

Fractal.prototype.tree = function (type, iterations, angle)
{ this.algorithm = algorithms.tree;
  this.algo = 'mono';
  this.type = type || 'tree1';
  this.lastRender = 0;
  this.angle = -90;
  this.iterations = iterations || 12;
  this.scalar.a = 1 + this.width/100 - this.iterations/10;
  this.generate = function (x1, y1, angle, it, crop, length)
          {
            if (it != 0)
            {
              var x2 = x1 + (Math.cos(angle * toRad) * it * length);
              var y2 = y1 + (Math.sin(angle * toRad) * it * length);
              this.context.moveTo(x1, y1);
              this.context.lineTo(x2, y2);
              this.generate(x2, y2, angle - 20, it - 1,crop,length);
              this.generate(x2, y2, angle + 20, it - 1,crop, length);
            } 
          }
}



Fractal.prototype.render = function (iterations) // default=32;
{ // localize properties for speed and take note of the time so we can see how long this takes;
  this.canvas.width = this.width/this.speed;
  this.canvas.height = this.height/this.speed;
  var time = Date.now(),
      points = [[]],
      r  = this.color.red,
      g  = this.color.green,
      b  = this.color.blue,
      w = this.canvas.width,
      h = this.canvas.height,
      crop = this.crop || 0,
      algorithm = this.algorithm[this.algo],
      it = iterations || this.iterations;
   
   if (this.type == 'mandelbrot' || this.type == 'julia')
    { for (var x = 0; x < w; x++)
      {
        points[x] = [];
      }
      var aS = this.scalar.a,
          bS = this.scalar.b,
          cS = this.scalar.c,
          dS = this.scalar.d,
          j  = this.j,
          j1 = this.j1,
          j2 = this.j2,
          xmin = this.xs + this.scalar.x - 2,///this.zoom,// + (this.xs - 100 + this.scalar.x)/33,
          xmax = this.xs - this.scalar.x + 2,///this.zoom,// + (this.xs + 100 - this.scalar.x)/33,
          ymin = this.ys + this.scalar.y - 2,///this.zoom,// + (this.ys - 100 + this.scalar.y)/33,
          ymax = this.ys - this.scalar.y + 2,///this.zoom,// + (this.ys + 100 - this.scalar.y)/33,
          y0, x0, z;
      for ( var x = 0; x < w; x++)
        { x0 = xmin + (xmax - xmin) * x / w;
      for (var y = 0; y<h;y++)
      { y0 = ymin + (ymax - ymin) * y / h;
        
          var i = algorithm(x0,y0,it,j,j1,j2,aS,bS,cS,dS);
          i = (i < 0) ? 0 : (i > it) ? it : i;
          //i = bind(i,it);
          //i = i.clamp(0,it);
          points[x][y] = i/it;
          
        }
      }
      this.points = points;
      this.lastRender =  Date.now() - time;
      this.stroke();
      
      
      if (crop >= 0)
      { this.context.fillStyle = 'white';
      } else
      { this.context.fillStyle = 'black'}
    } else if (this.type == 'terrain')
    { 
      for (i=0; i<=it; ++i)
      {
        points[i] = 0;
      }
      this.algorithm[this.algo](points,0, it, this.scalar.a, this.scalar.b);
      this.points = points; 
      this.lastRender = Date.now() - time;
      this.stroke();
      
    } else if (this.type == 'plasma')
    { 
      var p1, p2, p3, p4,x,y;
      var roughness = this.roughness;
      for (x = 0; x < w; x++)
      {
        points[x] = [];
      }
      //give corners random colors
      p1 = Math.random();
      p2 = Math.random();
      p3 = Math.random();
      p4 = Math.random();
      this.algorithm[this.algo](points, 0, 0, w, h, p1, p2, p3, p4, roughness);
      this.points = points;
      this.lastRender = Date.now() - time;
      this.stroke(); 
    } else if (this.type == 'tree1')
    { 
      this.stroke();
    }
    
}



Fractal.prototype.draw = function (canvasContext,xCord,yCord, width, height)
{   var xC = xCord || 0,
        yC = yCord || 0,
        w = width || this.width, //can compromise image quality for quick render for example
        h = height || this.height,
        rotation = this.rotation || 0,
        cContext = canvasContext || ctx;
    cContext.save();
     cContext.translate(xC + w/2, yC + h/2);
      cContext.rotate(rotation * pi/180);
       cContext.drawImage(this.canvas, - w/2, - h/2, w, h);
    cContext.restore();
}


/**
*  This is where most of the action happens,
*  these are the fractal generating functions.
*  They are recursive and if there are any efficiency gains to be had,
*  this is where they will come, so each has a sandbox for testing.
*
*
*/
algorithms =
{ mj:
  { smoothe: function(x0,y0,it,j,j1,j2,aS,bS,cS,dS)
            { var x = x0,
                  y = y0;
              for (var i = 0; i < it; i++)
              {   if ( x * x + y * y > 4.0) break;
                  var  z =  aS * x * x - bS * y * y + x0 * j + j1;
                 y = 2.0 * cS * x * y + y0 * j + j2;
                  x = z * dS;
              }
              i -= Math.log(Math.log(x*x+y*y)/log2);
              return i;
            },
    normal: function(x0,y0,it,j,j1,j2,aS,bS,cS,dS)
            { var x = x0,
                  y = y0;
              for (var i = 0; i < it; i++)
              { if ( x * x + y * y > 4.0) break;
                var  z =  aS * x * x - bS * y * y + x0 * j + j1;
                y = 2.0 * cS * x * y + y0 * j + j2;
                x = z * dS;
              }
              return i;
            },
    sandbox: function(x0,y0,it,j,j1,j2,aS,bS,cS,dS)
            { var x = x0,
                  y = y0;
              for (var i = 0; i < it; i++)
              {   if ( x * x + y * y > 4.0) break;
                  var  z =  aS * x * x - bS * y * y + x0 * j + j1;
                 y = 2.0 * cS * x * y + y0 * j + j2;
                  x = z * dS;
              }
              if (aS==1)
              {i -= Math.log(Math.log(x*x+y*y)/log2);
              }
              return i;
            }  
  },
  midpoint:
    { normal: function(points, x, y, width, height, p1, p2, p3, p4, roughness)
            {
            var side1, side2, side3, side4, center;
            var transWidth = ~~(width / 2);
            var transHeight = ~~(height / 2);

            //as long as square is bigger then a pixel..
            if (width > 1 || height > 1)
            {
            //center is just an average of all 4 corners
            center = ((p1 + p2 + p3 + p4) / 4);

            //randomly shift the middle point
           center += (Math.random() - 0.5) * ((transWidth + transHeight) / 10) * roughness;

          //sides are averages of the connected corners
          //p1----p2
          //| |
          //p4----p3
         side1 = ((p1 + p2) / 2);
         side2 = ((p2 + p3) / 2);
         side3 = ((p3 + p4) / 2);
         side4 = ((p4 + p1) / 2);

         //its possible that middle point was moved out of bounds so correct it here
         center = (center < 0) ? 0 : (center > 1) ? 1 : center;
         side1 = (side1 < 0) ? 0 : (side1 > 1) ? 1 : side1;
         side2 = (side2 < 0) ? 0 : (side2 > 1) ? 1 : side2;
         side3 = (side3 < 0) ? 0 : (side3 > 1) ? 1 : side3;
         side4 = (side4 < 0) ? 0 : (side4 > 1) ? 1 : side4;
    
         //repeat operation for each of 4 new squares created
         //recursion, baby!
         algorithms.midpoint.normal(points, x, y, transWidth, transHeight, p1, side1, center, side4, roughness);
         algorithms.midpoint.normal(points, x + transWidth, y, width - transWidth, transHeight, side1, p2, side2, center, roughness);
         algorithms.midpoint.normal(points, x + transWidth, y + transHeight, width - transWidth, height - transHeight, center, side2, p3, side3, roughness);
         algorithms.midpoint.normal(points, x, y + transHeight, transWidth, height - transHeight, side4, center, side3, p4, roughness);
        }
        else
        {
          //when last square is just a pixel, simply average it from the corners
          points[x][y]= (p1 + p2 + p3 + p4) / 4;
        }
    },
    sandbox: function(points, x, y, width, height, p1, p2, p3, p4, roughness)
            {
              var side1, side2, side3, side4, center;
              var transWidth = ~~(width / 2);
              var transHeight = ~~(height / 2);

              //as long as square is bigger then a pixel..
              if (width > 1 || height > 1)
              {
              //center is just an average of all 4 corners
              center = ((p1 + p2 + p3 + p4) / 4);

              //randomly shift the middle point
              center += (Math.random() - 0.5) * ((transWidth + transHeight) / 10) * roughness;

              //sides are averages of the connected corners
              //p1----p2
              //| |
              //p4----p3
              side1 = ((p1 + p2) / 2);
              side2 = ((p2 + p3) / 2);
              side3 = ((p3 + p4) / 2);
              side4 = ((p4 + p1) / 2);

              //its possible that middle point was moved out of bounds so correct it here
              center = bind(center);
              side1 = bind(side1);
              side2 = bind(side2);
              side3 = bind(side3);
              side4 = bind(side4);

              //repeat operation for each of 4 new squares created
              //recursion
              algorithms.midpoint.sandbox(points, x, y, transWidth, transHeight, p1, side1, center, side4, roughness);
              algorithms.midpoint.sandbox(points, x + transWidth, y, width - transWidth, transHeight, side1, p2, side2, center, roughness);
              algorithms.midpoint.sandbox(points, x + transWidth, y + transHeight, width - transWidth, height - transHeight, center, side2, p3, side3, roughness);
              algorithms.midpoint.sandbox(points, x, y + transHeight, transWidth, height - transHeight, side4, center, side3, p4, roughness);
              }
              else
              {
                //when last square is just a pixel, simply average it from the corners
                points[x][y]= (p1 + p2 + p3 + p4) / 4;
              }
            }
  },
  midpoint2d:
  { normal: function(points,start, end, max, sharpness)
            {
              var middle = Math.round((start + end) * 0.5);
              if ((end-start<=1) || middle==start || middle==end)
              { return;
              }
              points[middle] = 0.5 * (points[end] + points[start]) + max*(1 - 2*Math.random());
              //recursion:
              algorithms.midpoint2d.normal(points,start, middle, max*sharpness, sharpness);
              algorithms.midpoint2d.normal(points,middle, end, max*sharpness, sharpness);
            },
      sandbox: function(points,start, end, max, sharpness)
            {
              var middle = Math.round((start + end) * 0.5);
              if ((end-start<=1) || middle==start || middle==end)
              { return;
              }
              points[middle] = 0.5 * (points[end] + points[start]) + max*(1 - 2*Math.random());
              //recursion:
              algorithms.midpoint2d.sandbox(points,start, middle, max*sharpness, sharpness);
              algorithms.midpoint2d.sandbox(points,middle, end, max*sharpness, sharpness);
            }
  },
  tree:
      { mono:function (points, x1, y1, angle, depth)
          {
            if (depth != 0)
            {
              var x2 = x1 + (Math.cos(angle) * depth * gradient);
              var y2 = y1 + (Math.sin(angle) * depth * gradient);
              points[x] = [x1, y1, x2, y2,depth];
              algorithms.tree.mono(points,x2, y2, angle - 20, depth - 1);
              algorithms.tree.mono(points,x2, y2, angle + 20, depth - 1);
            } 
          }
      }
}

