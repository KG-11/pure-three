import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// GUI
const gui = new dat.GUI();

/**
 * Model
 */
const gltfLoader = new GLTFLoader();
gltfLoader.setPath("models/glTF/");
gltfLoader.load("MaterialChange.gltf", (gltf) => {
    const state = { variant: "Wood" };
    const parser = gltf.parser;
    const variantsExtension = gltf.userData.gltfExtensions["KHR_materials_variants"];
    const variants = variantsExtension.variants.map((variant) => variant.name);
    const variantsCtrl = gui.add(state, "variant", variants).name("Variant");

    selectVariant(scene, parser, variantsExtension, state.variant);
    variantsCtrl.onChange((value) => selectVariant(scene, parser, variantsExtension, value));
    scene.add(gltf.scene);
    render();
});

const selectVariant = (scene, parser, extension, variantName) => {
    const variantIndex = extension.variants.findIndex((v) => v.name.includes(variantName));
    scene.traverse(async (object) => {
        if (!object.isMesh || !object.userData.gltfExtensions) return;
        const meshVariantDef = object.userData.gltfExtensions["KHR_materials_variants"];
        if (!meshVariantDef) return;
        if (!object.userData.originalMaterial) object.userData.originalMaterial = object.material;
        const mapping = meshVariantDef.mappings.find((mapping) =>
            mapping.variants.includes(variantIndex)
        );
        if (mapping) {
            object.material = await parser.getDependency("material", mapping.material);
            parser.assignFinalMaterial(object);
        } else {
            object.material = object.userData.originalMaterial;
        }
        console.log(object.material); //see object.material.map
        render();
    });
};

/**
 * Lights
 */
const color = 0xffffff;
const intensity = 4;

const ambientLight = new THREE.AmbientLight(color, intensity);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(color, intensity);
directionalLight.position.set(-1, 2, 4);
scene.add(directionalLight);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.y = 4; // Average height
camera.position.z = 10;
scene.add(camera);

const dynamicWindowResize = () => {
    //Update Camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render();
};

window.addEventListener("resize", dynamicWindowResize, false);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color("#1c1624"));

const render = () => renderer.render(scene, camera);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.addEventListener("change", render);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.update();
render();
