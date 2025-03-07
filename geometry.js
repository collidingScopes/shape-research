// Helper to add slight randomness to positions
function jitter(val, amount) {
  return val + (Math.random() - 0.5) * amount;
}

// Function to create a cube with sharp edges
function createCube(size, particlesPerEdge, particlesPerFace) {
  const halfSize = size / 2;
  const positions = [];
  const jitterAmount = settings.jitter;
  
  // 1. Create particles concentrated on edges for sharp definition
  const edgeStep = size / particlesPerEdge;
  
  // For each of the 12 edges of the cube
  // Horizontal edges along X (4 edges)
  for (let i = 0; i < particlesPerEdge; i++) {
      const t = (i / particlesPerEdge) * size - halfSize;
      // Edge 1: (t, halfSize, halfSize)
      positions.push(jitter(t, jitterAmount), jitter(halfSize, jitterAmount), jitter(halfSize, jitterAmount));
      // Edge 2: (t, -halfSize, halfSize)
      positions.push(jitter(t, jitterAmount), jitter(-halfSize, jitterAmount), jitter(halfSize, jitterAmount));
      // Edge 3: (t, halfSize, -halfSize)
      positions.push(jitter(t, jitterAmount), jitter(halfSize, jitterAmount), jitter(-halfSize, jitterAmount));
      // Edge 4: (t, -halfSize, -halfSize)
      positions.push(jitter(t, jitterAmount), jitter(-halfSize, jitterAmount), jitter(-halfSize, jitterAmount));
  }
  
  // Vertical edges along Y (4 edges)
  for (let i = 0; i < particlesPerEdge; i++) {
      const t = (i / particlesPerEdge) * size - halfSize;
      // Edge 5: (halfSize, t, halfSize)
      positions.push(jitter(halfSize, jitterAmount), jitter(t, jitterAmount), jitter(halfSize, jitterAmount));
      // Edge 6: (-halfSize, t, halfSize)
      positions.push(jitter(-halfSize, jitterAmount), jitter(t, jitterAmount), jitter(halfSize, jitterAmount));
      // Edge 7: (halfSize, t, -halfSize)
      positions.push(jitter(halfSize, jitterAmount), jitter(t, jitterAmount), jitter(-halfSize, jitterAmount));
      // Edge 8: (-halfSize, t, -halfSize)
      positions.push(jitter(-halfSize, jitterAmount), jitter(t, jitterAmount), jitter(-halfSize, jitterAmount));
  }
  
  // Depth edges along Z (4 edges)
  for (let i = 0; i < particlesPerEdge; i++) {
      const t = (i / particlesPerEdge) * size - halfSize;
      // Edge 9: (halfSize, halfSize, t)
      positions.push(jitter(halfSize, jitterAmount), jitter(halfSize, jitterAmount), jitter(t, jitterAmount));
      // Edge 10: (-halfSize, halfSize, t)
      positions.push(jitter(-halfSize, jitterAmount), jitter(halfSize, jitterAmount), jitter(t, jitterAmount));
      // Edge 11: (halfSize, -halfSize, t)
      positions.push(jitter(halfSize, jitterAmount), jitter(-halfSize, jitterAmount), jitter(t, jitterAmount));
      // Edge 12: (-halfSize, -halfSize, t)
      positions.push(jitter(-halfSize, jitterAmount), jitter(-halfSize, jitterAmount), jitter(t, jitterAmount));
  }
  
  // 2. Add particles on cube faces - less dense than edges
  const gridStep = size / Math.sqrt(particlesPerFace / 6); // 6 faces
  
  // Generate evenly distributed points on each face
  for (let face = 0; face < 6; face++) {
      for (let i = 0; i < particlesPerFace / 6; i++) {
          // Create more structured grid pattern on faces
          const rows = Math.floor(Math.sqrt(particlesPerFace / 6));
          const row = Math.floor(i / rows);
          const col = i % rows;
          
          const u = (col / rows) * size - halfSize + (gridStep / 2);
          const v = (row / rows) * size - halfSize + (gridStep / 2);
          
          // Small random offset
          const faceJitterAmount = gridStep * jitterAmount * 5.0;
          
          let x, y, z;
          
          switch (face) {
              case 0: // Front face (z = halfSize)
                  x = jitter(u, faceJitterAmount);
                  y = jitter(v, faceJitterAmount);
                  z = halfSize;
                  break;
              case 1: // Back face (z = -halfSize)
                  x = jitter(u, faceJitterAmount);
                  y = jitter(v, faceJitterAmount);
                  z = -halfSize;
                  break;
              case 2: // Top face (y = halfSize)
                  x = jitter(u, faceJitterAmount);
                  y = halfSize;
                  z = jitter(v, faceJitterAmount);
                  break;
              case 3: // Bottom face (y = -halfSize)
                  x = jitter(u, faceJitterAmount);
                  y = -halfSize;
                  z = jitter(v, faceJitterAmount);
                  break;
              case 4: // Right face (x = halfSize)
                  x = halfSize;
                  y = jitter(u, faceJitterAmount);
                  z = jitter(v, faceJitterAmount);
                  break;
              case 5: // Left face (x = -halfSize)
                  x = -halfSize;
                  y = jitter(u, faceJitterAmount);
                  z = jitter(v, faceJitterAmount);
                  break;
          }
          
          positions.push(x, y, z);
      }
  }
  
  return positions;
}

