import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

import { Character } from './character_controller.js'

import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const keysPressed = {}
let spacePressed = false;

const colors = [
    new THREE.Color().setHex(0xFF6B6B),
    new THREE.Color().setHex(0x4ECDC4),
    new THREE.Color().setHex(0xFFE66D),
    new THREE.Color().setHex(0x1A535C),
    new THREE.Color().setHex(0xFF9F1C),
    new THREE.Color().setHex(0x2EC4B6),
    new THREE.Color().setHex(0xFFBF69),
    new THREE.Color().setHex(0x70C1B3),
    new THREE.Color().setHex(0xF7B801),
    new THREE.Color().setHex(0xE63946),
    new THREE.Color().setHex(0xA8DADC),
    new THREE.Color().setHex(0xF1FAEE),
    new THREE.Color().setHex(0xFFB3C1),
    new THREE.Color().setHex(0xCAF0F8),
    new THREE.Color().setHex(0xFFD6A5)
];

class World {
  constructor(canvas) {
    this._canvas = canvas;
    this.character = null;
    this.controls = null;
    this.world = null;
    this._objects = [];
    this._initialized = false;
  }

  async initialize() {
    this._InitRenderer();
    this._InitCamera();
    this._InitScene();
    this._InitLighting();

    this.controls = new OrbitControls(this.camera, this._canvas);
    this.controls.enablePan = false;

    await this._InitPhysics();

    await this._InitCharacter();

    this.controls.target.set(0, 1 + this.character.height, 0);
    this.controls.update();

    this._InitListeners();

    this._InitDebug();

    this._initialized = true;
    this._lastTime = performance.now() * 0.001;
    requestAnimationFrame(this._RAF);
  }

