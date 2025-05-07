class Cube{
    constructor(uv, color=[1, 1, 1, 1], textureWeight=1.0){
        this.type='cube';

        this.baseColor = color;

        var vertexUVBuffer = gl.createBuffer();
        if (!vertexUVBuffer) {
            console.log('Failed to create the buffer object');
            return -1
        }
        this.vertexUVBuffer = vertexUVBuffer;
        this.vertices = new Float32Array([
            //UV structure: array containing arrays of uv coords of the four corners of the square texture. 
            //order is front, back, top, bot, right, left

        // Front face (z = -0.5)
        -0.5, -0.5,  -0.5, uv[1][0], uv[1][1],
        0.5, -0.5,  -0.5, uv[1][2], uv[1][3],
        0.5,  0.5,  -0.5, uv[1][4], uv[1][5],

        -0.5, -0.5,  -0.5, uv[1][0], uv[1][1],
        0.5,  0.5,  -0.5, uv[1][4], uv[1][5],
        -0.5,  0.5,  -0.5, uv[1][6], uv[1][7],

        // Back face (z = +0.5)
        0.5, -0.5,  0.5, uv[0][0], uv[0][1],
        -0.5, -0.5,  0.5, uv[0][2], uv[0][3],
        -0.5,  0.5,  0.5, uv[0][4], uv[0][5],

        0.5, -0.5,  0.5, uv[0][0], uv[0][1],
        -0.5,  0.5,  0.5, uv[0][4], uv[0][5],
        0.5,  0.5,  0.5, uv[0][6], uv[0][7],

        // Top face (y = +0.5)
        -0.5,  0.5,  -0.5, uv[2][0], uv[2][1],
        0.5,  0.5,  -0.5, uv[2][2], uv[2][3],
        0.5,  0.5, 0.5, uv[2][4], uv[2][5],

        -0.5,  0.5,  -0.5, uv[2][0], uv[2][1],
        0.5,  0.5, 0.5, uv[2][4], uv[2][5],
        -0.5,  0.5, 0.5, uv[2][6], uv[2][7],

        // Bottom face (y = -0.5)
        -0.5, -0.5,  0.5, uv[3][0], uv[3][1],
        0.5, -0.5,  0.5, uv[3][2], uv[3][3],
        0.5, -0.5, -0.5, uv[3][4], uv[3][5],

        -0.5, -0.5,  0.5, uv[3][0], uv[3][1],
        0.5, -0.5, -0.5, uv[3][4], uv[3][5],
        -0.5, -0.5, -0.5, uv[3][6], uv[3][7],

        // Right face (x = +0.5)
        0.5, -0.5,  -0.5, uv[4][0], uv[4][1],
        0.5, -0.5, 0.5, uv[4][2], uv[4][3],
        0.5,  0.5, 0.5, uv[4][4], uv[4][5],

        0.5, -0.5,  -0.5, uv[4][0], uv[4][1],
        0.5,  0.5, 0.5, uv[4][4], uv[4][5],
        0.5,  0.5,  -0.5, uv[4][6], uv[4][7],

        // Left face (x = -0.5)
        -0.5, -0.5,  0.5, uv[5][0], uv[5][1],
        -0.5,  -0.5,  -0.5, uv[5][2], uv[5][3],
        -0.5,  0.5, -0.5, uv[5][4], uv[5][5],

        -0.5, -0.5,  0.5, uv[5][0], uv[5][1],
        -0.5,  0.5, -0.5, uv[5][4], uv[5][5],
        -0.5, 0.5, 0.5, uv[5][6], uv[5][7],

        ]);
        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexUVBuffer);
        //Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW)

        this.texColorWeight = textureWeight;
        this.matrix = new Matrix4();
    }

    render() {
        //set color
        var rgba = this.baseColor;
        gl.uniform4f(u_Color, rgba[0], rgba[1], rgba[2], 1);

        gl.uniform1f(u_texColorWeight, this.texColorWeight);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);   

        var FSIZE = this.vertices.BYTES_PER_ELEMENT;

        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexUVBuffer);
    
        // Assign the buffer object to a_Postion variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*5, 0);
    
        // Enable the assignmnet to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Assign the buffer object to a_UV variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE*5, FSIZE*3);

        // Enable the assignmnet to a_UV variable
        gl.enableVertexAttribArray(a_UV);
    
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/5);
    }
}
