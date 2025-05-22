// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec4 a_Color;
  attribute float a_texColorWeight;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  varying vec3 v_Normal;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * a_Position;
    v_UV = a_UV;
    v_Color = a_Color;
    v_texColorWeight = a_texColorWeight;
    v_Normal = a_Normal;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_Sampler0;
  uniform bool u_ShowNormals;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  varying vec3 v_Normal;
  void main() {
    if (u_ShowNormals){
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    } else {
      float t = v_texColorWeight;
      gl_FragColor = (1.0-t) * v_Color + t * texture2D(u_Sampler0, v_UV);
    }
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
let a_texColorWeight;
let a_UV;
let a_Normal;
let u_Sampler0;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_ModelMatrix;
let u_ShowNormals;

let camera = new Camera();

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

  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
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

  // Get the storage location of a_Color
  a_Color = gl.getAttribLocation(gl.program, "a_Color");
  if (!a_Color) {
    console.log("Failed to get the storage location of a_Color");
    return;
  }

  a_texColorWeight = gl.getAttribLocation(gl.program, "a_texColorWeight");
  if (!a_texColorWeight) {
    console.log("Failed to get location of a_texColorWeight");
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (!a_UV) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (!a_Normal) {
    console.log("Failed to get the storage location of a_Normal");
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  if (!u_Sampler0) {
    console.log("Failed to get the storage location of u_Sampler0");
    return false;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
    return false;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_ProjectionMatrix");
    return false;
  }

  u_ShowNormals = gl.getUniformLocation(gl.program, "u_ShowNormals");
  if (!u_ShowNormals) {
    console.log("Failed to get the storage location of u_ShowNormals");
    return false;
  }
}

function initTextures() {
  var image = new Image();
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }

  image.onload = function () {
    sendTextureToGLSL(image);
    renderAllChunks();
  };
  image.src = "./textures/texture_atlas.png";

  return true;
}

function sendTextureToGLSL(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
  console.log("finished loadTexture");
}

//gloabls
let focused = false;
let chosenBlock = BLOCK_TYPES.STONE;
let lightPos = [16, 6, 22];


const keysPressed = {};
//set up actions for the HTML UI elements
function addActionsForHTML() {
  canvas = document.getElementById("webgl");

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });


  let renderSlider = document.getElementById("render");
  renderSlider.value = 2;
  renderSlider.addEventListener("input", function () {
    renderDistance = chunkSize * renderSlider.value;
  });

  let lightSlideX = document.getElementById('lightx');
  lightSlideX.value = lightPos[0];
  lightSlideX.addEventListener('input', ()=>{
    lightPos[0] = this.value;
  });

  let lightSlideY = document.getElementById('lighty');
  lightSlideY.value = lightPos[1];
  lightSlideX.addEventListener('input', ()=>{
    lightPos[1] = this.value;
  });

  let lightSlideZ = document.getElementById('lightz');
  lightSlideZ.value = lightPos[2];
  lightSlideZ.addEventListener('input', ()=>{
    lightPos[2] = this.value;
  });

  function onMouseMove(e) {
    if (document.pointerLockElement !== canvas) return;

    const sensitivity = 0.1;

    const yaw = e.movementX * sensitivity;
    const pitch = -e.movementY * sensitivity;

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
    worldPos
      .set(camera.eye)
      .add(new Vector3().set(forward).mul(cubeSize * distance));

    let x = Math.round(worldPos.elements[0] / cubeSize);
    let y = Math.round(worldPos.elements[1] / cubeSize);
    let z = Math.round(worldPos.elements[2] / cubeSize);

    return { x, y, z };
  }

  function mouseClick(e) {
    const { x, y, z } = getBlockInFront(camera, cubeSize);

    if (e.button === 0) {
      // console.log("Place at", x, y, z);
      placeWorldBlock(chosenBlock, x, y, z);
    }

    if (e.button === 2) {
      // console.log("Delete at", x, y, z);
      removeWorldBlock(x, y, z);
    }
  }

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
      document.addEventListener("mousemove", onMouseMove);

      document.addEventListener("keydown", keyPressDown);

      document.addEventListener("keyup", keyPressUp);

      canvas.addEventListener("mousedown", mouseClick);
    } else {
      document.removeEventListener("mousemove", onMouseMove);

      document.removeEventListener("keydown", keyPressDown);

      document.removeEventListener("keyup", keyPressUp);

      canvas.addEventListener("mousedown", mouseClick);
    }
  });

  let normalOn = document.getElementById('normalon');
  normalOn.addEventListener('click', ()=>{
    gl.uniform1i(u_ShowNormals, true);
  })

  let normalOff = document.getElementById('normaloff');
  normalOff.addEventListener('click', ()=>{
    gl.uniform1i(u_ShowNormals, false);
  })
}

