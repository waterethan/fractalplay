/*
* Copyright (c) 2012 Ethan Gutierrez.
*
* This software is provided 'as-is', without any express or implied
* warranty.  In no event will the author be held liable for any damages
* arising from the use of this software.
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
* 1. The origin of this software must not be misrepresented; you must not
* claim that you wrote the original software. If you use this software
* in a product, an acknowledgment in the product documentation would be
* appreciated but is not required.
* 2. Altered source versions must be plainly marked as such, and must not be
* misrepresented as being the original software.
* 3. This notice may not be removed or altered from any source distribution.
*/

var phi = 1.6180339887,
    log2 = Math.log(2);
    
Fractal = function (size)
{ this.canvas = document.createElement('canvas');
  this.context = this.canvas.getContext('2d');
  this.canvas.height = size || 200;
  this.canvas.width = size || 200;
  this.xs = 0; // x Shift
  this.ys = 0; // y Shift
  this.girth =
  { x: 0, // x Girth
    y: 0  // y Girth
  };
  this.color =  {it: 0, gamma: 10};
  this.scalar = { a: 1, b: 1, c: 1, d: 1};
  this.j = 1;
  this.j1 = 0;
  this.j2 = 0;
  this.crop = 0; // iterations to skip, positive values fill black, negative no imageData.
  this.rotation = 0;
  this.showTime = true;
}

Fractal.prototype.toRGB = function(red,green,blue,iterations,gamma) //all color values required, number of iterations to color, leave empty or 'all' for entire fractal
{ this.color =
  { it: iterations || 'all',
    red: red,
    green: green,
    blue: blue,
    gamma: gamma || 13
  };
};

Fractal.prototype.reposition = function(X,Y) //percent of canvas
{ this.xs = X/33 || 0;
  this.ys = Y/33 || 0;
}

Fractal.prototype.scale = function(X,Y) //percent of fractal, negative to expand
{ this.girth.x = -(100-X)/33 || 0;
  this.girth.y = -(100-Y)/33 || 0;
}

Fractal.prototype.mandelbrot = function(c) //non zero scalar -1 for tricorn; default 1;
{ this.reposition(0,0);
  this.scalar.c = c || 1;
  this.scalar.b = this.scalar.a = this.scalar.d = this.j = 1;
  this.j1 = this.j2 = 0;
}


Fractal.prototype.julia = function(j1,j2)
{ this.reposition(15,0);
  this.j = 0;
  this.scalar.b = this.scalar.c = this.scalar.d = this.scalar.a = 1;
  this.j1 = j1;
  this.j2 = j2;
}

Fractal.prototype.smoothe = function(toggle)
{ if (toggle == "off" || toggle == "false" || toggle == "normal")
    {this.smoothing = 'normal'}
  else
  {this.smoothing = 'smoothe'}
}


Fractal.prototype.render = function (algorithm, iterations) // defaults: algorythm = algorithms.smooth.standard, iterations=32
{   var time = Date.now(),
        fractx = this.context,
        r  = this.color.red,
        g  = this.color.green,
        b  = this.color.blue,
        aS = this.scalar.a,
        bS = this.scalar.b,
        cS = this.scalar.c,
        dS = this.scalar.d,
        j  = this.j,
        j1 = this.j1,
        j2 = this.j2,
        w = this.canvas.width,
        h = this.canvas.height,
        fill = this.fill || 0,
        imgd = fractx.createImageData(w,h),
        pix = imgd.data,
        crop = this.crop,
        it = iterations || 32,
        color = (this.color.it == 'all') ? it - fill : this.color.it,
        gamma = this.color.gamma,
        xmin = -2 + this.xs + this.girth.x,
        xmax = 1 + this.xs - this.girth.x,
        ymin = -1.5 + this.ys + this.girth.y,
        ymax = 1.5 + this.ys - this.girth.y,
        smoothe = this.smoothing || 'smoothe',
        algo = algorithm || algorithms[smoothe].standard,
        y0, x0, z;
        
    for (var iy = 0; iy<h;iy++)
    { y0 = ymin + (ymax - ymin) * iy / h;
      for ( var ix = 0; ix < w; ix++)
      { x0 = xmin + (xmax - xmin) * ix / w;
        var i = algo(x0,y0,it,j,j1,j2,aS,bS,cS,dS);
        
        
        var p = (h * iy + ix) * 4;
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
        { pix[p] = 0;    // red
          pix[p+1] = 0;  // green
          pix[p+2] = 0;  // blue
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
    fractx.putImageData(imgd, 0,0);
    time = Date.now() - time;
    if (this.showTime)
    { fractx.fillStyle = 'white';
      fractx.fillText(time,10,10)
    };
}



Fractal.prototype.draw = function (canvasContext,xCord,yCord)
{   var xC = xCord || 0,
        yC = yCord || 0,
        cContext = canvasContext || ctx;
    cContext.save();
     cContext.translate(xC + this.canvas.width/2, yC + this.canvas.height/2);
      cContext.rotate(this.rotation * Math.PI/180);
       cContext.drawImage(this.canvas, - this.canvas.width/2, - this.canvas.height/2);
    cContext.restore();
}


algorithms =
{   smoothe: // since the main reason to turn off smoothing is to lower render time on large fractals, even one if statement can slow things down so it is best to rewrite the function clean without smoothing.
    {   standard:  function(x0,y0,it,j,j1,j2,aS,bS,cS,dS)
                    {   var x = x0,
                        y = y0;
                    for (var i = 0; i < it; i++)
                    {   if ( x * x + y * y > 4.0) break;
                        var  z =  aS * x * x - bS * y * y + x0 * j + j1;
                        y = 2.0 * cS * x * y + y0 * j + j2;
                        x = z * dS;
                    }
                    i -= Math.log(Math.log(x*x+y*y)/log2);
                    if (i < 0) {i=0};
                    return i;
                    }
    },
    normal:
    {   standard: function(x0,y0,it,j,j1,j2,aS,bS,cS,dS)
                    {   var x = x0,
                        y = y0;
                    for (var i = 0; i < it; i++)
                    {   if ( x * x + y * y > 4.0) break;
                        var  z =  aS * x * x - bS * y * y + x0 * j + j1;
                        y = 2.0 * cS * x * y + y0 * j + j2;
                        x = z * dS;
                    }
                    return i;
                    }
        
    }
}