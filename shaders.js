// Shader sources
const vertexShaderSource = `
    precision mediump float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float time;
    uniform float jitter;
    varying vec2 vUv;
    varying float vNoise;
    
    // Simple noise function
    float noise(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
    }
    
    void main() {
        vUv = uv;
        
        // Add some movement based on time
        vec3 pos = position;
        float noiseValue = noise(pos * 0.5 + time * 0.1);
        
        // Apply noise to vertex position based on jitter parameter
        pos.x += sin(time * 0.3 + pos.y * 1.5) * jitter * 2.5;
        pos.y += cos(time * 0.25 + pos.x * 1.5) * jitter * 2.5;
        pos.z += sin(time * 0.2 + noiseValue * 3.0) * jitter * 3.5;
        
        // Pass noise to fragment shader
        vNoise = noiseValue;
        
        // Calculate final position
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        
        // Fixed point size with z-position adjustment
        gl_PointSize = 3.0 * (0.8 - (gl_Position.z * 0.3));
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec2 vUv;
    varying float vNoise;
    uniform float time;
    uniform float opacity;
    uniform vec3 baseColor;    // New uniform for base color
    uniform vec3 accentColor;  // New uniform for accent color
    
    void main() {
        // Calculate distance from center of point
        vec2 center = vec2(0.5, 0.5);
        float dist = length(gl_PointCoord - center);
        
        // Create a soft circular point
        float intensity = 0.8 - smoothstep(0.0, 0.5, dist);
        
        // Apply animation based on noise and time
        intensity *= 0.5 + 0.5 * sin(time * 0.2 + vNoise * 10.0);
        
        // Color with gradient based on noise value - now using the uniform colors
        vec3 color = mix(
            baseColor,      // Base color from uniform
            accentColor,    // Accent color from uniform
            vNoise
        );
        
        // Final color with alpha for blending - use opacity parameter
        gl_FragColor = vec4(color, intensity > 0.05 ? opacity : 0.0);
    }
`;

// Helper function to compile shaders
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

// Helper function to create shader program
function createShaderProgram(gl) {
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    
    return program;
}