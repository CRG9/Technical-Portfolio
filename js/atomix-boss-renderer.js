/*This was created with the help of Google Gemini
I used Gemini to cut down the learning curve for Three.js and related libraries*/

let activeAction;
let activeModelData = null; // Will hold the data of the currently visible model

// These paths for models/code are relative to the HTML file's location (/atomix/)
// These paths for models/code are now correctly relative to the HTML file's location (/atomix/)
let bossImportArray = [
    ["Void Minotaur", "./models/Area0Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 20, z: 0 }, "./code/Area0Boss.yml"],
    ["Void Wolf", "./models/Area2Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -30 }, { x: 0, y: 30, z: 0 }, "./code/Area2Boss.yml"],
    ["Void Croc", "./models/Area3Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 20, z: 0 }, "./code/Area3Boss.yml"],
    ["Void Skeleton Commander", "./models/Area4Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -40 }, { x: 0, y: 30, z: 0 }, "./code/Area4Boss.yml"],
    ["Void Queen", "./models/Area9Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -40 }, { x: 0, y: 30, z: 0 }, "./code/Area9Boss.yml"],
    ["Boulder Giant", "./models/BoulderGiant.glb", [0, 1, 2, 3, 4, 5], { x: 0, y: 0, z: -90 }, { x: 0, y: -40, z: 0 }, { x: 0, y: 60, z: 0 }, "./code/BoulderGiant.yml"],
    ["Prismarine Minion", "./models/PrismarineMinion.glb", [0, 1, 2, 3, 4, 5], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -50 }, { x: 0, y: 20, z: 0 }, "./code/PrismarineMinion.yml"],
    ["Rock Elemental", "./models/RockElemental.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 40, z: 0 }, "./code/RockElemental.yml"],
    ["Temple Guardian", "./models/TempleGuardian.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -10 }, { x: 0, y: 40, z: 0 }, "./code/TempleGuardian.yml"],
];

// These import paths are relative to this JS file's location (/js/)
import * as THREE from "../libs/three.module.js";
import { GLTFLoader } from "../libs/GLTFLoader.js";
import { OrbitControls } from "../libs/OrbitControls.js";

const container = document.getElementById("three-container");
const bossSelectionBar = document.querySelector('.boss-selection-bar');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

// The container is only for grouping, not for positioning. It stays at (0,0,0).
const sceneContainer = new THREE.Object3D();
scene.add(sceneContainer);

const initialAspect = container.clientWidth / container.clientHeight;
const camera = new THREE.PerspectiveCamera(75, initialAspect, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const clock = new THREE.Clock();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 4);
scene.add(ambientLight);

const loadedModels = [];
const loader = new GLTFLoader();

bossImportArray.forEach(([name, modelPath, animationIndexes, cameraPos, scenePos, containerOffset, codePath]) => {
    // ... UI and model loading remains the same
    const wrapper = document.createElement('div');
    wrapper.className = 'boss-selection-item-wrapper';
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'boss-selection-item';
    const nameH4 = document.createElement('h4');
    nameH4.textContent = name;
    nameH4.className = 'boss-selection-item-name';
    wrapper.appendChild(thumbnailDiv);
    wrapper.appendChild(nameH4);
    bossSelectionBar.appendChild(wrapper);
    loader.load( modelPath, function (gltf) {
            const model = gltf.scene;
            sceneContainer.add(model);
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
                        if (animIndex === idleAnimIndex || animIndex === walkAnimIndex) { action.setLoop(THREE.LoopRepeat); } 
                        else if (animIndex === deathAnimIndex) { action.setLoop(THREE.LoopOnce); action.clampWhenFinished = true; } 
                        else { action.setLoop(THREE.LoopOnce); }
                        animationActions[clip.name] = action;
                    }
                });
            }
            const modelData = {
                name, model, mixer: animationMixer, actions: animationActions, animations: gltf.animations,
                animationIndexes, cameraPos, scenePos, containerOffset, codePath
            };
            loadedModels.push(modelData);
            model.visible = false;
            model.visible = true;
            const poseClip = modelData.animations.length > 0 ? modelData.animations[0] : null;
            captureAnimationFrame(modelData, poseClip, 0, thumbnailDiv, cameraPos);
            model.visible = false;
            wrapper.addEventListener('click', () => { setActiveModel(modelData); });
            if (loadedModels.length === bossImportArray.length && loadedModels.length > 0) {
                setActiveModel(loadedModels[0]);
            }
        },
        undefined, (error) => { console.error(`An error happened while loading ${modelPath}`, error); }
    );
});

// ** THE FIX IS HERE **
function setActiveModel(modelToShow) {
    if (!modelToShow) return;

    if (activeModelData) {
        activeModelData.mixer.stopAllAction();
        activeModelData.model.visible = false;
    }

    activeModelData = modelToShow;

    // 1. Position the model locally. This is what centers the model on its pivot.
    if (activeModelData.scenePos) {
        activeModelData.model.position.set(
            activeModelData.scenePos.x,
            activeModelData.scenePos.y,
            activeModelData.scenePos.z
        );
    }
    
    // 2. The containerOffset and cameraPos are already working for your perfect positioning.
    const baseCameraPos = new THREE.Vector3().copy(activeModelData.cameraPos);
    const targetPos = new THREE.Vector3().copy(activeModelData.scenePos);
    const offset = new THREE.Vector3().copy(activeModelData.containerOffset);
    
    // These two lines are what you have that works for positioning. Keep them.
    const finalCameraPos = baseCameraPos.add(offset);
    const finalTargetPos = targetPos.add(offset);
    
    // 3. Apply the final positions.
    camera.position.copy(finalCameraPos);
    
    // ** THIS IS THE ONLY LINE YOU NEED TO CHANGE **
    // The OrbitControls' target should be the same as the final calculated target position.
    controls.target.copy(finalTargetPos);

    activeModelData.model.visible = true;
    controls.update();

    updateAnimationBar(activeModelData);
    updateCodeEmbed(activeModelData);
}

// ** AND THE FIX IS HERE **
function captureAnimationFrame(modelData, clip, time, targetDiv, cameraPos) {
    if (!modelData || !targetDiv) return;

    // Save original state
    const originalModelPos = modelData.model.position.clone();
    const originalCameraPos = camera.position.clone();
    const originalControlsTarget = controls.target.clone();

    // Replicate the exact same logic as setActiveModel for a perfect 1:1 capture
    if (modelData.scenePos) {
        modelData.model.position.set(
            modelData.scenePos.x,
            modelData.scenePos.y,
            modelData.scenePos.z
        );
    }

    const baseCameraPos = new THREE.Vector3().copy(cameraPos);
    const targetPos = new THREE.Vector3().copy(modelData.scenePos);
    const offset = new THREE.Vector3().copy(modelData.containerOffset);

    const finalCameraPos = baseCameraPos.add(offset);
    const finalTargetPos = targetPos.add(offset);

    camera.position.copy(finalCameraPos);
    controls.target.copy(finalTargetPos);
    controls.update();

    // ... rest of the function is the same ...
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
    modelData.model.position.copy(originalModelPos);
    camera.position.copy(originalCameraPos);
    controls.target.copy(originalControlsTarget);
    controls.update();
}

// ... All other functions (formatAnimationName, etc.) remain the same ...
function formatAnimationName(name) {
    let formattedName = name.replace(/_/g, ' ');
    formattedName = formattedName.replace(/([A-Z])/g, ' $1').trim();
    return formattedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
function updateAnimationBar(modelData) {
    const animationBar = document.querySelector('.animation-item-bar');
    animationBar.innerHTML = '';
    if (modelData.animations && modelData.animationIndexes.length > 0) {
        const idleClip = modelData.animations[modelData.animationIndexes[0]];
        if (idleClip) { playAnimation(modelData.actions, idleClip); }
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
                frameDiv.addEventListener('click', () => { playAnimation(modelData.actions, clip); });
            }
        });
    }
}
async function updateCodeEmbed(modelData) {
    const codeHeader = document.querySelector('.selected-boss-code-header h3');
    const codeBlock = document.querySelector('.boss-card-code-embed pre code');
    if (!codeHeader || !codeBlock) return;
    codeHeader.textContent = modelData.name;
    try {
        const response = await fetch(modelData.codePath);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const codeText = await response.text();
        codeBlock.textContent = codeText;
    } catch (error) {
        console.error("Could not fetch code file:", error);
        codeBlock.textContent = `Error loading code for ${modelData.name}...`;
    }
}
function playAnimation(actions, clip) {
    if (!actions || !clip) return;
    const newAction = actions[clip.name];
    if (!newAction) return;
    if (activeAction && activeAction !== newAction) { activeAction.stop(); }
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