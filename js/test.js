// This import path is the second part of the test
import * as THREE from '../libs/three.module.js';

// If the browser can execute this code, the import was successful.
console.log('SUCCESS: three.module.js was loaded!', THREE);
document.getElementById('status').textContent = 'SUCCESS! The path to the libs folder is correct.';