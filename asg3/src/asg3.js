// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalTransformMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalTransformMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  uniform sampler2D u_Sampler0;
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_Color;
  uniform float u_texColorWeight;
  void main() {
    float t = u_texColorWeight;
    gl_FragColor = (1.0-t) * u_Color + t * texture2D(u_Sampler0, v_UV);
  }`

// Global Variables
let canvas;
let gl;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalTransformMatrix = new Matrix4();
let g_trackballRotationMatrix = new Matrix4();
let a_Position;
let u_Color;
let u_texColorWeight;
let a_UV;
let u_Sampler0;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_ModelMatrix;
let u_GlobalTransformMatrix;

let camera = new Camera();

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

  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW); // default is CCW (counter-clockwise)
  gl.cullFace(gl.BACK);
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

  // Get the storage location of u_Color
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  if (!u_Color) {
    console.log('Failed to get the storage location of u_Color');
    return;
  }

  //Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  //Get the storage location of u_GlobalRotateMatrix
  u_GlobalTransformMatrix = gl.getUniformLocation(gl.program, 'u_GlobalTransformMatrix');
  if (!u_GlobalTransformMatrix) {
    console.log('Failed to get the storage location of u_GlobalTransformMatrix');
    return;
  }

  u_texColorWeight = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  if (!u_texColorWeight){
    console.log('Failed to get locaiton of u_texColorWeight');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (!a_UV) {
    console.log('Failed to get the storeage location of a_UV');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storeage location of u_Sampler0');
    return false;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storeage location of u_ViewMatrix');
    return false;
  };

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storeage location of u_ProjectionMatrix');
    return false;
  };
}

function initTextures(){
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }

  image.onload = function() { sendTextureToGLSL(image); renderAllShapes();}
  image.src = 'luckyblock.png';

  return true;
}

function sendTextureToGLSL(image){
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
  console.log('finished loadTexture');
}

//Constants
let focused = false;

const keysPressed = {};
//set up actions for the HTML UI elements
function addActionsForHTML(){
  var camAngleX = document.getElementById('camAngleX');

  camAngleX.addEventListener('input', function() {g_globalAngleX = camAngleX.value; g_trackballRotationMatrix = new Matrix4(); renderAllShapes()});

  var camAngleY = document.getElementById('camAngleY');

  camAngleY.addEventListener('input', function() {g_globalAngleY = camAngleY.value; g_trackballRotationMatrix = new Matrix4(); renderAllShapes()});
  
  canvas = document.getElementById('webgl');


  document.getElementById('camReset').onclick = function(){resetCamera();};

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  })

  function onMouseMove(e) {
    if (document.pointerLockElement !== canvas) return;

    const sensitivity = 0.2;
  
    const yaw = e.movementX * sensitivity;
    const pitch = -e.movementY * sensitivity
  
    camera.panYawDegrees(yaw);
    camera.panPitchDegrees(pitch);
  }

  function keyPressDown(e) {
    keysPressed[e.code] = true;
  }
  function keyPressUp(e) {
    keysPressed[e.code] = false;
  }

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', onMouseMove);

      document.addEventListener('keydown', keyPressDown);
      
      document.addEventListener('keyup', keyPressUp);

    } else {
      document.removeEventListener('mousemove', onMouseMove);

      document.removeEventListener('keydown', keyPressDown);
      
      document.removeEventListener('keyup', keyPressUp);
    }
  });

}

var g_shapesList = [];

var g_eye = new Vector3([3, 3, -3]);
var g_at= new Vector3([0,0, 0]);
var g_up = new Vector3([0, 1, 0]);

//Draw every shape that is supposed to be in the canvas
function renderAllShapes(){

    //check the time at the start of this function
    var startTime = performance.now();

    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

    var globalTransformMat;
    globalTransformMat = new Matrix4().multiply(g_globalTransformMatrix).rotate(g_globalAngleX, 0, 1, 0).rotate(g_globalAngleY, 1, 0, 0).multiply(g_trackballRotationMatrix);
    gl.uniformMatrix4fv(u_GlobalTransformMatrix, false, globalTransformMat.elements);
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

function projectToSphere(x, y, radius = 1.0) {
  let d = Math.sqrt(x * x + y * y);
  let z;
  if (d < radius * Math.sqrt(0.5)) {
      z = Math.sqrt(radius * radius - d * d);
  } else {
      let t = radius / Math.sqrt(2.0);
      z = t * t / d;
  }
  return [x, y, z];
}

function rotateModel(angle, axis) {
  let rotationMatrix = new Matrix4();
  rotationMatrix.setRotate(angle * 180 / Math.PI, axis[0], axis[1], axis[2]); 
  g_trackballRotationMatrix = rotationMatrix.multiply(g_trackballRotationMatrix); 
}

let lastFrame = performance.now()/ 1000.0;
let now;
let deltaTime;

function tick(){
  now = performance.now()/1000.0;
  deltaTime = now - lastFrame;
  lastFrame = now;
  // console.log(g_seconds);
  if (keysPressed['KeyW']) {
    camera.moveForward(deltaTime);
  }
  if (keysPressed['KeyS']) {
    camera.moveBackwards(deltaTime);
  }
  if (keysPressed['KeyA']) {
    camera.moveLeft(deltaTime);
  }
  if (keysPressed['KeyD']) {
    camera.moveRight(deltaTime);
  }
  if (keysPressed['KeyQ']) {
    camera.panLeft(deltaTime);
  }
  if (keysPressed['KeyE']) {
    camera.panRight(deltaTime);
  }
  if (keysPressed['KeyR']){
    camera.panUp(deltaTime);
  }
  if (keysPressed['KeyT']){
    camera.panDown(deltaTime);
  }
  renderAllShapes();
  requestAnimationFrame(tick);
}

function resetCamera(){
  g_globalTransformMatrix = new Matrix4(); 
  g_globalAngleX = 0; 
  g_globalAngleY = 0; 
  camAngleX.value = g_globalAngleX; 
  camAngleY.value = g_globalAngleY; 
  g_trackballRotationMatrix = new Matrix4(); 
  renderAllShapes();
}

function main() {
  
  //set up canvas and gl variabls
  setupWegbGL();
  initTextures();

  //set up actions for the HTML UI elements
  connectVariablesToGLSL();

  //set up actions for the HTML UI elements
  addActionsForHTML();

  resetCamera();

  let cube1 = new Cube(Array(6).fill().map(() => [0, 0, 1, 0, 1, 1, 0, 1]));
  g_shapesList.push(cube1);

  // let cube2 = new Cube(Array(6).fill().map(() => [0, 0, 1, 0, 1, 1, 0, 1]));
  // cube2.matrix.translate(0.5, 0, 0);
  // cube2.matrix.scale(0.2, 0.2, 0.2)
  // g_shapesList.push(cube2);

  tick();
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}