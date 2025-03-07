/*
Shortcut hotkeys
Image export
Video export
Control zoom and rotation with hands/webcam tracking???
Additional shape types and styles
Ability to upload a 3d mesh / point cloud and visualize it???
Add glitching / noise effects
Show fps indicator at the top-left of the page?
Is it possible to still rotate and zoom when the animation is paused?
More fine-grain control over jitter (x, y, z, dimensions??)
Why does rotation still continue when speed is set to zero?
Randomize inputs function / hotkey
Changing shape or toggling any dat.gui inputs should restart the animation if it is paused
*/

// Main application logic

// Initialize WebGL context
const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported on this browser/device');
}

// Animation settings and parameters
const settings = {
    shape: 'cube',
    particlesPerEdge: 10000,
    particlesPerFace: 2400,
    jitter: 0.02,           // New parameter to control position randomness
    particleOpacity: 0.9,   // New parameter to control particle opacity
    autoRotate: true,
    rotationSpeed: 0.2,     // Speed of auto-rotation
    zoom: 6.0,
    isPaused: false,        // New parameter to track play/pause state
    // New color settings
    baseColor: [51, 102, 204],    // RGB values for blue (0.2, 0.4, 0.8)
    accentColor: [204, 51, 204],  // RGB values for purple (0.8, 0.2, 0.8)
    backgroundColor: [0, 0, 0],    // RGB values for black
    regenerateGeometry: function() {
        generateGeometry();
    }
};

// Create shader program
const program = createShaderProgram(gl);
gl.useProgram(program);

// Get attribute and uniform locations
const positionAttribute = gl.getAttribLocation(program, 'position');
const uvAttribute = gl.getAttribLocation(program, 'uv');
const modelViewMatrixUniform = gl.getUniformLocation(program, 'modelViewMatrix');
const projectionMatrixUniform = gl.getUniformLocation(program, 'projectionMatrix');
const timeUniform = gl.getUniformLocation(program, 'time');
const jitterUniform = gl.getUniformLocation(program, 'jitter');
const opacityUniform = gl.getUniformLocation(program, 'opacity');
// New color uniforms
const baseColorUniform = gl.getUniformLocation(program, 'baseColor');
const accentColorUniform = gl.getUniformLocation(program, 'accentColor');

// Set up projection matrix
const projectionMatrix = new Float32Array(16);
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrix);

// Current shape data
let positions = [];
let uvs = [];

// Generate geometry based on selected shape
function generateGeometry() {
    positions = [];
    uvs = [];
    
    switch (settings.shape) {
        case 'cube':
            positions = createCube(1.8, settings.particlesPerEdge, settings.particlesPerFace);
            break;
        case 'icosahedron':
            positions = createIcosahedron(1.1, settings.particlesPerEdge, settings.particlesPerFace);
            break;
        case 'octahedron':
            positions = createOctahedron(1.3, settings.particlesPerEdge, settings.particlesPerFace);
            break;
        case 'dodecahedron':
            positions = createDodecahedron(1.2, settings.particlesPerEdge, settings.particlesPerFace);
            break;
        case 'tetrahedron':
            positions = createTetrahedron(1.4, settings.particlesPerEdge, settings.particlesPerFace);
            break;
        default:
            positions = createCube(1.8, settings.particlesPerEdge, settings.particlesPerFace);
    }
    
    // Generate UV coordinates
    for (let i = 0; i < positions.length / 3; i++) {
        uvs.push(Math.random(), Math.random());
    }
    
    // Create buffer for positions
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Create buffer for UVs
    uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
}

// Function to update shader colors
function updateColors() {
    // Convert RGB values (0-255) to normalized values (0.0-1.0) for shaders
    const baseColorNormalized = settings.baseColor.map(c => c / 255);
    const accentColorNormalized = settings.accentColor.map(c => c / 255);
    
    // Pass colors to shader uniforms
    gl.uniform3fv(baseColorUniform, new Float32Array(baseColorNormalized));
    gl.uniform3fv(accentColorUniform, new Float32Array(accentColorNormalized));
}

// Function to update background color
function updateBackgroundColor() {
    // Convert RGB values (0-255) to normalized values (0.0-1.0) for WebGL
    const r = settings.backgroundColor[0] / 255;
    const g = settings.backgroundColor[1] / 255;
    const b = settings.backgroundColor[2] / 255;
    
    // Update clearColor in WebGL
    gl.clearColor(r, g, b, 1.0);
}

// Toggle play/pause function
function togglePlayPause() {
    settings.isPaused = !settings.isPaused;
    
    const currentRealTime = performance.now() * 0.001;
    
    if (settings.isPaused) {
        // Store when we paused
        pauseStartTime = currentRealTime;
        
        // Cancel the animation frame if it's running
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    } else {
        // Calculate how long we were paused and add to total
        const pauseDuration = currentRealTime - pauseStartTime;
        totalPausedTime += pauseDuration;
        
        // Restart the animation loop
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(render);
        }
    }
}

