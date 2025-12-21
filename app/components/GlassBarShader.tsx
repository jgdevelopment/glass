"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ShaderParams {
  cols: number;
  rows: number;
  gapX: number;
  gapY: number;
  refractionStrength: number;
  chromaStrength: number;
  speed: number;
  noiseScale: number;
  saturation: number;
  brightness: number;
  glassEdgeIntensity: number;
  causticIntensity: number;
  vignetteStrength: number;
}

const defaultParams: ShaderParams = {
  cols: 35,
  rows: 9,
  gapX: 0.012,
  gapY: 0.008,
  refractionStrength: 0.06,
  chromaStrength: 0.008,
  speed: 1.0,
  noiseScale: 1.0,
  saturation: 1.5,
  brightness: 1.0,
  glassEdgeIntensity: 1.0,
  causticIntensity: 1.0,
  vignetteStrength: 0.08,
};

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const createFragmentShaderSource = () => `
  precision highp float;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_cols;
  uniform float u_rows;
  uniform float u_gapX;
  uniform float u_gapY;
  uniform float u_refractionStrength;
  uniform float u_chromaStrength;
  uniform float u_speed;
  uniform float u_noiseScale;
  uniform float u_saturation;
  uniform float u_brightness;
  uniform float u_glassEdgeIntensity;
  uniform float u_causticIntensity;
  uniform float u_vignetteStrength;
  
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
    float slowTime = time * 0.08 * u_speed;
    
    // Large organic shapes
    float n1 = organicNoise(uv * 0.8 * u_noiseScale + slowTime * 0.5);
    float n2 = organicNoise(uv * 0.6 * u_noiseScale + vec2(5.2, 3.1) - slowTime * 0.3);
    float n3 = organicNoise(uv * 1.0 * u_noiseScale + vec2(2.7, 8.3) + slowTime * 0.4);
    
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
    col = mix(vec3(lum), col, u_saturation);
    
    // Apply brightness
    col *= u_brightness;
    
    return col;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    
    // Bar configuration
    float cols = u_cols;
    float rows = u_rows;
    
    float colIndex = floor(uv.x * cols);
    float rowIndex = floor(uv.y * rows);
    
    float localX = fract(uv.x * cols);
    float localY = fract(uv.y * rows);
    
    // Bar dimensions with small gaps
    float gapX = u_gapX;
    float gapY = u_gapY;
    float barMask = step(gapX, localX) * step(localX, 1.0 - gapX);
    barMask *= step(gapY, localY) * step(localY, 1.0 - gapY);
    
    // Glass prism refraction - cylindrical lens effect
    // Normalize local position within bar (excluding gaps)
    float barX = (localX - gapX) / (1.0 - 2.0 * gapX);
    float barY = (localY - gapY) / (1.0 - 2.0 * gapY);
    barX = clamp(barX, 0.0, 1.0);
    barY = clamp(barY, 0.0, 1.0);
    
    // Glass thickness simulation - parabolic refraction like a cylinder lens
    float centerDist = (barX - 0.5) * 2.0; // -1 to 1
    float glassProfile = 1.0 - centerDist * centerDist; // Parabolic thickness
    
    // Refraction offset - stronger horizontal compression/stretching
    float refractionStrength = u_refractionStrength;
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
    float barPhase = sin(barSeed + u_time * 0.15 * u_speed) * 0.008;
    sampleUv.y += barPhase;
    sampleUv.x += cos(barSeed * 0.8 + u_time * 0.1 * u_speed) * 0.005;
    
    // Sample background with chromatic aberration
    float chromaStrength = u_chromaStrength * (1.0 + abs(centerDist));
    vec3 col;
    col.r = getBackgroundColor((sampleUv + vec2(chromaStrength, 0.0)) * vec2(aspect * 0.55, 1.0), u_time).r;
    col.g = getBackgroundColor(sampleUv * vec2(aspect * 0.55, 1.0), u_time).g;
    col.b = getBackgroundColor((sampleUv - vec2(chromaStrength, 0.0)) * vec2(aspect * 0.55, 1.0), u_time).b;
    
    // === GLASS EDGE EFFECTS - THICKNESS AND DEPTH ===
    float edgeIntensity = u_glassEdgeIntensity;
    
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
    float fresnel = pow(1.0 - edgeDarken, 0.8) * 0.15 * edgeIntensity;
    col += vec3(0.8, 0.9, 1.0) * fresnel;
    
    // Left edge highlights - primary light source
    col += vec3(1.0, 1.0, 1.0) * leftEdge1 * 0.95 * edgeIntensity;
    col += vec3(0.9, 0.95, 1.0) * leftEdge2 * 0.4 * edgeIntensity;
    col += vec3(0.85, 0.92, 1.0) * leftGlow * 0.25 * edgeIntensity;
    
    // Right edge - darker with subtle highlight
    col *= mix(1.0, 0.85, rightDark * 0.5 * edgeIntensity);
    col += vec3(0.7, 0.8, 0.9) * rightEdge1 * 0.3 * edgeIntensity;
    col += vec3(0.6, 0.7, 0.85) * rightEdge2 * 0.15 * edgeIntensity;
    
    // Horizontal edge highlights
    col += vec3(0.9, 0.95, 1.0) * topEdge * 0.35 * edgeIntensity;
    col += vec3(0.85, 0.9, 0.95) * bottomEdge * 0.25 * edgeIntensity;
    
    // Corner accents
    col += vec3(1.0) * cornerTL * 0.3 * edgeIntensity;
    col += vec3(0.95, 0.98, 1.0) * cornerBL * 0.2 * edgeIntensity;
    
    // Sharp specular highlight on left edge
    float specular = pow(max(0.0, 1.0 - barX / 0.012), 8.0);
    col += vec3(1.0) * specular * 0.7 * edgeIntensity;
    
    // Subtle internal reflection/caustic
    float caustic = sin(barX * 12.0 + barY * 3.0 + u_time * 0.5 * u_speed) * 0.5 + 0.5;
    caustic *= glassProfile * 0.03 * u_causticIntensity;
    col += vec3(0.95, 0.98, 1.0) * caustic;
    
    // Gap between bars - dark
    vec3 gapColor = vec3(0.008, 0.012, 0.025);
    col = mix(gapColor, col, barMask);
    
    // Very subtle vignette
    vec2 vignetteUv = uv - 0.5;
    float vignette = 1.0 - dot(vignetteUv, vignetteUv) * u_vignetteStrength;
    col *= vignette;
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface ControlPanelProps {
  params: ShaderParams;
  onChange: (params: ShaderParams) => void;
  onReset: () => void;
}

function ControlPanel({ params, onChange, onReset }: ControlPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (key: keyof ShaderParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const controls: {
    key: keyof ShaderParams;
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: "cols", label: "Columns", min: 1, max: 80, step: 1 },
    { key: "rows", label: "Rows", min: 1, max: 30, step: 1 },
    { key: "gapX", label: "Gap X", min: 0, max: 0.1, step: 0.001 },
    { key: "gapY", label: "Gap Y", min: 0, max: 0.1, step: 0.001 },
    { key: "refractionStrength", label: "Refraction", min: 0, max: 0.2, step: 0.005 },
    { key: "chromaStrength", label: "Chromatic Aberration", min: 0, max: 0.05, step: 0.001 },
    { key: "speed", label: "Animation Speed", min: 0, max: 5, step: 0.1 },
    { key: "noiseScale", label: "Noise Scale", min: 0.1, max: 3, step: 0.1 },
    { key: "saturation", label: "Saturation", min: 0, max: 3, step: 0.1 },
    { key: "brightness", label: "Brightness", min: 0.1, max: 2, step: 0.05 },
    { key: "glassEdgeIntensity", label: "Glass Edge Intensity", min: 0, max: 2, step: 0.1 },
    { key: "causticIntensity", label: "Caustic Intensity", min: 0, max: 3, step: 0.1 },
    { key: "vignetteStrength", label: "Vignette", min: 0, max: 0.5, step: 0.01 },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        width: isCollapsed ? "auto" : 320,
        maxHeight: "calc(100vh - 32px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: isCollapsed ? 12 : "12px 12px 0 0",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderBottom: isCollapsed ? undefined : "none",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span
          style={{
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          ✨ Shader Controls
        </span>
        <span
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: 18,
            transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </div>

      {/* Controls Body */}
      {!isCollapsed && (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "0 0 12px 12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderTop: "none",
            padding: 16,
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {controls.map(({ key, label, min, max, step }) => (
              <div key={key}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{
                      color: "rgba(255, 255, 255, 0.8)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </label>
                  <span
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: 11,
                      fontFamily: "monospace",
                      background: "rgba(255, 255, 255, 0.1)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {params[key].toFixed(step < 1 ? String(step).split(".")[1]?.length || 2 : 0)}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={params[key]}
                  onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 3,
                    appearance: "none",
                    background: "rgba(255, 255, 255, 0.15)",
                    cursor: "pointer",
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 8,
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            Reset to Defaults
          </button>
        </div>
      )}

      {/* Slider thumb styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

export default function GlassBarShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  
  const [params, setParams] = useState<ShaderParams>(defaultParams);

  const handleReset = useCallback(() => {
    setParams(defaultParams);
  }, []);

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
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, createFragmentShaderSource());
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

    // Store all uniform locations
    uniformLocationsRef.current = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      cols: gl.getUniformLocation(program, "u_cols"),
      rows: gl.getUniformLocation(program, "u_rows"),
      gapX: gl.getUniformLocation(program, "u_gapX"),
      gapY: gl.getUniformLocation(program, "u_gapY"),
      refractionStrength: gl.getUniformLocation(program, "u_refractionStrength"),
      chromaStrength: gl.getUniformLocation(program, "u_chromaStrength"),
      speed: gl.getUniformLocation(program, "u_speed"),
      noiseScale: gl.getUniformLocation(program, "u_noiseScale"),
      saturation: gl.getUniformLocation(program, "u_saturation"),
      brightness: gl.getUniformLocation(program, "u_brightness"),
      glassEdgeIntensity: gl.getUniformLocation(program, "u_glassEdgeIntensity"),
      causticIntensity: gl.getUniformLocation(program, "u_causticIntensity"),
      vignetteStrength: gl.getUniformLocation(program, "u_vignetteStrength"),
    };

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
      const locs = uniformLocationsRef.current;

      gl.uniform2f(locs.resolution, canvas!.width, canvas!.height);
      gl.uniform1f(locs.time, time);

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

  // Update uniforms when params change
  useEffect(() => {
    const gl = glRef.current;
    const locs = uniformLocationsRef.current;
    if (!gl || !programRef.current) return;

    gl.useProgram(programRef.current);
    gl.uniform1f(locs.cols, params.cols);
    gl.uniform1f(locs.rows, params.rows);
    gl.uniform1f(locs.gapX, params.gapX);
    gl.uniform1f(locs.gapY, params.gapY);
    gl.uniform1f(locs.refractionStrength, params.refractionStrength);
    gl.uniform1f(locs.chromaStrength, params.chromaStrength);
    gl.uniform1f(locs.speed, params.speed);
    gl.uniform1f(locs.noiseScale, params.noiseScale);
    gl.uniform1f(locs.saturation, params.saturation);
    gl.uniform1f(locs.brightness, params.brightness);
    gl.uniform1f(locs.glassEdgeIntensity, params.glassEdgeIntensity);
    gl.uniform1f(locs.causticIntensity, params.causticIntensity);
    gl.uniform1f(locs.vignetteStrength, params.vignetteStrength);
  }, [params]);

  return (
    <>
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
      <ControlPanel params={params} onChange={setParams} onReset={handleReset} />
    </>
  );
}
