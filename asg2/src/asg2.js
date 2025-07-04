// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalTransformMatrix;
  varying vec4 v_Color;
  void main() {
    gl_Position = u_GlobalTransformMatrix * u_ModelMatrix * a_Position;
    v_Color = a_Color;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
  }`;

// Global Variables
let canvas;
let gl;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalTransformMatrix = new Matrix4();
let g_trackballRotationMatrix = new Matrix4();
let a_Position;
let a_Color;
let u_ModelMatrix;
let u_GlobalTransformMatrix;

let isDrawing = true;

function setupWegbGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  a_Color = gl.getAttribLocation(gl.program, "a_Color");
  if (!a_Color) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  //Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  //Get the storage location of u_GlobalRotateMatrix
  u_GlobalTransformMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalTransformMatrix",
  );
  if (!u_GlobalTransformMatrix) {
    console.log(
      "Failed to get the storage location of u_GlobalTransformMatrix",
    );
    return;
  }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let isDragging = false;

let tailSlider1, tailSlider2, tailSlider3;
//set up actions for the HTML UI elements
function addActionsForHTML() {
  var camAngleX = document.getElementById("camAngleX");

  camAngleX.addEventListener("input", function () {
    g_globalAngleX = camAngleX.value;
    g_trackballRotationMatrix = new Matrix4();
    renderAllShapes();
  });

  var camAngleY = document.getElementById("camAngleY");

  camAngleY.addEventListener("input", function () {
    g_globalAngleY = camAngleY.value;
    g_trackballRotationMatrix = new Matrix4();
    renderAllShapes();
  });

  tailSlider1 = document.getElementById("tailJoint1");
  tailSlider1.addEventListener("input", function () {
    backTailRotate = tailSlider1.value;
    calculateDragon();
  });

  tailSlider2 = document.getElementById("tailJoint2");
  tailSlider2.addEventListener("input", function () {
    tailJointRotate = tailSlider2.value;
    calculateDragon();
  });

  tailSlider3 = document.getElementById("tailJoint3");
  tailSlider3.addEventListener("input", function () {
    flameJointRotate = tailSlider3.value;
    calculateDragon();
  });

  canvas = document.getElementById("webgl");

  document.getElementById("Color1").onclick = function () {
    bodyColor = [249, 177, 101];
    caColor = [213, 221, 221];
    wingColor = [54, 147, 162];
    tongueColor = [168, 120, 146];
    counterColor = [250, 238, 178];
    pupilColor = [49, 44, 32];
    nostrilColor = [49, 44, 32];
    eyeWhiteColor = [248, 245, 250];
    flameColor = [238, 86, 51];
    flameComplimentColor = [252, 251, 119];
    buildDragon();
    calculateDragon();
    renderAllShapes();
  };

  document.getElementById("Color2").onclick = function () {
    bodyColor = [135, 125, 151];
    caColor = [213, 221, 221];
    wingColor = [165, 52, 91];
    tongueColor = [159, 73, 88];
    counterColor = [250, 238, 178];
    pupilColor = [165, 52, 91];
    nostrilColor = [49, 44, 32];
    eyeWhiteColor = [248, 245, 250];
    flameColor = [238, 86, 51];
    flameComplimentColor = [252, 251, 119];
    buildDragon();
    calculateDragon();
    renderAllShapes();
  };

  document.getElementById("camReset").onclick = function () {
    resetCamera();
  };
  document.getElementById("jointReset").onclick = function () {
    resetSliders();
    calculateDragon();
  };
  document.getElementById("startAnimate").onclick = function () {
    happy = false;
    bodyRotate = 10;
    bodyTranslate = -0.2;
    walking = true;
  };
  document.getElementById("stopAnimate").onclick = function () {
    stopWalk();
  };

  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    let scaleFactor = 1;
    if (e.deltaY > 0) {
      scaleFactor = 0.95;
    } else {
      scaleFactor = 1.05;
    }
    g_globalTransformMatrix.scale(scaleFactor, scaleFactor, scaleFactor);
  });

  canvas.addEventListener("mousedown", function (e) {
    if (e.shiftKey) {
      secretAnimationStart = performance.now() / 1000.0;
      stopWalk();
      happy = true;
    } else {
      isDragging = true;
      startX = (e.clientX / canvas.width) * 2 - 1;
      startY = (1 - e.clientY / canvas.height) * 2 - 1;
      startVec = projectToSphere(startX, startY);
    }
  });

  canvas.addEventListener("mousemove", function (e) {
    if (!isDragging) return;

    let currX = (e.clientX / canvas.width) * 2 - 1;
    let currY = (1 - e.clientY / canvas.height) * 2 - 1;
    let currVec = projectToSphere(currX, currY);

    let axis = [
      startVec[1] * currVec[2] - startVec[2] * currVec[1],
      startVec[2] * currVec[0] - startVec[0] * currVec[2],
      startVec[0] * currVec[1] - startVec[1] * currVec[0],
    ];

    axis = [-axis[0], -axis[1], -axis[2]];

    let dot =
      startVec[0] * currVec[0] +
      startVec[1] * currVec[1] +
      startVec[2] * currVec[2];
    let angle = Math.acos(Math.min(1, Math.max(-1, dot)));

    var sensitivity = 2;

    rotateModel(angle * sensitivity, axis);

    renderAllShapes();

    startVec = currVec;
  });

  canvas.addEventListener("mouseup", function (e) {
    isDragging = false;
  });
}

var g_shapesList = [];

let secretAnimationStart;
//Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  //check the time at the start of this function
  var startTime = performance.now();
  var globalTransformMat;
  globalTransformMat = new Matrix4()
    .multiply(g_globalTransformMatrix)
    .rotate(g_globalAngleX, 0, 1, 0)
    .rotate(g_globalAngleY, 1, 0, 0)
    .multiply(g_trackballRotationMatrix);
  gl.uniformMatrix4fv(
    u_GlobalTransformMatrix,
    false,
    globalTransformMat.elements,
  );

  if (walking && !happy) {
    g_shapesList = [];
    animateWalk();
    calculateDragon();
  }

  if (happy && !walking) {
    let seconds = performance.now() / 1000.0 - secretAnimationStart;
    if (seconds < 2) {
      g_shapesList = [];
      bodyRotate = 10 + 360 * seconds;
      bodyTranslate = -0.2 + 0.2 * Math.abs(Math.sin(2 * Math.PI * seconds));

      calculateDragon();
    } else {
      happy = false;
    }
  }
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // var len = g_points.length;
  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML(
    "numdot: " +
      len +
      " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(10000 / duration) / 10,
    "numdot",
  );
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
  }
  htmlElm.innerHTML = text;
}

function projectToSphere(x, y, radius = 1.0) {
  let d = Math.sqrt(x * x + y * y);
  let z;
  if (d < radius * Math.sqrt(0.5)) {
    z = Math.sqrt(radius * radius - d * d);
  } else {
    let t = radius / Math.sqrt(2.0);
    z = (t * t) / d;
  }
  return [x, y, z];
}

function rotateModel(angle, axis) {
  let length = Math.sqrt(axis[0]**2 + axis[1]**2 + axis[2]**2);
  if (length < 1e-6 || isNaN(angle)) return;

  let rotationMatrix = new Matrix4();
  rotationMatrix.setRotate((angle * 180) / Math.PI, axis[0], axis[1], axis[2]);
  g_trackballRotationMatrix = rotationMatrix.multiply(g_trackballRotationMatrix);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  console.log(g_seconds);
  renderAllShapes();
  requestAnimationFrame(tick);
}

let walking = false;
let happy = false;
let bodyRotate = 10;
let bodyTranslate = -0.2;
let backTailRotate = 0;
let tailJointRotate = 0;
let flameJointRotate = 0;
let jointTranslate = 0;
let leftWingTranslate = 0;
let rightWingTranslate = 0;
let leftLegRotate = 0;
let rightLegRotate = 0;
let leftArmRotate = 0;
let rightArmRotate = 0;
let neckRotate = 0;
function animateWalk() {
  walking = true;
  resetSliders();
  jointTranslate = 0.012 * Math.cos(2 * g_seconds);
  leftWingTranslate = 0.03 * Math.cos(-3.5 * g_seconds);
  rightWingTranslate = -0.03 * Math.cos(3.5 * g_seconds);
  leftLegRotate = 20 * Math.sin(4 * g_seconds);
  rightLegRotate = 20 * Math.sin(-4 * g_seconds);
  leftArmRotate = -20 * Math.cos(3.5 * g_seconds);
  rightArmRotate = 20 * Math.cos(3.5 * g_seconds);
  neckRotate = 5 * Math.cos(5 * g_seconds);
  flameJointRotate = (360 * g_seconds) / 5;
}

function stopWalk() {
  walking = false;
  resetSliders();
  g_shapesList = [];
  calculateDragon();
  renderAllShapes();
}

function resetSliders() {
  bodyRotate = 10;
  bodyTranslate = -0.2;
  backTailRotate = 0;
  tailJointRotate = 0;
  flameJointRotate = 0;
  jointTranslate = 0;
  leftWingTranslate = 0;
  rightWingTranslate = 0;
  leftLegRotate = 0;
  rightLegRotate = 0;
  leftArmRotate = 0;
  rightArmRotate = 0;
  neckRotate = 0;
  tailSlider1.value = 0;
  tailSlider2.value = 0;
  tailSlider3.value = 0;
}

function resetCamera() {
  g_globalTransformMatrix = new Matrix4();
  g_globalAngleX = 0;
  g_globalAngleY = 0;
  camAngleX.value = g_globalAngleX;
  camAngleY.value = g_globalAngleY;
  g_trackballRotationMatrix = new Matrix4();
  renderAllShapes();
}

function calculateDragon() {
  g_shapesList = [];
  //Charizard Body
  body.matrix = new Matrix4();
  body.matrix.rotate(bodyRotate, 0, 1, 0);
  body.matrix.translate(0, bodyTranslate, 0);
  var bodyCoord = new Matrix4(body.matrix);
  body.matrix.scale(0.46, 0.6, 0.46);
  g_shapesList.push(body);

  bodyCounter.matrix = new Matrix4(bodyCoord);
  bodyCounter.matrix.translate(0, -0.13, -0.0301);
  bodyCounter.matrix.scale(0.4509, 0.5, 0.52);
  g_shapesList.push(bodyCounter);

  //Charizard Tail
  backTail.matrix = new Matrix4(bodyCoord);
  backTail.matrix.translate(0, -0.19, 0.4);
  backTail.matrix.rotate(backTailRotate, 0, 0, 1);
  let backTailCoord = new Matrix4(backTail.matrix);
  backTail.matrix.scale(0.2301, 0.2301, 0.6001);
  g_shapesList.push(backTail);

  backTailCounter.matrix = new Matrix4(backTailCoord);
  backTailCounter.matrix.translate(0, -0.07, 0);
  backTailCounter.matrix.scale(0.23, 0.23, 0.6);
  g_shapesList.push(backTailCounter);

  tailJoint.matrix = new Matrix4(backTailCoord);
  tailJoint.matrix.translate(0, 0, 0.24);
  //Rotate tail joint
  tailJoint.matrix.rotate(tailJointRotate, 1, 0, 0);
  let tailJointCoord = new Matrix4(tailJoint.matrix);
  tailJoint.matrix.scale(0.1, 0.1, 0.1);
  g_shapesList.push(tailJoint);

  upperTail.matrix = new Matrix4(tailJointCoord);
  upperTail.matrix.translate(0, 0.185, 0);
  let upperTailCoord = new Matrix4(upperTail.matrix);
  upperTail.matrix.scale(0.2301, 0.6001, 0.2301);
  g_shapesList.push(upperTail);

  upperTailCounter.matrix = new Matrix4(upperTailCoord);
  upperTailCounter.matrix.translate(0, -0.07, 0.07);
  upperTailCounter.matrix.scale(0.23, 0.6, 0.23);
  g_shapesList.push(upperTailCounter);

  //charizard flame
  flameJoint.matrix = new Matrix4(upperTailCoord);
  flameJoint.matrix.translate(0, 0.24, 0);
  flameJoint.matrix.translate(0, jointTranslate, 0);
  flameJoint.matrix.rotate(flameJointRotate, 0, 1, 0);
  flameJoint.matrix.rotate(0, 1, 0, 0);
  let falmeJointCoord = new Matrix4(flameJoint.matrix);
  flameJoint.matrix.scale(0.1, 0.1, 0.1);
  g_shapesList.push(flameJoint);

  flameBase.matrix = new Matrix4(falmeJointCoord);
  flameBase.matrix.translate(0, 0.15, 0);
  flameBase.matrix.scale(0.28, 0.15, 0.28);
  g_shapesList.push(flameBase);

  flameTop1.matrix = new Matrix4(falmeJointCoord);
  flameTop1.matrix.translate(0, 0.19, 0);
  flameTop1.matrix.scale(0.2801, 0.0701, 0.2801);
  g_shapesList.push(flameTop1);

  flameTop2.matrix = new Matrix4(falmeJointCoord);
  flameTop2.matrix.translate(0, 0.25, 0);
  flameTop2.matrix.scale(0.2201, 0.0701, 0.2201);
  g_shapesList.push(flameTop2);

  flameTop3.matrix = new Matrix4(falmeJointCoord);
  flameTop3.matrix.translate(0, 0.32, 0);
  flameTop3.matrix.scale(0.1501, 0.0701, 0.1501);
  g_shapesList.push(flameTop3);

  //Charizard Wings
  leftinnerWing.matrix = new Matrix4(bodyCoord);
  leftinnerWing.matrix.translate(-0.18, 0.18, 0.26);
  leftinnerWing.matrix.translate(0, leftWingTranslate, 0);
  var leftinnerWingCoord = new Matrix4(leftinnerWing.matrix);
  leftinnerWing.matrix.scale(0.08, 0.35, 0.08);
  g_shapesList.push(leftinnerWing);

  lefttopWing1.matrix = new Matrix4(leftinnerWingCoord);
  lefttopWing1.matrix.translate(-0.059, 0.15, 0);
  lefttopWing1.matrix.scale(0.2, 0.08, 0.08);
  g_shapesList.push(lefttopWing1);

  lefttopWing2.matrix = new Matrix4(leftinnerWingCoord);
  lefttopWing2.matrix.translate(-0.18, 0.31, 0);
  lefttopWing2.matrix.scale(0.08, 0.4, 0.08);
  g_shapesList.push(lefttopWing2);

  leftWingHorn.matrix = new Matrix4(leftinnerWingCoord);
  leftWingHorn.matrix.translate(-0.18, 0.56, 0);
  leftWingHorn.matrix.scale(0.05, 0.06, 0.05);
  g_shapesList.push(leftWingHorn);

  lefttopWing3.matrix = new Matrix4(leftinnerWingCoord);
  lefttopWing3.matrix.translate(-0.428, 0.5, 0);
  lefttopWing3.matrix.scale(0.58, 0.08, 0.08);
  g_shapesList.push(lefttopWing3);

  leftWing1.matrix = new Matrix4(leftinnerWingCoord);
  leftWing1.matrix.translate(-0.415, 0.18, 0);
  leftWing1.matrix.scale(0.5, 0.58, 0.04);
  var leftWing1Coord = new Matrix4(leftWing1.matrix);
  g_shapesList.push(leftWing1);

  leftWingBack1.matrix = new Matrix4(leftWing1Coord);
  leftWingBack1.matrix.translate(-0.035, 0.001, 0.001);
  g_shapesList.push(leftWingBack1);

  leftWing2.matrix = new Matrix4(leftinnerWingCoord);
  leftWing2.matrix.translate(-0.15, 0, 0);
  leftWing2.matrix.scale(0.23, 0.22, 0.04);
  var leftWing2Coord = new Matrix4(leftWing2.matrix);
  g_shapesList.push(leftWing2);

  leftWingBack2.matrix = new Matrix4(leftWing2Coord);
  leftWingBack2.matrix.scale(1.15, 1, 1);
  leftWingBack2.matrix.translate(0, 0.001, 0.001);
  g_shapesList.push(leftWingBack2);

  leftWing3.matrix = new Matrix4(leftinnerWingCoord);
  leftWing3.matrix.translate(-0.061, -0.066, 0);
  leftWing3.matrix.scale(0.2, 0.22, 0.04);
  var leftWing3Coord = new Matrix4(leftWing3.matrix);
  g_shapesList.push(leftWing3);

  leftWingBack3.matrix = new Matrix4(leftWing3Coord);
  leftWingBack3.matrix.scale(0.999, 0.999, 0.999);
  leftWingBack3.matrix.translate(0, 0, 0.002);
  g_shapesList.push(leftWingBack3);

  leftWing4.matrix = new Matrix4(leftinnerWingCoord);
  leftWing4.matrix.translate(-0.37, -0.13, 0);
  leftWing4.matrix.scale(0.2, 0.17, 0.04);
  var leftWing4Coord = new Matrix4(leftWing4.matrix);
  g_shapesList.push(leftWing4);

  leftWingBack4.matrix = new Matrix4(leftWing4Coord);
  leftWingBack4.matrix.scale(0.999, 0.999, 0.999);
  leftWingBack4.matrix.translate(0, 0, 0.002);
  g_shapesList.push(leftWingBack4);

  leftWing5.matrix = new Matrix4(leftinnerWingCoord);
  leftWing5.matrix.translate(-0.625, -0.18, 0);
  leftWing5.matrix.scale(0.08, 0.18, 0.04);
  var leftWing5Coord = new Matrix4(leftWing5.matrix);
  g_shapesList.push(leftWing5);

  leftWingBack5.matrix = new Matrix4(leftWing5Coord);
  leftWingBack5.matrix.scale(1.2, 0.999, 0.999);
  leftWingBack5.matrix.translate(-0.1, 0, 0.002);
  g_shapesList.push(leftWingBack5);

  //right wing
  rightinnerWing.matrix = new Matrix4(bodyCoord);
  rightinnerWing.matrix.translate(0.18, 0.18, 0.26);
  rightinnerWing.matrix.translate(0, rightWingTranslate, 0);
  rightinnerWing.matrix.scale(-1, 1, 1);
  var rightinnerWingCoord = new Matrix4(rightinnerWing.matrix);
  rightinnerWing.matrix.scale(0.08, 0.35, 0.08);
  g_shapesList.push(rightinnerWing);

  righttopWing1.matrix = new Matrix4(rightinnerWingCoord);
  righttopWing1.matrix.translate(-0.059, 0.15, 0);
  righttopWing1.matrix.scale(0.2, 0.08, 0.08);
  g_shapesList.push(righttopWing1);

  righttopWing2.matrix = new Matrix4(rightinnerWingCoord);
  righttopWing2.matrix.translate(-0.18, 0.31, 0);
  righttopWing2.matrix.scale(0.08, 0.4, 0.08);
  g_shapesList.push(righttopWing2);

  rightWingHorn.matrix = new Matrix4(rightinnerWingCoord);
  rightWingHorn.matrix.translate(-0.18, 0.56, 0);
  rightWingHorn.matrix.scale(0.05, 0.06, 0.05);
  g_shapesList.push(rightWingHorn);

  righttopWing3.matrix = new Matrix4(rightinnerWingCoord);
  righttopWing3.matrix.translate(-0.428, 0.5, 0);
  righttopWing3.matrix.scale(0.58, 0.08, 0.08);
  g_shapesList.push(righttopWing3);

  rightWing1.matrix = new Matrix4(rightinnerWingCoord);
  rightWing1.matrix.translate(-0.415, 0.18, 0);
  rightWing1.matrix.scale(0.5, 0.58, 0.04);
  var rightWing1Coord = new Matrix4(rightWing1.matrix);
  g_shapesList.push(rightWing1);

  rightWingBack1.matrix = new Matrix4(rightWing1Coord);
  rightWingBack1.matrix.translate(-0.035, 0.001, 0.001);
  g_shapesList.push(rightWingBack1);

  rightWing2.matrix = new Matrix4(rightinnerWingCoord);
  rightWing2.matrix.translate(-0.15, 0, 0);
  rightWing2.matrix.scale(0.23, 0.22, 0.04);
  var rightWing2Coord = new Matrix4(rightWing2.matrix);
  g_shapesList.push(rightWing2);

  rightWingBack2.matrix = new Matrix4(rightWing2Coord);
  rightWingBack2.matrix.scale(1.15, 1, 1);
  rightWingBack2.matrix.translate(0, 0.001, 0.001);
  g_shapesList.push(rightWingBack2);

  rightWing3.matrix = new Matrix4(rightinnerWingCoord);
  rightWing3.matrix.translate(-0.061, -0.066, 0);
  rightWing3.matrix.scale(0.2, 0.22, 0.04);
  var rightWing3Coord = new Matrix4(rightWing3.matrix);
  g_shapesList.push(rightWing3);

  rightWingBack3.matrix = new Matrix4(rightWing3Coord);
  rightWingBack3.matrix.scale(0.999, 0.999, 0.999);
  rightWingBack3.matrix.translate(0, 0, 0.002);
  g_shapesList.push(rightWingBack3);

  rightWing4.matrix = new Matrix4(rightinnerWingCoord);
  rightWing4.matrix.translate(-0.37, -0.13, 0);
  rightWing4.matrix.scale(0.2, 0.17, 0.04);
  var rightWing4Coord = new Matrix4(rightWing4.matrix);
  g_shapesList.push(rightWing4);

  rightWingBack4.matrix = new Matrix4(rightWing4Coord);
  rightWingBack4.matrix.scale(0.999, 0.999, 0.999);
  rightWingBack4.matrix.translate(0, 0, 0.002);
  g_shapesList.push(rightWingBack4);

  rightWing5.matrix = new Matrix4(rightinnerWingCoord);
  rightWing5.matrix.translate(-0.625, -0.18, 0);
  rightWing5.matrix.scale(0.08, 0.18, 0.04);
  var rightWing5Coord = new Matrix4(rightWing5.matrix);
  g_shapesList.push(rightWing5);

  rightWingBack5.matrix = new Matrix4(rightWing5Coord);
  rightWingBack5.matrix.scale(1.2, 0.999, 0.999);
  rightWingBack5.matrix.translate(-0.1, 0, 0.002);
  g_shapesList.push(rightWingBack5);

  //Charizard Legs

  //left leg
  leftThigh.matrix = new Matrix4(bodyCoord);
  leftThigh.matrix.translate(-0.2, -0.33, 0);
  leftThigh.matrix.rotate(leftLegRotate, 1, 0, 0);
  var leftThighCoord = new Matrix4(leftThigh.matrix);
  leftThigh.matrix.rotate(12, 1, 0, 0);
  leftThigh.matrix.scale(0.23, 0.3, 0.35);
  g_shapesList.push(leftThigh);

  leftShin.matrix = new Matrix4(leftThighCoord);
  leftShin.matrix.translate(0, -0.17, -0.026);
  leftShin.matrix.scale(0.23, 0.15, 0.35);
  g_shapesList.push(leftShin);

  leftFoot.matrix = new Matrix4(leftThighCoord);
  leftFoot.matrix.translate(0, -0.207, -0.1);
  leftFoot.matrix.scale(0.23, 0.08, 0.3);
  g_shapesList.push(leftFoot);

  leftToeNail1.matrix = new Matrix4(leftThighCoord);
  leftToeNail1.matrix.translate(-0.08, -0.207, -0.18);
  leftToeNail1.matrix.scale(0.06, 0.06, 0.25);
  g_shapesList.push(leftToeNail1);

  leftToeNail2.matrix = new Matrix4(leftThighCoord);
  leftToeNail2.matrix.translate(0, -0.207, -0.18);
  leftToeNail2.matrix.scale(0.06, 0.06, 0.25);
  g_shapesList.push(leftToeNail2);

  leftToeNail3.matrix = new Matrix4(leftThighCoord);
  leftToeNail3.matrix.translate(0.08, -0.207, -0.18);
  leftToeNail3.matrix.scale(0.06, 0.06, 0.25);
  g_shapesList.push(leftToeNail3);

  //Right Leg
  rightThigh.matrix = new Matrix4(bodyCoord);
  rightThigh.matrix.translate(0.2, -0.33, 0);
  rightThigh.matrix.rotate(rightLegRotate, 1, 0, 0);
  var rightThighCoord = new Matrix4(rightThigh.matrix);
  rightThigh.matrix.rotate(12, 1, 0, 0);
  rightThigh.matrix.scale(0.23, 0.3, 0.35);
  g_shapesList.push(rightThigh);

  rightShin.matrix = new Matrix4(rightThighCoord);
  rightShin.matrix.translate(0, -0.17, -0.026);
  rightShin.matrix.scale(0.23, 0.15, 0.35);
  g_shapesList.push(rightShin);

  rightFoot.matrix = new Matrix4(rightThighCoord);
  rightFoot.matrix.translate(0, -0.207, -0.1);
  rightFoot.matrix.scale(0.23, 0.08, 0.3);
  g_shapesList.push(rightFoot);

  rightToeNail1.matrix = new Matrix4(rightThighCoord);
  rightToeNail1.matrix.translate(-0.08, -0.207, -0.18);
  rightToeNail1.matrix.scale(0.06, 0.06, 0.25);
  g_shapesList.push(rightToeNail1);

  rightToeNail2.matrix = new Matrix4(rightThighCoord);
  rightToeNail2.matrix.translate(0, -0.207, -0.18);
  rightToeNail2.matrix.scale(0.06, 0.06, 0.25);
  g_shapesList.push(rightToeNail2);

  rightToeNail3.matrix = new Matrix4(rightThighCoord);
  rightToeNail3.matrix.translate(0.08, -0.207, -0.18);
  rightToeNail3.matrix.scale(0.06, 0.06, 0.25);
  g_shapesList.push(rightToeNail3);

  //Charizard arms

  //left arm
  leftArm.matrix = new Matrix4(bodyCoord);
  leftArm.matrix.translate(-0.34, 0.2, 0);
  //rotate left arm
  leftArm.matrix.rotate(leftArmRotate, 1, 0, 0);
  var leftArmCoord = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.23, 0.1, 0.1);
  g_shapesList.push(leftArm);

  leftforearm.matrix = new Matrix4(leftArmCoord);
  leftforearm.matrix.translate(-0.078, 0, -0.07);
  var leftforearmCoord = new Matrix4(leftforearm.matrix);
  leftforearm.matrix.scale(0.1, 0.1, 0.23);
  g_shapesList.push(leftforearm);

  //left hand
  leftpalm.matrix = new Matrix4(leftforearmCoord);
  leftpalm.matrix.translate(0, 0, -0.1);
  var leftpalmCoord = new Matrix4(leftpalm.matrix);
  leftpalm.matrix.scale(0.2, 0.15, 0.05);
  g_shapesList.push(leftpalm);

  leftknuckles.matrix = new Matrix4(leftpalmCoord);
  leftknuckles.matrix.translate(0, 0.05, -0.05);
  leftknuckles.matrix.scale(0.2, 0.05, 0.08);
  g_shapesList.push(leftknuckles);

  leftfinger1.matrix = new Matrix4(leftpalmCoord);
  leftfinger1.matrix.translate(-0.07, 0.022, -0.07);
  leftfinger1.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(leftfinger1);

  leftfinger2.matrix = new Matrix4(leftpalmCoord);
  leftfinger2.matrix.translate(0, 0.022, -0.08);
  leftfinger2.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(leftfinger2);

  leftfinger3.matrix = new Matrix4(leftpalmCoord);
  leftfinger3.matrix.translate(0.07, 0.022, -0.07);
  leftfinger3.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(leftfinger3);

  leftnail1.matrix = new Matrix4(leftpalmCoord);
  leftnail1.matrix.translate(-0.07, -0.03, -0.07);
  leftnail1.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(leftnail1);

  leftnail2.matrix = new Matrix4(leftpalmCoord);
  leftnail2.matrix.translate(0, -0.03, -0.08);
  leftnail2.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(leftnail2);

  leftnail3.matrix = new Matrix4(leftpalmCoord);
  leftnail3.matrix.translate(0.07, -0.03, -0.07);
  leftnail3.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(leftnail3);

  //right arm
  rightArm.matrix = new Matrix4(bodyCoord);
  rightArm.matrix.translate(0.34, 0.2, 0);
  rightArm.matrix.rotate(rightArmRotate, 1, 0, 0);
  var rightArmCoord = new Matrix4(rightArm.matrix);
  rightArm.matrix.scale(0.23, 0.1, 0.1);
  g_shapesList.push(rightArm);

  forearm.matrix = new Matrix4(rightArmCoord);
  forearm.matrix.translate(0.078, 0, -0.07);
  var forearmCoord = new Matrix4(forearm.matrix);
  forearm.matrix.scale(0.1, 0.1, 0.23);
  g_shapesList.push(forearm);

  //right hand
  rightpalm.matrix = new Matrix4(forearmCoord);
  rightpalm.matrix.translate(0, 0, -0.1);
  var rightpalmCoord = new Matrix4(rightpalm.matrix);
  rightpalm.matrix.scale(0.2, 0.15, 0.05);
  g_shapesList.push(rightpalm);

  rightknuckles.matrix = new Matrix4(rightpalmCoord);
  rightknuckles.matrix.translate(0, 0.05, -0.05);
  rightknuckles.matrix.scale(0.2, 0.05, 0.08);
  g_shapesList.push(rightknuckles);

  finger1.matrix = new Matrix4(rightpalmCoord);
  finger1.matrix.translate(-0.07, 0.022, -0.07);
  finger1.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(finger1);

  rightfinger2.matrix = new Matrix4(rightpalmCoord);
  rightfinger2.matrix.translate(0, 0.022, -0.08);
  rightfinger2.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(rightfinger2);

  rightfinger3.matrix = new Matrix4(rightpalmCoord);
  rightfinger3.matrix.translate(0.07, 0.022, -0.07);
  rightfinger3.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(rightfinger3);

  rightnail1.matrix = new Matrix4(rightpalmCoord);
  rightnail1.matrix.translate(-0.07, -0.03, -0.07);
  rightnail1.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(rightnail1);

  rightnail2.matrix = new Matrix4(rightpalmCoord);
  rightnail2.matrix.translate(0, -0.03, -0.08);
  rightnail2.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(rightnail2);

  rightnail3.matrix = new Matrix4(rightpalmCoord);
  rightnail3.matrix.translate(0.07, -0.03, -0.07);
  rightnail3.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(rightnail3);

  //Charizard neck
  neck.matrix = bodyCoord;
  neck.matrix.translate(0, 0.35, 0);
  neck.matrix.rotate(neckRotate, 0, 1, 0);
  var neckCoord = new Matrix4(neck.matrix);
  neck.matrix.scale(0.2, 0.2, 0.2);
  g_shapesList.push(neck);

  //Charizard head
  head.matrix = new Matrix4(neckCoord);
  head.matrix.translate(0, 0.25, 0);
  var headCoord = new Matrix4(head.matrix);
  head.matrix.scale(0.3, 0.3, 0.3);
  g_shapesList.push(head);

  forehead.matrix = new Matrix4(headCoord);
  forehead.matrix.translate(0, 0.079, -0.03);
  forehead.matrix.scale(0.3, 0.15, 0.32);
  g_shapesList.push(forehead);

  topmouth.matrix = new Matrix4(headCoord);
  topmouth.matrix.translate(0, -0.03, -0.09);
  topmouth.matrix.scale(0.3, 0.07, 0.38);
  g_shapesList.push(topmouth);

  botmouth.matrix = new Matrix4(headCoord);
  botmouth.matrix.translate(0, -0.14, -0.09);
  botmouth.matrix.scale(0.3, 0.07, 0.38);
  g_shapesList.push(botmouth);

  tongue.matrix = new Matrix4(headCoord);
  tongue.matrix.translate(0, -0.095, -0.054);
  tongue.matrix.scale(0.25, 0.035, 0.38);
  g_shapesList.push(tongue);

  tooth1.matrix = new Matrix4(headCoord);
  tooth1.matrix.translate(-0.08, -0.043, -0.26);
  tooth1.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth1);

  tooth2.matrix = new Matrix4(headCoord);
  tooth2.matrix.translate(0.08, -0.043, -0.26);
  tooth2.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth2);

  tooth3.matrix = new Matrix4(headCoord);
  tooth3.matrix.translate(-0.08, -0.129, -0.26);
  tooth3.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth3);

  tooth4.matrix = new Matrix4(headCoord);
  tooth4.matrix.translate(0.08, -0.129, -0.26);
  tooth4.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth4);

  nose.matrix = new Matrix4(headCoord);
  nose.matrix.translate(0, 0, -0.09);
  nose.matrix.scale(0.1, 0.07, 0.38);
  g_shapesList.push(nose);

  ear1.matrix = new Matrix4(headCoord);
  ear1.matrix.translate(-0.08, 0.18, 0.1);
  ear1.matrix.rotate(25, 1, 0, 0);
  ear1.matrix.scale(0.07, 0.18, 0.07);
  g_shapesList.push(ear1);

  ear2.matrix = new Matrix4(headCoord);
  ear2.matrix.translate(0.08, 0.18, 0.1);
  ear2.matrix.rotate(25, 1, 0, 0);
  ear2.matrix.scale(0.07, 0.18, 0.07);
  g_shapesList.push(ear2);

  nostril1.matrix = new Matrix4(headCoord);
  nostril1.matrix.translate(-0.03, 0.021, -0.095);
  nostril1.matrix.scale(0.005, 0.02, 0.38);
  g_shapesList.push(nostril1);

  nostril2.matrix = new Matrix4(headCoord);
  nostril2.matrix.translate(0.03, 0.021, -0.095);
  nostril2.matrix.scale(0.005, 0.02, 0.38);
  g_shapesList.push(nostril2);

  eye1.matrix = new Matrix4(headCoord);
  eye1.matrix.translate(-0.07, 0.057, -0.16);
  eye1.matrix.scale(0.07, 0.05, 0.07);
  g_shapesList.push(eye1);

  eye2.matrix = new Matrix4(headCoord);
  eye2.matrix.translate(0.07, 0.057, -0.16);
  eye2.matrix.scale(-0.07, 0.05, 0.07);
  g_shapesList.push(eye2);

  pupil1.matrix = new Matrix4(headCoord);
  pupil1.matrix.translate(-0.065, 0.05, -0.1601);
  pupil1.matrix.scale(0.045, 0.035, 0.07);
  g_shapesList.push(pupil1);

  pupil2.matrix = new Matrix4(headCoord);
  pupil2.matrix.translate(0.065, 0.05, -0.1601);
  pupil2.matrix.scale(-0.045, 0.035, 0.07);
  g_shapesList.push(pupil2);
}

// #region Global Dragon Variables
let bodyColor = [249, 177, 101];
let caColor = [213, 221, 221];
let wingColor = [54, 147, 162];
let tongueColor = [168, 120, 146];
let counterColor = [250, 238, 178];
let pupilColor = [49, 44, 32];
let nostrilColor = [49, 44, 32];
let eyeWhiteColor = [248, 245, 250];
let flameColor = [238, 86, 51];
let flameComplimentColor = [252, 251, 119];

// Body
let body, bodyCounter;

// Tail
let backTail, backTailCounter, tailJoint, upperTail, upperTailCounter;

// Flame
let flameJoint, flameBase, flameTop1, flameTop2, flameTop3;

// Left Wing
let leftinnerWing, lefttopWing1, lefttopWing2, leftWingHorn, lefttopWing3;
let leftWing1,
  leftWingBack1,
  leftWing2,
  leftWingBack2,
  leftWing3,
  leftWingBack3;
let leftWing4, leftWingBack4, leftWing5, leftWingBack5;

// Right Wing
let rightinnerWing, righttopWing1, righttopWing2, rightWingHorn, righttopWing3;
let rightWing1,
  rightWingBack1,
  rightWing2,
  rightWingBack2,
  rightWing3,
  rightWingBack3;
let rightWing4, rightWingBack4, rightWing5, rightWingBack5;

// Left Leg
let leftThigh, leftShin, leftFoot;
let leftToeNail1, leftToeNail2, leftToeNail3;

// Right Leg
let rightThigh, rightShin, rightFoot;
let rightToeNail1, rightToeNail2, rightToeNail3;

// Left Arm
let leftArm, leftforearm, leftpalm, leftknuckles;
let leftfinger1, leftfinger2, leftfinger3;
let leftnail1, leftnail2, leftnail3;

// Right Arm
let rightArm, forearm, rightpalm, rightknuckles;
let finger1, rightfinger2, rightfinger3;
let rightnail1, rightnail2, rightnail3;

// Neck and Head
let neck, head, forehead, topmouth, botmouth, tongue;
let tooth1, tooth2, tooth3, tooth4;
let nose, ear1, ear2;
let nostril1, nostril2;

// Eyes
let eye1, eye2, pupil1, pupil2;
// #endregion

function buildDragon() {
  g_shapesList = [];

  // Body
  body = new Cube(bodyColor);
  bodyCounter = new Cube(counterColor);

  // Tail
  backTail = new Cube(bodyColor);
  backTailCounter = new Cube(counterColor);
  tailJoint = new Cube(caColor);
  upperTail = new Cube(bodyColor);
  upperTailCounter = new Cube(counterColor);

  // Flame
  flameJoint = new Cube(caColor);
  flameBase = new Cube(flameComplimentColor);
  flameTop1 = new Cube(flameColor);
  flameTop2 = new Cube(flameColor);
  flameTop3 = new Cube(flameColor);

  // Left Wing
  leftinnerWing = new Cube(bodyColor);
  lefttopWing1 = new Cube(bodyColor);
  lefttopWing2 = new Cube(bodyColor);
  leftWingHorn = new Cube(bodyColor);
  lefttopWing3 = new Cube(bodyColor);
  leftWing1 = new Cube(wingColor);
  leftWingBack1 = new Cube(bodyColor);
  leftWing2 = new Cube(wingColor);
  leftWingBack2 = new Cube(bodyColor);
  leftWing3 = new Cube(wingColor);
  leftWingBack3 = new Cube(bodyColor);
  leftWing4 = new Cube(wingColor);
  leftWingBack4 = new Cube(bodyColor);
  leftWing5 = new Cube(wingColor);
  leftWingBack5 = new Cube(bodyColor);

  // Right Wing
  rightinnerWing = new Cube(bodyColor);
  righttopWing1 = new Cube(bodyColor);
  righttopWing2 = new Cube(bodyColor);
  rightWingHorn = new Cube(bodyColor);
  righttopWing3 = new Cube(bodyColor);
  rightWing1 = new Cube(wingColor);
  rightWingBack1 = new Cube(bodyColor);
  rightWing2 = new Cube(wingColor);
  rightWingBack2 = new Cube(bodyColor);
  rightWing3 = new Cube(wingColor);
  rightWingBack3 = new Cube(bodyColor);
  rightWing4 = new Cube(wingColor);
  rightWingBack4 = new Cube(bodyColor);
  rightWing5 = new Cube(wingColor);
  rightWingBack5 = new Cube(bodyColor);

  // Left Leg
  leftThigh = new Cube(bodyColor);
  leftShin = new Cube(bodyColor);
  leftFoot = new Cube(bodyColor);
  leftToeNail1 = new Cube(caColor);
  leftToeNail2 = new Cube(caColor);
  leftToeNail3 = new Cube(caColor);

  // Right Leg
  rightThigh = new Cube(bodyColor);
  rightShin = new Cube(bodyColor);
  rightFoot = new Cube(bodyColor);
  rightToeNail1 = new Cube(caColor);
  rightToeNail2 = new Cube(caColor);
  rightToeNail3 = new Cube(caColor);

  // Left Arm
  leftArm = new Cube(bodyColor);
  leftforearm = new Cube(bodyColor);
  leftpalm = new Cube(bodyColor);
  leftknuckles = new Cube(bodyColor);
  leftfinger1 = new Cube(bodyColor);
  leftfinger2 = new Cube(bodyColor);
  leftfinger3 = new Cube(bodyColor);
  leftnail1 = new Cube(caColor);
  leftnail2 = new Cube(caColor);
  leftnail3 = new Cube(caColor);

  // Right Arm
  rightArm = new Cube(bodyColor);
  forearm = new Cube(bodyColor);
  rightpalm = new Cube(bodyColor);
  rightknuckles = new Cube(bodyColor);
  finger1 = new Cube(bodyColor);
  rightfinger2 = new Cube(bodyColor);
  rightfinger3 = new Cube(bodyColor);
  rightnail1 = new Cube(caColor);
  rightnail2 = new Cube(caColor);
  rightnail3 = new Cube(caColor);

  // Neck and Head
  neck = new Cube(bodyColor);
  head = new Cube(bodyColor);
  forehead = new Cube(bodyColor);
  topmouth = new Cube(bodyColor);
  botmouth = new Cube(bodyColor);
  tongue = new Cube(tongueColor);

  tooth1 = new Cube(caColor);
  tooth2 = new Cube(caColor);
  tooth3 = new Cube(caColor);
  tooth4 = new Cube(caColor);

  nose = new Cube(bodyColor);
  ear1 = new Cube(bodyColor);
  ear2 = new Cube(bodyColor);

  nostril1 = new Cube(nostrilColor);
  nostril2 = new Cube(nostrilColor);

  // Eyes
  eye1 = new TriPrism(eyeWhiteColor);
  eye2 = new TriPrism(eyeWhiteColor);
  pupil1 = new TriPrism(pupilColor);
  pupil2 = new TriPrism(pupilColor);
}

function main() {
  //set up canvas and gl variabls
  setupWegbGL();
  //set up actions for the HTML UI elements
  connectVariablesToGLSL();

  //set up actions for the HTML UI elements
  addActionsForHTML();

  resetSliders();
  resetCamera();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  buildDragon();
  calculateDragon();
  tick();
}
