class Cube {
  constructor(color = [1, 1, 1, 1]) {
    this.type = "cube";

    var colorBuffer = gl.createBuffer();
    if (!colorBuffer) {
      console.log("Failed to create the buffer object");
      return -1;
    }
    this.colorBuffer = colorBuffer;
    this.baseColor = color;
    let tints = [
      0.7, //back
      1.0, //front
      0.8, //top
      0.6, //bottom
      0.9, //right
      0.9, //left
    ];
    let shadedColors = [];
    for (let i = 0; i < 6; ++i) {
      let tint = tints[i];
      for (let j = 0; j < 6; ++j) {
        shadedColors.push(
          (this.baseColor[0] / 255) * tint,
          (this.baseColor[1] / 255) * tint,
          (this.baseColor[2] / 255) * tint,
          1,
        );
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(shadedColors),
      gl.DYNAMIC_DRAW,
    );

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create the buffer object");
      return -1;
    }
    this.vertexBuffer = vertexBuffer;
    this.vertices = new Float32Array([
      // Front face (z = +0.5)
      -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,

      -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

      // Back face (z = -0.5)
      -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,

      -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,

      // Top face (y = +0.5)
      -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,

      -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,

      // Bottom face (y = -0.5)
      -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5,

      -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5,

      // Right face (x = +0.5)
      0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,

      0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,

      // Left face (x = -0.5)
      -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5,

      -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
    ]);
    //Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    //Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

    this.matrix = new Matrix4();
  }

  render() {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    //Bind the color buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);

    // Assign the buffer object to a_Postion variable
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);

    // Enable the assignmnet to a_Position variable
    gl.enableVertexAttribArray(a_Color);

    //Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    // Assign the buffer object to a_Postion variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // Enable the assignmnet to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
  }
}
