import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DIRECTIONS = ['w', 'a', 's', 'd'];
const WALK_VELOCITY = 5;

class Character {
    constructor(world) {
        this.model = null;
        const gltfLoader = new GLTFLoader();
        const url = 'models/chiikawa/chiikawa.glb';
        gltfLoader.load(url, (gltf) => {
            this.model = gltf.scene;
            this.model.position.y = 0.78;

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            world.scene.add(this.model);
            this.characterController = new CharacterController(this, world);
        });
    }
}

class CharacterController {
    constructor(character, world) {
        this.currentAction = 'Idle';
        this.character = character;
        this.camera = world.camera;
        this.orbitControls = world.controls;

        this.walkDirection = new THREE.Vector3();
        this.rotateAngle = new THREE.Vector3(0, 1, 0);
        this.rotateQuaternion = new THREE.Quaternion();
        this.cameraTarget = new THREE.Vector3();
    }

    update(keysPressed, delta) {
        if (!this.character.model) return;

        const directionsPressed = DIRECTIONS.some(key => keysPressed[key] === true);
        const play = directionsPressed ? 'Walk' : 'Idle';

        if (this.currentAction !== play) {
            this.currentAction = play;
        }

        if (this.currentAction === 'Walk') {
        const angleYCameraDirection = Math.atan2(
            this.character.model.position.x - this.camera.position.x,
            this.character.model.position.z - this.camera.position.z
        );

            const directionOffset = this._directionOffset(keysPressed);

            this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.character.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2);

            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // run/walk velocity
            const velocity = WALK_VELOCITY;

            // move model & camera
            const moveX = this.walkDirection.x * velocity * delta
            const moveZ = this.walkDirection.z * velocity * delta
            this.character.model.position.x += moveX
            this.character.model.position.z += moveZ
            this._updateCameraTarget(moveX, moveZ)
        }
    }

    _updateCameraTarget(moveX, moveZ) {
        // move camera
        this.camera.position.x += moveX
        this.camera.position.z += moveZ

        // update camera target
        this.cameraTarget.x = this.character.model.position.x
        this.cameraTarget.y = this.character.model.position.y + 1
        this.cameraTarget.z = this.character.model.position.z
        this.orbitControls.target = this.cameraTarget
    }

    _directionOffset(keysPressed) {
        let offset = 0;
        if (keysPressed['w']) {
            if (keysPressed['a']) offset = Math.PI / 4;
            else if (keysPressed['d']) offset = -Math.PI / 4;
        } else if (keysPressed['s']) {
            if (keysPressed['a']) offset = Math.PI / 4 + Math.PI / 2;
            else if (keysPressed['d']) offset = -Math.PI / 4 - Math.PI / 2;
            else offset = Math.PI;
        } else if (keysPressed['a']) offset = Math.PI / 2;
        else if (keysPressed['d']) offset = -Math.PI / 2;
        return offset;
    }
}

export { Character };