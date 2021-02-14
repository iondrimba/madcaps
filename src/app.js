/* eslint-disable no-console */
import './style.css';
import Tweakpane from 'tweakpane';
import { gsap } from "gsap";
import {
  Scene,
  Object3D,
  Color,
  WebGLRenderer,
  PCFSoftShadowMap,
  PerspectiveCamera,
  AxesHelper,
  AmbientLight,
  DirectionalLight,
  GridHelper,
  PlaneBufferGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  Mesh,
  DoubleSide,
  SphereBufferGeometry,
  BoxBufferGeometry,
} from 'three';
import Stats from 'stats-js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import {
  radians,
  rgbToHex,
  distance,
} from './helpers';
class App {
  init() {
    this.setup();
    this.createScene();
    this.createCamera();
    this.addCameraControls();
    this.addAmbientLight();
    this.addDirectionalLight();
    this.addFloor();
    this.addFloorGrid();
    this.addFloorHelper();
    this.addSphere({ x: 0, y: 1, z: -4 });
    this.addBlocksWall();
    this.addAxisHelper();
    this.addStatsMonitor();
    this.addWindowListeners();
    this.animate();
    this.animateSphere();
    this.addTweakPane();
  }

  cleanUp() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('visibilitychange', this.onVisibilitychange);

