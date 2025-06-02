let canvas;
let renderer;

import { World } from './world.js';

async function main() {
    canvas = document.querySelector('#webgl');
    let world = new World(canvas);
    await world.initialize();
    //world.addCube(0x44aa88, 0);
    world.addCube(0x8844aa, -2);
    world.addCube(0xaa8844,  2);
    world.start();
}

main();