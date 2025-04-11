class Triangle{
    constructor(xy, color, size){
        this.position = xy;
        this.color = color;
        this.size = size;

        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1
        }
        this.buffer = vertexBuffer

        gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

        gl.uniform1f(u_Size, size);

        var d = size/200.0; //delta
        this.vertices = [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d];
    }
    render() {

        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    
        //Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW)
    
        // Assign the buffer object to a_Postion variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
        // Enable the assignmnet to a_Position variable
        gl.enableVertexAttribArray(a_Position);
    
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}