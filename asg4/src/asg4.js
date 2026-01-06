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
  varying vec4 v_VertPos;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * a_Position;
    v_UV = a_UV;
    v_Color = a_Color;
    v_texColorWeight = a_texColorWeight;
    v_Normal = a_Normal;
    v_VertPos = a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_Sampler0;
  uniform bool u_ShowNormals;
  uniform bool u_Lit;
  uniform bool u_Sky;
  uniform bool u_specularOn;
  uniform bool u_lightToggle;
  uniform vec3 u_lightColor;
  uniform vec3 u_spotColor;
  uniform vec3 u_lightPos;
  uniform vec3 u_spotPos;
  uniform vec3 u_spotDirection;
  uniform float u_lightInnerCutoff;
  uniform float u_lightOuterCutoff;
  uniform vec3 u_cameraPos;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying float v_texColorWeight;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  void main() {
    vec4 baseColor;
    if (u_ShowNormals){
      baseColor = vec4((v_Normal+1.0)/2.0, 1.0);
    } else {
      float t = v_texColorWeight;
      baseColor = (1.0-t) * v_Color + t * texture2D(u_Sampler0, v_UV);
    }
    
    if (u_lightToggle) {
      vec3 ambient = vec3(baseColor) * 0.2;
      if (u_Sky) {
        gl_FragColor = vec4(ambient, 1.0);
        return;  
      }
      if (!u_Lit) {
        gl_FragColor = baseColor;
        return;  
      }

      vec3 lightVector = u_lightPos - vec3(v_VertPos);
      float r = length(lightVector);
      vec3 L = normalize(lightVector);
      vec3 N = normalize(v_Normal);
      float nDotL = max(dot(N, L), 0.0);

      float constant = 1.0;
      float linear = 0.1;
      float quadratic = 0.05;

      float attenuation = 1.0 / (constant + linear * r + quadratic * r * r);

      vec3 R = reflect(-L, N);
      vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

      float specularStrength = 1.0;
      float shininess = 32.0;
      vec3 specular;
      if (!u_specularOn) {
        specularStrength = 0.0;
      }
      specular = u_lightColor * specularStrength * attenuation * pow(max(dot(E, R), 0.0), shininess);
      vec3 diffuse = vec3(baseColor) * u_lightColor * nDotL * attenuation;

      vec3 spotVector = u_spotPos - vec3(v_VertPos);
      vec3 surfToSpot = normalize(spotVector);
      vec3 spotToSurf = -surfToSpot;

      float spot_diffuse = max(0.0, dot(surfToSpot, N));
      float angleToSurface = dot(u_spotDirection, spotToSurf);
      float spot = smoothstep(u_lightOuterCutoff, u_lightInnerCutoff, angleToSurface);

      float k_constant = 1.0;
      float k_linear = 0.09;
      float k_quadratic = 0.032;
      float spot_attenuation = 1.0 / (k_constant + k_linear * r + k_quadratic * r * r);
      
      float brightness = spot_diffuse * spot * spot_attenuation;

      vec3 spotlight = u_spotColor * brightness;


      gl_FragColor = vec4(specular + diffuse + spotlight + ambient, 1.0);
    } else  {
      gl_FragColor = baseColor;
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
let u_Lit;
let u_Sky;
let u_specularOn;
let u_lightToggle;
let u_lightPos;
let u_spotPos;
let u_spotColor;
let u_spotDirection;
let u_lightInnerCutoff;
let u_lightOuterCutoff;
let u_lightColor;
let u_cameraPos;

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

  u_Lit = gl.getUniformLocation(gl.program, "u_Lit");
  if (!u_Lit) {
    console.log("Failed to get the storage location of u_Lit");
    return false;
  }

  u_Sky = gl.getUniformLocation(gl.program, "u_Sky");
  if (!u_Sky) {
    console.log("Failed to get the storage location of u_Sky");
    return false;
  }

  u_specularOn = gl.getUniformLocation(gl.program, "u_specularOn");
  if (!u_specularOn) {
    console.log("Failed to get the storage location of u_specularOn");
    return false;
  }

  u_lightToggle = gl.getUniformLocation(gl.program, "u_lightToggle");
  if (!u_lightToggle) {
    console.log("Failed to get the storage location of u_lightToggle");
    return false;
  }
  gl.uniform1i(u_lightToggle, true);

  u_lightColor = gl.getUniformLocation(gl.program, "u_lightColor");
  if (!u_lightColor) {
    console.log("Failed to get the storage location of u_lightColor");
    return false;
  }
  gl.uniform3f(u_lightColor, pointColor[0]/255, pointColor[1]/255, pointColor[2]/255);

  u_spotColor = gl.getUniformLocation(gl.program, "u_spotColor");
  if (!u_spotColor) {
    console.log("Failed to get the storage location of u_spotColor");
    return false;
  }
  gl.uniform3f(u_spotColor, spotColor[0]/255, spotColor[1]/255, spotColor[2]/255);

  u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_lightPos");
    return false;
  }

  u_spotPos = gl.getUniformLocation(gl.program, "u_spotPos");
  if (!u_spotPos) {
    console.log("Failed to get the storage location of u_spotPos");
    return false;
  }
  
  u_spotDirection = gl.getUniformLocation(gl.program, "u_spotDirection");
  if (!u_spotDirection) {
    console.log("Failed to get the storage location of u_spotDirection");
    return false;
  }

  u_lightInnerCutoff = gl.getUniformLocation(gl.program, "u_lightInnerCutoff");
  if (!u_lightInnerCutoff) {
    console.log("Failed to get the storage location of u_lightInnerCutoff");
    return false;
  }

  u_lightOuterCutoff = gl.getUniformLocation(gl.program, "u_lightOuterCutoff");
  if (!u_lightOuterCutoff) {
    console.log("Failed to get the storage location of u_lightOuterCutoff");
    return false;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
  if (!u_cameraPos) {
    console.log("Failed to get the storage location of u_cameraPos");
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
let sky;
let pointLight;
let spotLight;
let sphere;
let sphereLoc  = [16, 4, 22];
let lightPos = sphereLoc.slice();
let spotPos = [sphereLoc[0]+2, sphereLoc[1]+2, sphereLoc[2]];
let spotDirectionVec = new Vector3([0, -1, 0]);
let spotDirection = spotDirectionVec.elements;
let radius = 18.0;
let spotInner = Math.cos((Math.PI/180) * (radius-10.0));
let spotOuter = Math.cos((Math.PI/180) * radius);
let pointColor = [255, 0, 0];
let spotColor = [0, 0, 255];
let xOffset = 0;
let yOffset = 2;
let zOffset = 1;
lightPos[0] += xOffset; lightPos[1] += yOffset; lightPos[2] += zOffset;
let animationToggle = false;
let animationStartTime;

let lightSlideX;
let lightSlideZ;

keysPressed = {};
//set up actions for the HTML UI elements
function addActionsForHTML() {
  canvas = document.getElementById("webgl");

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });


  let renderSlider = document.getElementById("render");
  renderSlider.value = 1;
  renderSlider.addEventListener("input", function () {
    renderDistance = chunkSize * renderSlider.value;
  });

  lightSlideX = document.getElementById('lightx');
  lightSlideX.value = lightPos[0]*10;
  lightSlideX.addEventListener('input', ()=>{
    lightPos[0] = lightSlideX.value/10;
    xOffset = lightPos[0] - sphereLoc[0];
    pointLight.reset();
    pointLight.matrix.translate(lightPos[0], lightPos[1], lightPos[2]);
    pointLight.matrix.scale(0.25, 0.25, 0.25);
    pointLight.compute();
  });

  let lightSlideY = document.getElementById('lighty');
  lightSlideY.value = lightPos[1]*10;
  lightSlideY.addEventListener('input', ()=>{
    lightPos[1] = lightSlideY.value/10;
    yOffset = lightPos[1] - sphereLoc[1];
    pointLight.reset();
    pointLight.matrix.translate(lightPos[0], lightPos[1], lightPos[2]);
    pointLight.matrix.scale(0.25, 0.25, 0.25);
    pointLight.compute();
  });

  lightSlideZ = document.getElementById('lightz');
  lightSlideZ.value = lightPos[2]*10;
  lightSlideZ.addEventListener('input', ()=>{
    lightPos[2] = lightSlideZ.value/10;
    zOffset = lightPos[2] - sphereLoc[2];
    pointLight.reset();
    pointLight.matrix.translate(lightPos[0], lightPos[1], lightPos[2]);
    pointLight.matrix.scale(0.25, 0.25, 0.25);
    pointLight.compute();
  });

  let pointR = document.getElementById('pointR');
  pointR.value = pointColor[0];
  pointR.addEventListener('input', ()=>{
    pointColor[0] = pointR.value;
    pointLight.baseColor[0] = pointColor[0]/255;
    pointLight.compute();
    gl.uniform3f(u_lightColor, pointColor[0]/255, pointColor[1]/255, pointColor[2]/255)
  })

  let pointG = document.getElementById('pointG');
  pointG.value = pointColor[1];
  pointG.addEventListener('input', ()=>{
    pointColor[1] = pointG.value;
    pointLight.baseColor[1] = pointColor[1]/255;
    pointLight.compute();
    gl.uniform3f(u_lightColor, pointColor[0]/255, pointColor[1]/255, pointColor[2]/255)
  })

  let pointB = document.getElementById('pointB');
  pointB.value = pointColor[2];
  pointB.addEventListener('input', ()=>{
    pointColor[2] = pointB.value;
    pointLight.baseColor[2] = pointColor[2]/255;
    pointLight.compute();
    gl.uniform3f(u_lightColor, pointColor[0]/255, pointColor[1]/255, pointColor[2]/255)
  })

  let spotSlideX = document.getElementById('spotx');
  spotSlideX.value = spotPos[0]*10;
  spotSlideX.addEventListener('input', ()=>{
    spotPos[0] = spotSlideX.value/10;
    spotLight.reset();
    spotLight.matrix.translate(spotPos[0], spotPos[1], spotPos[2]);
    spotLight.matrix.scale(0.25, 0.25, 0.25);
    spotLight.compute();
  });

  let spotSlideY = document.getElementById('spoty');
  spotSlideY.value = spotPos[1]*10;
  spotSlideY.addEventListener('input', ()=>{
    spotPos[1] = spotSlideY.value/10;
    spotLight.reset();
    spotLight.matrix.translate(spotPos[0], spotPos[1], spotPos[2]);
    spotLight.matrix.scale(0.25, 0.25, 0.25);
    spotLight.compute();
  });

  let spotSlideZ = document.getElementById('spotz');
  spotSlideZ.value = spotPos[2]*10;
  spotSlideZ.addEventListener('input', ()=>{
    spotPos[2] = spotSlideZ.value/10;
    spotLight.reset();
    spotLight.matrix.translate(spotPos[0], spotPos[1], spotPos[2]);
    spotLight.matrix.scale(0.25, 0.25, 0.25);
    spotLight.compute();
  });

  let spotR = document.getElementById('spotR');
  spotR.value = spotColor[0];
  spotR.addEventListener('input', ()=>{
    spotColor[0] = spotR.value;
    spotLight.baseColor[0] = spotColor[0]/255;
    spotLight.compute();
    gl.uniform3f(u_spotColor, spotColor[0]/255, spotColor[1]/255, spotColor[2]/255)
  })

  let spotG = document.getElementById('spotG');
  spotG.value = spotColor[1];
  spotG.addEventListener('input', ()=>{
    spotColor[1] = spotG.value;
    spotLight.baseColor[1] = spotColor[1]/255;
    spotLight.compute();
    gl.uniform3f(u_spotColor, spotColor[0]/255, spotColor[1]/255, spotColor[2]/255)
  })

  let spotB = document.getElementById('spotB');
  spotB.value = spotColor[2];
  spotB.addEventListener('input', ()=>{
    spotColor[2] = spotB.value;
    spotLight.baseColor[2] = spotColor[2]/255;
    spotLight.compute();
    gl.uniform3f(u_spotColor, spotColor[0]/255, spotColor[1]/255, spotColor[2]/255)
  })

  let spotRotation = document.getElementById('spotRotate');
  spotRotation.value = 0;
  spotRotation.addEventListener('input', ()=>{
    let rotMatrix = new Matrix4();
    rotMatrix.rotate(spotRotation.value, 0, 0, 1);
    let directionVec = rotMatrix.multiplyVector3(spotDirectionVec);
    directionVec.normalize();
    spotDirection = directionVec.elements;
    console.log(spotDirection);
    gl.uniform3f(u_spotDirection, spotDirection[0], spotDirection[1], spotDirection[2])
  })

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
      keysPressed = {};

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

  let animationOn = document.getElementById('animationon');
  animationOn.addEventListener('click', () => {
    if (animationToggle) {
      return;
    }
    lightSlideX.disabled = true;
    lightSlideZ.disabled = true;
    animationToggle = true;
    animationStartTime = performance.now() /1000;
    console.log(true)
  });

  let animationOff = document.getElementById('animationoff');
  animationOff.addEventListener('click', () => {
    lightSlideX.disabled = false;
    lightSlideZ.disabled = false;
    animationToggle = false;
  });

  let lightingOn = document.getElementById('lighton');
  lightingOn.addEventListener('click', ()=>{
    gl.uniform1i(u_lightToggle, true);
  });

  let lightingOff = document.getElementById('lightoff');
  lightingOff.addEventListener('click', ()=>{
    gl.uniform1i(u_lightToggle, false);
  });

}

//hide buttons and stuff
var on = false;
function displayOptions() {
  var button = document.getElementById("showText");
  var text = document.getElementById("options");
  var instructions = document.getElementById("instructions")
  if (on) {
    text.style.display = "none";
    instructions.style.display = "block";
    button.textContent = "Configure";
    on = false;
  } else {
    text.style.display = "block";
    instructions.style.display = "none";
    button.textContent = "Instructions";
    on = true;
  }
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
let renderDistance = chunkSize*1;
function renderNecessaryChunks() {
  //check the time at the start of this function
  var startTime = performance.now();

  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projMatrix.elements);

  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  gl.uniform3f(u_lightPos, lightPos[0], lightPos[1], lightPos[2]);
  gl.uniform3f(u_spotPos, spotPos[0], spotPos[1], spotPos[2]);
  gl.uniform3f(u_spotDirection, spotDirection[0], spotDirection[1], spotDirection[2]);
  gl.uniform1f(u_lightInnerCutoff, spotInner);
  gl.uniform1f(u_lightOuterCutoff, spotOuter);
  gl.uniform3f(u_cameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  gl.uniform1i(u_Lit, false);
  gl.uniform1i(u_Sky, true);
  gl.uniform1i(u_specularOn, false);

  sky.reset();
  sky.matrix.translate(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
  sky.matrix.scale(-renderDistance*3, -renderDistance*3, -renderDistance*3);
  sky.compute();
  sky.render();

  gl.uniform1i(u_Lit, false);
  gl.uniform1i(u_Sky, false);
  pointLight.render();
  spotLight.render();

  gl.uniform1i(u_Lit, true);
  gl.uniform1i(u_specularOn, true);

  sphere.render();

  gl.uniform1i(u_specularOn, false);
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

  if (animationToggle) {
    let time = performance.now()/1000 - animationStartTime;
    let r = Math.sqrt(xOffset**2 + zOffset**2)
    let x = r * Math.cos(2*time);
    let z = r * Math.sin(2*time);

    lightPos[0] = sphereLoc[0] + x;
    lightPos[2] = sphereLoc[2] + z;

    lightSlideX.value = lightPos[0]*10;
    lightSlideZ.value = lightPos[2]*10;


    pointLight.reset();
    pointLight.matrix.translate(lightPos[0], lightPos[1], lightPos[2]);
    pointLight.matrix.scale(0.25, 0.25, 0.25);
    pointLight.compute();
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
  sphere.matrix.translate(sphereLoc[0], sphereLoc[1], sphereLoc[2]);
  sphere.compute();

  pointLight = new Cube([1, 0, 0, 1])
  pointLight.matrix.translate(lightPos[0], lightPos[1], lightPos[2]);
  pointLight.matrix.scale(0.25, 0.25, 0.25);
  pointLight.compute();

  spotLight = new Cube([0, 0, 1, 1]);
  spotLight.matrix.translate(spotPos[0], spotPos[1], spotPos[2]);
  spotLight.matrix.scale(0.25, 0.25, 0.25);
  spotLight.compute();

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
