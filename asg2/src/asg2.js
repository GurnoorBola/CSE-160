// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  varying vec4 v_Color;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_Color = a_Color;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
  }`

// Global Variables
let canvas;
let gl;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let a_Position;
let a_Color;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let isDrawing = true;

function setupWegbGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (!a_Color) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  //Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  //Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;


//set up actions for the HTML UI elements
function addActionsForHTML(){
  var camAngleX = document.getElementById('camAngleX');

  camAngleX.addEventListener('input', function() {g_globalAngleX = camAngleX.value; renderAllShapes()});

  var camAngleY = document.getElementById('camAngleY');

  camAngleY.addEventListener('input', function() {g_globalAngleY = camAngleY.value; renderAllShapes()});
}

var g_shapesList = [];

//Draw every shape that is supposed to be in the canvas
function renderAllShapes(){

    //check the time at the start of this function
    var startTime = performance.now();

    var globalRotMat=new Matrix4().rotate(g_globalAngleX, 0, 1, 0).rotate(g_globalAngleY, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // var len = g_points.length;
    var len = g_shapesList.length;
    for(var i = 0; i < len; i++) {
      g_shapesList[i].render();
    }

    var duration = performance.now() - startTime;
    sendTextToHTML('numdot: ' + len + ' ms: ' + Math.floor(duration) + ' fps: ' + Math.floor(10000/duration)/10, 'numdot');
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get ' + htmlID + " from HTML");
  }
  htmlElm.innerHTML = text;
}

function buildDragon(){
  let bodyColor = [249,177,101];
  let caColor = [213,221,221];
  let wingColor = [54,147,162];
  let tongueColor = [168,120,146];
  let counterColor = [250,238,178];
  let pupilColor = [49,44,32];
  let eyeWhiteColor = [248, 245, 250];

  //Charizard head
  let head = new Cube(bodyColor);
  head.matrix.translate(0, 0.45, 0);
  var headCoord = new Matrix4(head.matrix);
  head.matrix.scale(0.3, 0.3, 0.3);
  g_shapesList.push(head);

  let forehead = new Cube(bodyColor);
  forehead.matrix = new Matrix4(headCoord);
  forehead.matrix.translate(0, 0.079, -0.03);
  forehead.matrix.scale(0.3, 0.15, 0.32);
  g_shapesList.push(forehead);

  let topmouth = new Cube(bodyColor);
  topmouth.matrix = new Matrix4(headCoord);
  topmouth.matrix.translate(0, -0.03, -0.09);
  topmouth.matrix.scale(0.3, 0.07, 0.38);
  g_shapesList.push(topmouth);

  let botmouth = new Cube(bodyColor);
  botmouth.matrix = new Matrix4(headCoord);
  botmouth.matrix.translate(0, -0.14, -0.09);
  botmouth.matrix.scale(0.3, 0.07, 0.38);
  g_shapesList.push(botmouth);

  let tongue = new Cube(tongueColor);
  tongue.matrix = new Matrix4(headCoord);
  tongue.matrix.translate(0, -0.095, -0.054);
  tongue.matrix.scale(0.25, 0.035, 0.38);
  g_shapesList.push(tongue);

  let tooth1 = new Cube(caColor);
  tooth1.matrix = new Matrix4(headCoord);
  tooth1.matrix.translate(-0.08, -0.043, -0.26);
  tooth1.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth1);

  let tooth2 = new Cube(caColor);
  tooth2.matrix = new Matrix4(headCoord);
  tooth2.matrix.translate(0.08, -0.043, -0.26);
  tooth2.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth2);

  let tooth3 = new Cube(caColor);
  tooth3.matrix = new Matrix4(headCoord);
  tooth3.matrix.translate(-0.08, -0.129, -0.26);
  tooth3.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth3);

  let tooth4 = new Cube(caColor);
  tooth4.matrix = new Matrix4(headCoord);
  tooth4.matrix.translate(0.08, -0.129, -0.26);
  tooth4.matrix.scale(0.03, 0.07, 0.03);
  g_shapesList.push(tooth4);

  let nose = new Cube(bodyColor);
  nose.matrix = new Matrix4(headCoord);
  nose.matrix.translate(0, 0, -0.09);
  nose.matrix.scale(0.1, 0.07, 0.38);
  g_shapesList.push(nose);

  let ear1 = new Cube(bodyColor);
  ear1.matrix = new Matrix4(headCoord);
  ear1.matrix.translate(-0.08, 0.18, 0.1);
  ear1.matrix.rotate(25, 1, 0, 0)
  ear1.matrix.scale(0.07, 0.18, 0.07);
  g_shapesList.push(ear1);

  let ear2 = new Cube(bodyColor);
  ear2.matrix = new Matrix4(headCoord);
  ear2.matrix.translate(0.08, 0.18, 0.1);
  ear2.matrix.rotate(25, 1, 0, 0)
  ear2.matrix.scale(0.07, 0.18, 0.07);
  g_shapesList.push(ear2);

  let nostril1 = new Cube(pupilColor);
  nostril1.matrix = new Matrix4(headCoord);
  nostril1.matrix.translate(-0.03, 0.021, -0.095);
  nostril1.matrix.scale(0.005, 0.02, 0.38);
  g_shapesList.push(nostril1);

  let nostril2 = new Cube(pupilColor);
  nostril2.matrix = new Matrix4(headCoord);
  nostril2.matrix.translate(0.03, 0.021, -0.095);
  nostril2.matrix.scale(0.005, 0.02, 0.38);
  g_shapesList.push(nostril2);

  let eye1 = new TriPrism(eyeWhiteColor);
  eye1.matrix = new Matrix4(headCoord);
  eye1.matrix.translate(-0.07, 0.057, -0.16);
  eye1.matrix.scale(0.07, 0.05, 0.07);
  g_shapesList.push(eye1);

  let eye2 = new TriPrism(eyeWhiteColor);
  eye2.matrix = new Matrix4(headCoord);
  eye2.matrix.translate(0.07, 0.057, -0.16);
  eye2.matrix.scale(-0.07, 0.05, 0.07);
  g_shapesList.push(eye2);

  let pupil1 = new TriPrism(pupilColor);
  pupil1.matrix = new Matrix4(headCoord);
  pupil1.matrix.translate(-0.065, 0.05, -0.16001);
  pupil1.matrix.scale(0.045, 0.035, 0.07);
  g_shapesList.push(pupil1);

  let pupil2 = new TriPrism(pupilColor);
  pupil2.matrix = new Matrix4(headCoord);
  pupil2.matrix.translate(0.065, 0.05, -0.16001);
  pupil2.matrix.scale(-0.045, 0.035, 0.07);
  g_shapesList.push(pupil2);
  
}

function main() {
  
  //set up canvas and gl variabls
  setupWegbGL();
  //set up actions for the HTML UI elements
  connectVariablesToGLSL();

  //set up actions for the HTML UI elements
  addActionsForHTML();

  

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  buildDragon();

  renderAllShapes();
}