    _InitRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this._canvas });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    _OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _InitCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 3, 4);
        window.addEventListener('resize', this._OnWindowResize.bind(this));
    }

    _InitScene() {
        this.scene = new THREE.Scene();
        this._loader = new THREE.CubeTextureLoader();
        this._textureLoader = new THREE.TextureLoader();
        this._fontLoader = new FontLoader();
        const skybox = this._loader.load([
        'img/skybox/Daylight Box_Right.bmp',
        'img/skybox/Daylight Box_Left.bmp',
        'img/skybox/Daylight Box_Top.bmp',
        'img/skybox/Daylight Box_Bottom.bmp',
        'img/skybox/Daylight Box_Front.bmp',
        'img/skybox/Daylight Box_Back.bmp',
        ]);
        this.scene.background = skybox;

        this._AddGround();
    }

    _InitLighting() {
        const color = 0xFFFFFF;
        const pointIntensity = 450;
        const spotIntensity = 150;
        const al = new THREE.AmbientLight(color, 0.3);
        this.scene.add(al);

        this._light1 = new THREE.PointLight(color, pointIntensity);
        this._light1.castShadow = true;
        this._light1.shadow.normalBias = 0.2;
        this._light1.shadow.camera.left = -30;
        this._light1.shadow.camera.right = 30;
        this._light1.shadow.camera.top = 20;
        this._light1.shadow.camera.bottom = -20;
        this._light1.shadow.camera.near = 0.1;
        this._light1.shadow.camera.far = 70;
        this._light1.shadow.mapSize.set(2048, 2048);
        this._light1.position.set(0, 13, 25);
        this.scene.add(this._light1);

        this._light2 = new THREE.PointLight(color, pointIntensity);
        this._light2.castShadow = true;
        this._light2.shadow.normalBias = 0.2;
        this._light2.shadow.camera.left = -30;
        this._light2.shadow.camera.right = 30;
        this._light2.shadow.camera.top = 20;
        this._light2.shadow.camera.bottom = -20;
        this._light2.shadow.camera.near = 0.1;
        this._light2.shadow.camera.far = 70;
        this._light2.shadow.mapSize.set(2048, 2048);
        this._light2.position.set(0, 13, -25);
        this.scene.add(this._light2);


        const spotLight = new THREE.SpotLight(color, 150, 100, Math.PI / 20, 0.2, 1);
        spotLight.position.set(-25, 20, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.set(2048, 2048);
        spotLight.shadow.camera.near = 1;
        spotLight.shadow.camera.far = 4000;
        spotLight.shadow.camera.fov = 30;
        spotLight.shadow.normalBias = 0.2;
        this.scene.add(spotLight);

        // const helper1 = new THREE.CameraHelper(spotLight.shadow.camera);
        // const helper2 = new THREE.CameraHelper(this._light2.shadow.camera);
        // this.scene.add(helper1);
        // this.scene.add(helper2);
    }

    async _InitPhysics() {
        await RAPIER.init();
        this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
        this._CreateBarrier();
    }

    async _InitCharacter() {
        this.character = new Character(this);
        await this.character.init();
    }

    _InitListeners() {
        document.addEventListener('keydown', (ev) => {
            keysPressed[ev.key.toLowerCase()] = true;
            if (ev.code === 'Space' && !spacePressed){
                spacePressed = true;
                this.addRandShape();
            }
        }, false);
        document.addEventListener('keyup', (ev) => {
            keysPressed[ev.key.toLowerCase()] = false;
            if (ev.code === 'Space') {
                spacePressed = false;
            }
        }, false);
    }

    _InitDebug() {
        this.debug = false;
        this.debugMesh = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true }));
        this.scene.add(this.debugMesh);
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
        if (!this._initialized) return;
        if (this.text) {
            const speed = 0.5;
            const rot = time*speed;
            this.text.rotation.y = rot;
        }


        this.world.step();
        
        if (this.debug) {
            this.debugPhysics();
        }

        let objects = this._objects.slice();
        let length = objects.length;
        for (let i = 0; i < length; i++){
            let rb = objects[i].rigidBody;
            let mesh = objects[i].mesh;
            let position = rb.translation();
            let rotation  = rb.rotation();
            mesh.position.set(position.x, position.y, position.z);
            mesh.quaternion.copy(new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));
        }

        if (this.character && this.character.characterController) {
            this.character.characterController.update(keysPressed, delta);
        }
        this._renderer.render(this.scene, this.camera);
        requestAnimationFrame(this._RAF);
    };

    async _CreateChar(){
        this.character = new Character(this);
        await this.character.init();
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

    _CreateBarrier() {
        let ground = RAPIER.ColliderDesc.cuboid(100, 0.1, 100);
        this.world.createCollider(ground);
        let wall1 = RAPIER.ColliderDesc.cuboid(15, 10, 0.1).setTranslation(0, 0, 24);
        this.world.createCollider(wall1);
        let wall2 = RAPIER.ColliderDesc.cuboid(15, 10, 0.1).setTranslation(0, 0, -24);
        this.world.createCollider(wall2);
        let wall3 = RAPIER.ColliderDesc.cuboid(0.1, 10, 24).setTranslation(14.7, 0, 0);
        this.world.createCollider(wall3);
        let wall4 = RAPIER.ColliderDesc.cuboid(0.1, 10, 24).setTranslation(-14.7, 0, 0);
        this.world.createCollider(wall4);

        let goal1 = RAPIER.ColliderDesc.cuboid(1.7, 2, 0.1).setTranslation(0, 0, 23.5);
        this.world.createCollider(goal1);
        let goal2 = RAPIER.ColliderDesc.cuboid(0.1, 2, 1.0).setTranslation(1.8, 0, 22.6);
        this.world.createCollider(goal2);
        let goal3 = RAPIER.ColliderDesc.cuboid(0.1, 2, 1.0).setTranslation(-1.8, 0, 22.6);
        this.world.createCollider(goal3);
        let goal4 = RAPIER.ColliderDesc.cuboid(1.8, 0.1, 1).setTranslation(0, 2, 22.6);
        this.world.createCollider(goal4);

        let goal5 = RAPIER.ColliderDesc.cuboid(1.7, 2, 0.1).setTranslation(0, 0, -23.5);
        this.world.createCollider(goal5);
        let goal6 = RAPIER.ColliderDesc.cuboid(0.1, 2, 1.0).setTranslation(-1.8, 0, -22.6);
        this.world.createCollider(goal6);
        let goal7 = RAPIER.ColliderDesc.cuboid(0.1, 2, 1.0).setTranslation(1.8, 0, -22.6);
        this.world.createCollider(goal7);
        let goal8 = RAPIER.ColliderDesc.cuboid(1.8, 0.1, 1).setTranslation(0, 2, -22.6);
        this.world.createCollider(goal8);
    }

    start() {
        requestAnimationFrame(this._RAF);
    }

    addCube(x=0, y=0, z=0) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        let randomIndex = Math.floor(Math.random() * colors.length);
        const material = new THREE.MeshPhongMaterial({color: colors[randomIndex]});
        let cube = new THREE.Mesh(geometry, material)
        // cube.receiveShadow = true;
        // cube.castShadow = true;
        cube.position.x = x;
        cube.position.y = y;
        cube.position.z = z;
        this.scene.add(cube);

        // Create a dynamic rigid-body.
        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        // Create a cuboid collider attached to the dynamic rigidBody.
        let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setFriction(0)
        .setDensity(3.0)
        .setRestitution(0.9);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: cube, rigidBody: rb})
    }

    addBall(x=0) {
        const geometry = new THREE.SphereGeometry(1, 32, 16);
        this._textureLoader.load('img/textures/ball.jpg', (texture) => {
            const material = new THREE.MeshPhongMaterial({map: texture });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.scale.set(0.6, 0.6, 0.6);
            sphere.position.x = x;
            sphere.position.y = 2.0;
            sphere.receiveShadow = true;
            this.scene.add(sphere);

            let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(x, 2.0, 3.0);
            let rb = this.world.createRigidBody(rigidBodyDesc);

            let colliderDesc = RAPIER.ColliderDesc.ball(0.6).setFriction(1.5)
            .setDensity(1.0)
            .setRestitution(1.2);
            let collider = this.world.createCollider(colliderDesc, rb);
            this._objects.push({mesh: sphere, rigidBody: rb})
        });
    }

    addSphere(x=0, y=0, z=0) {
        const geometry = new THREE.SphereGeometry(1, 32, 16);
        let randomIndex = Math.floor(Math.random() * colors.length);
        const material = new THREE.MeshPhongMaterial({color: colors[randomIndex]});
        const sphere = new THREE.Mesh(geometry, material);
        sphere.scale.set(0.6, 0.6, 0.6);
        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z=z;
        sphere.receiveShadow = true;
        this.scene.add(sphere);

        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.ball(0.6).setFriction(0)
        .setDensity(3.0)
        .setRestitution(0.9);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: sphere, rigidBody: rb})
    }

    addCone(x=0, y=0, z=0) {
        const geometry = new THREE.ConeGeometry(0.5, 1, 20);
        let randomIndex = Math.floor(Math.random() * colors.length);
        const material = new THREE.MeshPhongMaterial({color: colors[randomIndex]});
        const cone = new THREE.Mesh(geometry, material);
        cone.position.x = x;
        cone.position.y = y;
        cone.position.z= z;
        cone.receiveShadow = true;
        this.scene.add(cone);

        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.cone(0.5, 0.5).setFriction(0)
        .setDensity(3.0)
        .setRestitution(0.9);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: cone, rigidBody: rb})
    }

    addCylinder(x=0, y=0, z=0) {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1);
        let randomIndex = Math.floor(Math.random() * colors.length);
        const material = new THREE.MeshPhongMaterial({color: colors[randomIndex]});
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.x = x;
        cylinder.position.y = y;
        cylinder.position.z = z;
        cylinder.receiveShadow = true;
        this.scene.add(cylinder);

        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        let colliderDesc = RAPIER.ColliderDesc.cylinder(0.5, 0.5).setFriction(0)
        .setDensity(3.0)
        .setRestitution(0.9);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: cylinder, rigidBody: rb})
    }

    addKnot(x=0, y=0, z=0) {
        const torusKnotMesh = new THREE.TorusKnotGeometry(0.5, 0.3);
        let randomIndex = Math.floor(Math.random() * colors.length);
        const material = new THREE.MeshPhongMaterial({color: colors[randomIndex]});
        const knot = new THREE.Mesh(torusKnotMesh, material);
        knot.position.x = x;
        knot.position.y = y;
        knot.position.z = z;
        knot.receiveShadow = true;
        this.scene.add(knot);

        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        const vertices = new Float32Array(torusKnotMesh.attributes.position.array)
        let indices = new Uint32Array(torusKnotMesh.index.array)

        let colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices).setRestitution(0.9)
        .setDensity(3.0);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: knot, rigidBody: rb})
    }

    addHeart(posx=0, posy=0, posz=0) {
        //from three.js website
        const shape = new THREE.Shape();
        const x = 2.5;
        const y = 5;
        shape.moveTo(x + 2.5, y + 2.5);
        shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
        shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
        shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
        shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
        shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
        shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

        const extrudeSettings = {
            steps: 2,  
            depth: 2,  
            bevelEnabled: true,  
            bevelThickness: 1,  
            bevelSize: 1,  
            bevelSegments: 2,  
        };

        const heartMesh = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        heartMesh.center();
        heartMesh.scale(0.15, 0.15, 0.15);
        let randomIndex = Math.floor(Math.random() * colors.length);
        const material = new THREE.MeshPhongMaterial({color: colors[randomIndex]});
        const heart = new THREE.Mesh(heartMesh, material);
        heart.position.x = posx;
        heart.position.y = posy;
        heart.position.z= posz;
        heart.receiveShadow = true;
        this.scene.add(heart);

        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(posx, posy, posz);
        let rb = this.world.createRigidBody(rigidBodyDesc);

        const vertices = new Float32Array(heartMesh.attributes.position.array)
        const vertexCount = heartMesh.attributes.position.count;
        const indices = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
            indices[i] = i;
        }
        let colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices, RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setRestitution(0.9)
        .setDensity(3.0);
        let collider = this.world.createCollider(colliderDesc, rb);
        this._objects.push({mesh: heart, rigidBody: rb})
    }

    addText(x, y, z) {
        this._fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
            const textMesh = new TextGeometry('Press space for more shapes!', {
                font: font,
                size: 80,
                depth: 5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            textMesh.center();
            textMesh.scale(0.01, 0.01, 0.01);

            let randomIndex = Math.floor(Math.random() * colors.length);
            const material = new THREE.MeshPhongMaterial({ color: colors[randomIndex] });
            this.text = new THREE.Mesh(textMesh, material);
            this.text.position.set(x, y, z);
            this.scene.add(this.text);
        });
    }

    addRandShape() {
        let randomIndex = Math.floor(Math.random() * 6);
        let randomHeight = Math.floor(Math.random() * 6)
        let randomXOffset = Math.floor((Math.random() * 6) - 2);
        let randomZOffset = Math.floor((Math.random() * 6) - 2);
        if (randomIndex == 0) {
            this.addCube(this.character.model.position.x, 4.0 + randomHeight, this.character.model.position.z + randomZOffset);
        }
        if (randomIndex == 1) {
            this.addCone(this.character.model.position.x + randomXOffset, 4.0 + randomHeight, this.character.model.position.z + randomZOffset);
        }
        if (randomIndex == 2) {
            this.addCylinder(this.character.model.position.x + randomXOffset, 4.0 + randomHeight, this.character.model.position.z + randomZOffset);
        }
        if (randomIndex == 3) {
            this.addHeart(this.character.model.position.x + randomXOffset, 4.0 + randomHeight, this.character.model.position.z + randomZOffset);
        }
        if (randomIndex == 4) {
            this.addKnot(this.character.model.position.x + randomXOffset, 4.0 + randomHeight, this.character.model.position.z + randomZOffset);
        }
        if (randomIndex == 5) {
            this.addSphere(this.character.model.position.x + randomXOffset, 4.0 + randomHeight, this.character.model.position.z + randomZOffset);
        }
    }


    debugPhysics(){
        const { vertices, colors } = this.world.debugRender();
        this.debugMesh.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        this.debugMesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
    }

}

export { World };