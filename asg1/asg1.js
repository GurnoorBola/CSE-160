// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWegbGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  //Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Globals related UI elemenents
let g_selectedType=POINT;

//set up actions for the HTML UI elements
function addActionsForButtons(){
  var redSlide = document.getElementById('redSlide');
  var greenSlide = document.getElementById('greenSlide');
  var blueSlide = document.getElementById('blueSlide');

  //Button Events (Shape Type)
  document.getElementById('green').onclick = function () {redSlide.value=0; greenSlide.value=100; blueSlide.value=0;};
  document.getElementById('red').onclick = function () {redSlide.value=100; greenSlide.value=0; blueSlide.value=0;};
  document.getElementById('clearButton').onclick = function() {g_shapesList=[]; renderAllShapes(); };
  document.getElementById('drawing').onclick = function() {g_shapesList=[]; renderAllShapes(); drawButterfly()}

  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function () {g_selectedType=CIRCLE}
}

function getSliders(){
  var redSlide = document.getElementById('redSlide');
  var greenSlide = document.getElementById('greenSlide');
  var blueSlide = document.getElementById('blueSlide');
  var tSlide = document.getElementById('tSlide');
  var sizeSlide = document.getElementById('sizeSlide');

  return [[redSlide.value/100, greenSlide.value/100, blueSlide.value/100, tSlide.value/100], sizeSlide.value]
}

var g_shapesList = [];

function click(ev) {
  // extract the event click and return it in WebGL coordinates
  [x, y] = convertCoordinatesEventToGL(ev);
  [rgba, size] = getSliders();
  //console.log([x,y])

  //Create and store the new point
  let point;
  if (g_selectedType == POINT){
    point = new Point();
  } else if (g_selectedType == TRIANGLE){
    point = new Triangle([x,y], rgba, size);
  } else {
    point = new Circle([x,y], rgba, size);
  }
  point.position = [x, y];
  point.color=rgba.slice();
  point.size=size;
  g_shapesList.push(point);

  //Draw every shape that is supposed to be in canvas
  renderAllShapes();
}

//Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x, y]);
}

//Draw every shape that is supposed to be in the canvas
function renderAllShapes(){

    //check the time at the start of this function
    var startTime = performance.now();
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

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


function main() {
  
  //set up canvas and gl variabls
  setupWegbGL();
  //set up actions for the HTML UI elements
  connectVariablesToGLSL();

  //set up actions for the HTML UI elements
  addActionsForButtons();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click (ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}