class Block {
  constructor(chunk, uv, color = [1, 1, 1, 1], textureWeight = 1.0) {
    this.type = "block";
    this.chunk = chunk;

    this.baseColor = color;

    this.vertices = new Float32Array([
      //UV structure: array containing arrays of uv coords of the four corners of the square texture.
      //order is front, back, top, bot, right, left

      // Front face (z = +0.5)
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,

      -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

      // Back face (z = -0.5)
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
      //front face (z = -0.5)
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

      // Back face (z = +0.5)
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
      0, 0, -1,  0, 0, -1,  0, 0, -1,
      0, 0, -1,  0, 0, -1,  0, 0, -1,

      0, 0, 1,  0, 0, 1,  0, 0, 1,
      0, 0, 1,  0, 0, 1,  0, 0, 1,

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

  //applies matrix transformation and returns new cube data
  compute() {
    //structure of chunkData [x, y, z,   u, v,   r, g, b, a,   textureweight]
    let chunkVertexData = this.chunk.vertexData;
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

      chunkVertexData.push(
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
  }
}
