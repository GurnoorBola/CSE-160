import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DIRECTIONS = ['w', 'a', 's', 'd'];
const WALK_SPEED = 5;
const RUN_SPEED = 10;

class Character {
    constructor(world) {
        this.world = world;
        this.model = null;
        this.pos = new THREE.Vector3(0, 0, 0);
        this.height = 0.78;
    }

    async init() {
        await this.loadModel();
        this.SetupCharacterPhysics();
        this.characterController = new CharacterController(this, this.world);
    }

    async loadModel() {
        const gltfLoader = new GLTFLoader();
        const url = 'models/chiikawa/chiikawa.glb';

        const gltf = await new Promise((resolve, reject) => {
            gltfLoader.load(url, resolve, undefined, reject);
        });

        this.model = gltf.scene;
        this.model.position.set(this.pos.x, this.pos.y + this.height, this.pos.z);

        this.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.world.scene.add(this.model);
    }

    SetupCharacterPhysics(){
        this.physWorld = this.world.world;
        this.hitboxYoffset = 0.3;
        let offset = 0.01;
        this.controller = this.physWorld.createCharacterController(offset);

        let rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(this.model.position.x, this.model.position.y + this.hitboxYoffset, this.model.position.z);
        this.rb = this.physWorld.createRigidBody(rigidBodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.capsule(0.3, 0.7)
        this.collider = this.physWorld.createCollider(colliderDesc, this.rb);
        this.controller.setApplyImpulsesToDynamicBodies(true);
    }
}

class CharacterController {
    constructor(character, world) {
        this.currentAction = 'Idle';
        this.character = character;
        this.rb = this.character.rb;
        this.collider = this.character.collider;
        this.controller = this.character.controller;
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
        let speed = WALK_SPEED;
        let shouldSwitch = false;

        if (this.currentAction !== play) {
            this.currentAction = play;
        }

        if (keysPressed['shift']) {
            speed = RUN_SPEED;
            shouldSwitch = true;
        }

        this.orbitControls.mouseButtons = {
            LEFT: shouldSwitch ? 2 : 0,
            MIDDLE: 1,
            RIGHT: shouldSwitch ? 0 : 2,
        };

        if (this.currentAction === 'Walk') {
            const angleYCameraDirection = Math.atan2(
                this.character.model.position.x - this.camera.position.x,
                this.character.model.position.z - this.camera.position.z
            );

            const directionOffset = this._directionOffset(keysPressed);

            this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.character.model.quaternion.rotateTowards(this.rotateQuaternion, 0.05);

            this.camera.getWorldDirection(this.walkDirection)
            this.walkDirection.y = 0
            this.walkDirection.normalize()
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)

            // move model & camera
            const translation = this.walkDirection.clone().multiplyScalar(speed * delta);

            this.controller.computeColliderMovement(this.collider, translation);
            const corrected = this.controller.computedMovement();

            const currentPos = this.rb.translation();
            this.rb.setNextKinematicTranslation({
                x: currentPos.x + corrected.x,
                y: currentPos.y,
                z: currentPos.z + corrected.z
            });

            //this.controller.computeColliderMovement(this.collider, )
            const updatedPos = this.rb.translation();
            this.character.model.position.set(
                updatedPos.x,
                updatedPos.y - this.character.hitboxYoffset,
                updatedPos.z
            );            
            this._updateCameraTarget(corrected.x, corrected.z)
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