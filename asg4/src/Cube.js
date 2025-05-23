class Cube {
  constructor(color = [0, 0, 1, 1], uv = Array(6).fill().map(() => [0, 0, 1, 0, 1, 1, 0, 1]), textureWeight = 0.0) {
    this.type = "cube";

    this.baseColor = color;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create the buffer object");
      return -1;
    }
    this.vertexBuffer = vertexBuffer;
    this.vertexData = [];
    this.vertices = new Float32Array([
      //UV structure: array containing arrays of uv coords of the four corners of the square texture.
      //order is back, front, top, bot, right, left

      // Back face (z = -0.5)
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,

      -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

      // Front face (z = -0.5)
      0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5,

      0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,

      // Top face (y = +0.5)
      -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,

      -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,

      // Bottom face (y = -0.5)
      -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,

      -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,

      // Right face (x = +0.5)
      0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,

      0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,

      // Left face (x = -0.5)
      -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,

      -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
    ]);

    this.uvs = new Float32Array([
      //front face (z = +0.5)
      uv[1][0],
      uv[1][1],
      uv[1][2],
      uv[1][3],
      uv[1][4],
      uv[1][5],

      uv[1][0],
      uv[1][1],
      uv[1][4],
      uv[1][5],
      uv[1][6],
      uv[1][7],

      // Back face (z = -0.5)
      uv[0][0],
      uv[0][1],
      uv[0][2],
      uv[0][3],
      uv[0][4],
      uv[0][5],

      uv[0][0],
      uv[0][1],
      uv[0][4],
      uv[0][5],
      uv[0][6],
      uv[0][7],

      // Top face (y = +0.5)
      uv[2][0],
      uv[2][1],
      uv[2][2],
      uv[2][3],
      uv[2][4],
      uv[2][5],

      uv[2][0],
      uv[2][1],
      uv[2][4],
      uv[2][5],
      uv[2][6],
      uv[2][7],

      // Bottom face (y = -0.5)
      uv[3][0],
      uv[3][1],
      uv[3][2],
      uv[3][3],
      uv[3][4],
      uv[3][5],

      uv[3][0],
      uv[3][1],
      uv[3][4],
      uv[3][5],
      uv[3][6],
      uv[3][7],

      // Right face (x = +0.5)
      uv[4][0],
      uv[4][1],
      uv[4][2],
      uv[4][3],
      uv[4][4],
      uv[4][5],

      uv[4][0],
      uv[4][1],
      uv[4][4],
      uv[4][5],
      uv[4][6],
      uv[4][7],

      // Left face (x = -0.5)
      uv[5][0],
      uv[5][1],
      uv[5][2],
      uv[5][3],
      uv[5][4],
      uv[5][5],

      uv[5][0],
      uv[5][1],
      uv[5][4],
      uv[5][5],
      uv[5][6],
      uv[5][7],
    ]);

    this.normals = new Float32Array([
      0, 0, 1,  0, 0, 1,  0, 0, 1,
      0, 0, 1,  0, 0, 1,  0, 0, 1,

      0, 0, -1,  0, 0, -1,  0, 0, -1,
      0, 0, -1,  0, 0, -1,  0, 0, -1,

      0, 1, 0,  0, 1, 0,  0, 1, 0,
      0, 1, 0,  0, 1, 0,  0, 1, 0,

      0, -1, 0,  0, -1, 0,  0, -1, 0,
      0, -1, 0,  0, -1, 0,  0, -1, 0,
      
      1, 0, 0,  1, 0, 0,  1, 0, 0,
      1, 0, 0,  1, 0, 0,  1, 0, 0,

      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
      -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
    ]);

    this.texColorWeight = textureWeight;
    this.matrix = new Matrix4();
  }

  reset() {
    this.matrix.setIdentity();
  }

  render(){
    //structure of vertexData [x, y, z,   u, v,   r, g, b, a,   textureweight]
    //remember to build once before rendering

    const stride = 13;

    var FSIZE = Float32Array.BYTES_PER_ELEMENT;

    //Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    // Assign the buffer object to a_Postion variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * stride, 0);

    // Enable the assignmnet to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_UV variable
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * stride, FSIZE * 3);

    // Enable the assignmnet to a_UV variable
    gl.enableVertexAttribArray(a_UV);

    // Assign the buffer object to a_Color variable
    gl.vertexAttribPointer(
      a_Color,
      4,
      gl.FLOAT,
      false,
      FSIZE * stride,
      FSIZE * 5,
    );

    // Enable the assignmnet to a_Color variable
    gl.enableVertexAttribArray(a_Color);

    // Assign the buffer object to a_texColorWeight variable
    gl.vertexAttribPointer(
      a_texColorWeight,
      1,
      gl.FLOAT,
      false,
      FSIZE * stride,
      FSIZE * 9,
    );

    // Assign the buffer object to a_Normal variable
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * stride, FSIZE * 10);

    // Enable the assignmnet to a_Normal variable
    gl.enableVertexAttribArray(a_Normal);

    // Enable the assignmnet to a_texColorWeight variable
    gl.enableVertexAttribArray(a_texColorWeight);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexData.length / stride);
  }

  //applies matrix transformation and returns new cube data
  compute() {
    //structure of chunkData [x, y, z,   u, v,   r, g, b, a,   textureweight,   nx, ny, nz]
    this.vertexData = [];
    let vertexData = this.vertexData;
    let vertex = new Vector3();
    for (let i = 0; i < this.vertices.length; i += 3) {
      vertex.elements = [
        this.vertices[i],
        this.vertices[i + 1],
        this.vertices[i + 2],
      ];
      let uvIndex = (i / 3) * 2;
      let u = this.uvs[uvIndex];
      let v = this.uvs[uvIndex + 1];

      vertexData.push(
        ...this.matrix.multiplyVector3(vertex).elements,
        u,
        v,
        ...this.baseColor,
        this.texColorWeight,

        this.normals[i],
        this.normals[i + 1],
        this.normals[i + 2],
      );
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.DYNAMIC_DRAW);
  }
}
