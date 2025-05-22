class Sphere {
constructor(color = [1, 1, 1, 1]) {
    this.type = "sphere";

    this.baseColor = color;

    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log("Failed to create the buffer object");
      return -1;
    }
    this.vertexBuffer = vertexBuffer;
    this.vertexData = [];
    this.vertices = [];
    this.normals = this.vertices;

    let d=Math.PI/10;
    let dd=Math.PI/10;

    for (let t=0; t < Math.PI; t+=d) {
        for (let r=0; r<(2*Math.PI); r+=d) {
            var p1 = [Math.sin(t)*Math.cos(r), Math.sin(t)*Math.sin(r), Math.cos(t)];
            var p2 = [Math.sin(t+dd)*Math.cos(r), Math.sin(t+dd)*Math.sin(r), Math.cos(t+dd)];
            var p3 = [Math.sin(t)*Math.cos(r+dd), Math.sin(t)*Math.sin(r+dd), Math.cos(t)];
            var p4 = [Math.sin(t+dd)*Math.cos(r+dd), Math.sin(t+dd)*Math.sin(r+dd), Math.cos(t+dd)];

            this.vertices.push(
              ...p1, ...p2, ...p4,
              ...p1, ...p4, ...p3
            );
        }
    }
    
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
    console.log(this.normals)
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

      vertexData.push(
        ...this.matrix.multiplyVector3(vertex).elements,
        //UV coords
        0,
        0,
        ...this.baseColor,
        //texColorWeight
        0,
        this.normals[i],
        this.normals[i + 1],
        -this.normals[i + 2],
      );
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.DYNAMIC_DRAW);
  }
}