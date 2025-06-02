import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

import { Character } from './character_controller.js'

const keysPressed = {}
document.addEventListener('keydown', (ev) => {
    keysPressed[ev.key.toLowerCase()] = true;
}, false);
document.addEventListener('keyup', (ev) => {
    keysPressed[ev.key.toLowerCase()] = false;
}, false);

class World {
    constructor(canvas) {
        this._canvas = canvas;
    }

    _SetupLighting() {
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const color = 0xFFFFFF;
        const intensity = 3;
        const al = new THREE.AmbientLight(color, 0.3);
        this.scene.add(al);
        this._light = new THREE.DirectionalLight(color, intensity);
        this._light.castShadow = true;
        this._light.shadow.normalBias = 0.2;
        this._light.shadow.camera.left = -30;
        this._light.shadow.camera.right = 30;
        this._light.shadow.camera.top = 20;
        this._light.shadow.camera.bottom = -20;
        this._light.shadow.camera.near = 0.1;
        this._light.shadow.camera.far = 70;
        this._light.shadow.mapSize.set(2048, 2048);
        this._light.position.set(-7, 13, 25);
        this.scene.add(this._light);

        const helper = new THREE.CameraHelper(this._light.shadow.camera);
        this.scene.add(helper);
    };

    _OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    async initialize() {
        this._objects = [];
        this._physicsObjects = [];
        this._RAF = this._RAF.bind(this);
        this._renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this._canvas });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this.scene = new THREE.Scene();
        this._loader = new THREE.CubeTextureLoader();
        this.world = null;

        const fov = 75;
        const aspect = 2;
        const near = 0.1;
        const far = 100;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.x = 0;
        this.camera.position.y = 3;
        this.camera.position.z = 4;

        this.camera.lookAt(0, 1, 1);

        window.addEventListener('resize', this._OnWindowResize.bind(this));

        //window.addEventListener('resize', () => this._Resize(), false);
        this._SetupLighting();
        //this._Resize();

        const texture = this._loader.load([
            'img/skybox/Daylight Box_Right.bmp',
            'img/skybox/Daylight Box_Left.bmp',
            'img/skybox/Daylight Box_Top.bmp',
            'img/skybox/Daylight Box_Bottom.bmp',
            'img/skybox/Daylight Box_Front.bmp',
            'img/skybox/Daylight Box_Back.bmp',
        ]);
        this.scene.background = texture;
        this._AddGround();
        this._CreateChar();

        this.controls = new OrbitControls(this.camera, this._canvas);
        this.controls.target.set(0, 1 + 0.78, 0);
        this.controls.update();

        await RAPIER.init().then(() => {
            this._StartPhysics()
        });
    }

    _RAF = (time) => {
        time *= 0.001;
        const delta = time - this._lastTime;
        this._lastTime = time;

        // this._objects.forEach((object, ndx) => {
        //     const speed = 1 + ndx * .1;
        //     const rot = time * speed;
        //     object.rotation.x = rot;
        //     object.rotation.y = rot;
        // });
        this.world.step();

        let objects = this._objects.slice();
        let length = objects.length;
        for (let i = 0; i < length; i++){
            let rb = objects[i].rigidBody;
            let mesh = objects[i].mesh;
            let position = rb.translation();
            let rotation  = rb.rotation();
            console.log(position.x, position.y);
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        }

        if (this.character && this.character.characterController) {
            this.character.characterController.update(keysPressed, delta);
        }
        this._renderer.render(this.scene, this.camera);
        requestAnimationFrame(this._RAF);
    };

    _CreateChar(){
        this.character = new Character(this);
    }

    _AddGround() {
        const gltfLoader = new GLTFLoader();
            const url = 'models/Soccer Field.glb';
            gltfLoader.load(url, (gltf) => {
                let model = gltf.scene;
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color,
                            roughness: 0.7,
                            metalness: 0.0
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            this.scene.add(model);
        });
        let planeWidth = 100;
        let planeHeight = 100;

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshPhysicalMaterial({
            color: '#333',
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = Math.PI * (90/180);
        plane.receiveShadow = true;
        
        this.scene.add(plane);
    }

    _StartPhysics(){
        // Use the RAPIER module here.
        let gravity = { x: 0.0, y: -9.81, z: 0.0 };
        this.world = new RAPIER.World(gravity);

        // Create the ground
        let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0);
        this.world.createCollider(groundColliderDesc);

    }

    start() {
        requestAnimationFrame(this._RAF);
    }

    addCube(color, x) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color });
        let cube = new THREE.Mesh(geometry, material)
        // cube.receiveShadow = true;
        // cube.castShadow = true;
        cube.position.x = x;
        cube.position.y = 1.0;
        this.scene.add(cube);

        // Create a dynamic rigid-body.
        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, 3.0, 0.0);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        // Create a cuboid collider attached to the dynamic rigidBody.
        let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setMass(1).setRestitution(0.9);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: cube, rigidBody: rb})
    }

    
}

export { World };