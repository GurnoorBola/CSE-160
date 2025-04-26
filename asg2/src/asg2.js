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

  //Charizard Body
  let body = new Cube(bodyColor);
  body.matrix.translate(0, 0, 0);
  var bodyCoord = new Matrix4(body.matrix);
  body.matrix.scale(0.46, 0.6, 0.46);
  g_shapesList.push(body);

  let bodyCounter = new Cube(counterColor);
  bodyCounter.matrix = new Matrix4(bodyCoord);
  bodyCounter.matrix.translate(0, -0.13, -0.0301);
  bodyCounter.matrix.scale(0.4509, 0.5, 0.52);
  g_shapesList.push(bodyCounter);

  //Charizard Legs

  //left leg
  let leftThigh = new Cube(bodyColor);
  leftThigh.matrix = new Matrix4(bodyCoord);
  leftThigh.matrix.translate(-0.2, -0.33, 0);
  var leftThighCoord = new Matrix4(leftThigh.matrix);
  leftThigh.matrix.rotate(12, 1, 0, 0)
  leftThigh.matrix.scale(0.23, 0.3, 0.35);
  g_shapesList.push(leftThigh);

  let leftShin = new Cube(bodyColor);
  leftShin.matrix = new Matrix4(leftThighCoord);
  leftShin.matrix.translate(0, -0.17, -0.026);
  leftShin.matrix.scale(0.23, 0.15, 0.35)
  g_shapesList.push(leftShin);

  let leftFoot = new Cube(bodyColor);
  leftFoot.matrix = new Matrix4(leftThighCoord);
  leftFoot.matrix.translate(0, -0.207, -0.10);
  leftFoot.matrix.scale(0.23, 0.08, 0.30)
  g_shapesList.push(leftFoot);

  let leftToeNail1 = new Cube(caColor);
  leftToeNail1.matrix = new Matrix4(leftThighCoord);
  leftToeNail1.matrix.translate(-0.08, -0.207, -0.18);
  leftToeNail1.matrix.scale(0.06, 0.06, 0.25)
  g_shapesList.push(leftToeNail1);

  let leftToeNail2 = new Cube(caColor);
  leftToeNail2.matrix = new Matrix4(leftThighCoord);
  leftToeNail2.matrix.translate(0, -0.207, -0.18);
  leftToeNail2.matrix.scale(0.06, 0.06, 0.25)
  g_shapesList.push(leftToeNail2);

  let leftToeNail3 = new Cube(caColor);
  leftToeNail3.matrix = new Matrix4(leftThighCoord);
  leftToeNail3.matrix.translate(0.08, -0.207, -0.18);
  leftToeNail3.matrix.scale(0.06, 0.06, 0.25)
  g_shapesList.push(leftToeNail3);

  //Right Leg
  let rightThigh = new Cube(bodyColor);
  rightThigh.matrix = new Matrix4(bodyCoord);
  rightThigh.matrix.translate(0.2, -0.33, 0);
  var rightThighCoord = new Matrix4(rightThigh.matrix);
  rightThigh.matrix.rotate(12, 1, 0, 0)
  rightThigh.matrix.scale(0.23, 0.3, 0.35);
  g_shapesList.push(rightThigh);

  let rightShin = new Cube(bodyColor);
  rightShin.matrix = new Matrix4(rightThighCoord);
  rightShin.matrix.translate(0, -0.17, -0.026);
  rightShin.matrix.scale(0.23, 0.15, 0.35)
  g_shapesList.push(rightShin);

  let rightFoot = new Cube(bodyColor);
  rightFoot.matrix = new Matrix4(rightThighCoord);
  rightFoot.matrix.translate(0, -0.207, -0.10);
  rightFoot.matrix.scale(0.23, 0.08, 0.30)
  g_shapesList.push(rightFoot);

  let rightToeNail1 = new Cube(caColor);
  rightToeNail1.matrix = new Matrix4(rightThighCoord);
  rightToeNail1.matrix.translate(-0.08, -0.207, -0.18);
  rightToeNail1.matrix.scale(0.06, 0.06, 0.25)
  g_shapesList.push(rightToeNail1);

  let rightToeNail2 = new Cube(caColor);
  rightToeNail2.matrix = new Matrix4(rightThighCoord);
  rightToeNail2.matrix.translate(0, -0.207, -0.18);
  rightToeNail2.matrix.scale(0.06, 0.06, 0.25)
  g_shapesList.push(rightToeNail2);

  let rightToeNail3 = new Cube(caColor);
  rightToeNail3.matrix = new Matrix4(rightThighCoord);
  rightToeNail3.matrix.translate(0.08, -0.207, -0.18);
  rightToeNail3.matrix.scale(0.06, 0.06, 0.25)
  g_shapesList.push(rightToeNail3);

  //Charizard arms

  //left arm
  let leftArm = new Cube(bodyColor);
  leftArm.matrix = new Matrix4(bodyCoord);
  leftArm.matrix.translate(-0.34, 0.2, 0);
  var leftArmCoord = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.23, 0.10, 0.10);
  g_shapesList.push(leftArm);

  let leftforearm = new Cube(bodyColor);
  leftforearm.matrix = new Matrix4(leftArmCoord);
  leftforearm.matrix.translate(-0.078, 0, -0.07);
  var leftforearmCoord = new Matrix4(leftforearm.matrix);
  leftforearm.matrix.scale(0.10, 0.10, 0.23)
  g_shapesList.push(leftforearm);

  //left hand
  let leftpalm = new Cube(bodyColor);
  leftpalm.matrix = new Matrix4(leftforearmCoord);
  leftpalm.matrix.translate(0, 0, -0.1);
  var leftpalmCoord = new Matrix4(leftpalm.matrix);
  leftpalm.matrix.scale(0.20, 0.15, 0.05)
  g_shapesList.push(leftpalm);

  let leftknuckles = new Cube(bodyColor);
  leftknuckles.matrix = new Matrix4(leftpalmCoord);
  leftknuckles.matrix.translate(0, 0.05, -0.05);
  leftknuckles.matrix.scale(0.2, 0.05, 0.08);
  g_shapesList.push(leftknuckles) 

  let leftfinger1 = new Cube(bodyColor);
  leftfinger1.matrix = new Matrix4(leftpalmCoord);
  leftfinger1.matrix.translate(-0.07, 0.022, -0.07);
  leftfinger1.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(leftfinger1)

  let leftfinger2 = new Cube(bodyColor);
  leftfinger2.matrix = new Matrix4(leftpalmCoord);
  leftfinger2.matrix.translate(0, 0.022, -0.08);
  leftfinger2.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(leftfinger2)

  let leftfinger3 = new Cube(bodyColor);
  leftfinger3.matrix = new Matrix4(leftpalmCoord);
  leftfinger3.matrix.translate(0.07, 0.022, -0.07);
  leftfinger3.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(leftfinger3)

  let leftnail1 = new Cube(caColor);
  leftnail1.matrix = new Matrix4(leftpalmCoord);
  leftnail1.matrix.translate(-0.07, -0.03, -0.07);
  leftnail1.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(leftnail1)

  let leftnail2 = new Cube(caColor);
  leftnail2.matrix = new Matrix4(leftpalmCoord);
  leftnail2.matrix.translate(0, -0.03, -0.08);
  leftnail2.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(leftnail2)

  let leftnail3 = new Cube(caColor);
  leftnail3.matrix = new Matrix4(leftpalmCoord);
  leftnail3.matrix.translate(0.07, -0.03, -0.07);
  leftnail3.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(leftnail3)

  //right arm 
  let rightArm = new Cube(bodyColor);
  rightArm.matrix = new Matrix4(bodyCoord);
  rightArm.matrix.translate(0.34, 0.2, 0);
  var rightArmCoord = new Matrix4(rightArm.matrix);
  rightArm.matrix.scale(0.23, 0.10, 0.10);
  g_shapesList.push(rightArm);

  let forearm = new Cube(bodyColor);
  forearm.matrix = new Matrix4(rightArmCoord);
  forearm.matrix.translate(0.078, 0, -0.07);
  var forearmCoord = new Matrix4(forearm.matrix);
  forearm.matrix.scale(0.10, 0.10, 0.23)
  g_shapesList.push(forearm);

  //right hand
  let rightpalm = new Cube(bodyColor);
  rightpalm.matrix = new Matrix4(forearmCoord);
  rightpalm.matrix.translate(0, 0, -0.1);
  var rightpalmCoord = new Matrix4(rightpalm.matrix);
  rightpalm.matrix.scale(0.20, 0.15, 0.05)
  g_shapesList.push(rightpalm);

  let rightknuckles = new Cube(bodyColor);
  rightknuckles.matrix = new Matrix4(rightpalmCoord);
  rightknuckles.matrix.translate(0, 0.05, -0.05);
  rightknuckles.matrix.scale(0.2, 0.05, 0.08);
  g_shapesList.push(rightknuckles) 

  let finger1 = new Cube(bodyColor);
  finger1.matrix = new Matrix4(rightpalmCoord);
  finger1.matrix.translate(-0.07, 0.022, -0.07);
  finger1.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(finger1)

  let rightfinger2 = new Cube(bodyColor);
  rightfinger2.matrix = new Matrix4(rightpalmCoord);
  rightfinger2.matrix.translate(0, 0.022, -0.08);
  rightfinger2.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(rightfinger2)

  let rightfinger3 = new Cube(bodyColor);
  rightfinger3.matrix = new Matrix4(rightpalmCoord);
  rightfinger3.matrix.translate(0.07, 0.022, -0.07);
  rightfinger3.matrix.scale(0.05, 0.1, 0.05);
  g_shapesList.push(rightfinger3)

  let rightnail1 = new Cube(caColor);
  rightnail1.matrix = new Matrix4(rightpalmCoord);
  rightnail1.matrix.translate(-0.07, -0.03, -0.07);
  rightnail1.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(rightnail1)

  let rightnail2 = new Cube(caColor);
  rightnail2.matrix = new Matrix4(rightpalmCoord);
  rightnail2.matrix.translate(0, -0.03, -0.08);
  rightnail2.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(rightnail2)

  let rightnail3 = new Cube(caColor);
  rightnail3.matrix = new Matrix4(rightpalmCoord);
  rightnail3.matrix.translate(0.07, -0.03, -0.07);
  rightnail3.matrix.scale(0.051, 0.051, 0.0501);
  g_shapesList.push(rightnail3)

  //Charizard neck
  let neck = new Cube(bodyColor);
  neck.matrix = bodyCoord;
  neck.matrix.translate(0, 0.35, 0);
  var neckCoord = new Matrix4(neck.matrix);
  neck.matrix.scale(0.2, 0.2, 0.2);
  g_shapesList.push(neck);

  //Charizard head
  let head = new Cube(bodyColor);
  head.matrix = new Matrix4(neckCoord)
  head.matrix.translate(0, 0.25, 0);
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
  pupil1.matrix.translate(-0.065, 0.05, -0.1601);
  pupil1.matrix.scale(0.045, 0.035, 0.07);
  g_shapesList.push(pupil1);

  let pupil2 = new TriPrism(pupilColor);
  pupil2.matrix = new Matrix4(headCoord);
  pupil2.matrix.translate(0.065, 0.05, -0.1601);
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