// Function to create a regular icosahedron (20-faced polyhedron)
function createIcosahedron(radius, edgeParticles, faceParticles) {
  const positions = [];
  const jitterAmount = settings.jitter;
  
  // Normalized vertices of a regular icosahedron
  const t = (1 + Math.sqrt(5)) / 2;
  const vertices = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ].map(([x, y, z]) => {
      const length = Math.sqrt(x*x + y*y + z*z);
      return [x/length, y/length, z/length];
  });
  
  // Faces of icosahedron (indices to vertices)
  const faces = [
      [0, 5, 11], [0, 1, 5], [0, 7, 1], [0, 10, 7], [0, 11, 10],
      [1, 9, 5], [5, 4, 11], [11, 2, 10], [10, 6, 7], [7, 8, 1],
      [3, 4, 9], [3, 2, 4], [3, 6, 2], [3, 8, 6], [3, 9, 8],
      [4, 5, 9], [2, 4, 11], [6, 10, 2], [8, 7, 6], [9, 1, 8]
  ];
  
  // 1. Create particles concentrated along edges
  const edges = new Set(); // Track unique edges
  
  for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
          const v1 = face[i];
          const v2 = face[(i + 1) % face.length];
          
          // Create a unique edge key (smaller index first)
          const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
          
          if (!edges.has(edgeKey)) {
              edges.add(edgeKey);
              
              // Get vertex coordinates
              const [x1, y1, z1] = vertices[v1];
              const [x2, y2, z2] = vertices[v2];
              
              // Create particles along this edge
              for (let j = 0; j <= edgeParticles; j++) {
                  const t = j / edgeParticles;
                  // Interpolate between vertices
                  let x = x1 + t * (x2 - x1);
                  let y = y1 + t * (y2 - y1);
                  let z = z1 + t * (z2 - z1);
                  
                  // Normalize to keep on surface and apply radius
                  const len = Math.sqrt(x*x + y*y + z*z);
                  x = (x / len) * radius;
                  y = (y / len) * radius;
                  z = (z / len) * radius;
                  
                  // Add jitter
                  x += (Math.random() - 0.5) * jitterAmount;
                  y += (Math.random() - 0.5) * jitterAmount;
                  z += (Math.random() - 0.5) * jitterAmount;
                  
                  positions.push(x, y, z);
              }
          }
      }
  }
  
  // 2. Add particles on each face (less dense than edges)
  for (const face of faces) {
      // Get vertices of this face
      const faceVertices = face.map(idx => vertices[idx]);
      
      // Calculate face center
      let centerX = 0, centerY = 0, centerZ = 0;
      for (const [x, y, z] of faceVertices) {
          centerX += x;
          centerY += y;
          centerZ += z;
      }
      centerX /= faceVertices.length;
      centerY /= faceVertices.length;
      centerZ /= faceVertices.length;
      
      // Normalize center point to be on sphere
      const lenCenter = Math.sqrt(centerX*centerX + centerY*centerY + centerZ*centerZ);
      centerX = (centerX / lenCenter) * radius;
      centerY = (centerY / lenCenter) * radius;
      centerZ = (centerZ / lenCenter) * radius;
      
      // Add particles within this face
      for (let i = 0; i < faceParticles/20; i++) {
          // Get random point that's biased toward face perimeter (for sharper face definition)
          // Bias toward edges by using sqrt - pushes distribution toward edge
          const r1 = Math.sqrt(Math.random());
          const r2 = Math.random();
          
          // Random barycentric coordinates
          let u = r1 * (1 - r2);
          let v = r1 * r2;
          let w = 1 - u - v;
          
          // Get vertices for triangle
          const [x1, y1, z1] = faceVertices[0];
          const [x2, y2, z2] = faceVertices[1];
          const [x3, y3, z3] = faceVertices[2];
          
          // Compute point using barycentric coordinates
          let x = u * x1 + v * x2 + w * x3;
          let y = u * y1 + v * y2 + w * y3;
          let z = u * z1 + v * z2 + w * z3;
          
          // Normalize to sphere surface
          const len = Math.sqrt(x*x + y*y + z*z);
          x = (x / len) * radius;
          y = (y / len) * radius;
          z = (z / len) * radius;
          
          // Add jitter
          const faceJitterAmount = jitterAmount * 0.5;
          x += (Math.random() - 0.5) * faceJitterAmount;
          y += (Math.random() - 0.5) * faceJitterAmount;
          z += (Math.random() - 0.5) * faceJitterAmount;
          
          positions.push(x, y, z);
      }
  }
  
  return positions;
}

