/*This was created with the help of Google Gemini
I used Gemini to cut down the learning curve for Three.js and related libraries*/

let activeAction;
let activeModelData = null; // Will hold the data of the currently visible model

// These paths for models/code are relative to the HTML file's location (/atomix/)
let bossImportArray = [
    ["Void Minotaur", "../atomix/models/Area0Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 20, z: 0 }, "../atomix/code/Area0Boss.yml"],
    ["Void Wolf", "../atomix/models/Area2Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -30 }, { x: 0, y: 30, z: 0 }, "../atomix/code/Area2Boss.yml"],
    ["Void Croc", "../atomix/models/Area3Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 20, z: 0 }, "../atomix/code/Area3Boss.yml"],
    ["Void Skeleton Commander", "../atomix/models/Area4Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -40 }, { x: 0, y: 30, z: 0 }, "../atomix/code/Area4Boss.yml"],
    ["Void Queen", "../atomix/models/Area9Boss.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -40 }, { x: 0, y: 30, z: 0 }, "../atomix/code/Area9Boss.yml"],
    ["Boulder Giant", "../atomix/models/BoulderGiant.glb", [0, 1, 2, 3, 4, 5], { x: 0, y: 0, z: -90 }, { x: 0, y: -40, z: 0 }, { x: 0, y: 60, z: 0 }, "../atomix/code/BoulderGiant.yml"],
    ["Prismarine Minion", "../atomix/models/PrismarineMinion.glb", [0, 1, 2, 3, 4, 5], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -50 }, { x: 0, y: 20, z: 0 }, "../atomix/code/PrismarineMinion.yml"],
    ["Rock Elemental", "../atomix/models/RockElemental.glb", [0, 1, 2, 3, 4, 5, 6, 7], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 40, z: 0 }, "../atomix/code/RockElemental.yml"],
    ["Temple Guardian", "../atomix/models/TempleGuardian.glb", [0, 1, 2, 3, 4, 5, 6, 7, 8], { x: 0, y: 0, z: -90 }, { x: 0, y: 0, z: -10 }, { x: 0, y: 40, z: 0 }, "../atomix/code/TempleGuardian.yml"],
];

// These import paths are relative to this JS file's location (/js/)
import * as THREE from "../libs/three-module.js";
import { GLTFLoader } from "../libs/GLTFLoader.js";
import { OrbitControls } from "../libs/OrbitControls.js";

const container = document.getElementById("three-container");
const bossSelectionBar = document.querySelector('.boss-selection-bar');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

const sceneContainer = new THREE.Object3D();
scene.add(sceneContainer);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

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

    loader.load(modelPath, function (gltf) {
        const model = gltf.scene;
        sceneContainer.add(model);
        const animationMixer = new THREE.AnimationMixer(model);
        const animationActions = {};

        if (gltf.animations && gltf.animations.length > 0 && animationIndexes.length > 0) {
            animationIndexes.forEach(animIndex => {
                const clip = gltf.animations[animIndex];
                if (clip) {
                    const action = animationMixer.clipAction(clip);
                    // Simplified loop logic for clarity, adjust if needed
                    if (clip.name.toLowerCase().includes('idle') || clip.name.toLowerCase().includes('walk')) {
                        action.setLoop(THREE.LoopRepeat);
                    } else if (clip.name.toLowerCase().includes('death')) {
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
            name, model, mixer: animationMixer, actions: animationActions, animations: gltf.animations,
            animationIndexes, cameraPos, scenePos, containerOffset, codePath
        };
        loadedModels.push(modelData);
        model.visible = true; // Keep visible for capture
        
        // Use a default pose for thumbnail if animations exist
        const poseClip = modelData.animations.length > 0 ? modelData.animations[0] : null;
        captureAnimationFrame(modelData, poseClip, 0, thumbnailDiv);

        model.visible = false; // Hide after capturing
        wrapper.addEventListener('click', () => { setActiveModel(modelData); });

        // If all models are loaded, set the first one as active
        if (loadedModels.length === bossImportArray.length) {
            setActiveModel(loadedModels[0]);
        }
    },
    undefined, 
    (error) => { console.error(`An error happened while loading ${modelPath}`, error); }
    );
});

function setActiveModel(modelToShow) {
    if (!modelToShow) return;

    // Hide the previously active model
    if (activeModelData) {
        activeModelData.mixer.stopAllAction();
        activeModelData.model.visible = false;
    }

    activeModelData = modelToShow;

    // Apply model-specific positioning
    if (activeModelData.scenePos) {
        activeModelData.model.position.set(
            activeModelData.scenePos.x,
            activeModelData.scenePos.y,
            activeModelData.scenePos.z
        );
    }
    
    // Calculate final camera and target positions
    const finalCameraPos = new THREE.Vector3().copy(activeModelData.cameraPos).add(activeModelData.containerOffset);
    const finalTargetPos = new THREE.Vector3().copy(activeModelData.scenePos).add(activeModelData.containerOffset);
    
    camera.position.copy(finalCameraPos);
    controls.target.copy(finalTargetPos);

    activeModelData.model.visible = true;
    controls.update();

    updateAnimationBar(activeModelData);
    updateCodeEmbed(activeModelData);
}

function captureAnimationFrame(modelData, clip, time, targetDiv) {
    if (!modelData || !targetDiv) return;

    // Store original states to restore later
    const originalVisibility = modelData.model.visible;
    const originalCameraPos = camera.position.clone();
    const originalControlsTarget = controls.target.clone();

    modelData.model.visible = true;

    // Set model-specific position for the thumbnail
    if (modelData.scenePos) {
        modelData.model.position.copy(modelData.scenePos);
    }

    // Set camera for thumbnail
    const finalCameraPos = new THREE.Vector3().copy(modelData.cameraPos).add(modelData.containerOffset);
    const finalTargetPos = new THREE.Vector3().copy(modelData.scenePos).add(modelData.containerOffset);
    camera.position.copy(finalCameraPos);
    controls.target.copy(finalTargetPos);
    controls.update();

    // Pose the model for the thumbnail
    if (clip) {
        const { mixer } = modelData;
        const action = mixer.clipAction(clip);
        action.play();
        mixer.setTime(time);
        mixer.update(0); // Update mixer one frame
        action.stop();
    }

    renderer.render(scene, camera);
    const imageURL = renderer.domElement.toDataURL("image/png");
    targetDiv.style.backgroundImage = `url(${imageURL})`;
    targetDiv.style.backgroundSize = "cover";
    targetDiv.style.backgroundPosition = "center";

    // Restore original states
    modelData.model.visible = originalVisibility;
    camera.position.copy(originalCameraPos);
    controls.target.copy(originalControlsTarget);
    controls.update();
}

function formatAnimationName(name) {
    let formattedName = name.replace(/_/g, ' ');
    formattedName = formattedName.replace(/([A-Z])/g, ' $1').trim();
    return formattedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function updateAnimationBar(modelData) {
    const animationBar = document.querySelector('.animation-item-bar');
    animationBar.innerHTML = '';

    if (modelData.actions && modelData.animations && modelData.animationIndexes.length > 0) {
        // Play the default idle animation
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
                
                captureAnimationFrame(modelData, clip, clip.duration / 2, frameDiv);
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

    if (activeAction && activeAction !== newAction) {
        activeAction.fadeOut(0.3);
    }
    
    newAction.reset().fadeIn(0.3).play();
    activeAction = newAction;
}

function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener('resize', onWindowResize);

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