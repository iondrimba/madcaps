import './style.css';
import Tweakpane from 'tweakpane';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin.js';
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
  MeshMatcapMaterial,
  TextureLoader,
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
  hexToRgb,
  lerpColor,
} from './helpers';

gsap.registerPlugin(MotionPathPlugin);

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
    this.addSphere();
    this.addBlocksWall(this.meshes.boxWall, -1, -1.4);
    this.addBlocksWall(this.meshes.boxWall1, 1, -1.4);
    this.addAxisHelper();
    this.addStatsMonitor();
    this.addWindowListeners();
    this.meshes.sphere.mesh.position.set(-1, 1, 2.5);

    this.animate();
    this.animateSphere();

  }

  cleanUp() {
    window.removeEventListener('resize', this.onResize);

    while (document.body.childNodes.length) {
      document.body.removeChild(document.body.lastChild);
    }
  }

  loadMatCaps() {
    this.textureBox = new TextureLoader().load('./assets/3B3C3F_DAD9D5_929290_ABACA8.png');
  }

  setup() {
    this.debug = false;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.gsap = gsap;

    this.colors = {
      background: rgbToHex(window.getComputedStyle(document.body).backgroundColor),
      floor: '#fffc03',
      ball: '#00fffc',
      box: '#fc00ff',
      grid: '#957fff',
      ambientLight: '#ffffff',
      directionalLight: '#ffffff',
      lerp: {
        start: '#00fffc',
        end: '#fc00ff',
      }
    };

    this.meshes = {
      container: new Object3D(),
      boxes: {
        size: .4,
        geometry: () => {
          const width = this.meshes.boxes.size, height = this.meshes.boxes.size / 4, depth = this.meshes.boxes.size;

          return new BoxBufferGeometry(width, height, depth);
        },
      },
      boxWall: {
        container: new Object3D(),
        front: [],
        back: [],
      },
      boxWall1: {
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
      range: { inMin: 2.5, inMax: -2, min: .5, max: -2 },
      clamp: { min: -4.5, max: .05 },
      circular: {
        angle: 0,
        radius: 1,
      },
      timeline: {
        start: -2.5,
        end: 2.5,
      }
    };

    this.motionColor = {
      range: { inMin: 2.5, inMax: -2, min: .5, max: -2 },
      clamp: { min: -4.5, max: .05 },
    };

    this.onResize = this.onResize.bind(this);
  }

  createScene() {
    this.scene = new Scene();
    this.scene.background = new Color(this.colors.background);
    this.renderer = new WebGLRenderer({ antialias: true, transparent: true });
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
    this.camera.position.set(-20, 25, 20);

    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControl.minPolarAngle = radians(0);
    this.orbitControl.maxPolarAngle = radians(65);
    this.orbitControl.enableDamping = true;
    this.orbitControl.minDistance = 20;
    this.orbitControl.maxDistance = 50;
    this.orbitControl.dampingFactor = 0.02;

    document.body.style.cursor = "-moz-grabg";
    document.body.style.cursor = "-webkit-grab";

    this.orbitControl.addEventListener("start", () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = "-moz-grabbing";
        document.body.style.cursor = "-webkit-grabbing";
      });
    });

    this.orbitControl.addEventListener("end", () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = "-moz-grab";
        document.body.style.cursor = "-webkit-grab";
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
    this.directionalLight.position.set(-40, 100, -10);
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
    const size = 100;
    const divisions = 100;
    this.grid = new GridHelper(size, divisions, this.colors.grid, this.colors.grid);

    this.grid.position.set(0, -.2, 0);
    this.grid.material.opacity = 0;
    this.grid.material.transparent = true;

    this.scene.add(this.grid);
  }

  addFloor() {
    const geometry = new PlaneBufferGeometry(100, 100);
    const material = new MeshStandardMaterial({ color: this.colors.floor, side: DoubleSide });

    this.floor = new Mesh(geometry, material);
    this.floor.position.y = -.21;
    this.floor.position.z = 0;
    this.floor.rotateX(Math.PI / 2);
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  addFloorHelper() {
    if (this.debug) {
      this.controls = new TransformControls(this.camera, this.renderer.domElement);
      this.controls.enabled = false;
      this.controls.attach(this.floor);
      this.scene.add(this.controls);
    }
  }

  addSphere() {
    const radius = this.meshes.sphere.size, width = 32, height = 32;
    const geometry = new SphereBufferGeometry(radius, width, height);
    const mesh = new Mesh(geometry, this.meshes.sphere.material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.meshes.sphere.mesh = mesh;

    this.scene.add(mesh);
  }

  getBoxMesh(geometry, boxes) {
    const m = new MeshStandardMaterial({
      color: this.colors.lerp.end,
      metalness: .11,
      emissive: 0x0,
      roughness: .1,
    });
    const mesh = new Mesh(geometry, m);

    mesh.castShadow = true;

    return mesh;
  }

  addBlocksWall(boxWall, x, z) {
    const cols = 15;
    const rows = 10;
    const geometry = this.meshes.boxes.geometry();

    for (let col = 0; col < cols; col++) {
      boxWall.front[col] = [];
      boxWall.back[col] = [];

      for (let row = 0; row < rows; row++) {
        const front = this.getBoxMesh(geometry, this.meshes.boxes);
        const back = this.getBoxMesh(geometry, this.meshes.boxes);
        const x = row * (this.meshes.boxes.size / 2);
        const z = col * (this.meshes.boxes.size / 2);

        front.position.set(x, .05, z);
        back.position.set(x, -.05, z);;

        boxWall.container.add(front);
        boxWall.container.add(back);

        boxWall.front[col][row] = front;
        boxWall.back[col][row] = back;
      }
    }

    boxWall.container.rotateZ(Math.PI / 2);
    boxWall.container.position.x = x;
    boxWall.container.position.z = z;

    this.scene.add(boxWall.container);
  }

  draw() {
    const cols = 15;
    const rows = 10;
    const { x, z, y } = this.meshes.sphere.mesh.position;
    let dist = 0;
    let front = null;
    let back = null;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        if (x < 0) {
          front = this.meshes.boxWall.front[col][row];
          back = this.meshes.boxWall.back[col][row];
          dist = distance(x + y + 1, z - this.meshes.boxWall.container.position.z, front.position.x, front.position.z);
        } else {
          front = this.meshes.boxWall1.front[col][row];
          back = this.meshes.boxWall1.back[col][row];
          dist = distance(x + y - 1, z - this.meshes.boxWall1.container.position.z, front.position.x, front.position.z);
        }

        const range = this.gsap.utils.mapRange(this.motion.range.inMin, this.motion.range.inMax, this.motion.range.min, this.motion.range.max, dist);
        const amount = this.gsap.utils.clamp(this.motion.clamp.min, this.motion.clamp.max, range);
        const rangeDist = this.gsap.utils.mapRange(0, 2.5, 0, 1, dist);
        const rangeClamp = this.gsap.utils.clamp(0, 1, rangeDist);
        const l = lerpColor(this.colors.lerp.start, this.colors.lerp.end, Number(rangeClamp.toFixed(2)));

        front.material.color = new Color(l);
        back.material.color = new Color(l);

        this.gsap.to(front.position, {
          duration: .1,
          ease: 'sine.inOut',
          y: -amount,
        });

        this.gsap.to(back.position, {
          duration: .1,
          ease: 'sine.inOut',
          y: amount,
        });
      }
    }
  }

  animateSphere() {
    const tl = this.gsap.timeline({
      defaults: { duration: 1, ease: 'linear' },
      onComplete: () => {
        tl.restart();
      }
    });

    tl.to(this.meshes.sphere.mesh.position, {
      z: this.motion.timeline.start,
    });

    tl.to(this.meshes.sphere.mesh.position, {
      onUpdate: () => {
        this.meshes.sphere.mesh.position.x = -(Math.cos(radians(this.motion.circular.angle)) * this.motion.circular.radius);
        this.meshes.sphere.mesh.position.z = (Math.sin(radians(this.motion.circular.angle)) * this.motion.circular.radius - Math.abs(this.motion.timeline.start));
        this.motion.circular.angle -= 3;
      },
      onComplete: () => {
        this.motion.circular.angle = 0;
      }
    });

    tl.to(this.meshes.sphere.mesh.position, {
      z: this.motion.timeline.end,
    });

    tl.to(this.meshes.sphere.mesh.position, {
      onUpdate: () => {
        this.meshes.sphere.mesh.position.x = (Math.cos(radians(this.motion.circular.angle)) * this.motion.circular.radius);
        this.meshes.sphere.mesh.position.z = -(Math.sin(radians(this.motion.circular.angle)) * this.motion.circular.radius - this.motion.timeline.end);
        this.motion.circular.angle -= 3;
      },
      onComplete: () => {
        this.motion.circular.angle = 0;
      }
    });
  }

  addWindowListeners() {
    window.addEventListener('resize', this.onResize, { passive: true });
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