// Function to create an octahedron (8-faced polyhedron)
function createOctahedron(radius, edgeParticles, faceParticles) {
  const positions = [];
  const jitterAmount = settings.jitter;
  
  // Vertices of an octahedron
  const vertices = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], 
      [0, -1, 0], [0, 0, 1], [0, 0, -1]
  ];
  
  // Faces (each face is a triangle)
  const faces = [
      [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
      [1, 4, 2], [1, 3, 4], [1, 5, 3], [1, 2, 5]
  ];
  
  // Create particles concentrated along edges
  const edges = new Set();
  
  for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
          const v1 = face[i];
          const v2 = face[(i + 1) % face.length];
          
          const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
          
          if (!edges.has(edgeKey)) {
              edges.add(edgeKey);
              
              const [x1, y1, z1] = vertices[v1];
              const [x2, y2, z2] = vertices[v2];
              
              for (let j = 0; j <= edgeParticles; j++) {
                  const t = j / edgeParticles;
                  let x = x1 + t * (x2 - x1);
                  let y = y1 + t * (y2 - y1);
                  let z = z1 + t * (z2 - z1);
                  
                  // Normalize and scale
                  const len = Math.sqrt(x*x + y*y + z*z);
                  x = (x / len) * radius;
                  y = (y / len) * radius;
                  z = (z / len) * radius;
                  
                  // Add jitter
                  x += (Math.random() - 0.5) * jitterAmount;
                  y += (Math.random() - 0.5) * jitterAmount;
                  z += (Math.random() - 0.5) * jitterAmount;
                  
                  positions.push(x, y, z);
              }
          }
      }
  }
  
  // Add particles on each face
  for (const face of faces) {
      const [v1, v2, v3] = face;
      const [x1, y1, z1] = vertices[v1];
      const [x2, y2, z2] = vertices[v2];
      const [x3, y3, z3] = vertices[v3];
      
      for (let i = 0; i < faceParticles / 8; i++) {
          // Barycentric coordinates
          const r1 = Math.sqrt(Math.random());
          const r2 = Math.random();
          const u = r1 * (1 - r2);
          const v = r1 * r2;
          const w = 1 - u - v;
          
          let x = u * x1 + v * x2 + w * x3;
          let y = u * y1 + v * y2 + w * y3;
          let z = u * z1 + v * z2 + w * z3;
          
          // Normalize to sphere surface
          const len = Math.sqrt(x*x + y*y + z*z);
          x = (x / len) * radius;
          y = (y / len) * radius;
          z = (z / len) * radius;
          
          // Add jitter
          const faceJitterAmount = jitterAmount * 0.5;
          x += (Math.random() - 0.5) * faceJitterAmount;
          y += (Math.random() - 0.5) * faceJitterAmount;
          z += (Math.random() - 0.5) * faceJitterAmount;
          
          positions.push(x, y, z);
      }
  }
  
  return positions;
}

