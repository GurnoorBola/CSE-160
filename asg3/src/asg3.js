// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec4 a_Color;
  attribute float a_texColorWeight;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * a_Position;
    v_UV = a_UV;
    v_Color = a_Color;
    v_texColorWeight = a_texColorWeight;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  uniform sampler2D u_Sampler0;
  precision mediump float;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  void main() {
    float t = v_texColorWeight;
    gl_FragColor = (1.0-t) * v_Color + t * texture2D(u_Sampler0, v_UV);
  }`

// Global Variables
let canvas;
let gl;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalTransformMatrix = new Matrix4();
let g_trackballRotationMatrix = new Matrix4();
let a_Position;
let a_Color;
let a_texColorWeight;
let a_UV;
let u_Sampler0;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_ModelMatrix;

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
  gl.frontFace(gl.CCW); 
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

  // Get the storage location of a_Color
  a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (!a_Color) {
    console.log('Failed to get the storage location of a_Color');
    return;
  }

  a_texColorWeight = gl.getAttribLocation(gl.program, 'a_texColorWeight');
  if (!a_texColorWeight){
    console.log('Failed to get locaiton of a_texColorWeight');
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

  image.onload = function() { sendTextureToGLSL(image); renderAllChunks();}
  image.src = 'textureAtlas.png';

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
  canvas = document.getElementById('webgl');

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  })

  function onMouseMove(e) {
    if (document.pointerLockElement !== canvas) return;

    const sensitivity = 0.1;
  
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

  function getBlockInFront(camera, cubeSize, distance = 2.0) {
    let forward = new Vector3();
    forward.set(camera.at).sub(camera.eye).normalize();

    let worldPos = new Vector3();
    worldPos.set(camera.eye).add(new Vector3().set(forward).mul(cubeSize * distance));

    let x = Math.round(worldPos.elements[0] / cubeSize);
    let y = Math.round(worldPos.elements[1] / cubeSize);
    let z = Math.round(worldPos.elements[2] / cubeSize);

    return { x, y, z };
  }


function mouseClick(e) {
  const { x, y, z } = getBlockInFront(camera, cubeSize);

  if (e.button === 0) {
    // console.log("Place at", x, y, z);
    placeWorldBlock(BLOCK_TYPES.LUCKY, x, y, z);
  }

  if (e.button === 2) {
    // console.log("Delete at", x, y, z);
    removeWorldBlock(x, y, z)
  }
}



  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', onMouseMove);

      document.addEventListener('keydown', keyPressDown);
      
      document.addEventListener('keyup', keyPressUp);

      canvas.addEventListener('mousedown', mouseClick);

    } else {
      document.removeEventListener('mousemove', onMouseMove);

      document.removeEventListener('keydown', keyPressDown);
      
      document.removeEventListener('keyup', keyPressUp);

      canvas.addEventListener('mousedown', mouseClick);
    }
  });

}

var g_chunksList = [];

//Draw every chunk that is in the world
function renderAllChunks(){

    //check the time at the start of this function
    var startTime = performance.now();

    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // var len = g_points.length;
    var len = g_chunksList.length;
    for(var i = 0; i < len; i++) {
      g_chunksList[i].render();
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
  renderAllChunks();
  requestAnimationFrame(tick);
}

function main() {
  
  //set up canvas and gl variabls
  setupWegbGL();
  initTextures();

  //set up actions for the HTML UI elements
  connectVariablesToGLSL();

  //set up actions for the HTML UI elements
  addActionsForHTML();

  //Proof of concept
  chunkify();

  buildGround();

  addWorldBlock(BLOCK_TYPES.LUCKY, -2, 0, -1)
  addWorldBlock(BLOCK_TYPES.GRASS, 0, 0, -1)
  addWorldBlock(BLOCK_TYPES.DIRT, -1, 1, -1)
  addWorldBlock(BLOCK_TYPES.LUCKY, 0, 0, -16)

  tick();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}