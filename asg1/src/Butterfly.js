function coord(x, y) {
  return [(x - 0.5) / 7.5, y / 7.5];
}

function drawButterfly() {
  const gray = [0.49, 0.48, 0.48, 1.0];
  const darkGray = [0.4, 0.39, 0.39, 1.0];
  const skyBlue = [0.4, 0.7, 1.0, 1.0];
  const royalBlue = [0.2, 0.4, 0.9, 1.0];
  const indigo = [0.1, 0.2, 0.5, 1.0];
  const triangles = [
    {
      //Body of butterfly
      color: gray,
      verts: new Float32Array([
        ...coord(0, -2),
        ...coord(1, -2),
        ...coord(0, 2),

        ...coord(1 / 4, 2),
        ...coord(1 / 4 + 1 / 6, 2 + 1 / 4),
        ...coord(1 / 6, 2 + 1 / 4),
      ]),
    },
    {
      color: darkGray,
      verts: new Float32Array([
        ...coord(1, -2),
        ...coord(1, 2),
        ...coord(0, 2),

        ...coord(1 - 1 / 4, 2),
        ...coord(1 - 1 / 6, 2 + 1 / 4),
        ...coord(1 - 1 / 4 - 1 / 6, 2 + 1 / 4),
      ]),
    },
    {
      //left wing
      color: skyBlue,
      verts: new Float32Array([
        ...coord(1, 0),
        ...coord(6, 0),
        ...coord(1, 1),

        ...coord(4, -4),
        ...coord(7, -2),
        ...coord(4, -2),

        ...coord(1, 1),
        ...coord(7, 1),
        ...coord(7, 2),

        ...coord(3, 2),
        ...coord(7, 4),
        ...coord(3, 4),

        ...coord(3, -1),
        ...coord(6, -1),
        ...coord(3, 0),

        ...coord(2, -3),
        ...coord(2, -1),
        ...coord(1, -1),

        ...coord(2, -3),
        ...coord(4, -2),
        ...coord(2, -2),
      ]),
    },
    {
      color: royalBlue,
      verts: new Float32Array([
        ...coord(6, 0),
        ...coord(6, 1),
        ...coord(1, 1),

        ...coord(2, -3),
        ...coord(4, -4),
        ...coord(4, -3),

        ...coord(1, 2),
        ...coord(3, 2),
        ...coord(3, 4),

        ...coord(3, 2),
        ...coord(7, 2),
        ...coord(7, 4),

        ...coord(6, 4),
        ...coord(7, 4),
        ...coord(6, 5),

        ...coord(1, -1),
        ...coord(3, -1),
        ...coord(3, 0),

        ...coord(2, -2),
        ...coord(6, -2),
        ...coord(6, -1),
      ]),
    },
    {
      color: indigo,
      verts: new Float32Array([
        ...coord(6, 0),
        ...coord(7, 1),
        ...coord(6, 1),

        ...coord(2, -3),
        ...coord(4, -3),
        ...coord(4, -2),

        ...coord(1, 1),
        ...coord(7, 2),
        ...coord(1, 2),

        ...coord(3, 4),
        ...coord(6, 4),
        ...coord(6, 5),

        ...coord(1, 0),
        ...coord(3, 0),
        ...coord(1, -1),

        ...coord(2, -2),
        ...coord(6, -1),
        ...coord(2, -1),

        ...coord(6, -2),
        ...coord(7, -2),
        ...coord(6, -1),
      ]),
    },
    {
      //right wing
      color: skyBlue,
      verts: new Float32Array([
        ...coord(0, 0),
        ...coord(-5, 0),
        ...coord(0, 1),

        ...coord(-3, -4),
        ...coord(-6, -2),
        ...coord(-3, -2),

        ...coord(0, 1),
        ...coord(-6, 1),
        ...coord(-6, 2),

        ...coord(-2, 2),
        ...coord(-6, 4),
        ...coord(-2, 4),

        ...coord(-2, -1),
        ...coord(-5, -1),
        ...coord(-2, 0),

        ...coord(-1, -3),
        ...coord(-1, -1),
        ...coord(0, -1),

        ...coord(-1, -3),
        ...coord(-3, -2),
        ...coord(-1, -2),
      ]),
    },
    {
      color: royalBlue,
      verts: new Float32Array([
        ...coord(-5, 0),
        ...coord(-5, 1),
        ...coord(0, 1),

        ...coord(-1, -3),
        ...coord(-3, -4),
        ...coord(-3, -3),

        ...coord(0, 2),
        ...coord(-2, 2),
        ...coord(-2, 4),

        ...coord(-2, 2),
        ...coord(-6, 2),
        ...coord(-6, 4),

        ...coord(-5, 4),
        ...coord(-6, 4),
        ...coord(-5, 5),

        ...coord(0, -1),
        ...coord(-2, -1),
        ...coord(-2, 0),

        ...coord(-1, -2),
        ...coord(-5, -2),
        ...coord(-5, -1),
      ]),
    },
    {
      color: indigo,
      verts: new Float32Array([
        ...coord(-5, 0),
        ...coord(-6, 1),
        ...coord(-5, 1),

        ...coord(-1, -3),
        ...coord(-3, -3),
        ...coord(-3, -2),

        ...coord(0, 1),
        ...coord(-6, 2),
        ...coord(0, 2),

        ...coord(-2, 4),
        ...coord(-5, 4),
        ...coord(-5, 5),

        ...coord(0, 0),
        ...coord(-2, 0),
        ...coord(0, -1),

        ...coord(-1, -2),
        ...coord(-5, -1),
        ...coord(-1, -1),

        ...coord(-5, -2),
        ...coord(-6, -2),
        ...coord(-5, -1),
      ]),
    },
  ];

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  triangles.forEach((triangle) => {
    gl.uniform4f(u_FragColor, ...triangle.color);
    gl.bufferData(gl.ARRAY_BUFFER, triangle.verts, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, triangle.verts.length / 2);
  });
}
