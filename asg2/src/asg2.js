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

function buildRobot(){
  bodyColor = [160, 169, 180];
  jawColor = [135, 144, 155];
  eyeColor = [105,222,75];
  holeColor=[20,20,20];

  let tophead = new Cube(bodyColor);
  tophead.matrix.translate(0, 0.45, 0);
  tophead.matrix.scale(0.4, 0.3, 0.4);
  g_shapesList.push(tophead);

  let jaw = new Cube(jawColor);
  jaw.matrix.translate(0, 0.2, -0.013);
  jaw.matrix.rotate(-12, 1, 0, 0)
  jaw.matrix.scale(0.43, 0.15, 0.42);
  g_shapesList.push(jaw);

  let mouth = new Cube(holeColor);
  mouth.matrix.translate(0, 0.22, -0.02);
  mouth.matrix.rotate(-12, 1, 0, 0)
  mouth.matrix.scale(0.35, 0.12, 0.40);
  g_shapesList.push(mouth);

  let lefteye = new Cube(eyeColor);
  lefteye.matrix.translate(-0.11, 0.4, -0.16)
  lefteye.matrix.scale(0.1, 0.13, 0.2);
  g_shapesList.push(lefteye);

  let righteye = new Cube(eyeColor);
  righteye.matrix.translate(0.11, 0.4, -0.16)
  righteye.matrix.scale(0.1, 0.13, 0.2);
  g_shapesList.push(righteye);

  let lefteyehole = new Cube(holeColor);
  lefteyehole.matrix.translate(-0.11, 0.4, -0.15)
  lefteyehole.matrix.scale(0.12, 0.15, 0.2);
  g_shapesList.push(lefteyehole);

  let righteyehole = new Cube(holeColor);
  righteyehole.matrix.translate(0.11, 0.4, -0.15)
  righteyehole.matrix.scale(0.12, 0.15, 0.2);
  g_shapesList.push(righteyehole);
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

  buildRobot();

  renderAllShapes();
}