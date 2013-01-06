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
* t3d is a minimalist 3d class library
* Class: Face - a 3d surface with basic texturing
* Class: V - vector space for 3d transforms
*
*/


t3d = function(){};

t3d.Face = function()
{	this.p2d = [];
	this.p3d = [];
	this.color = 'black';
	this.texture = 'fill'; //options: 'fill', 'mesh';
}

t3d.Face.prototype =
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
 * property: m - 3x3 transformation matrix
 * property: t - 1x3 translation matrix, origin of matrix this.m
 * @param: v - diagonal value or, if array, diagonal vector of matrix this.m
 * 		default: 0 - emty matrix
 * 		notible: 1 - identity matrix
 *
 *	if v is array
 *		@param: v[0] - m[0][0]
 * 		@param: v[1] - m[1][1] 
 * 		@param: v[2] - m[2][2]
 * 			defaults: 0
 * 			notible: [1,1,1] - identity matrix
 *
 * 	@param: r - z rotation of matrix this.m or, if array, [x,y,z] rotations of matrix this.m
 * 		default: no rotation
 * 		
 *	@param: o - z value of translation matrix this.t, origin of matrix this.m or, if array, [x,y,z] values
 *
 *
 *
 *	Examples:
 *
 *		Example1: var matrix = new t3d.V();
 *
 *			Empty matrix
 *
 *		Example2: var matrix = new t3d.V(1);
 *
 *			Identity matrix
 *
 *
 *		Example3:  this.matrix = new t3d.V(1,[this.angleX,this.angleY],1000);
 *
 *			A standard camera matrix with focal length 1000
 *			one of the most common matrices for 3D transforms as only 2 degrees of freedom are ever needed 
 *			this.matrix is set to identity, transformed by angles this.angleX and this.angleY, and translated to by 0,0,1000
 *			equivalant to:  this.matrix = new t3d.V([1,1,1],[this.angleX,this.angleY,0],[0,0,1000]);
 *							
 *
 *		Example4:		camera.matrix = new t3d.V(zoom,[camera.angleX,camera.angleY],focalLength);
 *
 *			same as Example3 one with choice of zoom(scalar) and focal Length
 *
 *		Example5: var Vector = new t3d.V([magnitude1,magnitude2,magnitude3]);
 *
 *		Example6: var Vector3D = new t3d.V([magnitude],[0,direction1,direction2]);
 *
 *		Example7: var Vector2D = new t3d.V([magnitude],direction);
 *
 *		
 */
t3d.V = function (v,r,o) 
{ this.m = [];
	if (o) { this.t = (o[1] || o[1] == 0) ? o : [0,0,o]} //only generate translation matrix if translating
	var d = [0,0,0]; // diagonal defaults to empty vector
	if (v) {d = (v[0] || v[0] == 0) ? v : [v,v,v]} //if v is vector, set diagonal to v, otherwise v is scalar like 1 for identity
	for (var i=0;i<3;i++)
	{ this.m[i] = [];
	  for (j=0;j<3;j++)
		{	if (i == j)
			{ this.m[i][j] = d[i] || 0} //diagonal, d[i] set to zero if vector is declared with fewer than three dimensions
			else
			{ this.m[i][j] = 0}
		}
	}
	if (r)
		{ if (r[1] || r[1] == 0)
			{ for (var i=0;i<3;i++)
				{ if (r[i]) {this.rotate(r[i],i)}}
			}
			else {this.rotate(r,2)}
		}
	
	
}

/*
 * examples
 * t3d.V(1) - identity matrix equiv- t3d(1,1,1)
 * t3d.V(zoom) - matrix scaled by some number zoom 
 * t3d.V(a,b,c) - matrix with diagonal values a, b, and c
 *
 *
 */


t3d.V.prototype =
{ //concatinate or multiply this matrix with other matrix o or with array o;
	cat: function(o) 
	{ var M = [[0,0,0],[0,0,0],[0,0,0]];//new t3d.V();
		for (i=0;i<3;i++)
		{ for (j=0;j<3;j++)
			{ for (k=0;k<3;k++) 
				{ if (o.m) // if o is another matrix great
					{ M[i][j] += this.m[i][k] * o.m[k][j]}
					else // o is an array of length 9 representing values of a 3x3 matrix
					{ M[i][j] += this.m[i][k] * o[k+j*3]}
				}
			}		
		}	
	this.m = M;
	},
	scale: function(x, y, z)
	{	var M = new t3d.V(x,y,z); 
		this.cat(M);  
	},
	rotate: function(angle,axis) //0 for x axis, 1 for y, 2 for z;
	{ var s = Math.sin(angle).toFixed(5), //set precission here
				c = Math.cos(angle).toFixed(5);
		switch (axis)
		{	case 0:
				this.cat([1, 0, 0, 
									0, c,-s,  
									0, s, c,]);
				break;
			case 1:
				this.cat([c, 0,-s, 
									0, 1, 0, 
									s, 0, c,]);
				break;
			case 2:
				this.cat([c,  s, 0, 
									-s, c, 0, 
									0, 	0, 1,]);
				break;
		}
		/*var M = new t3d.V(1);
		 *switch (axis)
		{	case 0:
				M.m[1][1] = M.m[2][2] = c;
				M.m[1][2] = s;
				M.m[2][1] = -s;
				break;
			case 1:
				M.m[0][0] = M.m[2][2] = c;
				M.m[0][2] = s;
				M.m[2][0] = -s;
				break;
			case 2:
				M.m[0][0] = M.m[1][1] = c;
				M.m[1][0] = s;
				M.m[0][1] = -s;
				break;
		}
		this.cat(M);
		*/
	},
	transformArray: function(arr)
	{ var ar=[];
		for(var i=0;i<arr.length/3;i++)
		{	var i3=i*3,
					x=arr[i3],
					y=arr[i3+1],
					z=arr[i3+2];
			for (var j=0;j<3;j++)
			{ ar[i3+j]=this.m[0][j]*x+this.m[1][j]*y+this.m[2][j]*z;
				if (this.t) { ar[i3+j] += this.t[j]}
			}
		}
		return ar;
	},
	translate: function(x, y, z)
	{ if (!this.t) {this.t = [x,y,z]} //if we did not translate at instantiation, do it now
		else
		{	this.t[0] += x;
			this.t[1] += y;
			this.t[2] += z;
		}
	}
}