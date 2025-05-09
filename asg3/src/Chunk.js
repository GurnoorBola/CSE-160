const BLOCK_TYPES = {
    AIR: 0,
    LUCKY: 1,
    GRASS: 2,
    DIRT: 3,
}

const sheetSize = 2048;

const BLOCK_DATA = {
    [BLOCK_TYPES.LUCKY] : {
        name: 'lucky',
        color: [1, 0, 0, 1],
        uv: Array(6).fill().map(() => [0.312744140625, 0.562744140625, 0.437255859375, 0.562744140625, 0.437255859375, 0.687255859375, 0.312744140625, 0.687255859375]),
        texWeight: 1.0
    },
    [BLOCK_TYPES.GRASS] : {
        name: 'grass',
        color: [0, 1, 0, 1],
        uv: [[0.000244140625, 0.500244140625, 0.249755859375, 0.500244140625, 0.249755859375, 0.749755859375, 0.000244140625, 0.749755859375], [0.000244140625, 0.500244140625, 0.249755859375, 0.500244140625, 0.249755859375, 0.749755859375, 0.000244140625, 0.749755859375], [0.750244140625, 0.750244140625, 0.999755859375, 0.750244140625, 0.999755859375, 0.999755859375, 0.750244140625, 0.999755859375], [0.250244140625, 0.750244140625, 0.499755859375, 0.750244140625, 0.499755859375, 0.999755859375, 0.250244140625, 0.999755859375], [0.000244140625, 0.500244140625, 0.249755859375, 0.500244140625, 0.249755859375, 0.749755859375, 0.000244140625, 0.749755859375], [0.000244140625, 0.500244140625, 0.249755859375, 0.500244140625, 0.249755859375, 0.749755859375, 0.000244140625, 0.749755859375]],
        texWeight: 1.0
    },
    [BLOCK_TYPES.DIRT] : {
        name: 'dirt',
        color: [1, 0, 0, 1],
        uv: Array(6).fill().map(() => [0.250244140625, 0.750244140625, 0.499755859375, 0.750244140625, 0.499755859375, 0.999755859375, 0.250244140625, 0.999755859375]),
        texWeight: 1.0
    },
}
const chunkSize = 16
const worldSize = chunkSize*20;
const cubeSize = 0.5

function getIndex(x, y, z) {
    return x + y * chunkSize + z * chunkSize * chunkSize;
}

function getCoords(index){
    z = Math.floor(index / (chunkSize * chunkSize));
    y = Math.floor((index % (chunkSize * chunkSize)) / chunkSize);
    x = index % chunkSize;
    return [x, y, z];
}

function addChunkBlock(chunk, type, x, y, z){
    if (x < chunkSize && y < chunkSize && z < chunkSize){
        let index = getIndex(x, y, z);
        chunk.blocks[index] = type;
    }
}

function delChunkBlock(chunk, x, y, z) {
    if (x < chunkSize && y < chunkSize && z < chunkSize){
        let index = getIndex(x, y, z);
        chunk.blocks[index] = BLOCK_TYPES.AIR;
    }
}

function addWorldBlock(type, x, y, z){
    for (let i = 0; i < g_chunksList.length; i++) {
        let chunk = g_chunksList[i];
        if (x >= chunk.x && x < (chunk.x + chunkSize) && 
            y >= chunk.y && y < (chunk.y + chunkSize) && 
            z >= chunk.z && z < (chunk.z + chunkSize)
        ){
            //convert world coords to chunk coords
            let chunkX = x%chunkSize;
            let chunkY = y%chunkSize;
            let chunkZ = z%chunkSize;
            if (chunkX < 0) chunkX += chunkSize;
            if (chunkY < 0) chunkY += chunkSize;
            if (chunkZ < 0) chunkZ += chunkSize;

            let index = getIndex(chunkX, chunkY, chunkZ);
            chunk.blocks[index] = type;
            // console.log(`Adding block at (${x}, ${y}, ${z})`);
            // console.log(`Matched chunk (${chunk.x}, ${chunk.y}, ${chunk.z})`);
            return;
        }
    }
    console.log('invalid coordinates');
    return false;
}

function placeWorldBlock(type, x, y, z){
    for (let i = 0; i < g_chunksList.length; i++) {
        let chunk = g_chunksList[i];
        if (x >= chunk.x && x < (chunk.x + chunkSize) && 
            y >= chunk.y && y < (chunk.y + chunkSize) && 
            z >= chunk.z && z < (chunk.z + chunkSize)
        ){
            //convert world coords to chunk coords
            let chunkX = x%chunkSize;
            let chunkY = y%chunkSize;
            let chunkZ = z%chunkSize;
            if (chunkX < 0) chunkX += chunkSize;
            if (chunkY < 0) chunkY += chunkSize;
            if (chunkZ < 0) chunkZ += chunkSize;

            let index = getIndex(chunkX, chunkY, chunkZ);
            chunk.blocks[index] = type;
            // console.log(`Adding block at (${x}, ${y}, ${z})`);
            // console.log(`Matched chunk (${chunk.x}, ${chunk.y}, ${chunk.z})`);
            chunk.build();
            return;
        }
    }
    console.log('invalid coordinates');
    return false;
}

