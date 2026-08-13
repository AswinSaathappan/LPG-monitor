import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const viewport = document.getElementById("cylinder-3d-viewport");
const levelLabel = document.getElementById("cylinder-level-label");

if (!viewport || !levelLabel) {
  throw new Error("The 3D cylinder viewport could not be initialized.");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3f7fd);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(5.6, 3.1, 8.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.localClippingEnabled = true;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 7.2;
controls.maxDistance = 12;
controls.minPolarAngle = 0.68;
controls.maxPolarAngle = 2.25;
controls.target.set(0, 0.2, 0);
controls.update();

const hemiLight = new THREE.HemisphereLight(0xdceaff, 0x42516b, 2.1);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
keyLight.position.set(4.5, 7, 5.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 20;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8cbaff, 1.7);
fillLight.position.set(-5, 2.5, 3);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xf8fbff, 18, 15, 2);
rimLight.position.set(0, 5, -4);
scene.add(rimLight);

const cylinder = new THREE.Group();
cylinder.rotation.y = -0.34;
cylinder.position.y = 0.05;
scene.add(cylinder);

const SHELL_RADIUS = 1.25;
const SHELL_STRAIGHT_LENGTH = 2.75;
const SHELL_Y_SCALE = 0.78;
const SHELL_TOP = SHELL_Y_SCALE * (SHELL_STRAIGHT_LENGTH / 2 + SHELL_RADIUS);

const LIQUID_RADIUS = 1.08;
const LIQUID_STRAIGHT_LENGTH = 2.52;
const LIQUID_Y_SCALE = 0.77;
const LIQUID_STRAIGHT_HALF = (LIQUID_STRAIGHT_LENGTH / 2) * LIQUID_Y_SCALE;
const LIQUID_BOTTOM = -LIQUID_Y_SCALE * (LIQUID_STRAIGHT_LENGTH / 2 + LIQUID_RADIUS);
const LIQUID_TOP = -LIQUID_BOTTOM;
const LIQUID_HEIGHT = LIQUID_TOP - LIQUID_BOTTOM;

const shellMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb52f3b,
  metalness: 0.72,
  roughness: 0.26,
  clearcoat: 0.55,
  clearcoatRoughness: 0.18,
  transparent: true,
  opacity: 0.38,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const paintedMetal = new THREE.MeshStandardMaterial({
  color: 0xa92734,
  metalness: 0.7,
  roughness: 0.28,
});

const paintedMetalDark = new THREE.MeshStandardMaterial({
  color: 0x7c1724,
  metalness: 0.65,
  roughness: 0.32,
});

const brassMaterial = new THREE.MeshStandardMaterial({
  color: 0xc08a32,
  metalness: 0.82,
  roughness: 0.22,
});

const regulatorMaterial = new THREE.MeshStandardMaterial({
  color: 0x273344,
  metalness: 0.7,
  roughness: 0.25,
});

const outerShell = new THREE.Mesh(
  new THREE.CapsuleGeometry(SHELL_RADIUS, SHELL_STRAIGHT_LENGTH, 18, 64),
  shellMaterial,
);
outerShell.scale.y = SHELL_Y_SCALE;
outerShell.castShadow = false;
outerShell.renderOrder = 2;
cylinder.add(outerShell);

function addHorizontalRing(radius, tubeRadius, y, material) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tubeRadius, 12, 64),
    material,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  ring.castShadow = true;
  ring.receiveShadow = true;
  cylinder.add(ring);
  return ring;
}

addHorizontalRing(SHELL_RADIUS * 0.985, 0.047, -0.98, paintedMetal);
addHorizontalRing(SHELL_RADIUS * 0.985, 0.047, 1.05, paintedMetal);

const baseBand = new THREE.Mesh(
  new THREE.CylinderGeometry(1.38, 1.3, 0.25, 64, 1, true),
  paintedMetalDark,
);
baseBand.position.y = -SHELL_TOP - 0.04;
baseBand.castShadow = true;
baseBand.receiveShadow = true;
cylinder.add(baseBand);
addHorizontalRing(1.34, 0.065, -SHELL_TOP - 0.16, paintedMetalDark);
addHorizontalRing(1.3, 0.045, -SHELL_TOP + 0.08, paintedMetal);

const collarBottomY = SHELL_TOP - 0.23;
const collarTopY = SHELL_TOP + 0.58;
addHorizontalRing(0.87, 0.075, collarBottomY, paintedMetal);
addHorizontalRing(1.01, 0.09, collarTopY, paintedMetalDark);

const collarPostGeometry = new THREE.CylinderGeometry(0.055, 0.065, collarTopY - collarBottomY, 12);
for (let index = 0; index < 4; index += 1) {
  const angle = Math.PI / 4 + index * (Math.PI / 2);
  const post = new THREE.Mesh(collarPostGeometry, paintedMetal);
  post.position.set(
    Math.cos(angle) * 0.87,
    (collarBottomY + collarTopY) / 2,
    Math.sin(angle) * 0.87,
  );
  post.castShadow = true;
  cylinder.add(post);
}

