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

Face = function()
{	this.p2d = [];
	this.p3d = [];
	this.color = 'black';
}

Face.prototype.scale = function(focus)
{ for (var i=0;i<this.p3d.length;i++)
			{ var i3 = i*3;
			  var i2 = i*2;
				var scale = focus/(this.p3d[i3+2]+focus);
				this.p2d[i2] = this.p3d[i3]*scale;
				this.p2d[i2+1] = this.p3d[i3+1]*scale;
			}
}

Face.prototype.draw = function(context)
{ var c = context || ctx;
	c.moveTo(this.p2d[0],this.p2d[1]);
	for (var i=1;i<this.p2d.length;i++)
	{ var i2 = i*2;
		c.lineTo(this.p2d[i2],this.p2d[i2+1]);
	}
	c.lineTo(this.p2d[0],this.p2d[1]);	
}