var g_chunksList = [];

//Draw every chunk that is in the world
function renderAllChunks() {
  //check the time at the start of this function
  var startTime = performance.now();

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // var len = g_points.length;
  var len = g_chunksList.length;
  for (var i = 0; i < len; i++) {
    g_chunksList[i].render();
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


//will only render chunks within a certain render distance from camera
let sky;
let sphere;
let renderDistance = chunkSize*2;
function renderNecessaryChunks() {
  //check the time at the start of this function
  var startTime = performance.now();

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  sky.reset();
  sky.matrix.translate(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
  sky.matrix.scale(-renderDistance*3, -renderDistance*3, -renderDistance*3);
  sky.compute();
  gl.disable(gl.CULL_FACE);
  sky.render();
  sphere.render();
  gl.enable(gl.CULL_FACE);

  // var len = g_points.length;
  var len = g_chunksList.length;
  for (var i = 0; i < len; i++) {
    if ((g_chunksList[i].x/2) > camera.at.elements[0]+renderDistance || 
        (g_chunksList[i].x/2) < camera.at.elements[0]-renderDistance ||
        (g_chunksList[i].y/2) > camera.at.elements[1]+renderDistance || 
        (g_chunksList[i].y/2) < camera.at.elements[1]-renderDistance ||
        (g_chunksList[i].z/2) > camera.at.elements[2]+renderDistance || 
        (g_chunksList[i].z/2) < camera.at.elements[2]-renderDistance
      ) {
        continue;
    } else {
        g_chunksList[i].render();
    }
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

function buildAllChunks() {
  for (let i = 0; i < g_chunksList.length; i++) {
    g_chunksList[i].build();
  }
}

function buildGround() {
  const half = worldSize / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      addWorldBlock(BLOCK_TYPES.GRASS, x, 0, z);
    }
  }
}


//world generation created with the help of ChatGPT
const sizeX = 100;
const sizeZ = 100;
const sizeY = 20;

let map = Array(sizeY).fill().map(() =>
  Array(sizeZ).fill().map(() =>
    Array(sizeX).fill(0)
  )
);

const centerX = Math.floor(sizeX / 2);
const centerZ = Math.floor(sizeZ / 2);

for (let z = 0; z < sizeZ; z++) {
  for (let x = 0; x < sizeX; x++) {
    const dx = x - centerX;
    const dz = z - centerZ;

    const noise = (Math.random() - 0.5) * 1.5; 
    const height = Math.floor(3 + 2 * Math.sin(dx * 0.4) + 1.5 * Math.cos(dz * 0.3) + noise);

    for (let y = 0; y < sizeY; y++) {
      if (y < height - 2) map[y][z][x] = 4; // STONE
      else if (y < height - 1) map[y][z][x] = 3; // DIRT
      else if (y < height) map[y][z][x] = 2; // GRASS
    }
  }
}

for (let z = 0; z < sizeZ; z++) {
  for (let x = 0; x < sizeX; x++) {
    for (let y = sizeY - 1; y >= 0; y--) {
      if (map[y][z][x] === BLOCK_TYPES.GRASS) {
        let rand = Math.random();
        if (y > 3 && y < 20 && rand < 0.025) {
          map[y + 1][z][x] = BLOCK_TYPES.PUMPKIN;
        }
        if (y > 3 && y < 20 && rand > 0.025 && rand < 0.042) {
          map[y + 1][z][x] = BLOCK_TYPES.LUCKY;
        }
        break;
      }
    }
  }
}

let castle = [
  [],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 5, 5, 5, 5, 5, 5, 5, 5, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    [4, 4, 4, 4, 0, 0, 4, 4, 4, 4],
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    [4, 4, 4, 4, 0, 0, 4, 4, 4, 4],
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    [4, 4, 4, 4, 0, 0, 4, 4, 4, 4],
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    [4, 4, 4, 4, 0, 0, 4, 4, 4, 4],
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 5, 5, 5, 5, 5, 5, 5, 5, 4]),
    Array(10).fill().map(()=>4),
  ],
  [
    Array(10).fill().map(()=>4),
    ...Array(8).fill().map(() => [4, 0, 0, 0, 0, 0, 0, 0, 0, 4]),
    Array(10).fill().map(()=>4),
  ],

  [
    [4, 4, 0, 0, 0, 0, 0, 0, 4, 4],
    [4, 1, 1, 1, 1, 1, 1, 1, 1, 4],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [4, 1, 1, 1, 1, 1, 1, 1, 1, 4],
    [4, 4, 0, 0, 0, 0, 0, 0, 4, 4],
  ],
  [
    [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    ...Array(2).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    ...Array(2).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [4, 0, 0, 0, 0, 0, 0, 0, 0, 4],
  ],
  [
    [],
    ...Array(2).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    ...Array(2).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [],
  ],
  [
    [],
    ...Array(8).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [],
  ],
  [
    [],
    ...Array(8).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [],
  ],
  [
    [],
    ...Array(8).fill().map(() => [0, 1, 1, 1, 1, 1, 1, 1, 1, 0]),
    [],
  ],
  
];

function buildMap(map) {
  //map is built in layers starting from the origin outwards. 
  for (let y = 0; y < map.length; y++) {
    for (let z = 0; z < map[y].length; z++) {
      for (let x = 0; x < map[y][z].length; x++) {
        if (map[y][z][x] == 0){
          continue;
        }
        addWorldBlock(map[y][z][x], x, y, z);
      }
    }
  }
}


let lastFrame = performance.now() / 1000.0;
let now;
let deltaTime;

function tick() {
  now = performance.now() / 1000.0;
  deltaTime = now - lastFrame;
  lastFrame = now;
  // console.log(g_seconds);
  if (keysPressed["KeyW"]) {
    camera.moveForward(deltaTime);
  }
  if (keysPressed["KeyS"]) {
    camera.moveBackwards(deltaTime);
  }
  if (keysPressed["KeyA"]) {
    camera.moveLeft(deltaTime);
  }
  if (keysPressed["KeyD"]) {
    camera.moveRight(deltaTime);
  }
  if (keysPressed["KeyQ"]) {
    camera.panLeft(deltaTime);
  }
  if (keysPressed["KeyE"]) {
    camera.panRight(deltaTime);
  }
  if (keysPressed["KeyR"]) {
    camera.panUp(deltaTime);
  }
  if (keysPressed["KeyT"]) {
    camera.panDown(deltaTime);
  }
  if (keysPressed["Digit1"]){
    chosenBlock = BLOCK_TYPES.LUCKY;
  }
  if (keysPressed["Digit2"]){
    chosenBlock = BLOCK_TYPES.GRASS;
  }
  if (keysPressed["Digit3"]){
    chosenBlock = BLOCK_TYPES.DIRT;
  }
  if (keysPressed["Digit4"]){
    chosenBlock = BLOCK_TYPES.STONE;
  }
  if (keysPressed["Digit5"]){
    chosenBlock = BLOCK_TYPES.OAK_PLANK;
  }
  if (keysPressed["Digit6"]){
    chosenBlock = BLOCK_TYPES.PUMPKIN;
  }
  //renderAllChunks();
  renderNecessaryChunks();
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

  buildMap(map);
  buildMap(castle);

  buildAllChunks();


  sky = new Cube([101/255,153/255,253/255, 1.0]);

  sphere = new Sphere();
  sphere.matrix.translate(16, 4, 22);
  sphere.compute();

  // addWorldBlock(BLOCK_TYPES.LUCKY, -2, 0, -1)
  // addWorldBlock(BLOCK_TYPES.GRASS, 0, 0, -1)
  // addWorldBlock(BLOCK_TYPES.DIRT, -1, 1, -1)
  // addWorldBlock(BLOCK_TYPES.LUCKY, 0, 0, -16)

  tick();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