const valve = new THREE.Group();
valve.position.y = collarTopY + 0.03;
cylinder.add(valve);

const valveStem = new THREE.Mesh(
  new THREE.CylinderGeometry(0.13, 0.15, 0.24, 32),
  brassMaterial,
);
valveStem.position.y = 0.13;
valveStem.castShadow = true;
valve.add(valveStem);

const valveNut = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.22, 0.16, 6),
  brassMaterial,
);
valveNut.position.y = 0.32;
valveNut.rotation.y = Math.PI / 6;
valveNut.castShadow = true;
valve.add(valveNut);

const regulator = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.25, 0.15, 32),
  regulatorMaterial,
);
regulator.position.y = 0.47;
regulator.castShadow = true;
valve.add(regulator);

const regulatorKnob = new THREE.Mesh(
  new THREE.BoxGeometry(0.32, 0.07, 0.14),
  regulatorMaterial,
);
regulatorKnob.position.set(0, 0.58, 0);
regulatorKnob.castShadow = true;
valve.add(regulatorKnob);

const liquidClipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), LIQUID_BOTTOM);
const liquidMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x1888e8,
  emissive: 0x0b4f9e,
  emissiveIntensity: 0.28,
  metalness: 0.08,
  roughness: 0.18,
  transparent: true,
  opacity: 0.82,
  side: THREE.DoubleSide,
  depthWrite: false,
  clippingPlanes: [liquidClipPlane],
  clipShadows: true,
});

const liquid = new THREE.Mesh(
  new THREE.CapsuleGeometry(LIQUID_RADIUS, LIQUID_STRAIGHT_LENGTH, 18, 64),
  liquidMaterial,
);
liquid.scale.y = LIQUID_Y_SCALE;
liquid.visible = false;
liquid.renderOrder = 1;
cylinder.add(liquid);

const liquidSurface = new THREE.Mesh(
  new THREE.CircleGeometry(1, 64),
  new THREE.MeshPhysicalMaterial({
    color: 0x55b7ff,
    emissive: 0x146ec0,
    emissiveIntensity: 0.38,
    metalness: 0.05,
    roughness: 0.14,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  }),
);
liquidSurface.rotation.x = -Math.PI / 2;
liquidSurface.visible = false;
liquidSurface.renderOrder = 1;
cylinder.add(liquidSurface);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  new THREE.ShadowMaterial({ color: 0x1c3156, opacity: 0.17 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -SHELL_TOP - 0.3;
ground.receiveShadow = true;
scene.add(ground);

function getLiquidSurfaceRadius(levelY) {
  const distanceFromCenter = Math.abs(levelY);

  if (distanceFromCenter <= LIQUID_STRAIGHT_HALF) {
    return LIQUID_RADIUS;
  }

  const capOffset = (distanceFromCenter - LIQUID_STRAIGHT_HALF) / LIQUID_Y_SCALE;
  const radiusSquared = LIQUID_RADIUS ** 2 - capOffset ** 2;
  return Math.sqrt(Math.max(0, radiusSquared));
}

function updateCylinderLevel(percentage) {
  const numericPercentage = Number(percentage);

  if (!Number.isFinite(numericPercentage)) {
    return;
  }

  const clampedPercentage = Math.min(100, Math.max(0, numericPercentage));
  const levelY = LIQUID_BOTTOM + (clampedPercentage / 100) * LIQUID_HEIGHT;
  const surfaceRadius = getLiquidSurfaceRadius(levelY);

  liquidClipPlane.constant = levelY + cylinder.position.y;
  liquid.visible = clampedPercentage > 0;
  liquidSurface.visible = clampedPercentage > 0 && surfaceRadius > 0.012;
  liquidSurface.position.y = levelY + 0.006;
  liquidSurface.scale.set(surfaceRadius, surfaceRadius, 1);

  levelLabel.textContent = clampedPercentage === 0
    ? "Empty · 0.0% LPG"
    : `${clampedPercentage.toFixed(1)}% LPG`;
  levelLabel.classList.add("is-live");
  viewport.setAttribute(
    "aria-label",
    `Interactive 3D LPG cylinder showing ${clampedPercentage.toFixed(1)} percent LPG`,
  );
}

function resizeRenderer() {
  const width = Math.max(viewport.clientWidth, 1);
  const height = Math.max(viewport.clientHeight, 1);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(viewport);
resizeRenderer();
animate();

window.updateCylinderLevel = updateCylinderLevel;

if (Number.isFinite(window.pendingCylinderLevel)) {
  updateCylinderLevel(window.pendingCylinderLevel);
  window.pendingCylinderLevel = undefined;
}
