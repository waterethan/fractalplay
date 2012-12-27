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
* TWO is a minimalist 3d class library
* Class: Face - a 3d surface with basic texturing
* Class: V - vector space for 3d transforms
*
*/


TWO = function(){};

TWO.Face = function()
{	this.p2d = [];
	this.p3d = [];
	this.color = 'black';
	this.texture = 'fill'; //options: 'fill', 'mesh';
}

TWO.Face.prototype =
{ scale: function(focus)
	{ for (var i=0;i<this.p3d.length;i++)
			{ var i3 = i*3,
						i2 = i*2,
						scale = focus/(this.p3d[i3+2]+focus);
				this.p2d[i2] = this.p3d[i3]*scale;
				this.p2d[i2+1] = this.p3d[i3+1]*scale;
			}
	},
	outline: function(context)
	{ var c = context || ctx;
		c.moveTo(this.p2d[0],this.p2d[1]);
		for (var i=1;i<this.p2d.length;i++)
		{ var i2 = i*2;
			c.lineTo(this.p2d[i2],this.p2d[i2+1]);
		}
		c.lineTo(this.p2d[0],this.p2d[1]);	
	},
	draw: function(context)
	{ var c = context || ctx;
		c.beginPath();
		this.outline(c);
		c.strokeStyle = this.color;
		c.stroke();
		if (this.texture == 'fill')
		{	c.fillStyle = this.color;
			c.fill();
		}
	}
}


/*
 * Vector Space V 
 * property: m - 4x4 transformation matrix
 * @param: d - diagonal value of matrix this.m
 * 		default: 0 - emty matrix
 * 		notible: 1 - identity matrix
 */
TWO.V = function (d) 
{ this.m = [];
	for (i=0;i<4;i++)
	{ this.m[i] = [];
	  for (j=0;j<4;j++)
		{	if (i == j)
			{ this.m[i][j] = d || 0}
			else
			{ this.m[i][j] = 0}
		}
	}
}

//concatinate this matrix with other matrix o;
TWO.V.prototype =
{ multiply: function(o) 
	{ var M = new TWO.V();
		for (i=0;i<4;i++)
		{ for (j=0;j<4;j++)
			{ for (k=0;k<4;k++) 
				{ M.m[i][j] += this.m[i][k] * o.m[k][j];}
			}		
		}	
	this.m = M.m;
	},
	scale: function(x, y, z)
	{ var M = new TWO.V(1);
		M.m[0][0] = x;
		M.m[1][1] = y;
		M.m[2][2] = z;
		this.multiply(M);  
	},
	rotate: function(angle,axis) //0 for x, 1 for y, 2 for z;
	{ var sin = Math.sin(angle),
				cos = Math.cos(angle),
				M = new TWO.V(1);
		switch (axis)
		{	case 0:
				M.m[1][1] = M.m[2][2] = cos;
				M.m[1][2] = sin;
				M.m[2][1] = -sin;
				break;
			case 1:
				M.m[0][0] = M.m[2][2] = cos;
				M.m[0][2] = sin;
				M.m[2][0] = -sin;
				break;
			case 2:
				M.m[0][0] = M.m[1][1] = cos;
				M.m[1][0] = sin;
				M.m[0][1] = -sin;
				break;
		}
		this.multiply(M);
	},
	transformArray: function(arr)
	{ var rVal=[],
				l=arr.length/3;
		for(var i=0;i<l;i++)
		{	var i3=i*3,
					x=arr[i3],
					y=arr[i3+1],
					z=arr[i3+2];		
			rVal[i3]=this.m[0][0]*x+this.m[1][0]*y+this.m[2][0]*z+this.m[3][0];
			rVal[i3+1]=this.m[0][1]*x+this.m[1][1]*y+this.m[2][1]*z+this.m[3][1];
			rVal[i3+2]=this.m[0][2]*x+this.m[1][2]*y+this.m[2][2]*z+this.m[3][2];
		}
		return rVal;
	},
	translate: function(dx, dy, dz)
	{	this.m[3][0] += dx;
	  this.m[3][1] += dy;
	  this.m[3][2] += dz;
	}
}