import * as THREE from 'three';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

import { Character } from './character_controller.js'

class World {
    constructor(canvas) {
        this._canvas = canvas;
        this._Initialize();
    }

    _Resize() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this._renderer.setSize(width, height);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
    }

    _SetupLighting() {
        const color = 0xFFFFFF;
        const intensity = 3;
        const al = new THREE.AmbientLight(color, 0.3);
        this.scene.add(al);
        this._light = new THREE.DirectionalLight(color, intensity);
        this._light.position.set(-1, 2, 4);
        this.scene.add(this._light);
    };

    _Initialize() {
        this._objects = [];
        this._RAF = this._RAF.bind(this);
        this._renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this._canvas });
        this.scene = new THREE.Scene();
        this._loader = new THREE.CubeTextureLoader();

        const fov = 75;
        const aspect = 2;
        const near = 0.1;
        const far = 100;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.z = 3;

        const controls = new OrbitControls(this._camera, this._canvas);
        controls.target.set(0, 0, 0);
        controls.update();

        //window.addEventListener('resize', () => this._Resize(), false);
        this._SetupLighting();
        //this._Resize();

        const texture = this._loader.load([
            'img/skybox/vz_apocalypse_right.png',
            'img/skybox/vz_apocalypse_left.png',
            'img/skybox/vz_apocalypse_up.png',
            'img/skybox/vz_apocalypse_down.png',
            'img/skybox/vz_apocalypse_front.png',
            'img/skybox/vz_apocalypse_back.png',
        ]);
        this.scene.background = texture;

        this._CreateChar();
    }

    _RAF = (time) => {
        time *= 0.001;

        this._objects.forEach((object, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            object.rotation.x = rot;
            object.rotation.y = rot;
        });

        this._renderer.render(this.scene, this._camera);
        requestAnimationFrame(this._RAF);
    };

    _CreateChar(){
        let character = new Character(this);
    }

    start() {
        requestAnimationFrame(this._RAF);
    }

    addCube(color, x) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color });
        let cube = new THREE.Mesh(geometry, material)
        cube.position.x = x;
        this._objects.push(cube);
        this.scene.add(cube);
    }

    
}

export { World };