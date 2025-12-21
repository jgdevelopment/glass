"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                     + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  vec3 getFluidColor(vec2 uv, float time) {
    // Create flowing, turbulent base
    vec2 flow = vec2(
      fbm(uv * 1.6 + time * 0.16),
      fbm(uv * 1.6 + vec2(5.2, 1.3) + time * 0.13)
    );
    
    vec2 distortedUv = uv + flow * 0.5;
    
    // Multiple layers of noise
    float n1 = fbm(distortedUv * 1.4 + time * 0.085);
    float n2 = fbm(distortedUv * 2.0 - time * 0.1 + vec2(3.1, 7.2));
    float n3 = fbm(distortedUv * 0.9 + time * 0.065 + vec2(1.7, 9.3));
    float n4 = fbm(distortedUv * 2.5 + time * 0.045 + vec2(8.4, 2.1));
    
    // Color palette matching the reference
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 paleBlue = vec3(0.9, 0.96, 1.0);
    vec3 brightCyan = vec3(0.3, 0.95, 1.0);
    vec3 cyan = vec3(0.1, 0.8, 0.95);
    vec3 skyBlue = vec3(0.45, 0.75, 1.0);
    vec3 blue = vec3(0.15, 0.4, 0.95);
    vec3 deepBlue = vec3(0.05, 0.15, 0.55);
    vec3 orange = vec3(1.0, 0.55, 0.1);
    vec3 brightOrange = vec3(1.0, 0.7, 0.25);
    vec3 red = vec3(0.95, 0.15, 0.1);
    vec3 pink = vec3(0.95, 0.45, 0.7);
    vec3 black = vec3(0.0, 0.0, 0.03);
    
    // Normalize noise
    float t1 = n1 * 0.5 + 0.5;
    float t2 = n2 * 0.5 + 0.5;
    float t3 = n3 * 0.5 + 0.5;
    float t4 = n4 * 0.5 + 0.5;
    
    vec3 col = deepBlue;
    
    // Build cyan/blue base
    col = mix(col, blue, smoothstep(0.12, 0.38, t1));
    col = mix(col, cyan, smoothstep(0.28, 0.55, t1) * smoothstep(0.2, 0.6, t2));
    col = mix(col, brightCyan, smoothstep(0.42, 0.68, t1) * smoothstep(0.35, 0.75, t3));
    col = mix(col, skyBlue, smoothstep(0.32, 0.58, t2) * smoothstep(0.28, 0.52, t4) * 0.55);
    
    // White/bright areas
    float whiteMask = smoothstep(0.52, 0.78, t1) * smoothstep(0.48, 0.82, t2);
    col = mix(col, paleBlue, whiteMask * 0.85);
    col = mix(col, white, whiteMask * smoothstep(0.62, 0.88, t3));
    
    // Warm zones - more saturated and prominent
    float warmBase = smoothstep(0.32, 0.58, t3) * smoothstep(0.28, 0.52, t4);
    float warmMask = warmBase * (1.0 - smoothstep(0.48, 0.72, t1));
    col = mix(col, brightOrange, warmMask * 0.85);
    col = mix(col, orange, warmMask * smoothstep(0.38, 0.62, t2) * 0.9);
    col = mix(col, red, smoothstep(0.48, 0.68, t4) * warmMask * 0.95);
    
    // Pink accents
    float pinkMask = smoothstep(0.38, 0.62, t2) * smoothstep(0.42, 0.68, t4);
    pinkMask *= (1.0 - warmMask) * smoothstep(0.25, 0.45, t1);
    col = mix(col, pink, pinkMask * 0.5);
    
    // Deep black areas for dramatic contrast
    float blackMask = (1.0 - smoothstep(0.08, 0.28, t1)) * (1.0 - smoothstep(0.12, 0.32, t2));
    col = mix(col, black, blackMask * 0.92);
    
    // Additional dark regions
    float darkMask = smoothstep(0.18, 0.38, t3) * (1.0 - smoothstep(0.22, 0.45, t1)) * (1.0 - blackMask);
    col = mix(col, deepBlue * 0.5, darkMask * 0.6);
    
    // Boost saturation significantly
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, 1.4);
    
    return col;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    
    // Bar configuration
    float cols = 35.0;
    float rows = 9.0;
    
    float colIndex = floor(uv.x * cols);
    float rowIndex = floor(uv.y * rows);
    
    float localX = fract(uv.x * cols);
    float localY = fract(uv.y * rows);
    
    // Bar mask
    float gapX = 0.01;
    float gapY = 0.005;
    float barMask = step(gapX, localX) * step(localX, 1.0 - gapX);
    barMask *= step(gapY, localY) * step(localY, 1.0 - gapY);
    
    // 3D glass effects - more pronounced
    // Left edge bright line
    float leftLine = smoothstep(0.0, 0.025, localX) * (1.0 - smoothstep(0.025, 0.06, localX));
    float leftGlow = pow(smoothstep(0.08, 0.0, localX), 1.8);
    
    // Right edge
    float rightLine = smoothstep(0.0, 0.02, 1.0 - localX) * (1.0 - smoothstep(0.02, 0.045, 1.0 - localX));
    
    // Edge darkening
    float edgeDarken = smoothstep(0.0, 0.08, localX) * smoothstep(0.0, 0.08, 1.0 - localX);
    
    // Refraction
    float refractionStrength = 0.04;
    float distFromCenter = (localX - 0.5) * 2.0;
    
    vec2 refractedUv = uv;
    refractedUv.x += distFromCenter * refractionStrength;
    refractedUv.y += sin(distFromCenter * 3.14159) * refractionStrength * 0.3;
    
    // Per-bar variation
    float phase = sin(colIndex * 0.85 + rowIndex * 1.6 + u_time * 0.22) * 0.015;
    refractedUv.y += phase;
    refractedUv.x += cos(colIndex * 0.55 + u_time * 0.15) * 0.01;
    
    // Get colors
    vec3 fluidColor = getFluidColor(refractedUv * vec2(aspect * 0.6, 1.0), u_time);
    
    // Chromatic aberration
    float chromaStrength = 0.012;
    vec2 chromaOffset = vec2(distFromCenter * chromaStrength, 0.0);
    
    vec3 chromaColor;
    chromaColor.r = getFluidColor((refractedUv + chromaOffset) * vec2(aspect * 0.6, 1.0), u_time).r;
    chromaColor.g = fluidColor.g;
    chromaColor.b = getFluidColor((refractedUv - chromaOffset) * vec2(aspect * 0.6, 1.0), u_time).b;
    
    vec3 col = mix(fluidColor, chromaColor, 0.4);
    
    // Apply edge effects
    col *= mix(0.65, 1.0, edgeDarken);
    
    // Strong left edge highlight
    col += vec3(0.95, 0.98, 1.0) * leftLine * 0.8;
    col += vec3(0.85, 0.92, 1.0) * leftGlow * 0.45;
    
    // Subtle right edge
    col += vec3(0.75, 0.85, 0.95) * rightLine * 0.35;
    
    // Sharp specular
    float specLeft = pow(max(0.0, 1.0 - localX / 0.015), 6.0);
    col += vec3(1.0) * specLeft * 0.6;
    
    // Horizontal separations
    float horizEdge = smoothstep(0.0, 0.015, localY) * smoothstep(0.0, 0.015, 1.0 - localY);
    col *= mix(0.5, 1.0, horizEdge);
    
    // Top highlight
    float topHighlight = (1.0 - smoothstep(0.0, 0.03, 1.0 - localY));
    topHighlight *= smoothstep(0.012, 0.04, localX) * smoothstep(0.012, 0.04, 1.0 - localX);
    col += vec3(0.9, 0.95, 1.0) * topHighlight * 0.2;
    
    // Gap color
    vec3 gapColor = vec3(0.01, 0.015, 0.03);
    col = mix(gapColor, col, barMask);
    
    // Vignette
    vec2 vignetteUv = uv - 0.5;
    float vignette = 1.0 - dot(vignetteUv, vignetteUv) * 0.1;
    col *= vignette;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function GlassBarShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    function resize() {
      if (!canvas || !gl) return;
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = displayWidth + "px";
      canvas.style.height = displayHeight + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    const startTime = Date.now();

    function render() {
      if (!gl || !programRef.current) return;

      const time = (Date.now() - startTime) / 1000;

      gl.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      gl.uniform1f(timeLocation, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