// Initial geometry generation
let positionBuffer, uvBuffer;
generateGeometry();

// Initial color setup
updateColors();
updateBackgroundColor();

let rotationQuaternion = [0, 0, 0, 1]; // [x, y, z, w] - initialize to identity
let tempQuaternion = [0, 0, 0, 1];
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let autoRotateBefore = true; // Track if auto-rotate was enabled before interaction
let lastUserInteraction = 0; // Track when the user last interacted with the model
const autoRotateResumeDelay = 250; // Delay in ms before auto-rotation resumes
let userHasInteracted = false; // Track if user has interacted at all

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
    
    // Only store the auto-rotate state if this is the first interaction
    // or after auto-rotation has resumed
    if (!userHasInteracted || settings.autoRotate) {
        autoRotateBefore = settings.autoRotate;
        userHasInteracted = true;
    }
    
    // Always disable auto-rotation during dragging
    settings.autoRotate = false;
    updateDatGUI();
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        lastUserInteraction = performance.now(); // Reset the timer when dragging stops
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
    };
    
    // Calculate rotation magnitude based on movement
    const rotationSpeed = 0.005;
    const horizontalRotation = deltaMove.x * rotationSpeed;
    const verticalRotation = deltaMove.y * rotationSpeed;
    
    // Create quaternions for horizontal and vertical rotations
    // For horizontal rotation, rotate around world up vector (0, 1, 0)
    quat.fromAxisAngle(tempQuaternion, [0, 1, 0], horizontalRotation);
    quat.multiply(rotationQuaternion, tempQuaternion, rotationQuaternion);
    
    // For vertical rotation, rotate around camera-relative right vector (1, 0, 0)
    quat.fromAxisAngle(tempQuaternion, [1, 0, 0], verticalRotation);
    quat.multiply(rotationQuaternion, tempQuaternion, rotationQuaternion);
    
    // Normalize to prevent drift
    quat.normalize(rotationQuaternion, rotationQuaternion);
    
    previousMousePosition = { x: e.clientX, y: e.clientY };
    
    // Ensure auto-rotation is disabled during active dragging
    // but don't reset the autoRotateBefore value
    if (settings.autoRotate) {
        settings.autoRotate = false;
        updateDatGUI();
    }
    
    // Update the last interaction time during active dragging
    lastUserInteraction = performance.now();
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    settings.zoom += e.deltaY * 0.003;
    settings.zoom = Math.max(0.5, Math.min(settings.zoom, 15.0));
    
    // Consider zooming as user interaction for auto-rotation purposes
    if (settings.autoRotate) {
        autoRotateBefore = true;
        settings.autoRotate = false;
    }
    
    lastUserInteraction = performance.now();
    userHasInteracted = true;
    updateDatGUI();
});

// Add spacebar event listener for play/pause
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        togglePlayPause();
    }
});

// Initialize dat.GUI
function initGUI() {
    const gui = new dat.GUI();
    
    // Shape selector
    gui.add(settings, 'shape', ['cube', 'icosahedron', 'octahedron', 'dodecahedron', 'tetrahedron'])
        .name('Shape')
        .onChange(() => {
            generateGeometry();
        });
    
    // Particles controls
    const particlesFolder = gui.addFolder('Particles');
    particlesFolder.add(settings, 'particlesPerEdge', 1000, 30000, 5)
        .name('Edge Particles')
        .onChange(() => settings.regenerateGeometry());
        
    particlesFolder.add(settings, 'particlesPerFace', 500, 50000, 100)
        .name('Face Particles')
        .onChange(() => settings.regenerateGeometry());
        
    particlesFolder.add(settings, 'jitter', 0.0, 1.0, 0.01)
        .name('Jitter')
        .onChange(() => {
          // Regenerate geometry when jitter changes to keep values in sync
          settings.regenerateGeometry();
        });
        
    particlesFolder.add(settings, 'particleOpacity', 0.1, 1.0, 0.05)
        .name('Particle Opacity');
        
    particlesFolder.open();
    
    // Animation controls
    const animationFolder = gui.addFolder('Animation');
    /*
    animationFolder.add(settings, 'autoRotate')
        .name('Auto Rotate');
    */  
    animationFolder.add(settings, 'rotationSpeed', 0.0, 1.0, 0.05)
        .name('Rotation Speed');
        
    animationFolder.add(settings, 'zoom', 1.0, 10.0, 0.5)
        .name('Zoom');
        
    animationFolder.open();
    
    // New color controls folder
    const colorFolder = gui.addFolder('Colors');
    
    // Base color picker
    colorFolder.addColor(settings, 'baseColor')
        .name('Base Color')
        .onChange(updateColors);
        
    // Accent color picker
    colorFolder.addColor(settings, 'accentColor')
        .name('Accent Color')
        .onChange(updateColors);
        
    // Background color picker
    colorFolder.addColor(settings, 'backgroundColor')
        .name('Background Color')
        .onChange(updateBackgroundColor);
        
    colorFolder.open();
    
    /*
    // Action button
    gui.add(settings, 'regenerateGeometry')
        .name('Regenerate');
    */

    return gui;
}

