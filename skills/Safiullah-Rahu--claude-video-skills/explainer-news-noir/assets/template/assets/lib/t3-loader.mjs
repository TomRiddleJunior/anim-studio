// Loads three 0.186.1 (ES modules) + the post-processing addons once, exposes them as window.T3 and resolves
// window.t3Ready (declared in index.html before this module).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

window.THREE = THREE;
window.T3 = { THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, RoomEnvironment };
window.__t3Resolve(window.T3);
