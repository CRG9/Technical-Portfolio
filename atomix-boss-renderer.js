/*This was created using Google Gemini*/
/*This was created using Google Gemini*/
/*This was created using Google Gemini*/


let animationActions = {};
let activeAction;

import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";

// Get the container element from the HTML
const container = document.getElementById("three-container");

// 1. Create the Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

// 2. Create the Camera
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
// Move the camera back so we can see the objects at the center
camera.position.z = -90;
camera.position.y = 5;

// 3. Create the Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });

let animationMixer;
const clock = new THREE.Clock();

// 👇 ADD THIS LINE RIGHT BELOW IT
renderer.setPixelRatio(window.devicePixelRatio);

renderer.setSize(container.clientWidth, container.clientHeight);
// Add the canvas element to our HTML container
container.appendChild(renderer.domElement);

// 4. Create the Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Makes movement feel smoother

// 5. Add Lights
const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 2);
scene.add(hemisphereLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(1, 1, 2);
scene.add(directionalLight);

// 7. Load the 3D Model
const loader = new GLTFLoader();
loader.load(
  "/atomix/models/Area3Boss.glb",
  function (gltf) {
    console.log("Model Loaded Successfully");
    const model = gltf.scene;
    scene.add(model);

    model.position.set(0, -15, 0);
    // --- ANIMATION SETUP ---
    // 1. Create an AnimationMixer for the model
    animationMixer = new THREE.AnimationMixer(model);

if (gltf.animations && gltf.animations.length > 0) {
  // Define the specific animation indices you want to load
  const desiredAnimationIndices = [3, 5, 6];

  // 1. PREPARE ONLY THE DESIRED ANIMATIONS for playback
  desiredAnimationIndices.forEach(index => {
    const clip = gltf.animations[index];
    // Safety check to make sure the animation exists
    if (clip) {
      const action = animationMixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      animationActions[clip.name] = action;
      console.log(`Prepared animation #${index}: '${clip.name}'`);
    } else {
      console.warn(`Animation at index ${index} not found.`);
    }
  });

  // 2. GET THE TARGET DIVS
  const frameDivs = [
    document.getElementById("frame-1"),
    document.getElementById("frame-2"),
    document.getElementById("frame-3"),
  ];

   // 3. CAPTURE FRAMES and ADD CLICK LISTENERS for the desired animations
  setTimeout(() => {
    desiredAnimationIndices.forEach((animationIndex, loopIndex) => {
      const clip = gltf.animations[animationIndex];
      const div = frameDivs[loopIndex];

      if (clip && div) {
        const halfwayTime = clip.duration / 2;
        captureAnimationFrame(clip, halfwayTime, div);
        div.addEventListener("click", () => {
          playAnimation(clip);
        });
      }
    });
  }, 100); // Wait 100ms for everything to be ready
}
  },
  undefined,
  function (error) {
    console.error("An error happened while loading the model", error);
  }
);

/**
 * Poses the model at a specific time in an animation, renders the scene,
 * and applies the result as a background image to a target div.
 * @param {THREE.AnimationClip} clip The animation clip to use.
 * @param {number} time The time (in seconds) to set the animation to.
 * @param {HTMLElement} targetDiv The div to apply the background image to.
 */
function captureAnimationFrame(clip, time, targetDiv) {
  if (!animationMixer || !clip || !targetDiv) return;

  animationMixer.stopAllAction();
  const action = animationMixer.clipAction(clip);
  action.play();

  action.time = time;
  animationMixer.update(0);

  renderer.render(scene, camera);
  const imageURL = renderer.domElement.toDataURL("image/png");

  targetDiv.style.backgroundImage = `url(${imageURL})`;
  targetDiv.style.backgroundSize = "cover";
  targetDiv.style.backgroundPosition = "center";

  action.stop();
}

// --- UPDATE YOUR ANIMATE LOOP ---
// The mixer needs to be updated with the time delta on each frame
// for real-time animations later.

function animate() {
  requestAnimationFrame(animate);

  // Get the time elapsed since the last frame
  const delta = clock.getDelta();

  // Update the animation mixer
  if (animationMixer) {
    animationMixer.update(delta);
  }

  // ... (rest of your animate function, like controls.update() and renderer.render())
  controls.update();
  renderer.render(scene, camera);
}
animate();

/**
 * Instantly stops any active animation and plays the requested one from the beginning.
 * The animation will hold on its final frame.
 * @param {THREE.AnimationClip} clip The animation clip to play.
 */
function playAnimation(clip) {
  if (!animationMixer || !clip) return;

  const newAction = animationActions[clip.name];
  const oldAction = activeAction;
  activeAction = newAction;

  // If a different animation was active, stop it immediately.
  if (oldAction && oldAction !== newAction) {
    oldAction.stop();
  }

  // Reset the new animation to its starting frame, then play it.
  newAction.reset().play();
}