function delWorldBlock(x, y, z) {
    for (let i = 0; i < g_chunksList.length; i++) {
        let chunk = g_chunksList[i];
        if (x >= chunk.x && x < (chunk.x + chunkSize) && 
            y >= chunk.y && y < (chunk.y + chunkSize) && 
            z >= chunk.z && z < (chunk.z + chunkSize)
        ){
            //convert world coords to chunk coords
            let chunkX = x%chunkSize;
            let chunkY = y%chunkSize;
            let chunkZ = z%chunkSize;
            if (chunkX < 0) chunkX += chunkSize;
            if (chunkY < 0) chunkY += chunkSize;
            if (chunkZ < 0) chunkZ += chunkSize;

            let index = getIndex(chunkX, chunkY, chunkZ);
            chunk.blocks[index] = BLOCK_TYPES.AIR;
            // console.log(`Deleting block at (${x}, ${y}, ${z})`);
            // console.log(`Matched chunk (${chunk.x}, ${chunk.y}, ${chunk.z})`);
            chunk.build();
            return;
        }
    }
    console.log('invalid coordinates');
    return false;
}

function removeWorldBlock(x, y, z) {
    for (let i = 0; i < g_chunksList.length; i++) {
        let chunk = g_chunksList[i];
        if (x >= chunk.x && x < (chunk.x + chunkSize) && 
            y >= chunk.y && y < (chunk.y + chunkSize) && 
            z >= chunk.z && z < (chunk.z + chunkSize)
        ){
            //convert world coords to chunk coords
            let chunkX = x%chunkSize;
            let chunkY = y%chunkSize;
            let chunkZ = z%chunkSize;
            if (chunkX < 0) chunkX += chunkSize;
            if (chunkY < 0) chunkY += chunkSize;
            if (chunkZ < 0) chunkZ += chunkSize;

            let index = getIndex(chunkX, chunkY, chunkZ);
            chunk.blocks[index] = BLOCK_TYPES.AIR;
            // console.log(`Deleting block at (${x}, ${y}, ${z})`);
            // console.log(`Matched chunk (${chunk.x}, ${chunk.y}, ${chunk.z})`);
            chunk.build();
            return true;
        }
    }
    console.log('invalid coordinates');
    return false;
}

function checkLookBlock(camera) {
    let forward = new Vector3();
    forward.set(camera.at);
    forward.sub(camera.eye);
    forward.normalize();
}

function chunkify(){
  const half = worldSize / 2;

  for (let x = -half; x < half; x += chunkSize) {
    for (let y = 0; y < worldSize; y += chunkSize) {
      for (let z = -half; z < half; z += chunkSize) {
        let chunk = new Chunk([x, y, z]);
        chunk.build();
        g_chunksList.push(chunk);
        console.log(`Created chunk at ${x}, ${y} ${z}`);
      }
    }
  }
}

function buildGround() {
  const half = worldSize / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      addWorldBlock(BLOCK_TYPES.GRASS, x, 0, z);
    }
  }
  for (let i = 0; i < g_chunksList.length; i++){
    g_chunksList[i].build();
  }
}

class Chunk {
    constructor(origin) {
        this.type = 'chunk';

        this.x = origin[0];
        this.y = origin[1];
        this.z = origin[2];
        
        var chunkBuffer = gl.createBuffer();
        if (!chunkBuffer) {
            console.log('Failed to create the buffer object');
            return -1
        }
        this.chunkBuffer = chunkBuffer;
        this.blocks = new Uint8Array(chunkSize * chunkSize * chunkSize);

        this.vertexData = [];
    }

    //if render draw everything in buffer
    render () {
        //structure of chunkData [x, y, z,   u, v,   r, g, b, a,   textureweight]
        //remember to build once before rendering

        const stride = 10;

        var FSIZE = Float32Array.BYTES_PER_ELEMENT;
        
        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkBuffer);
    
        // Assign the buffer object to a_Postion variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*stride, 0);
    
        // Enable the assignmnet to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Assign the buffer object to a_UV variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE*stride, FSIZE*3);

        // Enable the assignmnet to a_UV variable
        gl.enableVertexAttribArray(a_UV);

        // Assign the buffer object to a_Color variable
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE*stride, FSIZE*5);

        // Enable the assignmnet to a_Color variable
        gl.enableVertexAttribArray(a_Color);

        // Assign the buffer object to a_texColorWeight variable
        gl.vertexAttribPointer(a_texColorWeight, 1, gl.FLOAT, false, FSIZE*stride, FSIZE*9);

        // Enable the assignmnet to a_texColorWeight variable
        gl.enableVertexAttribArray(a_texColorWeight);
    
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexData.length/stride);
    }

    build() {
        this.vertexData = [];
        for (let i = 0; i < this.blocks.length; i++){
            //get block type from blocks array and make block of that type
            let blockType = this.blocks[i];
            if (blockType != BLOCK_TYPES.AIR){
                let cube = new Cube(this, BLOCK_DATA[blockType].uv, BLOCK_DATA[blockType].color, BLOCK_DATA[blockType].texWeight);
                let xyz = getCoords(i)
                cube.matrix.scale(cubeSize, cubeSize, cubeSize);
                cube.matrix.translate(this.x, this.y, this.z);
                cube.matrix.translate(xyz[0], xyz[1], xyz[2]);
                cube.compute();
            }
        }

        let vertices = new Float32Array(this.vertexData)

        //Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkBuffer);

        //write data to buffer
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    }
}

