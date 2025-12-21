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
  
  // Smooth organic noise - less octaves, larger features
  float organicNoise(vec2 p) {
    float value = 0.0;
    value += snoise(p * 0.5) * 0.6;
    value += snoise(p * 1.0 + vec2(3.4, 1.2)) * 0.3;
    value += snoise(p * 2.0 + vec2(7.1, 4.5)) * 0.1;
    return value;
  }
  
  // Background color - smooth organic gradients like light through colored glass
  vec3 getBackgroundColor(vec2 uv, float time) {
    // Very slow, smooth flow
    float slowTime = time * 0.08;
    
    // Large organic shapes
    float n1 = organicNoise(uv * 0.8 + slowTime * 0.5);
    float n2 = organicNoise(uv * 0.6 + vec2(5.2, 3.1) - slowTime * 0.3);
    float n3 = organicNoise(uv * 1.0 + vec2(2.7, 8.3) + slowTime * 0.4);
    
    // Normalize to 0-1
    float t1 = n1 * 0.5 + 0.5;
    float t2 = n2 * 0.5 + 0.5;
    float t3 = n3 * 0.5 + 0.5;
    
    // Color palette - vivid, saturated colors like the reference
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 paleBlue = vec3(0.85, 0.92, 1.0);
    vec3 cyan = vec3(0.2, 0.85, 0.95);
    vec3 brightCyan = vec3(0.4, 0.95, 1.0);
    vec3 skyBlue = vec3(0.5, 0.78, 1.0);
    vec3 blue = vec3(0.1, 0.35, 0.9);
    vec3 deepBlue = vec3(0.02, 0.1, 0.45);
    vec3 orange = vec3(1.0, 0.5, 0.05);
    vec3 brightOrange = vec3(1.0, 0.65, 0.15);
    vec3 yellow = vec3(1.0, 0.85, 0.3);
    vec3 red = vec3(0.95, 0.12, 0.08);
    vec3 pink = vec3(0.95, 0.5, 0.65);
    vec3 magenta = vec3(0.85, 0.25, 0.6);
    vec3 black = vec3(0.0, 0.0, 0.02);
    
    // Build color with smooth gradients - larger color regions
    vec3 col = deepBlue;
    
    // Blue/cyan base with smooth transitions
    col = mix(col, blue, smoothstep(0.2, 0.5, t1));
    col = mix(col, skyBlue, smoothstep(0.35, 0.65, t1) * smoothstep(0.3, 0.6, t2));
    col = mix(col, cyan, smoothstep(0.5, 0.75, t1) * smoothstep(0.4, 0.7, t3));
    col = mix(col, brightCyan, smoothstep(0.6, 0.85, t2) * smoothstep(0.5, 0.8, t1));
    
    // Bright/white areas
    float whiteMask = smoothstep(0.65, 0.9, t1) * smoothstep(0.55, 0.85, t2);
    col = mix(col, paleBlue, whiteMask);
    col = mix(col, white, whiteMask * smoothstep(0.7, 0.95, t3));
    
    // Warm color zones - distinct regions
    float warmZone = smoothstep(0.4, 0.65, t3) * (1.0 - smoothstep(0.55, 0.8, t1));
    col = mix(col, yellow, warmZone * 0.4);
    col = mix(col, brightOrange, warmZone * smoothstep(0.35, 0.6, t2));
    col = mix(col, orange, warmZone * smoothstep(0.45, 0.7, t2) * 0.9);
    col = mix(col, red, warmZone * smoothstep(0.55, 0.8, t3) * 0.95);
    
    // Pink/magenta accents
    float pinkZone = smoothstep(0.45, 0.7, t2) * smoothstep(0.5, 0.75, t3);
    pinkZone *= (1.0 - warmZone * 0.8) * (1.0 - whiteMask);
    col = mix(col, pink, pinkZone * 0.5);
    col = mix(col, magenta, pinkZone * smoothstep(0.55, 0.8, t1) * 0.4);
    
    // Dark/black regions for contrast
    float darkMask = (1.0 - smoothstep(0.15, 0.4, t1)) * (1.0 - smoothstep(0.2, 0.45, t2));
    col = mix(col, black, darkMask * 0.95);
    
    // Boost saturation
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, 1.5);
    
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
    
    // No gaps - bars are flush, separation comes from edge highlights
    float barX = localX;
    float barY = localY;
    
    // Glass thickness simulation - parabolic refraction like a cylinder lens
    float centerDist = (barX - 0.5) * 2.0; // -1 to 1
    float glassProfile = 1.0 - centerDist * centerDist; // Parabolic thickness
    
    // Refraction offset - stronger horizontal compression/stretching
    float refractionIndex = 1.5; // Glass IOR
    float refractionStrength = 0.06;
    vec2 refractOffset = vec2(
      centerDist * refractionStrength * glassProfile,
      0.0
    );
    
    // Vertical compression within bar - creates horizontal banding effect
    float verticalRefract = sin(centerDist * 3.14159) * 0.015;
    refractOffset.y += verticalRefract;
    
    // Base UV for sampling background
    vec2 sampleUv = uv + refractOffset;
    
    // Per-bar slight rotation/offset for organic feel
    float barSeed = colIndex * 0.73 + rowIndex * 1.37;
    float barPhase = sin(barSeed + u_time * 0.15) * 0.008;
    sampleUv.y += barPhase;
    sampleUv.x += cos(barSeed * 0.8 + u_time * 0.1) * 0.005;
    
    // Sample background with chromatic aberration
    float chromaStrength = 0.008 * (1.0 + abs(centerDist));
    vec3 col;
    col.r = getBackgroundColor((sampleUv + vec2(chromaStrength, 0.0)) * vec2(aspect * 0.55, 1.0), u_time).r;
    col.g = getBackgroundColor(sampleUv * vec2(aspect * 0.55, 1.0), u_time).g;
    col.b = getBackgroundColor((sampleUv - vec2(chromaStrength, 0.0)) * vec2(aspect * 0.55, 1.0), u_time).b;
    
    // === GLASS EDGE EFFECTS - THICKNESS AND DEPTH ===
    
    // Left edge - bright beveled highlight (light catching the glass edge)
    float leftEdge1 = smoothstep(0.0, 0.02, barX) * (1.0 - smoothstep(0.02, 0.05, barX));
    float leftEdge2 = smoothstep(0.0, 0.05, barX) * (1.0 - smoothstep(0.05, 0.12, barX));
    float leftGlow = pow(1.0 - smoothstep(0.0, 0.15, barX), 2.0);
    
    // Right edge - subtle secondary highlight and shadow
    float rightEdge1 = smoothstep(0.0, 0.015, 1.0 - barX) * (1.0 - smoothstep(0.015, 0.035, 1.0 - barX));
    float rightEdge2 = smoothstep(0.0, 0.04, 1.0 - barX) * (1.0 - smoothstep(0.04, 0.1, 1.0 - barX));
    float rightDark = pow(1.0 - smoothstep(0.0, 0.08, 1.0 - barX), 1.5);
    
    // Top and bottom edges - horizontal thickness lines
    float topEdge = smoothstep(0.0, 0.025, 1.0 - barY) * (1.0 - smoothstep(0.025, 0.06, 1.0 - barY));
    float bottomEdge = smoothstep(0.0, 0.02, barY) * (1.0 - smoothstep(0.02, 0.05, barY));
    
    // Corner highlights - where edges meet
    float cornerTL = leftEdge2 * topEdge * 2.0;
    float cornerBL = leftEdge2 * bottomEdge * 1.5;
    
    // Overall edge darkening (glass is thicker at edges when viewed through)
    float edgeDarken = smoothstep(0.0, 0.1, barX) * smoothstep(0.0, 0.1, 1.0 - barX);
    edgeDarken *= smoothstep(0.0, 0.06, barY) * smoothstep(0.0, 0.06, 1.0 - barY);
    
    // Apply glass thickness - darken edges slightly
    col *= mix(0.7, 1.0, edgeDarken);
    
    // Fresnel-like edge brightening (light scattering in glass)
    float fresnel = pow(1.0 - edgeDarken, 0.8) * 0.15;
    col += vec3(0.8, 0.9, 1.0) * fresnel;
    
    // Left edge highlights - primary light source
    col += vec3(1.0, 1.0, 1.0) * leftEdge1 * 0.95;
    col += vec3(0.9, 0.95, 1.0) * leftEdge2 * 0.4;
    col += vec3(0.85, 0.92, 1.0) * leftGlow * 0.25;
    
    // Right edge - darker with subtle highlight
    col *= mix(1.0, 0.85, rightDark * 0.5);
    col += vec3(0.7, 0.8, 0.9) * rightEdge1 * 0.3;
    col += vec3(0.6, 0.7, 0.85) * rightEdge2 * 0.15;
    
    // Horizontal edge highlights
    col += vec3(0.9, 0.95, 1.0) * topEdge * 0.35;
    col += vec3(0.85, 0.9, 0.95) * bottomEdge * 0.25;
    
    // Corner accents
    col += vec3(1.0) * cornerTL * 0.3;
    col += vec3(0.95, 0.98, 1.0) * cornerBL * 0.2;
    
    // Sharp specular highlight on left edge
    float specular = pow(max(0.0, 1.0 - barX / 0.012), 8.0);
    col += vec3(1.0) * specular * 0.7;
    
    // Subtle internal reflection/caustic
    float caustic = sin(barX * 12.0 + barY * 3.0 + u_time * 0.5) * 0.5 + 0.5;
    caustic *= glassProfile * 0.03;
    col += vec3(0.95, 0.98, 1.0) * caustic;
    
    // Gap between bars - dark
    vec3 gapColor = vec3(0.008, 0.012, 0.025);
    col = mix(gapColor, col, barMask);
    
    // Very subtle vignette
    vec2 vignetteUv = uv - 0.5;
    float vignette = 1.0 - dot(vignetteUv, vignetteUv) * 0.08;
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
