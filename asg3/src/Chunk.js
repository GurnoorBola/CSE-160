const BLOCK_TYPES = {
    AIR: 0,
    LUCKY: 1
}

const BLOCK_DATA = {
    [BLOCK_TYPES.LUCKY] : {
        name: 'lucky',
        color: [1, 0, 0, 1],
        uv: Array(6).fill().map(() => [0, 0, 1, 0, 1, 1, 0, 1]),
        texWeight: 1.0
    }
}

const chunkSize = 16
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

function addBlock(chunk, type, x, y, z){
    if (x < chunkSize && y < chunkSize && z < chunkSize){
        let index = getIndex(x, y, z);
        chunk.blocks[index] = type;
    }
}

class Chunk {
    constructor(origin) {
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

