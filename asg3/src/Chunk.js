class chunk {
    constructor(origin) {
        this.x = origin[0];
        this.y = origin[1];
        this.z = origin[2];
        this.map = []

        
        var chunkBuffer = gl.createBuffer();
        if (!chunkBuffer) {
            console.log('Failed to create the buffer object');
            return -1
        }
        this.chunkBuffer = chunkBuffer;
        this.map = []
        this.vertexData = [];
    }

    render () {
        //******need to bake rgba into buffer!!!!********
        const stride = 5;


        gl.uniform4f(u_Color, rgba[0], rgba[1], rgba[2], 1);

        gl.uniform1f(u_texColorWeight, this.texColorWeight);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);   

        var FSIZE = this.vertices.BYTES_PER_ELEMENT;

        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkBuffer);
    
        // Assign the buffer object to a_Postion variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*stride, 0);
    
        // Enable the assignmnet to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Assign the buffer object to a_UV variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE*stride, FSIZE*3);

        // Enable the assignmnet to a_UV variable
        gl.enableVertexAttribArray(a_UV);
    
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/stride);
    }

    rebuild() {
        for (let i = 0; i < this.map.length; i++){
            map[i].compute();
        }
    }
}

//if render draw everything in buffer