function updateDatGUI() {
    // This function would update the GUI to reflect current values
    // Normally dat.GUI handles this automatically, but for values changed outside the GUI
    // (like zoom changed by mouse wheel), we need this
    for (let i = 0; i < gui.__controllers.length; i++) {
        gui.__controllers[i].updateDisplay();
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Update projection matrix
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrix);
});

// Variables to store animation state
let animationFrameId = null;
let virtualTime = 0;    // Virtual time counter that ignores pauses
let pauseStartTime = 0; // Real time when pause occurred
let totalPausedTime = 0; // Total accumulated paused time

// Animation loop
function render(time) {
    // Convert real time to seconds
    const realTime = time * 0.001;
    
    // Calculate virtual time (real time minus total paused time)
    if (!settings.isPaused) {
        virtualTime = realTime - totalPausedTime;
    }
    // When paused, virtualTime retains its last value
    
    // Calculate delta time for animations
    let deltaTime = 0;
    if (!settings.isPaused) {
        deltaTime = realTime - lastTime;
        lastTime = realTime;
    }
    
    // Enhanced auto-rotation resumption
    if (userHasInteracted && autoRotateBefore && !isDragging && !settings.autoRotate) {
        const timeSinceInteraction = performance.now() - lastUserInteraction;
        if (timeSinceInteraction > autoRotateResumeDelay) {
            settings.autoRotate = true;
            updateDatGUI();
        }
    }
    
    // Clear canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(settings.backgroundColor[0]/255, settings.backgroundColor[1]/255, settings.backgroundColor[2]/255, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Enable blending for particles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Auto-rotation if enabled and not paused
    if (settings.autoRotate && !settings.isPaused) {
        // Create a quaternion for a small rotation around Y axis
        quat.fromAxisAngle(tempQuaternion, [0, 1, 0], deltaTime * settings.rotationSpeed);
        quat.multiply(rotationQuaternion, tempQuaternion, rotationQuaternion);
        
        // Add a gentle wobble if desired
        const wobbleAmount = Math.sin(virtualTime * 0.3) * 0.0;
        quat.fromAxisAngle(tempQuaternion, [1, 0, 0], wobbleAmount);
        quat.multiply(rotationQuaternion, tempQuaternion, rotationQuaternion);
        
        // Normalize to prevent drift
        quat.normalize(rotationQuaternion, rotationQuaternion);
    }
    
    // Set up model-view matrix
    const modelViewMatrix = new Float32Array(16);
    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -settings.zoom]);
    
    // Apply quaternion rotation instead of Euler angles
    const rotationMatrix = new Float32Array(16);
    quat.toMat4(rotationMatrix, rotationQuaternion);
    mat4.multiply(modelViewMatrix, modelViewMatrix, rotationMatrix);
    
    gl.uniformMatrix4fv(modelViewMatrixUniform, false, modelViewMatrix);
    
    // Always use virtualTime for shader animations to ensure consistency
    gl.uniform1f(timeUniform, virtualTime);
    
    // Update jitter uniform
    gl.uniform1f(jitterUniform, settings.jitter);
    
    // Update opacity uniform
    gl.uniform1f(opacityUniform, settings.particleOpacity);
    
    // Update color uniforms
    const baseColorNormalized = settings.baseColor.map(c => c / 255);
    const accentColorNormalized = settings.accentColor.map(c => c / 255);
    gl.uniform3fv(baseColorUniform, new Float32Array(baseColorNormalized));
    gl.uniform3fv(accentColorUniform, new Float32Array(accentColorNormalized));
    
    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribute);
    
    // Bind UV buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(uvAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvAttribute);
    
    // Draw points
    gl.drawArrays(gl.POINTS, 0, positions.length / 3);
    
    // Only continue the animation loop if not paused
    if (!settings.isPaused) {
        animationFrameId = requestAnimationFrame(render);
    }
}

// Initialize dat.GUI
const gui = initGUI();

// Need to initialize lastTime before first render
let lastTime = performance.now() * 0.001;

// Remove the old shape selector UI
const oldSelector = document.querySelector('.ui-controls');
if (oldSelector) {
    oldSelector.remove();
}

// Start animation
animationFrameId = requestAnimationFrame(render);