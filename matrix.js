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


function Matrix(x,y)
{ this.rows = x;
	this.cols = y;
	this.m = [];
	for (i=0;i<x;i++)
	{ this.m[i] = [];
	  for (j=0;j<this.cols;j++)
		{	if (i == j){this.m[i][j] = 1} else {this.m[i][j] = 0}}
	}
}

Matrix.prototype.identify = function()
{ for (i=0;i<this.rows;i++)
	{ for (j=0;j<this.cols;j++)
		{	if (i == j){this.m[i][j] = 1} else {this.m[i][j] = 0}}		
	}
}

Matrix.prototype.zero = function()
{ for (i=0;i<this.rows;i++)
	{ for (j=0;j<this.cols;j++)
		{ this.m[i][j] = 0;}		
	}
}

Matrix.prototype.clone = function(o) //take the values from some other matrix o;
{ for (i=0;i<this.rows;i++)
	{ for (j=0;j<this.cols;j++)
		{ this.m[i][j] = o.m[i][j];}		
	}
}

Matrix.prototype.multiply = function(o) //concatinate this matrix with other matrix o;
{ var temp = new Matrix(4,4);
	temp.zero();
	for (i=0;i<this.rows;i++)
	{ for (j=0;j<this.cols;j++)
		{ for (k=0;k<this.cols;k++) // note number of columns in this must equal the number of rows in other;
			{ temp.m[i][j] += this.m[i][k] * o.m[k][j];}
		}		
	}
	
	this.clone(temp);
}

Matrix.prototype.scale = function(x, y, z)
{ var temp = new Matrix(4,4);
	temp.m[0][0] = x;
	temp.m[1][1] = y;
	temp.m[2][2] = z;
	this.multiply(temp);  
}

Matrix.prototype.rotate = function(angle,axis) //0 for x, 1 for y, 2 for z;
{ var sin = Math.sin(angle);
  var cos = Math.cos(angle);
  var temp = new Matrix(4,4);
	switch (axis)
	{
		case 0:
			temp.m[1][1] = temp.m[2][2] = cos;
			temp.m[1][2] = sin;
			temp.m[2][1] = -sin;
			break;
		case 1:
			temp.m[0][0] = temp.m[2][2] = cos;
			temp.m[0][2] = sin;
			temp.m[2][0] = -sin;
			break;
		case 2:
			temp.m[0][0] = temp.m[1][1] = cos;
			temp.m[1][0] = sin;
			temp.m[0][1] = -sin;
			break;
	}
  this.multiply(temp);
}

Matrix.prototype.reflect = function(axis) //0 for x, 1 for y, 2 for z;
{ var temp = new Matrix(4,4);
	switch (axis)
	{
		case 0:
			temp.m[0][0] = -1;
			break;
		case 1:
			temp.m[1][1] = -1;
			break;
		case 2:
			temp.m[2][2] = -1;
			break;
	}
  this.multiply(temp);
}

Matrix.prototype.transformPoint = function(x,y,z)
{ var a = this.transformArray([x,y,z]);
  return {x: a[0],y: a[1], z: a[2]};
}

Matrix.prototype.transformArray=function(arr)
{ var rVal=[];
	var l=arr.length/3;
	for(var i=0;i<l;i++)
	{	var i3=i*3;
		var x=arr[i3];
		var y=arr[i3+1];
		var z=arr[i3+2];
		
		rVal[i3]=this.m[0][0]*x+this.m[1][0]*y+this.m[2][0]*z+this.m[3][0];
		rVal[i3+1]=this.m[0][1]*x+this.m[1][1]*y+this.m[2][1]*z+this.m[3][1];
		rVal[i3+2]=this.m[0][2]*x+this.m[1][2]*y+this.m[2][2]*z+this.m[3][2];
	}
	return rVal;
}

Matrix.prototype.translate = function(dx, dy, dz)
{
  this.m[3][0] += dx;
  this.m[3][1] += dy;
  this.m[3][2] += dz;
}