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
  edgeHardness: number;
  shimmerIntensity: number;
  // New edge controls
  edgeWidth: number;
  edgeWarmth: number;
  edgeRefraction: number;
  edgeBevelDepth: number;
  edgeChroma: number;
}

const defaultParams: ShaderParams = {
  cols: 35,
  rows: 9,
  gapX: 0.008,
  gapY: 0.006,
  refractionStrength: 0.08,
  chromaStrength: 0.025,
  speed: 0.15,
  noiseScale: 0.8,
  saturation: 1.6,
  brightness: 1.1,
  glassEdgeIntensity: 1.8,
  causticIntensity: 0.2,
  vignetteStrength: 0.05,
  edgeHardness: 0.85,
  shimmerIntensity: 0.5,
  // New edge defaults - tuned to match reference
  edgeWidth: 0.04,
  edgeWarmth: 0.8,
  edgeRefraction: 0.6,
  edgeBevelDepth: 0.7,
  edgeChroma: 0.5,
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
  uniform float u_edgeHardness;
  uniform float u_shimmerIntensity;
  uniform float u_edgeWidth;
  uniform float u_edgeWarmth;
  uniform float u_edgeRefraction;
  uniform float u_edgeBevelDepth;
  uniform float u_edgeChroma;
  
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
  
  // Static pattern noise - creates hard-edged color regions
  float staticNoise(vec2 p, float time, float shimmerAmt) {
    // Very slow shimmer, not flow
    float shimmer = sin(time * 0.5) * 0.02 * shimmerAmt;
    float n = snoise(p + shimmer);
    return n;
  }
  
  // Hard-edged step function for crisp color transitions
  float hardStep(float edge, float x, float softness) {
    return smoothstep(edge - softness, edge + softness, x);
  }
  
  // Background color - static regions with hard edges and shimmer
  vec3 getBackgroundColor(vec2 uv, float time) {
    // Slow shimmer animation (not flowing)
    float shimmerTime = time * u_speed;
    float shimmerAmt = u_shimmerIntensity;
    
    // Multiple noise layers at different scales - mostly static
    float n1 = staticNoise(uv * 1.2 * u_noiseScale, shimmerTime, shimmerAmt);
    float n2 = staticNoise(uv * 0.8 * u_noiseScale + vec2(5.2, 3.1), shimmerTime * 0.7, shimmerAmt);
    float n3 = staticNoise(uv * 1.5 * u_noiseScale + vec2(2.7, 8.3), shimmerTime * 0.5, shimmerAmt);
    float n4 = staticNoise(uv * 0.6 * u_noiseScale + vec2(9.1, 1.7), shimmerTime * 0.3, shimmerAmt);
    
    // Normalize to 0-1
    float t1 = n1 * 0.5 + 0.5;
    float t2 = n2 * 0.5 + 0.5;
    float t3 = n3 * 0.5 + 0.5;
    float t4 = n4 * 0.5 + 0.5;
    
    // Color palette - vibrant colors from reference
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 paleBlue = vec3(0.88, 0.94, 1.0);
    vec3 cyan = vec3(0.15, 0.85, 0.98);
    vec3 brightCyan = vec3(0.45, 0.95, 1.0);
    vec3 skyBlue = vec3(0.45, 0.75, 1.0);
    vec3 blue = vec3(0.08, 0.3, 0.92);
    vec3 deepBlue = vec3(0.02, 0.08, 0.5);
    vec3 orange = vec3(1.0, 0.45, 0.0);
    vec3 brightOrange = vec3(1.0, 0.6, 0.1);
    vec3 yellow = vec3(1.0, 0.9, 0.35);
    vec3 red = vec3(0.98, 0.08, 0.05);
    vec3 pink = vec3(0.98, 0.55, 0.7);
    vec3 magenta = vec3(0.9, 0.2, 0.65);
    vec3 black = vec3(0.0, 0.0, 0.0);
    
    // Hard edge transition threshold - controlled by edgeHardness
    // Higher hardness = smaller edgeSoft = sharper transitions
    float edgeSoft = 0.15 * (1.0 - u_edgeHardness * 0.9);
    
    // Base - deep blue/black with hard transitions
    vec3 col = black;
    
    // Deep blue regions with hard edges
    col = mix(col, deepBlue, hardStep(0.25, t1, edgeSoft));
    
    // Blue regions
    col = mix(col, blue, hardStep(0.35, t1, edgeSoft) * hardStep(0.3, t2, edgeSoft));
    
    // Sky blue with harder edges
    float skyMask = hardStep(0.45, t1, edgeSoft) * hardStep(0.4, t2, edgeSoft);
    col = mix(col, skyBlue, skyMask);
    
    // Cyan areas - vibrant
    float cyanMask = hardStep(0.55, t1, edgeSoft) * hardStep(0.5, t3, edgeSoft);
    col = mix(col, cyan, cyanMask);
    col = mix(col, brightCyan, hardStep(0.65, t2, edgeSoft) * cyanMask);
    
    // WHITE/BRIGHT REGIONS - key feature from reference
    float whiteMask = hardStep(0.7, t1, 0.06) * hardStep(0.65, t2, 0.06);
    whiteMask = max(whiteMask, hardStep(0.75, t4, 0.05) * hardStep(0.7, t3, 0.05));
    col = mix(col, paleBlue, whiteMask);
    col = mix(col, white, whiteMask * hardStep(0.8, t3, 0.04));
    
    // WARM COLOR ZONES - orange, red with hard edges
    float warmBase = hardStep(0.4, t3, edgeSoft) * (1.0 - hardStep(0.6, t1, edgeSoft));
    
    // Yellow fringe
    col = mix(col, yellow, warmBase * hardStep(0.35, t4, edgeSoft) * 0.6);
    
    // Orange core
    float orangeMask = warmBase * hardStep(0.45, t2, edgeSoft);
    col = mix(col, brightOrange, orangeMask);
    col = mix(col, orange, orangeMask * hardStep(0.55, t4, edgeSoft));
    
    // Red hot spots
    float redMask = warmBase * hardStep(0.6, t3, 0.05) * hardStep(0.55, t4, 0.05);
    col = mix(col, red, redMask);
    
    // Pink/magenta accents
    float pinkZone = hardStep(0.5, t2, edgeSoft) * hardStep(0.55, t3, edgeSoft);
    pinkZone *= (1.0 - warmBase * 0.7) * (1.0 - whiteMask);
    col = mix(col, pink, pinkZone * 0.5);
    col = mix(col, magenta, pinkZone * hardStep(0.65, t1, 0.06) * 0.6);
    
    // Dark/black regions for high contrast
    float darkMask = (1.0 - hardStep(0.2, t1, edgeSoft)) * (1.0 - hardStep(0.25, t2, edgeSoft));
    col = mix(col, black, darkMask);
    
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
    float barX = (localX - gapX) / (1.0 - 2.0 * gapX);
    float barY = (localY - gapY) / (1.0 - 2.0 * gapY);
    barX = clamp(barX, 0.0, 1.0);
    barY = clamp(barY, 0.0, 1.0);
    
    // Glass thickness - stronger cylindrical lens
    float centerDist = (barX - 0.5) * 2.0; // -1 to 1
    float glassProfile = 1.0 - centerDist * centerDist;
    
    // Refraction offset - static lens distortion
    float refractionStrength = u_refractionStrength;
    vec2 refractOffset = vec2(
      centerDist * refractionStrength * glassProfile,
      0.0
    );
    
    // Subtle vertical lens distortion
    float verticalRefract = sin(centerDist * 3.14159) * 0.01;
    refractOffset.y += verticalRefract;
    
    // Base UV for sampling background - static per bar
    vec2 sampleUv = uv + refractOffset;
    
    // Per-bar unique offset (static, not animated)
    float barSeed = colIndex * 0.73 + rowIndex * 1.37;
    float barOffsetX = sin(barSeed) * 0.012;
    float barOffsetY = cos(barSeed * 1.3) * 0.008;
    sampleUv.x += barOffsetX;
    sampleUv.y += barOffsetY;
    
    // Very subtle shimmer animation (discrete, not flowing)
    float shimmer = sin(barSeed * 2.1 + u_time * 0.3 * u_speed) * 0.003 * u_shimmerIntensity;
    sampleUv.x += shimmer;
    
    // STRONG CHROMATIC ABERRATION - key feature from reference
    float chromaBase = u_chromaStrength;
    // Chromatic aberration increases toward edges of each bar
    float chromaEdge = chromaBase * (1.0 + abs(centerDist) * 2.0);
    
    vec3 col;
    // Red channel - shifted right/positive
    vec2 redUv = sampleUv + vec2(chromaEdge, chromaEdge * 0.3);
    col.r = getBackgroundColor(redUv * vec2(aspect * 0.5, 1.0), u_time).r;
    
    // Green channel - center
    col.g = getBackgroundColor(sampleUv * vec2(aspect * 0.5, 1.0), u_time).g;
    
    // Blue channel - shifted left/negative
    vec2 blueUv = sampleUv - vec2(chromaEdge, chromaEdge * 0.2);
    col.b = getBackgroundColor(blueUv * vec2(aspect * 0.5, 1.0), u_time).b;
    
    // === ADVANCED GLASS EDGE EFFECTS ===
    float edgeIntensity = u_glassEdgeIntensity;
    float edgeW = u_edgeWidth;
    float warmth = u_edgeWarmth;
    float edgeRefract = u_edgeRefraction;
    float bevelDepth = u_edgeBevelDepth;
    float edgeChromaAmt = u_edgeChroma;
    
    // Edge colors - warm amber/orange on one side, cool blue on other
    vec3 warmOrange = vec3(1.0, 0.55, 0.15);
    vec3 amber = vec3(1.0, 0.7, 0.3);
    vec3 warmHighlight = mix(vec3(1.0, 1.0, 1.0), warmOrange, warmth);
    vec3 coolHighlight = vec3(0.85, 0.92, 1.0);
    vec3 whiteHighlight = vec3(1.0, 1.0, 1.0);
    
    // Edge distances
    float leftDist = barX;
    float rightDist = 1.0 - barX;
    float topDist = 1.0 - barY;
    float bottomDist = barY;
    
    // === PRIMARY EDGE LINES (warm amber on left/bottom edges) ===
    float edgeSoftness = 0.006;
    float innerBevelStart = edgeW;
    float innerBevelEnd = edgeW * 3.0;
    
    // LEFT EDGE - Primary warm orange line (like in reference)
    float leftPrimaryLine = smoothstep(0.0, edgeSoftness, leftDist);
    leftPrimaryLine *= (1.0 - smoothstep(edgeW * 0.6, edgeW, leftDist));
    
    // Left edge inner gradient (beveled glass depth)
    float leftBevelGrad = smoothstep(0.0, innerBevelEnd, leftDist);
    float leftInnerZone = smoothstep(edgeW * 0.5, innerBevelStart, leftDist) * (1.0 - smoothstep(innerBevelStart, innerBevelEnd, leftDist));
    
    // RIGHT EDGE - Cool blue/white highlight
    float rightPrimaryLine = smoothstep(0.0, edgeSoftness, rightDist);
    rightPrimaryLine *= (1.0 - smoothstep(edgeW * 0.5, edgeW * 0.8, rightDist));
    
    // Right edge bevel
    float rightInnerZone = smoothstep(edgeW * 0.4, edgeW * 0.8, rightDist) * (1.0 - smoothstep(edgeW * 0.8, innerBevelEnd * 0.7, rightDist));
    
    // TOP EDGE
    float topLine = smoothstep(0.0, edgeSoftness * 1.5, topDist);
    topLine *= (1.0 - smoothstep(edgeW * 0.8, edgeW * 1.2, topDist));
    
    // BOTTOM EDGE - Warm amber
    float bottomLine = smoothstep(0.0, edgeSoftness * 1.5, bottomDist);
    bottomLine *= (1.0 - smoothstep(edgeW * 0.8, edgeW * 1.2, bottomDist));
    
    // === CHROMATIC EDGE REFRACTION ===
    // Create color splitting at edges like real glass refraction
    float leftEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd * 1.5, leftDist);
    float rightEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd * 1.2, rightDist);
    
    // Shift red channel outward at left edge, blue at right edge
    float edgeChromaShift = edgeChromaAmt * 0.15;
    vec2 leftChromaOffset = vec2(-edgeChromaShift * leftEdgeZone, 0.0);
    vec2 rightChromaOffset = vec2(edgeChromaShift * rightEdgeZone, 0.0);
    
    // Sample with chromatic offset at edges
    vec3 leftEdgeColor = vec3(0.0);
    leftEdgeColor.r = getBackgroundColor((sampleUv + leftChromaOffset + vec2(edgeRefract * 0.02 * leftEdgeZone, 0.0)) * vec2(aspect * 0.5, 1.0), u_time).r;
    leftEdgeColor.g = getBackgroundColor((sampleUv + leftChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time).g;
    leftEdgeColor.b = getBackgroundColor((sampleUv - leftChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time).b;
    
    vec3 rightEdgeColor = vec3(0.0);
    rightEdgeColor.r = getBackgroundColor((sampleUv + rightChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time).r;
    rightEdgeColor.g = getBackgroundColor((sampleUv + rightChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time).g;
    rightEdgeColor.b = getBackgroundColor((sampleUv + rightChromaOffset - vec2(edgeRefract * 0.015 * rightEdgeZone, 0.0)) * vec2(aspect * 0.5, 1.0), u_time).b;
    
    // Blend edge refracted colors
    col = mix(col, leftEdgeColor, leftEdgeZone * edgeRefract * 0.5);
    col = mix(col, rightEdgeColor, rightEdgeZone * edgeRefract * 0.4);
    
    // === APPLY EDGE HIGHLIGHTS ===
    // Left edge - warm orange/amber primary line
    col = mix(col, warmHighlight, leftPrimaryLine * 0.85 * edgeIntensity);
    col += amber * leftInnerZone * 0.25 * edgeIntensity * warmth;
    
    // Right edge - cool blue/white
    col = mix(col, coolHighlight, rightPrimaryLine * 0.5 * edgeIntensity);
    col += coolHighlight * rightInnerZone * 0.15 * edgeIntensity;
    
    // Top edge - subtle cool
    col += mix(coolHighlight, whiteHighlight, 0.5) * topLine * 0.35 * edgeIntensity;
    
    // Bottom edge - warm amber
    col += mix(warmHighlight, amber, 0.4) * bottomLine * 0.4 * edgeIntensity;
    
    // === BEVEL DEPTH SHADING ===
    // Darken inner bevel zone to create depth illusion
    float leftBevelShadow = smoothstep(edgeW, edgeW * 2.5, leftDist) * (1.0 - smoothstep(edgeW * 2.5, edgeW * 5.0, leftDist));
    float rightBevelShadow = smoothstep(edgeW * 0.8, edgeW * 2.0, rightDist) * (1.0 - smoothstep(edgeW * 2.0, edgeW * 4.0, rightDist));
    
    col *= mix(1.0, 0.88, leftBevelShadow * bevelDepth * 0.5);
    col *= mix(1.0, 0.92, rightBevelShadow * bevelDepth * 0.35);
    
    // === CORNER ACCENTS ===
    // Warm corners where edges meet
    float cornerBL = pow((1.0 - smoothstep(0.0, 0.12, leftDist)) * (1.0 - smoothstep(0.0, 0.12, bottomDist)), 0.7);
    float cornerTL = pow((1.0 - smoothstep(0.0, 0.12, leftDist)) * (1.0 - smoothstep(0.0, 0.12, topDist)), 0.7);
    float cornerBR = pow((1.0 - smoothstep(0.0, 0.1, rightDist)) * (1.0 - smoothstep(0.0, 0.1, bottomDist)), 0.7);
    float cornerTR = pow((1.0 - smoothstep(0.0, 0.1, rightDist)) * (1.0 - smoothstep(0.0, 0.1, topDist)), 0.7);
    
    // Warm corners (especially bottom-left and top-left like reference)
    col += warmOrange * cornerBL * 0.35 * edgeIntensity * warmth;
    col += amber * cornerTL * 0.25 * edgeIntensity * warmth;
    col += coolHighlight * cornerBR * 0.15 * edgeIntensity;
    col += coolHighlight * cornerTR * 0.12 * edgeIntensity;
    
    // === GLASS CENTER SPECULAR ===
    float specular = pow(glassProfile, 2.5) * 0.06 * edgeIntensity;
    col += whiteHighlight * specular;
    
    // === CAUSTIC SHIMMER ===
    float caustic = sin(barX * 15.0 + barY * 5.0 + u_time * 0.4 * u_speed) * 0.5 + 0.5;
    caustic = pow(caustic, 2.5) * glassProfile * 0.025 * u_causticIntensity;
    col += whiteHighlight * caustic;
    
    // Gap between bars - very dark
    vec3 gapColor = vec3(0.005, 0.008, 0.02);
    col = mix(gapColor, col, barMask);
    
    // Subtle vignette
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
  onSave: () => void;
}

function ControlPanel({ params, onChange, onReset, onSave }: ControlPanelProps) {
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
    { key: "edgeWidth", label: "Edge Width", min: 0.01, max: 0.1, step: 0.005 },
    { key: "edgeWarmth", label: "Edge Warmth", min: 0, max: 1, step: 0.05 },
    { key: "edgeRefraction", label: "Edge Refraction", min: 0, max: 1, step: 0.05 },
    { key: "edgeBevelDepth", label: "Edge Bevel Depth", min: 0, max: 1, step: 0.05 },
    { key: "edgeChroma", label: "Edge Chroma Split", min: 0, max: 1, step: 0.05 },
    { key: "causticIntensity", label: "Caustic Intensity", min: 0, max: 3, step: 0.1 },
    { key: "vignetteStrength", label: "Vignette", min: 0, max: 0.5, step: 0.01 },
    { key: "edgeHardness", label: "Color Edge Hardness", min: 0, max: 1, step: 0.05 },
    { key: "shimmerIntensity", label: "Shimmer Intensity", min: 0, max: 2, step: 0.1 },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        width: 320,
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
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Shader Controls
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button
              onClick={onSave}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 8,
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
              }}
            >
              Save as Default
            </button>
            <button
              onClick={onReset}
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 8,
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
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
              Reset
            </button>
          </div>
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

const STORAGE_KEY = "glassBarShaderParams";

function loadSavedParams(): ShaderParams {
  if (typeof window === "undefined") return defaultParams;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultParams, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return defaultParams;
}

export default function GlassBarShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  
  const [params, setParams] = useState<ShaderParams>(defaultParams);

  useEffect(() => {
    setParams(loadSavedParams());
  }, []);

  const handleReset = useCallback(() => {
    const saved = loadSavedParams();
    setParams(saved);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  }, [params]);

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
      edgeHardness: gl.getUniformLocation(program, "u_edgeHardness"),
      shimmerIntensity: gl.getUniformLocation(program, "u_shimmerIntensity"),
      edgeWidth: gl.getUniformLocation(program, "u_edgeWidth"),
      edgeWarmth: gl.getUniformLocation(program, "u_edgeWarmth"),
      edgeRefraction: gl.getUniformLocation(program, "u_edgeRefraction"),
      edgeBevelDepth: gl.getUniformLocation(program, "u_edgeBevelDepth"),
      edgeChroma: gl.getUniformLocation(program, "u_edgeChroma"),
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
    gl.uniform1f(locs.edgeHardness, params.edgeHardness);
    gl.uniform1f(locs.shimmerIntensity, params.shimmerIntensity);
    gl.uniform1f(locs.edgeWidth, params.edgeWidth);
    gl.uniform1f(locs.edgeWarmth, params.edgeWarmth);
    gl.uniform1f(locs.edgeRefraction, params.edgeRefraction);
    gl.uniform1f(locs.edgeBevelDepth, params.edgeBevelDepth);
    gl.uniform1f(locs.edgeChroma, params.edgeChroma);
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
      <ControlPanel params={params} onChange={setParams} onReset={handleReset} onSave={handleSave} />
    </>
  );
}