// Function to create a dodecahedron (12-faced polyhedron)
function createDodecahedron(radius, edgeParticles, faceParticles) {
  const positions = [];
  const jitterAmount = settings.jitter;
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  
  // Vertices of a dodecahedron
  const vertices = [
      // Normalized coordinates
      [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
      [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
      [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
      [1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, phi], [-1/phi, 0, -phi],
      [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
  ].map(([x, y, z]) => {
      const len = Math.sqrt(x*x + y*y + z*z);
      return [x/len, y/len, z/len];
  });
  
  // Faces (each face is a pentagon)
  const faces = [
      [0, 8, 4, 14, 12], [0, 16, 17, 2, 12], [0, 16, 1, 9, 8],
      [1, 16, 17, 3, 13], [1, 9, 5, 15, 13], [2, 17, 3, 11, 10],
      [2, 10, 6, 14, 12], [3, 13, 15, 7, 11], [4, 8, 9, 5, 18],
      [4, 18, 19, 6, 14], [5, 18, 19, 7, 15], [6, 19, 7, 11, 10]
  ];
  
  // Create particles along edges
  const edges = new Set();
  
  for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
          const v1 = face[i];
          const v2 = face[(i + 1) % face.length];
          
          const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
          
          if (!edges.has(edgeKey)) {
              edges.add(edgeKey);
              
              const [x1, y1, z1] = vertices[v1];
              const [x2, y2, z2] = vertices[v2];
              
              for (let j = 0; j <= edgeParticles; j++) {
                  const t = j / edgeParticles;
                  let x = x1 + t * (x2 - x1);
                  let y = y1 + t * (y2 - y1);
                  let z = z1 + t * (z2 - z1);
                  
                  // Normalize and scale
                  const len = Math.sqrt(x*x + y*y + z*z);
                  x = (x / len) * radius;
                  y = (y / len) * radius;
                  z = (z / len) * radius;
                  
                  // Add jitter
                  x += (Math.random() - 0.5) * jitterAmount;
                  y += (Math.random() - 0.5) * jitterAmount;
                  z += (Math.random() - 0.5) * jitterAmount;
                  
                  positions.push(x, y, z);
              }
          }
      }
  }
  
  // Add particles on each face
  for (const face of faces) {
      // Calculate face center
      let centerX = 0, centerY = 0, centerZ = 0;
      for (const vertexIdx of face) {
          const [x, y, z] = vertices[vertexIdx];
          centerX += x;
          centerY += y;
          centerZ += z;
      }
      centerX /= face.length;
      centerY /= face.length;
      centerZ /= face.length;
      
      // Normalize center point
      const lenCenter = Math.sqrt(centerX*centerX + centerY*centerY + centerZ*centerZ);
      centerX = (centerX / lenCenter) * radius;
      centerY = (centerY / lenCenter) * radius;
      centerZ = (centerZ / lenCenter) * radius;
      
      // Add particles within this face
      for (let i = 0; i < faceParticles / 12; i++) {
          // Randomly select two vertices from the face
          const idx1 = Math.floor(Math.random() * face.length);
          let idx2 = (idx1 + 1) % face.length;
          
          const [x1, y1, z1] = vertices[face[idx1]];
          const [x2, y2, z2] = vertices[face[idx2]];
          
          // Random interpolation with bias toward edges
          const t = Math.pow(Math.random(), 1.5); // Bias toward 0 (edges)
          
          // Interpolate between center and edge point
          let x = centerX * (1 - t) + (x1 + t * (x2 - x1)) * t * radius;
          let y = centerY * (1 - t) + (y1 + t * (y2 - y1)) * t * radius;
          let z = centerZ * (1 - t) + (z1 + t * (z2 - z1)) * t * radius;
          
          // Normalize to sphere surface
          const len = Math.sqrt(x*x + y*y + z*z);
          x = (x / len) * radius;
          y = (y / len) * radius;
          z = (z / len) * radius;
          
          // Add jitter
          const faceJitterAmount = jitterAmount * 0.5;
          x += (Math.random() - 0.5) * faceJitterAmount;
          y += (Math.random() - 0.5) * faceJitterAmount;
          z += (Math.random() - 0.5) * faceJitterAmount;
          
          positions.push(x, y, z);
      }
  }
  
  return positions;
}

// Function to create a tetrahedron (4-faced polyhedron)
function createTetrahedron(radius, edgeParticles, faceParticles) {
  const positions = [];
  const jitterAmount = settings.jitter;
  
  // Vertices of a regular tetrahedron
  const vertices = [
      [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
  ].map(([x, y, z]) => {
      const len = Math.sqrt(x*x + y*y + z*z);
      return [x/len, y/len, z/len];
  });
  
  // Faces (each face is a triangle)
  const faces = [
      [0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]
  ];
  
  // Create particles along edges
  const edges = new Set();
  
  for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
          const v1 = face[i];
          const v2 = face[(i + 1) % face.length];
          
          const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
          
          if (!edges.has(edgeKey)) {
              edges.add(edgeKey);
              
              const [x1, y1, z1] = vertices[v1];
              const [x2, y2, z2] = vertices[v2];
              
              for (let j = 0; j <= edgeParticles; j++) {
                  const t = j / edgeParticles;
                  let x = x1 + t * (x2 - x1);
                  let y = y1 + t * (y2 - y1);
                  let z = z1 + t * (z2 - z1);
                  
                  // Normalize and scale
                  const len = Math.sqrt(x*x + y*y + z*z);
                  x = (x / len) * radius;
                  y = (y / len) * radius;
                  z = (z / len) * radius;
                  
                  // Add jitter
                  x += (Math.random() - 0.5) * jitterAmount;
                  y += (Math.random() - 0.5) * jitterAmount;
                  z += (Math.random() - 0.5) * jitterAmount;
                  
                  positions.push(x, y, z);
              }
          }
      }
  }
  
  // Add particles on each face
  for (const face of faces) {
      const [v1, v2, v3] = face;
      const [x1, y1, z1] = vertices[v1];
      const [x2, y2, z2] = vertices[v2];
      const [x3, y3, z3] = vertices[v3];
      
      for (let i = 0; i < faceParticles / 4; i++) {
          // Barycentric coordinates
          const r1 = Math.sqrt(Math.random());
          const r2 = Math.random();
          const u = r1 * (1 - r2);
          const v = r1 * r2;
          const w = 1 - u - v;
          
          let x = u * x1 + v * x2 + w * x3;
          let y = u * y1 + v * y2 + w * y3;
          let z = u * z1 + v * z2 + w * z3;
          
          // Normalize to sphere surface
          const len = Math.sqrt(x*x + y*y + z*z);
          x = (x / len) * radius;
          y = (y / len) * radius;
          z = (z / len) * radius;
          
          // Add jitter
          const faceJitterAmount = jitterAmount * 0.5;
          x += (Math.random() - 0.5) * faceJitterAmount;
          y += (Math.random() - 0.5) * faceJitterAmount;
          z += (Math.random() - 0.5) * faceJitterAmount;
          
          positions.push(x, y, z);
      }
  }
  
  return positions;
}