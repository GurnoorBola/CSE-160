let canvas;
let renderer;

import { World } from './world.js';

async function main() {
    canvas = document.querySelector('#webgl');
    let world = new World(canvas);
    await world.initialize();
    //world.addCube(0x44aa88, 0);
    world.addText(0, 7, 0)
    world.addHeart(-2, 3, 0);
    world.addCube(2, 3, 0);
    world.addBall()
    world.start();
}

main();