    while (document.body.childNodes.length) {
      document.body.removeChild(document.body.lastChild);
    }
  }

  setup() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.gsap = gsap;

    this.colors = {
      background: rgbToHex(window.getComputedStyle(document.body).backgroundColor),
      floor: '#ffffff',
      ball: '#5661ff',
      box: '#ff0000',
      grid: '#aca9a9',
      ambientLight: '#ffffff',
      directionalLight: '#ffffff',
    };

    this.meshes = {
      container: new Object3D(),
      boxes: {
        size: .4,
        geometry: () => {
          const width = this.meshes.boxes.size, height = this.meshes.boxes.size /4 , depth = this.meshes.boxes.size;

          return new BoxBufferGeometry(width, height, depth);
        },
        material: new MeshStandardMaterial({
          color: this.colors.box,
          metalness: .11,
          emissive: 0x0,
          roughness: .1,
        }),
      },
      boxWall: {
        container: new Object3D(),
        front: [],
        back: [],
      },
      sphere: {
        mesh: null,
        size: .25,
        material: new MeshStandardMaterial({
          color: this.colors.ball,
          metalness: .11,
          emissive: 0x0,
          roughness: .1,
        }),
      },
    };


    this.motion = {
      range: { inMin: 2, inMax: -.5, min: .5, max: -1.8 },
      clamp: { min: -4.5, max: .05 },
    };

    this.onResize = this.onResize.bind(this);
    this.onVisibilitychange = this.onVisibilitychange.bind(this);
  }

  addTweakPane() {
    this.tweakpane = new Tweakpane();
    this.motionGUI = this.tweakpane.addFolder({
      title: "Motion",
      expanded: true
    });

    this.motionGUI.addInput(this.motion.range, 'inMin', { min: -100, max: 100, step: .1 });

    this.motionGUI.addInput(this.motion.range, 'inMax', { min: -100, max: 100, step: .1 });

    this.motionGUI.addInput(this.motion.range, 'min', { min: -100, max: 100, step: .1 });

    this.motionGUI.addInput(this.motion.range, 'max', { min: -100, max: 100, step: .1 });
  }

  createScene() {
    this.scene = new Scene();
    this.scene.background = new Color(this.colors.background);
    this.renderer = new WebGLRenderer({ antialias: true });
    this.scene.add(this.meshes.container);
    this.renderer.setSize(this.width, this.height);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  addAxisHelper() {
    const axesHelper = new AxesHelper(5);

    this.debug && this.scene.add(axesHelper);
  }

  createCamera() {
    this.camera = new PerspectiveCamera(20, this.width / this.height, 1, 1000);
    this.camera.position.set(0, 10, 50);

    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControl.maxPolarAngle = radians(90);
    this.orbitControl.maxAzimuthAngle = radians(40);
    this.orbitControl.enableDamping = true;
    this.orbitControl.dampingFactor = 0.02;

    document.body.style.cursor = '-moz-grabg';
    document.body.style.cursor = '-webkit-grab';

    this.orbitControl.addEventListener('start', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grabbing';
        document.body.style.cursor = '-webkit-grabbing';
      });
    });

    this.orbitControl.addEventListener('end', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grab';
        document.body.style.cursor = '-webkit-grab';
      });
    });
  }

  addAmbientLight() {
    const light = new AmbientLight({ color: this.colors.ambientLight }, .5);

    this.scene.add(light);
  }

  addDirectionalLight() {
    const target = new Object3D();
    target.position.set(0, 0, -40);

    this.directionalLight = new DirectionalLight(this.colors.directionalLight, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.needsUpdate = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.position.set(0, 13, 23);
    this.directionalLight.target = target;

    this.directionalLight.shadow.camera.far = 1000;
    this.directionalLight.shadow.camera.near = -100;

    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.directionalLight.shadow.camera.zoom = 1;

    this.scene.add(this.directionalLight);
  }

  addFloorGrid() {
    const size = 20;
    const divisions = 20;
    this.grid = new GridHelper(size, divisions, this.colors.grid, this.colors.grid);

    this.grid.position.set(0, 0, 0);
    this.grid.material.opacity = 0;
    this.grid.material.transparent = false;

    this.scene.add(this.grid);
  }

  addFloor() {
    const geometry = new PlaneBufferGeometry(20, 20);
    const material = new MeshStandardMaterial({ color: this.colors.floor, side: DoubleSide });

    this.floor = new Mesh(geometry, material);
    this.floor.position.y = 0;
    this.floor.position.z = 0;
    this.floor.rotateX(Math.PI / 2);
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  addFloorHelper() {
    this.controls = new TransformControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.attach(this.floor);
    this.scene.add(this.controls);
  }

  addSphere({ x, y, z }) {
    const radius = this.meshes.sphere.size, width = 32, height = 32;
    const geometry = new SphereBufferGeometry(radius, width, height);
    const mesh = new Mesh(geometry, this.meshes.sphere.material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.position.set(x, y, z);

    this.meshes.sphere.mesh = mesh;

    this.scene.add(mesh);
  }

  getBoxMesh(geometry, material) {
    const mesh = new Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  addBlocksWall() {
    const cols = 15;
    const rows = 10;
    const geometry = this.meshes.boxes.geometry();

    for (let col = 0; col < cols; col++) {
      this.meshes.boxWall.front[col] = [];
      this.meshes.boxWall.back[col] = [];

      for (let row = 0; row < rows; row++) {
        const front = this.getBoxMesh(geometry, this.meshes.boxes.material);
        const back = this.getBoxMesh(geometry, this.meshes.boxes.material);
        const x = row * (this.meshes.boxes.size / 2);
        const z = col * (this.meshes.boxes.size / 2);

        front.position.set(x, 0, z);
        back.position.copy(front.position);

        this.meshes.boxWall.container.add(front);
        this.meshes.boxWall.container.add(back);

        this.meshes.boxWall.front[col][row] = front;
        this.meshes.boxWall.back[col][row] = back;
      }
    }

    this.meshes.boxWall.container.rotateZ(Math.PI / 2);

    this.scene.add(this.meshes.boxWall.container);
  }

  draw() {
    const cols = 15;
    const rows = 10;
    const { x, z, y } = this.meshes.sphere.mesh.position;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const front = this.meshes.boxWall.front[col][row];
        const back = this.meshes.boxWall.back[col][row];

        const dist = distance(x + y, z, front.position.x, front.position.z);
        const range = this.gsap.utils.mapRange(this.motion.range.inMin, this.motion.range.inMax, this.motion.range.min, this.motion.range.max, dist);
        const amount = gsap.utils.clamp(this.motion.clamp.min, this.motion.clamp.max, range);

        this.gsap.to(front.position, {
          duration: .1,
          ease: "sine.inOut",
          y: -amount,
        });

        this.gsap.to(back.position, {
          duration: .1,
          ease: "sine.inOut",
          y: amount,
        });
      }
    }
  }

  animateSphere() {
    gsap.to(this.meshes.sphere.mesh.position, {
      z: 8,
      duration: 5,
      delay: 0,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      yoyoEase: "sine.inOut",
    });
  }

  addWindowListeners() {
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('visibilitychange', this.onVisibilitychange, false);
  }

  addStatsMonitor() {
    this.stats = new Stats();
    this.stats.showPanel(0);

    document.body.appendChild(this.stats.dom);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  onVisibilitychange(evt) {
    if (evt.target.hidden) {
      console.log('pause');
    } else {
      console.log('play');
    }
  }

  animate() {
    this.stats.begin();

    this.orbitControl.update();
    this.renderer.render(this.scene, this.camera);
    this.draw();

    this.stats.end();


    requestAnimationFrame(this.animate.bind(this));
  }
}

export default App;
