import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Character {
    constructor(world) {
        this.model = null;
        const gltfLoader = new GLTFLoader();
        const url = 'models/chiikawa/chiikawa.glb';
        gltfLoader.load(url, (gltf) => {
            this.model = gltf.scene;
            this.model.rotation.y  = Math.PI * (-90/180);
            world.scene.add(this.model);
        });
    }
}

class CharacterController {
    constructor() {

    }
}

class InputManger {
    
}

export { Character };