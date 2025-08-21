/*This was created with the help of Google Gemini
I used Gemini to cut down the learning curve for Three.js and related libraries*/

let activeAction;
let activeModelData = null; // Will hold the data of the currently visible model

//This bossArray is used to load in the models and their animations
// ADJUSTMENT: Added a new file path for the code snippet at the end of each entry
let bossImportArray = [
  ["Void Minotaur", "/atomix/models/Area0Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 5, z: -90 }, "/atomix/code/Area0Boss.yml"],
  ["Void Wolf", "/atomix/models/Area2Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 5, z: -90 }, "/atomix/code/Area2Boss.yml"],
  ["Void Croc", "/atomix/models/Area3Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 5, z: -90 }, "/atomix/code/Area3Boss.yml"],
  ["Void Skeleton Commander", "/atomix/models/Area4Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 5, z: -90 }, "/atomix/code/Area4Boss.yml"],
  ["Boulder Giant", "/atomix/models/BoulderGiant.glb", [0, 1, 2, 3, 4, 5], { x: 0, y: 5, z: -90 }, "/atomix/code/BoulderGiant.yml"],
  ["Prismarine Minion", "/atomix/models/PrismarineMinion.glb", [0, 1, 2, 3, 4, 5], { x: 0, y: 5, z: -90 }, "/atomix/code/PrismarineMinion.yml"],
  ["Rock Elemental", "/atomix/models/RockElemental.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 5, z: -90 }, "/atomix/code/RockElemental.yml"],
  ["Temple Guardian", "/atomix/models/TempleGuardian.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 5, z: -90 }, "/atomix/code/TempleGuardian.yml"],
];


import * as THREE from "./libs/three.module.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { OrbitControls } from "./libs/OrbitControls.js";

// Get the container element from the HTML
const container = document.getElementById("three-container");
const bossSelectionBar = document.querySelector('.boss-selection-bar');

// 1. Create the Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

// --- ADJUSTMENT: Store the initial aspect ratio ---
const initialAspect = container.clientWidth / container.clientHeight;

// 2. Create the Camera
const camera = new THREE.PerspectiveCamera(
  75,
  initialAspect, // Use the stored aspect ratio
  0.1,
  1000
);
// --- ADJUSTMENT: Moved camera further back to prevent clipping ---
const originalCameraPosition = new THREE.Vector3(0, 5, -140);
camera.position.copy(originalCameraPosition);


// 3. Create the Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
const clock = new THREE.Clock();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// 4. Create the Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 5. Add Lights
const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 2);
scene.add(hemisphereLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(1, 1, 2);
scene.add(directionalLight);

// --- MODEL LOADING ---
const loadedModels = [];
const loader = new GLTFLoader();

// --- ADJUSTMENT: Updated loop to handle the new array structure ---
bossImportArray.forEach(([name, modelPath, animationIndexes, cameraPos, codePath]) => {
  // Create UI elements for each boss here
  const wrapper = document.createElement('div');
  wrapper.className = 'boss-selection-item-wrapper';

  const thumbnailDiv = document.createElement('div');
  thumbnailDiv.className = 'boss-selection-item';

  const nameH4 = document.createElement('h4');
  // Use the new 'name' variable directly
  nameH4.textContent = name;
  nameH4.className = 'boss-selection-item-name';

  wrapper.appendChild(thumbnailDiv);
  wrapper.appendChild(nameH4);
  bossSelectionBar.appendChild(wrapper);

  loader.load(
    modelPath,
    function (gltf) {
      const model = gltf.scene;
      scene.add(model);
      model.position.set(0, -15, 0);

      const animationMixer = new THREE.AnimationMixer(model);
      const animationActions = {};

      if (gltf.animations && gltf.animations.length > 0 && animationIndexes.length > 0) {
        const idleAnimIndex = animationIndexes[0];
        const walkAnimIndex = animationIndexes[1];
        const deathAnimIndex = animationIndexes[animationIndexes.length - 1];

        animationIndexes.forEach(animIndex => {
          const clip = gltf.animations[animIndex];
          if (clip) {
            const action = animationMixer.clipAction(clip);
            if (animIndex === idleAnimIndex || animIndex === walkAnimIndex) {
              action.setLoop(THREE.LoopRepeat);
            } else if (animIndex === deathAnimIndex) {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopOnce);
            }
            animationActions[clip.name] = action;
          }
        });
      }

      const modelData = {
        name: name, // Store the name
        model: model,
        mixer: animationMixer,
        actions: animationActions,
        animations: gltf.animations,
        animationIndexes: animationIndexes,
        cameraPos: cameraPos,
        codePath: codePath // Store the code path
      };
      loadedModels.push(modelData);
      
      model.visible = false;

      model.visible = true;
      const poseClip = modelData.animations.length > 0 ? modelData.animations[0] : null;
      captureAnimationFrame(modelData, poseClip, 0, thumbnailDiv, cameraPos);
      model.visible = false;

      wrapper.addEventListener('click', () => {
          setActiveModel(modelData);
      });
      
      if (loadedModels.length === bossImportArray.length) {
        if(loadedModels.length > 0) {
            setActiveModel(loadedModels[0]);
        }
      }
    },
    undefined,
    function (error) {
      console.error(`An error happened while loading ${modelPath}`, error);
    }
  );
});

/**
 * A helper function to format animation names for display.
 * @param {string} name The raw animation name.
 * @returns {string} The formatted name.
 */
function formatAnimationName(name) {
  let formattedName = name.replace(/_/g, ' ');
  formattedName = formattedName.replace(/([A-Z])/g, ' $1').trim();
  return formattedName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function setActiveModel(modelToShow) {
    if (!modelToShow) return;
    
    if (activeModelData && activeModelData.mixer) {
        activeModelData.mixer.stopAllAction();
    }

    loadedModels.forEach(data => data.model.visible = false);
    modelToShow.model.visible = true;
    activeModelData = modelToShow;
    updateAnimationBar(activeModelData);
    updateCodeEmbed(activeModelData); // Call the new function
}

function updateAnimationBar(modelData) {
    const animationBar = document.querySelector('.animation-item-bar');
    animationBar.innerHTML = '';

    if (modelData.animations && modelData.animationIndexes.length > 0) {
        const idleClip = modelData.animations[modelData.animationIndexes[0]];
        if (idleClip) {
            playAnimation(modelData.actions, idleClip);
        }

        modelData.animationIndexes.forEach(animIndex => {
            const clip = modelData.animations[animIndex];
            if (clip) {
                const wrapper = document.createElement('div');
                wrapper.className = 'animation-item-wrapper';

                const frameDiv = document.createElement('div');
                frameDiv.className = 'animation-item';

                const nameH4 = document.createElement('h4');
                nameH4.textContent = formatAnimationName(clip.name);

                wrapper.appendChild(frameDiv);
                wrapper.appendChild(nameH4);
                animationBar.appendChild(wrapper);

                captureAnimationFrame(modelData, clip, clip.duration / 2, frameDiv, modelData.cameraPos);

                frameDiv.addEventListener('click', () => {
                    playAnimation(modelData.actions, clip);
                });
            }
        });
    }
}

/**
 * Fetches and displays the code snippet for the active model.
 * @param {object} modelData The data for the currently active model.
 */
async function updateCodeEmbed(modelData) {
    const codeHeader = document.querySelector('.selected-boss-code-header h3');
    const codeBlock = document.querySelector('.boss-card-code-embed pre code');

    if (!codeHeader || !codeBlock) return;

    // Update the header with the boss's name
    codeHeader.textContent = modelData.name;

    // Fetch the code file
    try {
        const response = await fetch(modelData.codePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const codeText = await response.text();
        codeBlock.textContent = codeText;
    } catch (error) {
        console.error("Could not fetch code file:", error);
        codeBlock.textContent = `Error loading code for ${modelData.name}...`;
    }
}

function captureAnimationFrame(modelData, clip, time, targetDiv, cameraPos) {
  if (!modelData || !targetDiv) return;

  const originalPos = camera.position.clone();
  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  controls.update();

  if (clip) {
    const { mixer, actions } = modelData;
    const action = actions[clip.name] || mixer.clipAction(clip);
    if (action) {
        action.play();
        mixer.setTime(time);
        mixer.update(0);
    }
  }
  
  renderer.render(scene, camera);
  const imageURL = renderer.domElement.toDataURL("image/png");

  targetDiv.style.backgroundImage = `url(${imageURL})`;
  targetDiv.style.backgroundSize = "cover";
  targetDiv.style.backgroundPosition = "center";

  modelData.mixer.stopAllAction();
  
  camera.position.copy(originalPos);
  controls.update();
}

function playAnimation(actions, clip) {
  if (!actions || !clip) return;

  const newAction = actions[clip.name];
  if (!newAction) return;

  if (activeAction && activeAction !== newAction) {
    activeAction.stop();
  }
  
  activeAction = newAction;
  activeAction.reset().play();
}

function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    renderer.setSize(width, height);

    const newAspect = width / height;

    let viewportWidth, viewportHeight;
    if (newAspect > initialAspect) {
        viewportHeight = height;
        viewportWidth = height * initialAspect;
    } else {
        viewportWidth = width;
        viewportHeight = width / initialAspect;
    }

    const viewportX = (width - viewportWidth) / 2;
    const viewportY = (height - viewportHeight) / 2;

    renderer.setViewport(viewportX, viewportY, viewportWidth, viewportHeight);
}
window.addEventListener('resize', onWindowResize);
onWindowResize();


function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (activeModelData) {
    activeModelData.mixer.update(delta);
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
