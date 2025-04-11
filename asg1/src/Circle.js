class Circle{
    constructor(center, color, size, detail){
        this.type='circle';
        this.position = center;
        this.color = color;
        this.size = size;
        this.segments = detail;

        var vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1
        }
        this.buffer = vertexBuffer;
        this.vertices = [this.position[0], this.position[1]];

        var  d = size/200.0;
        for (let i = 0; i <= this.segments; i++) {
            let angle = (i / this.segments) * 2 * Math.PI;
            let x = this.position[0] + Math.cos(angle) * d;
            let y = this.position[1] + Math.sin(angle) * d;
            this.vertices.push(x, y);
        }
    }

    render() {
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        var slices = this.segments;

        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    
        //Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW)
    
        // Assign the buffer object to a_Postion variable
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
        // Enable the assignmnet to a_Position variable
        gl.enableVertexAttribArray(a_Position);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length/2);
    }
}
