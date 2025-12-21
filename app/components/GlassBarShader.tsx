"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Palette,
  Grid3X3,
  Gem,
  Sparkles,
  Radio,
  PanelTop,
  ChevronDown,
} from "lucide-react";
import { SketchPicker, ColorResult } from "react-color";

interface ShaderParams {
  cols: number;
  rows: number;
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
  // Noise texture controls
  noiseTextureDensity: number;
  noiseTextureIntensity: number;
  noiseTextureSaturation: number;
  noiseTextureSpeed: number;
  // RGB Color controls (6 colors for precise matching)
  // Color 1: Cyan/Light Blue
  color1R: number;
  color1G: number;
  color1B: number;
  // Color 2: Deep Blue
  color2R: number;
  color2G: number;
  color2B: number;
  // Color 3: Red
  color3R: number;
  color3G: number;
  color3B: number;
  // Color 4: Yellow/Gold
  color4R: number;
  color4G: number;
  color4B: number;
  // Color 5: Pink/Magenta
  color5R: number;
  color5G: number;
  color5B: number;
  // Color 6: Highlight tint
  color6R: number;
  color6G: number;
  color6B: number;
  // Color 7: Additional color
  color7R: number;
  color7G: number;
  color7B: number;
  // Color 8: Additional color
  color8R: number;
  color8G: number;
  color8B: number;
  // Color balance controls
  colorContrast: number;
  colorMix: number;
  // Per-pane variation controls
  paneBendVariance: number;
  paneColorShift: number;
  paneDistortVariance: number;
  // Border shape type: 0=rectangle, 1=triangle, 2=wave, 3=zigzag, 4=hexagon
  borderShape: number;
}

const defaultParams: ShaderParams = {
  // Grid - 18 columns, 3 rows
  cols: 18,
  rows: 3,
  // Glass refraction effects - dramatic bending like reference
  refractionStrength: 0.35,
  chromaStrength: 0.03,
  speed: 0.3,
  noiseScale: 0.4,
  saturation: 1.5,
  brightness: 1.05,
  glassEdgeIntensity: 0.7,
  causticIntensity: 1.5,
  vignetteStrength: 0.02,
  edgeHardness: 0.85,
  shimmerIntensity: 0.3,
  // Edge effects - subtle warm beveled borders like reference
  edgeWidth: 0.025,
  edgeWarmth: 1.0,
  edgeRefraction: 0.5,
  edgeBevelDepth: 0.5,
  edgeChroma: 0.3,
  // Noise texture - subtle film grain
  noiseTextureDensity: 800.0,
  noiseTextureIntensity: 0.08,
  noiseTextureSaturation: 0.2,
  noiseTextureSpeed: 0.5,
  // RGB Color controls - matched to reference image
  // Color 1: Bright Cyan (#5FC8F0)
  color1R: 0.37,
  color1G: 0.78,
  color1B: 0.94,
  // Color 2: Deep Royal Blue (#1830A0)
  color2R: 0.09,
  color2G: 0.19,
  color2B: 0.63,
  // Color 3: Vermillion Red (#E01808)
  color3R: 0.88,
  color3G: 0.09,
  color3B: 0.03,
  // Color 4: Golden Yellow/Orange (#F8A020)
  color4R: 0.97,
  color4G: 0.63,
  color4B: 0.13,
  // Color 5: Pink/Magenta (#E060B0)
  color5R: 0.88,
  color5G: 0.38,
  color5B: 0.69,
  // Color 6: Pure White highlight (#FFFFFF)
  color6R: 1.0,
  color6G: 1.0,
  color6B: 1.0,
  // Color 7: Teal/Aqua (#18E0D8)
  color7R: 0.09,
  color7G: 0.88,
  color7B: 0.85,
  // Color 8: Purple-Blue (#3028B0)
  color8R: 0.19,
  color8G: 0.16,
  color8B: 0.69,
  // Color balance - higher contrast for defined regions
  colorContrast: 1.65,
  colorMix: 0.45,
  // Per-pane variation - dramatic like reference
  paneBendVariance: 0.85,
  paneColorShift: 0.95,
  paneDistortVariance: 0.8,
  // Border shape
  borderShape: 0,
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
  uniform float u_noiseTextureDensity;
  uniform float u_noiseTextureIntensity;
  uniform float u_noiseTextureSaturation;
  uniform float u_noiseTextureSpeed;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform vec3 u_color4;
  uniform vec3 u_color5;
  uniform vec3 u_color6;
  uniform vec3 u_color7;
  uniform vec3 u_color8;
  uniform float u_colorContrast;
  uniform float u_colorMix;
  uniform float u_paneBendVariance;
  uniform float u_paneColorShift;
  uniform float u_paneDistortVariance;
  uniform float u_borderShape;
  
  // Internal bend/wave controls - these create the complex internal distortions
  const float INTERNAL_WAVES = 1.5; // Few waves for smoother, longer curves
  const float WAVE_AMPLITUDE = 1.2; // Strong bending for dramatic curves
  const float WAVE_SHARPNESS = 0.6; // Smooth wave edges
  
  // Hash function for noise texture (high frequency grain)
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  
  // 2D hash for colored noise
  vec3 hash3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
  }
  
  // Film grain noise texture
  vec3 getNoiseTexture(vec2 uv, float time) {
    // Scale UV by density for grain size
    vec2 noiseUv = uv * u_noiseTextureDensity;
    
    // Animate the noise
    float animOffset = floor(time * u_noiseTextureSpeed);
    noiseUv += animOffset * 17.31; // offset by animation frame
    
    // Get base noise value (grayscale)
    float grain = hash(noiseUv);
    
    // Add some variation at different scales for more natural look
    grain += hash(noiseUv * 0.5 + 127.1) * 0.5;
    grain += hash(noiseUv * 2.0 + 53.7) * 0.25;
    grain = grain / 1.75; // normalize
    
    // Center around 0.5 and apply intensity
    grain = (grain - 0.5) * u_noiseTextureIntensity;
    
    // For colored noise, get RGB hash
    vec3 coloredGrain = hash3(noiseUv) - 0.5;
    coloredGrain *= u_noiseTextureIntensity;
    
    // Mix between grayscale and colored based on saturation
    vec3 noiseColor = mix(vec3(grain), coloredGrain, u_noiseTextureSaturation);
    
    return noiseColor;
  }
  
  // HSL to RGB conversion
  vec3 hsl2rgb(float h, float s, float l) {
    h = mod(h, 360.0) / 360.0;
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
  }
  
  // Per-pane hash for unique variation
  float paneHash(float col, float row) {
    return fract(sin(col * 127.1 + row * 311.7) * 43758.5453);
  }
  
  vec2 paneHash2(float col, float row) {
    float h1 = fract(sin(col * 127.1 + row * 311.7) * 43758.5453);
    float h2 = fract(sin(col * 269.5 + row * 183.3) * 43758.5453);
    return vec2(h1, h2);
  }

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
  
  // Background color - organic flowing regions like the reference image
  // Each pane samples a different part of a continuous flowing gradient
  vec3 getBackgroundColor(vec2 uv, float time, float paneColorShift) {
    // Slow shimmer animation
    float shimmerTime = time * u_speed;
    float shimmerAmt = u_shimmerIntensity;
    
    // LARGE scale noise for sweeping color regions that span multiple panes
    // This creates the flowing, organic look from the reference
    float scale = u_noiseScale;
    
    // Apply significant per-pane offset to sample different regions
    // This is the key to making each pane look different
    vec2 paneOffset = vec2(paneColorShift * 0.8, paneColorShift * 0.4);
    vec2 samplePos = uv + paneOffset;
    
    // Large-scale flowing noise layers
    float n1 = staticNoise(samplePos * 0.5 * scale, shimmerTime, shimmerAmt);
    float n2 = staticNoise(samplePos * 0.7 * scale + vec2(3.7, 2.1), shimmerTime * 0.6, shimmerAmt);
    float n3 = staticNoise(samplePos * 0.4 * scale + vec2(1.5, 5.3), shimmerTime * 0.4, shimmerAmt);
    float n4 = staticNoise(samplePos * 0.6 * scale + vec2(7.2, 0.8), shimmerTime * 0.5, shimmerAmt);
    float n5 = staticNoise(samplePos * 0.8 * scale + vec2(2.1, 4.6), shimmerTime * 0.3, shimmerAmt);
    
    // Normalize to 0-1
    float t1 = n1 * 0.5 + 0.5;
    float t2 = n2 * 0.5 + 0.5;
    float t3 = n3 * 0.5 + 0.5;
    float t4 = n4 * 0.5 + 0.5;
    float t5 = n5 * 0.5 + 0.5;
    
    // Apply contrast for more defined regions
    float contrast = u_colorContrast;
    t1 = clamp((t1 - 0.5) * contrast + 0.5, 0.0, 1.0);
    t2 = clamp((t2 - 0.5) * contrast + 0.5, 0.0, 1.0);
    t3 = clamp((t3 - 0.5) * contrast + 0.5, 0.0, 1.0);
    t4 = clamp((t4 - 0.5) * contrast + 0.5, 0.0, 1.0);
    t5 = clamp((t5 - 0.5) * contrast + 0.5, 0.0, 1.0);
    
    // Create a global position value for color distribution across the screen
    // Combined with paneOffset, this creates the left-to-right color flow
    float globalX = (samplePos.x + 0.5) * 0.5; // 0 to 1 across screen
    float globalY = samplePos.y;
    
    // Define colors from uniforms
    vec3 cyan = u_color1;
    vec3 deepBlue = u_color2;
    vec3 red = u_color3;
    vec3 yellow = u_color4; // Now yellow/gold
    vec3 pink = u_color5;
    vec3 highlight = u_color6;
    vec3 teal = u_color7;
    vec3 purple = u_color8;
    vec3 white = vec3(1.0);
    vec3 black = vec3(0.0);
    
    // Orange derived from red and yellow
    vec3 orange = mix(red, yellow, 0.5);
    
    // Edge softness for color transitions
    float edgeSoft = 0.12 * (1.0 - u_edgeHardness * 0.85);
    
    // === CREATE FLOWING COLOR REGIONS ===
    // The reference shows large organic color pools that flow across the image
    
    // Start with black base
    vec3 col = black;
    
    // === CYAN REGIONS (prominent but balanced) ===
    float cyanZone = hardStep(0.35, t1, edgeSoft) * hardStep(0.3, t2, edgeSoft);
    cyanZone = max(cyanZone, hardStep(0.4, t2, edgeSoft) * hardStep(0.35, t3, edgeSoft));
    cyanZone *= (1.0 - hardStep(0.65, t4, edgeSoft * 0.5)); // Not where it's warm
    col = mix(col, cyan * 0.5, hardStep(0.2, t1, edgeSoft) * 0.3);
    col = mix(col, cyan * 0.8, cyanZone * 0.7);
    col = mix(col, cyan, cyanZone * hardStep(0.45, t1, edgeSoft) * 0.8);
    col = mix(col, mix(cyan, white, 0.25), cyanZone * hardStep(0.6, t3, 0.08) * 0.6);
    
    // === DEEP BLUE REGIONS (more prominent) ===
    float blueZone = hardStep(0.35, t3, edgeSoft) * hardStep(0.3, t2, edgeSoft);
    blueZone = max(blueZone, hardStep(0.38, t5, edgeSoft) * hardStep(0.32, t1, edgeSoft));
    blueZone *= (1.0 - cyanZone * 0.35);
    blueZone *= (1.0 - hardStep(0.65, t4, edgeSoft * 0.5)); // Not where it's very warm
    col = mix(col, deepBlue * 0.4, hardStep(0.18, t3, edgeSoft) * 0.5);
    col = mix(col, deepBlue * 0.75, blueZone * 0.8);
    col = mix(col, deepBlue, blueZone * hardStep(0.45, t3, edgeSoft));
    
    // === RED/VERMILLION REGIONS (more prominent) ===
    float redZone = hardStep(0.42, t4, edgeSoft) * (1.0 - hardStep(0.55, t1, edgeSoft));
    redZone = max(redZone, hardStep(0.45, t5, edgeSoft) * hardStep(0.4, t4, edgeSoft));
    redZone *= (1.0 - cyanZone * 0.5) * (1.0 - blueZone * 0.4);
    col = mix(col, red * 0.7, redZone * 0.6);
    col = mix(col, mix(red, orange, 0.35), redZone * hardStep(0.5, t4, edgeSoft) * 0.9);
    
    // === ORANGE REGIONS (more visible) ===
    float orangeZone = hardStep(0.5, t4, edgeSoft) * hardStep(0.48, t5, edgeSoft);
    orangeZone *= (1.0 - cyanZone * 0.6) * (1.0 - blueZone * 0.5);
    orangeZone *= hardStep(0.35, t2, edgeSoft);
    col = mix(col, orange, orangeZone * 0.7);
    col = mix(col, mix(orange, yellow, 0.4), orangeZone * hardStep(0.55, t2, edgeSoft) * 0.85);
    
    // === YELLOW/GOLD REGIONS (bright warm highlights, subtle) ===
    float yellowZone = hardStep(0.6, t4, edgeSoft) * hardStep(0.55, t5, edgeSoft);
    yellowZone *= hardStep(0.5, t3, edgeSoft);
    yellowZone *= (1.0 - cyanZone * 0.6);
    col = mix(col, yellow, yellowZone * 0.6);
    col = mix(col, mix(yellow, white, 0.2), yellowZone * hardStep(0.65, t2, 0.06));
    
    // === PINK/MAGENTA ACCENTS (scattered throughout, more visible) ===
    float pinkZone = hardStep(0.45, t2, edgeSoft) * hardStep(0.48, t5, edgeSoft);
    pinkZone = max(pinkZone, hardStep(0.47, t4, edgeSoft) * hardStep(0.52, t1, edgeSoft) * (1.0 - blueZone * 0.35));
    pinkZone = max(pinkZone, hardStep(0.50, t3, edgeSoft) * hardStep(0.48, t2, edgeSoft) * (1.0 - orangeZone * 0.4));
    pinkZone *= (1.0 - orangeZone * 0.45) * (1.0 - cyanZone * 0.35);
    pinkZone *= (1.0 - hardStep(0.72, t1, edgeSoft * 0.5));
    col = mix(col, pink, pinkZone * 0.65);
    col = mix(col, mix(pink, white, 0.3), pinkZone * hardStep(0.58, t3, 0.08) * 0.55);
    
    // === TEAL REGIONS (between cyan and blue) ===
    float tealZone = hardStep(0.38, t1, edgeSoft) * hardStep(0.35, t3, edgeSoft);
    tealZone *= (1.0 - blueZone * 0.4) * (1.0 - cyanZone * 0.3);
    tealZone *= hardStep(0.3, t5, edgeSoft);
    col = mix(col, teal * 0.8, tealZone * 0.5);
    col = mix(col, teal, tealZone * hardStep(0.45, t2, edgeSoft));
    col = mix(col, mix(teal, cyan, 0.5), tealZone * hardStep(0.5, t4, 0.08) * 0.5);
    
    // === PURPLE/VIOLET REGIONS (now more blue-ish, subtle accent) ===
    float purpleZone = hardStep(0.55, t3, edgeSoft) * hardStep(0.52, t1, edgeSoft);
    purpleZone *= (1.0 - redZone * 0.5) * (1.0 - pinkZone * 0.6);
    purpleZone *= (1.0 - cyanZone * 0.5) * (1.0 - blueZone * 0.4);
    purpleZone *= (1.0 - hardStep(0.65, t2, edgeSoft * 0.5));
    // Mix purple more toward blue
    vec3 blueishPurple = mix(purple, deepBlue, 0.45);
    col = mix(col, blueishPurple * 0.7, purpleZone * 0.3);
    col = mix(col, blueishPurple, purpleZone * hardStep(0.58, t5, edgeSoft) * 0.6);
    col = mix(col, mix(blueishPurple, pink, 0.2), purpleZone * hardStep(0.62, t4, 0.08) * 0.25);
    
    // === WHITE/HIGHLIGHT REGIONS (balanced) ===
    float whiteMask = hardStep(0.72, t1, 0.05) * hardStep(0.68, t2, 0.05);
    whiteMask = max(whiteMask, hardStep(0.75, t4, 0.04) * hardStep(0.7, t5, 0.05));
    col = mix(col, highlight, whiteMask * 0.75);
    col = mix(col, white, whiteMask * hardStep(0.8, t3, 0.03));
    
    // === BLACK/SHADOW REGIONS (more prominent like reference) ===
    float darkMask = (1.0 - hardStep(0.28, t1, edgeSoft)) * (1.0 - hardStep(0.32, t2, edgeSoft));
    darkMask *= (1.0 - hardStep(0.38, t3, edgeSoft));
    // Additional dark spots
    float darkMask2 = (1.0 - hardStep(0.25, t4, edgeSoft)) * (1.0 - hardStep(0.30, t5, edgeSoft));
    darkMask2 *= (1.0 - cyanZone * 0.5) * (1.0 - blueZone * 0.4);
    col = mix(col, black, darkMask * 0.92);
    col = mix(col, black, darkMask2 * 0.75);
    
    // === COLOR BLEEDING/BLENDING for organic flow ===
    float bleedMask = hardStep(0.35, t5, 0.18) * (1.0 - hardStep(0.65, t5, 0.18));
    vec3 blendColor = mix(cyan, orange, smoothstep(0.25, 0.75, t3));
    col = mix(col, blendColor, bleedMask * 0.25 * u_colorMix);
    
    // Additional cyan-to-blue transition blending
    float transitionMask = hardStep(0.38, t1, 0.22) * (1.0 - hardStep(0.62, t1, 0.22));
    col = mix(col, mix(deepBlue, cyan, t2), transitionMask * 0.20 * u_colorMix);
    
    // Blue-to-orange warm/cool transition for more organic flow
    float warmCoolMask = hardStep(0.42, t4, 0.18) * (1.0 - hardStep(0.58, t2, 0.18));
    vec3 warmCoolBlend = mix(deepBlue, mix(orange, red, 0.4), smoothstep(0.35, 0.65, t5));
    col = mix(col, warmCoolBlend, warmCoolMask * 0.15 * u_colorMix);
    
    // Boost saturation
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, u_saturation);
    
    // Apply brightness
    col *= u_brightness;
    
    return col;
  }
  
  // Overload for backward compatibility
  vec3 getBackgroundColor(vec2 uv, float time) {
    return getBackgroundColor(uv, time, 0.0);
  }
  
  // === TESSELLATION HELPER FUNCTIONS ===
  
  // Hexagon grid tessellation
  // Returns: vec4(cellX, cellY, localX, localY) where local is 0-1 within hex
  vec4 hexGrid(vec2 uv, float cols, float rows) {
    // Hex dimensions
    float hexWidth = 1.0 / cols;
    float hexHeight = 1.0 / rows;
    float hexRatio = hexWidth / hexHeight;
    
    // Adjust for hex packing (hexes are offset every other row)
    vec2 hexSize = vec2(hexWidth, hexHeight * 0.866);
    
    // First, find which row we're in
    float row = floor(uv.y / hexSize.y);
    float rowOffset = mod(row, 2.0) * 0.5 * hexSize.x;
    
    // Adjust x for row offset
    float adjustedX = uv.x - rowOffset;
    float col = floor(adjustedX / hexSize.x);
    
    // Local position within cell
    float localX = fract(adjustedX / hexSize.x);
    float localY = fract(uv.y / hexSize.y);
    
    // Check if we need to adjust for hex shape (top/bottom corners)
    float hexSlope = 0.5; // How much the hex edges slope
    float cornerZone = 0.25;
    
    // Check if in corner region and should belong to adjacent hex
    if (localY < cornerZone) {
      float threshold = localY / cornerZone;
      if (localX < 0.5 - threshold * 0.5) {
        col -= 1.0;
        localX = fract((adjustedX - hexSize.x * col) / hexSize.x);
      } else if (localX > 0.5 + threshold * 0.5) {
        col += 1.0;
        localX = fract((adjustedX - hexSize.x * col) / hexSize.x);
      }
    }
    
    return vec4(col, row, localX, localY);
  }
  
  // Compute distance to hex edge (returns 0 at edge, 1 at center)
  float hexEdgeDist(vec2 local) {
    // Hex center is at (0.5, 0.5)
    vec2 centered = local - 0.5;
    
    // Six edges of hexagon
    float dist = 1.0;
    
    // Top and bottom edges
    dist = min(dist, 1.0 - abs(centered.y) * 2.5);
    
    // Four diagonal edges
    float diag1 = abs(centered.x * 0.866 + centered.y * 0.5);
    float diag2 = abs(centered.x * 0.866 - centered.y * 0.5);
    dist = min(dist, 1.0 - diag1 * 2.0);
    dist = min(dist, 1.0 - diag2 * 2.0);
    
    return clamp(dist, 0.0, 1.0);
  }
  
  // Triangle grid tessellation
  // Returns: vec4(cellX, cellY, localX, localY)
  vec4 triGrid(vec2 uv, float cols, float rows) {
    float cellWidth = 1.0 / cols;
    float cellHeight = 1.0 / rows;
    
    float row = floor(uv.y / cellHeight);
    float col = floor(uv.x / cellWidth);
    
    float localX = fract(uv.x / cellWidth);
    float localY = fract(uv.y / cellHeight);
    
    // Determine if upward or downward pointing triangle
    float isUpward = mod(col + row, 2.0);
    
    // Check which triangle we're in
    float diagLine = isUpward > 0.5 ? localX : (1.0 - localX);
    float inUpper = step(diagLine, localY);
    
    // Adjust cell ID if in the "other" triangle
    if (inUpper > 0.5) {
      // We're in the upper triangle, which belongs to different cell
      col += isUpward > 0.5 ? 0.5 : -0.5;
    }
    
    return vec4(col, row, localX, localY);
  }
  
  // Compute distance to triangle edge
  float triEdgeDist(vec2 local, float cellCol, float cellRow) {
    float isUpward = mod(cellCol + cellRow, 2.0);
    
    vec2 centered = local - 0.5;
    float dist = 1.0;
    
    // Bottom edge
    dist = min(dist, local.y * 2.0);
    
    // Two diagonal edges
    if (isUpward > 0.5) {
      // Upward triangle: / and \\ edges meeting at top
      dist = min(dist, (1.0 - local.y - abs(centered.x)) * 1.5);
    } else {
      // Downward triangle: \\ and / edges meeting at bottom  
      dist = min(dist, (local.y - abs(centered.x)) * 1.5);
    }
    
    return clamp(dist, 0.0, 1.0);
  }
  
  
  // === INTERNAL WAVE/BEND FUNCTION ===
  // Creates smooth flowing vertical curves like real fluted glass
  // Colors should flow vertically with gentle horizontal displacement
  vec2 getInternalWaveDistortion(float barX, float barY, float paneRand1, float paneRand2, float paneRand3) {
    vec2 distort = vec2(0.0);
    
    // Phase offset per pane for variety
    float phaseOffset = paneRand2 * 6.28318;
    
    // Cylindrical lens effect - strongest in center of bar
    // This is the key - creates smooth horizontal displacement
    float centerDist = barX - 0.5; // -0.5 to 0.5
    float lensStrength = 1.0 - abs(centerDist) * 2.0;
    lensStrength = max(0.0, lensStrength);
    lensStrength = pow(lensStrength, 0.7); // Softer profile
    
    // === PRIMARY CYLINDRICAL LENS (horizontal displacement) ===
    // This is the main effect - shifts horizontally based on position in bar
    distort.x = centerDist * WAVE_AMPLITUDE * 0.6;
    
    // === GENTLE VERTICAL WAVE MODULATION ===
    // Subtle variation along the vertical axis
    float vMod = sin(barY * 1.5 * 3.14159 + phaseOffset) * 0.3;
    vMod += sin(barY * 0.8 * 3.14159 + paneRand1 * 5.0) * 0.2;
    distort.x *= (1.0 + vMod);
    
    // === PER-PANE BEND DIRECTION ===
    // Some bars bend slightly left, some right
    float bendBias = (paneRand1 - 0.5) * 0.15 * WAVE_AMPLITUDE;
    distort.x += bendBias * lensStrength;
    
    // === SUBTLE VERTICAL STRETCH ===
    float vStretch = sin(barY * 2.0 * 3.14159 + paneRand2 * 4.0);
    distort.y = vStretch * WAVE_AMPLITUDE * 0.08 * lensStrength;
    
    return distort;
  }
  
  // === GLOSSY/WET HIGHLIGHT FUNCTION ===
  // Creates specular highlights that simulate wet glass
  float getWetHighlight(float barX, float barY, float paneRand1, float paneRand2) {
    float highlight = 0.0;
    
    // Only some panes have prominent wet highlights (based on random)
    float hasHighlight = step(0.4, paneRand1); // ~60% of panes have highlights
    
    // Single main specular spot per pane at random position
    float spotX1 = 0.3 + paneRand1 * 0.4;
    float spotY1 = 0.15 + paneRand2 * 0.7;
    
    // Calculate distance to highlight spot (elongated vertically)
    float d1 = length(vec2((barX - spotX1) * 1.5, (barY - spotY1) * 0.8));
    
    // Soft specular highlight
    highlight += smoothstep(0.2, 0.0, d1) * 0.5 * hasHighlight;
    
    // Subtle vertical streak (thinner, less prominent)
    float streakX = abs(barX - (0.3 + paneRand2 * 0.4));
    float streak = smoothstep(0.04, 0.0, streakX) * smoothstep(0.0, 0.2, barY) * smoothstep(1.0, 0.8, barY);
    highlight += streak * 0.15 * hasHighlight;
    
    // Very subtle edge gleam
    float edgeGleam = smoothstep(0.05, 0.0, barX) + smoothstep(0.95, 1.0, barX);
    edgeGleam *= 0.1 * (0.5 + 0.5 * sin(barY * 6.0 + paneRand1 * 8.0));
    highlight += edgeGleam;
    
    return highlight;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    
    // Bar configuration
    float cols = u_cols;
    float rows = u_rows;
    float shape = u_borderShape;
    
    // Shape selection flags: 0=Rectangle, 1=Triangle, 2=Hexagon
    float isRect = 1.0 - step(0.5, shape);
    float isTri = step(0.5, shape) * (1.0 - step(1.5, shape));
    float isHex = step(1.5, shape);
    
    // Calculate cell coordinates based on shape type
    float colIndex, rowIndex, localX, localY;
    float shapeEdgeDist = 1.0; // Distance to nearest edge (0 at edge, 1 at center)
    
    // === RECTANGLE (default) ===
    float rectColIndex = floor(uv.x * cols);
    float rectRowIndex = floor(uv.y * rows);
    float rectLocalX = fract(uv.x * cols);
    float rectLocalY = fract(uv.y * rows);
    float rectEdgeDist = min(min(rectLocalX, 1.0 - rectLocalX), min(rectLocalY, 1.0 - rectLocalY)) * 2.0;
    
    // === TRIANGLE ===
    float triCellWidth = 1.0 / cols;
    float triCellHeight = 1.0 / rows;
    float triRowIndex = floor(uv.y / triCellHeight);
    float triColBase = floor(uv.x / triCellWidth);
    float triLocalXBase = fract(uv.x / triCellWidth);
    float triLocalYBase = fract(uv.y / triCellHeight);
    // Determine if upward or downward pointing based on position
    float triIsOdd = mod(triColBase + triRowIndex, 2.0);
    // Check which triangle within the cell
    float triDiag = triIsOdd > 0.5 ? triLocalXBase : (1.0 - triLocalXBase);
    float triInUpper = step(triDiag, triLocalYBase);
    float triColIndex = triColBase + triInUpper * (triIsOdd > 0.5 ? 0.5 : -0.5);
    // Calculate local position within triangle (centered)
    float triLocalX = triLocalXBase;
    float triLocalY = triLocalYBase;
    
    // Determine if this is an upward or downward pointing triangle
    // For upward triangles: flat bottom, point at top
    // For downward triangles: flat top, point at bottom
    float triIsUpward = mod(triColBase + triRowIndex + triInUpper, 2.0);
    
    // Distance to triangle edges - calculated properly for edge effects
    // The diagonal edges need proper signed distance for directional beveling
    float sqrt2inv = 0.7071; // 1/sqrt(2) for 45-degree diagonals
    
    // For upward triangles: bottom edge is horizontal, two diagonals go up
    // For downward triangles: top edge is horizontal, two diagonals go down
    float triDistHorizontal, triDistDiagLeft, triDistDiagRight;
    
    if (triIsUpward > 0.5) {
      // Upward pointing triangle: flat bottom at y=0, apex at top
      triDistHorizontal = triLocalYBase; // distance to bottom edge
      // Left diagonal: line from (0,0) to (0.5,1) - equation: y = 2x, or 2x - y = 0
      // Distance = (2x - y) / sqrt(5) but we normalize differently
      triDistDiagLeft = (triLocalXBase + triLocalYBase * 0.5) * sqrt2inv;
      // Right diagonal: line from (1,0) to (0.5,1) - equation: y = -2x + 2, or 2x + y = 2
      triDistDiagRight = ((1.0 - triLocalXBase) + triLocalYBase * 0.5) * sqrt2inv;
    } else {
      // Downward pointing triangle: flat top at y=1, apex at bottom
      triDistHorizontal = 1.0 - triLocalYBase; // distance to top edge
      // Left diagonal: from (0,1) to (0.5,0)
      triDistDiagLeft = (triLocalXBase + (1.0 - triLocalYBase) * 0.5) * sqrt2inv;
      // Right diagonal: from (1,1) to (0.5,0)
      triDistDiagRight = ((1.0 - triLocalXBase) + (1.0 - triLocalYBase) * 0.5) * sqrt2inv;
    }
    
    // Store individual edge distances for later use in edge effects
    // We'll pass these through to the edge effect system
    float triEdge1 = triDistHorizontal;
    float triEdge2 = triDistDiagLeft;
    float triEdge3 = triDistDiagRight;
    
    float triEdgeDist = min(triEdge1, min(triEdge2, triEdge3)) * 1.5;
    
    // === HEXAGON ===
    // Proper hexagonal grid
    float hexWidth = 1.0 / cols;
    float hexHeight = 1.0 / rows * 0.866; // Adjust for hex packing
    float hexRowIndex = floor(uv.y / hexHeight);
    float hexRowOffset = mod(hexRowIndex, 2.0) * 0.5 * hexWidth;
    float hexAdjustedX = uv.x - hexRowOffset;
    float hexColIndex = floor(hexAdjustedX / hexWidth);
    float hexLocalX = fract(hexAdjustedX / hexWidth);
    float hexLocalY = fract(uv.y / hexHeight);
    // Hex corner adjustment - check if in corner region
    float hexCornerZone = 0.3;
    float hexCornerThreshold = hexLocalY / hexCornerZone;
    // Adjust for hex corners
    if (hexLocalY < hexCornerZone) {
      if (hexLocalX < 0.5 * (1.0 - hexCornerThreshold)) {
        hexColIndex -= 1.0;
        hexLocalX += 1.0;
        hexRowIndex -= mod(hexRowIndex + 1.0, 2.0);
      } else if (hexLocalX > 1.0 - 0.5 * (1.0 - hexCornerThreshold)) {
        hexColIndex += 1.0;
        hexLocalX -= 1.0;
        hexRowIndex -= mod(hexRowIndex + 1.0, 2.0);
      }
    }
    // Hex edge distance (6 edges)
    vec2 hexCentered = vec2(hexLocalX - 0.5, hexLocalY - 0.5);
    float hexDistTop = 1.0 - hexLocalY;
    float hexDistBottom = hexLocalY;
    float hexDistDiag1 = 1.0 - abs(hexCentered.x * 1.5 + hexCentered.y);
    float hexDistDiag2 = 1.0 - abs(hexCentered.x * 1.5 - hexCentered.y);
    float hexDistDiag3 = 1.0 - abs(-hexCentered.x * 1.5 + hexCentered.y);
    float hexDistDiag4 = 1.0 - abs(-hexCentered.x * 1.5 - hexCentered.y);
    float hexEdgeDist = min(min(hexDistTop, hexDistBottom), min(min(hexDistDiag1, hexDistDiag2), min(hexDistDiag3, hexDistDiag4)));
    hexEdgeDist = clamp(hexEdgeDist * 1.5, 0.0, 1.0);
    
    // Select values based on shape type
    colIndex = rectColIndex * isRect + triColIndex * isTri + hexColIndex * isHex;
    rowIndex = rectRowIndex * isRect + triRowIndex * isTri + hexRowIndex * isHex;
    localX = rectLocalX * isRect + triLocalX * isTri + hexLocalX * isHex;
    localY = rectLocalY * isRect + triLocalY * isTri + hexLocalY * isHex;
    shapeEdgeDist = rectEdgeDist * isRect + triEdgeDist * isTri + hexEdgeDist * isHex;
    shapeEdgeDist = clamp(shapeEdgeDist, 0.0, 1.0);
    
    // No black gaps - barMask is always 1.0 (cells tile seamlessly)
    float barMask = 1.0;
    
    // Glass prism refraction - use local coordinates
    float barX = clamp(localX, 0.0, 1.0);
    float barY = clamp(localY, 0.0, 1.0);
    
    // Glass thickness - stronger cylindrical lens
    float centerDist = (barX - 0.5) * 2.0; // -1 to 1
    float glassProfile = 1.0 - centerDist * centerDist;
    
    // For non-rectangular shapes, use shape edge distance for glass profile
    // This makes the glass thicker in center, thinner at edges following the shape
    float shapeGlassProfile = shapeEdgeDist * shapeEdgeDist;
    glassProfile = mix(glassProfile, shapeGlassProfile, 1.0 - isRect);
    
    // === PER-PANE VARIATION ===
    vec2 paneRand = paneHash2(colIndex, rowIndex);
    float paneRand3 = paneHash(colIndex + 100.0, rowIndex + 50.0);
    float paneRand4 = paneHash(colIndex + 200.0, rowIndex + 150.0);
    float paneRand5 = paneHash(colIndex + 300.0, rowIndex + 250.0);
    
    // Per-pane bend direction and strength
    float paneBendDir = (paneRand.x - 0.5) * 2.0; // -1 to 1
    float paneBendAmt = paneRand.y * u_paneBendVariance;
    
    // Per-pane distortion multiplier
    float paneDistortMult = 1.0 + (paneRand3 - 0.5) * u_paneDistortVariance * 2.0;
    
    // Per-pane color offset - LARGE offset so each bar samples a different part of the gradient
    // This is the key to getting different colors in each pane like the reference
    float paneColorOffset = colIndex / cols * 2.0 + paneRand.x * 1.5 + paneRand.y * 0.8;
    paneColorOffset += rowIndex * 0.3; // Also vary by row
    
    float paneHueShift = paneColorOffset * u_paneColorShift;
    
    // === INTERNAL WAVE DISTORTION ===
    // This is the key feature that creates complex internal bending
    vec2 internalWave = getInternalWaveDistortion(barX, barY, paneRand.x, paneRand.y, paneRand3);
    internalWave *= u_refractionStrength * 6.0; // Scale with refraction strength (increased for dramatic bending like reference)
    
    // Refraction offset - static lens distortion with per-pane variation
    float refractionStrength = u_refractionStrength * paneDistortMult;
    
    // Add per-pane bend: some panes curve left, some right, some straight
    float bendOffset = paneBendDir * paneBendAmt * 0.1 * glassProfile;
    float verticalBend = (paneRand3 - 0.5) * paneBendAmt * 0.05 * (1.0 - abs(centerDist));
    
    // Combine cylindrical lens with internal waves
    vec2 refractOffset = vec2(
      centerDist * refractionStrength * glassProfile + bendOffset + internalWave.x,
      verticalBend + internalWave.y
    );
    
    // Subtle vertical lens distortion
    float verticalRefract = sin(centerDist * 3.14159) * 0.01 * paneDistortMult;
    refractOffset.y += verticalRefract;
    
    // Base UV for sampling background - static per bar
    vec2 sampleUv = uv + refractOffset;
    
    // Per-bar unique offset - creates visible color variation per pane
    // Each bar should sample a different region of the color gradient
    float barSeed = colIndex * 0.73 + rowIndex * 1.37;
    
    // Horizontal offset based on column position and random seed
    float barOffsetX = (colIndex / cols) * 0.12 + sin(barSeed) * 0.06;
    barOffsetX += paneRand.x * 0.10 * u_paneColorShift;
    
    // Vertical offset for additional variation
    float barOffsetY = cos(barSeed * 1.3) * 0.03 + paneRand.y * 0.05;
    
    // Add within-bar horizontal position for flowing effect
    float withinBarOffsetX = (barX - 0.5) * 0.03;
    // Add within-bar vertical position for additional variation
    float withinBarOffsetY = (barY - 0.5) * 0.02;
    
    sampleUv.x += barOffsetX + withinBarOffsetX;
    sampleUv.y += barOffsetY + withinBarOffsetY;
    
    // Very subtle shimmer animation (discrete, not flowing)
    float shimmer = sin(barSeed * 2.1 + u_time * 0.3 * u_speed) * 0.003 * u_shimmerIntensity;
    sampleUv.x += shimmer;
    
    // === ENHANCED CHROMATIC ABERRATION WITH INTERNAL SPLITTING ===
    // Multiple split points within each pane for that prismatic look
    float chromaBase = u_chromaStrength;
    // Chromatic aberration increases toward edges of each bar + per-pane variation
    float chromaVariance = 1.0 + (paneRand.x - 0.5) * u_paneBendVariance;
    float chromaEdge = chromaBase * (1.0 + abs(centerDist) * 2.5) * chromaVariance;
    
    // Additional chromatic split at internal wave peaks (more pronounced)
    float wavePeakChroma = abs(sin(barY * INTERNAL_WAVES * 3.14159 + paneRand.y * 6.28));
    wavePeakChroma = pow(wavePeakChroma, 0.5); // Wider peaks
    chromaEdge *= (1.0 + wavePeakChroma * 0.8);
    
    // Per-pane chromatic direction variation
    float chromaAngle = paneRand.y * 3.14159 * 0.3 * u_paneBendVariance;
    vec2 chromaDir = vec2(cos(chromaAngle), sin(chromaAngle));
    
    vec3 col;
    
    // === MULTI-SAMPLE CHROMATIC ABERRATION ===
    // Sample at multiple points with different offsets for richer color splitting
    
    // Primary chromatic split
    vec2 redOffset = chromaDir * chromaEdge + vec2(chromaEdge * 0.3, 0.0);
    vec2 redUv = sampleUv + redOffset;
    
    vec2 greenUv = sampleUv + chromaDir * chromaEdge * 0.1;
    
    vec2 blueOffset = -chromaDir * chromaEdge + vec2(-chromaEdge * 0.2, 0.0);
    vec2 blueUv = sampleUv + blueOffset;
    
    // Secondary split at different internal positions
    vec2 internalSplit = vec2(
      sin(barY * 5.0 + paneRand3 * 10.0) * 0.01,
      cos(barY * 4.0 + paneRand4 * 10.0) * 0.008
    );
    
    // Sample with combined distortions
    col.r = getBackgroundColor((redUv + internalSplit * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
    col.g = getBackgroundColor((greenUv) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
    col.b = getBackgroundColor((blueUv - internalSplit * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    
    // === INTERNAL COLOR VARIATION ===
    // Add subtle color shifts at the wave bend points
    float wavePos = sin(barY * INTERNAL_WAVES * 3.14159 + paneRand.x * 6.28);
    float waveBendZone = abs(wavePos) > 0.7 ? smoothstep(0.7, 1.0, abs(wavePos)) : 0.0;
    
    // At wave peaks/troughs, shift colors slightly
    vec3 waveColorShift = vec3(
      sin(barY * 8.0 + paneRand3 * 10.0) * 0.1,
      sin(barY * 7.0 + paneRand4 * 10.0) * 0.08,
      sin(barY * 9.0 + paneRand5 * 10.0) * 0.12
    );
    col += waveColorShift * waveBendZone * 0.15;
    
    // === ADVANCED GLASS EDGE EFFECTS WITH 3D BEVEL ===
    float edgeIntensity = u_glassEdgeIntensity;
    float edgeW = u_edgeWidth;
    float warmth = u_edgeWarmth;
    float edgeRefract = u_edgeRefraction;
    float bevelDepth = u_edgeBevelDepth;
    float edgeChromaAmt = u_edgeChroma;
    
    // Edge colors - warm amber/orange on one side, cool blue on other
    // Rich warm colors for beveled edges - matched to reference
    vec3 warmOrange = vec3(1.0, 0.5, 0.12);
    vec3 amber = vec3(1.0, 0.65, 0.25);
    vec3 warmHighlight = mix(vec3(1.0, 1.0, 1.0), warmOrange, warmth);
    vec3 coolHighlight = vec3(0.85, 0.92, 1.0);
    vec3 whiteHighlight = vec3(1.0, 1.0, 1.0);
    
    // Edge distances - for non-rectangle shapes, use shape-aware edge distance
    float leftDist = barX;
    float rightDist = 1.0 - barX;
    float topDist = 1.0 - barY;
    float bottomDist = barY;
    
    // Additional edge distances for triangles (diagonals)
    float diagLeftDist = 1.0;
    float diagRightDist = 1.0;
    float hasTriDiagonals = 0.0;
    float triUpward = 0.0;
    
    // For triangles, use individual edge distances for proper beveling on each edge
    if (isTri > 0.5) {
      // Recalculate triangle parameters for edge detection
      float triCellW = 1.0 / cols;
      float triCellH = 1.0 / rows;
      float tRowIdx = floor(uv.y / triCellH);
      float tColBase = floor(uv.x / triCellW);
      float tLocalX = fract(uv.x / triCellW);
      float tLocalY = fract(uv.y / triCellH);
      float tIsOdd = mod(tColBase + tRowIdx, 2.0);
      float tDiag = tIsOdd > 0.5 ? tLocalX : (1.0 - tLocalX);
      float tInUpper = step(tDiag, tLocalY);
      
      // sqrt(2)/2 for proper 45-degree distance calculation
      float sqrt2inv = 0.7071;
      
      // Scale factor for edge distances to match rectangle edge effect visibility
      float edgeScale = 0.85;
      
      // The triangles are formed by dividing rectangles with diagonals
      // For "/" diagonal (tIsOdd > 0.5): upper-left triangle (y>x), lower-right triangle (y<x)
      // For "\" diagonal (tIsOdd <= 0.5): upper-right triangle (x+y>1), lower-left triangle (x+y<1)
      
      if (tIsOdd > 0.5) {
        // "/" diagonal pattern - line is y = x
        if (tInUpper > 0.5) {
          // Upper-left triangle: vertices (0,0), (0,1), (1,1)
          // Edges: top (y=1), left (x=0), diagonal (y=x on right side)
          topDist = (1.0 - tLocalY) * edgeScale;
          leftDist = tLocalX * edgeScale;
          // Distance to diagonal y=x: we're above (y>x), normal points toward lower-right
          diagRightDist = (tLocalY - tLocalX) * sqrt2inv * edgeScale;
          rightDist = diagRightDist; // Diagonal acts as "right" edge
          bottomDist = 1.0; // No bottom edge
          triUpward = 0.0; // This triangle points downward (apex at bottom-right area)
        } else {
          // Lower-right triangle: vertices (0,0), (1,0), (1,1)
          // Edges: bottom (y=0), right (x=1), diagonal (y=x on left side)
          bottomDist = tLocalY * edgeScale;
          rightDist = (1.0 - tLocalX) * edgeScale;
          // Distance to diagonal: we're below (y<x), normal points toward upper-left
          diagLeftDist = (tLocalX - tLocalY) * sqrt2inv * edgeScale;
          leftDist = diagLeftDist; // Diagonal acts as "left" edge
          topDist = 1.0; // No top edge
          triUpward = 1.0; // This triangle points upward (apex at top-left area)
        }
      } else {
        // "\" diagonal pattern - line is x + y = 1
        if (tInUpper > 0.5) {
          // Upper-right triangle: vertices (0,1), (1,0), (1,1)
          // Edges: top (y=1), right (x=1), diagonal (x+y=1 on left/bottom side)
          topDist = (1.0 - tLocalY) * edgeScale;
          rightDist = (1.0 - tLocalX) * edgeScale;
          // Distance to diagonal x+y=1: we're above (x+y>1), normal points toward lower-left
          diagLeftDist = (tLocalX + tLocalY - 1.0) * sqrt2inv * edgeScale;
          leftDist = diagLeftDist; // Diagonal acts as "left" edge
          bottomDist = 1.0; // No bottom edge
          triUpward = 0.0;
        } else {
          // Lower-left triangle: vertices (0,0), (0,1), (1,0)
          // Edges: bottom (y=0), left (x=0), diagonal (x+y=1 on right/top side)
          bottomDist = tLocalY * edgeScale;
          leftDist = tLocalX * edgeScale;
          // Distance to diagonal: we're below (x+y<1), normal points toward upper-right
          diagRightDist = (1.0 - tLocalX - tLocalY) * sqrt2inv * edgeScale;
          rightDist = diagRightDist; // Diagonal acts as "right" edge
          topDist = 1.0; // No top edge
          triUpward = 1.0;
        }
      }
      
      hasTriDiagonals = 1.0;
    }
    
    // For hexagon, use the computed shape edge distance
    if (isHex > 0.5) {
      float shapeDist = shapeEdgeDist * 0.5;
      leftDist = shapeDist;
      rightDist = shapeDist;
      topDist = shapeDist;
      bottomDist = shapeDist;
    }
    
    // === 3D BEVELED FRAME EFFECT ===
    // Create the appearance of thick beveled glass edges like picture frames
    float bevelWidth = edgeW * 3.0;
    float outerBevelWidth = edgeW * 1.5;
    
    // Outer bright edge (catch light)
    float leftOuterBevel = smoothstep(0.0, outerBevelWidth * 0.3, leftDist) * (1.0 - smoothstep(outerBevelWidth * 0.3, outerBevelWidth, leftDist));
    float rightOuterBevel = smoothstep(0.0, outerBevelWidth * 0.25, rightDist) * (1.0 - smoothstep(outerBevelWidth * 0.25, outerBevelWidth * 0.8, rightDist));
    float topOuterBevel = smoothstep(0.0, outerBevelWidth * 0.25, topDist) * (1.0 - smoothstep(outerBevelWidth * 0.25, outerBevelWidth * 0.8, topDist));
    float bottomOuterBevel = smoothstep(0.0, outerBevelWidth * 0.3, bottomDist) * (1.0 - smoothstep(outerBevelWidth * 0.3, outerBevelWidth, bottomDist));
    
    // Inner shadow zone (recessed area)
    float leftInnerBevel = smoothstep(outerBevelWidth, bevelWidth, leftDist) * (1.0 - smoothstep(bevelWidth, bevelWidth * 1.5, leftDist));
    float rightInnerBevel = smoothstep(outerBevelWidth * 0.8, bevelWidth * 0.8, rightDist) * (1.0 - smoothstep(bevelWidth * 0.8, bevelWidth * 1.2, rightDist));
    float topInnerBevel = smoothstep(outerBevelWidth * 0.8, bevelWidth * 0.8, topDist) * (1.0 - smoothstep(bevelWidth * 0.8, bevelWidth * 1.2, topDist));
    float bottomInnerBevel = smoothstep(outerBevelWidth, bevelWidth, bottomDist) * (1.0 - smoothstep(bevelWidth, bevelWidth * 1.5, bottomDist));
    
    // === PRIMARY EDGE LINES (warm amber on left/bottom edges) ===
    float edgeSoftness = 0.005;
    float innerBevelStart = edgeW * 0.8;
    float innerBevelEnd = edgeW * 2.5;
    
    // LEFT EDGE - Primary warm orange line (like in reference)
    float leftPrimaryLine = smoothstep(0.0, edgeSoftness, leftDist);
    leftPrimaryLine *= (1.0 - smoothstep(edgeW * 0.4, edgeW * 0.7, leftDist));
    
    // Left edge inner gradient (beveled glass depth)
    float leftBevelGrad = smoothstep(0.0, innerBevelEnd, leftDist);
    float leftInnerZone = smoothstep(edgeW * 0.5, innerBevelStart, leftDist) * (1.0 - smoothstep(innerBevelStart, innerBevelEnd, leftDist));
    
    // RIGHT EDGE - Cool blue/white highlight
    float rightPrimaryLine = smoothstep(0.0, edgeSoftness, rightDist);
    rightPrimaryLine *= (1.0 - smoothstep(edgeW * 0.35, edgeW * 0.6, rightDist));
    
    // Right edge bevel
    float rightInnerZone = smoothstep(edgeW * 0.4, edgeW * 0.8, rightDist) * (1.0 - smoothstep(edgeW * 0.8, innerBevelEnd * 0.7, rightDist));
    
    // TOP EDGE - Cool blue/white highlight (same treatment as right edge)
    float topPrimaryLine = smoothstep(0.0, edgeSoftness, topDist);
    topPrimaryLine *= (1.0 - smoothstep(edgeW * 0.35, edgeW * 0.6, topDist));
    
    // Top edge inner gradient
    float topInnerZone = smoothstep(edgeW * 0.4, edgeW * 0.8, topDist) * (1.0 - smoothstep(edgeW * 0.8, innerBevelEnd * 0.7, topDist));
    
    // BOTTOM EDGE - Warm orange/amber (same treatment as left edge)
    float bottomPrimaryLine = smoothstep(0.0, edgeSoftness, bottomDist);
    bottomPrimaryLine *= (1.0 - smoothstep(edgeW * 0.4, edgeW * 0.7, bottomDist));
    
    // Bottom edge inner gradient
    float bottomInnerZone = smoothstep(edgeW * 0.5, innerBevelStart, bottomDist) * (1.0 - smoothstep(innerBevelStart, innerBevelEnd, bottomDist));
    
    // === CHROMATIC EDGE REFRACTION ===
    // Create color splitting at edges like real glass refraction
    float leftEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd * 1.5, leftDist);
    float rightEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd * 1.2, rightDist);
    float topEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd * 1.2, topDist);
    float bottomEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd * 1.5, bottomDist);
    
    // Shift red channel outward at left edge, blue at right edge
    float edgeChromaShift = edgeChromaAmt * 0.15;
    
    // For triangles, chromatic offset should be perpendicular to the diagonal edges
    vec2 leftChromaOffset, rightChromaOffset;
    
    if (hasTriDiagonals > 0.5) {
      // For triangles: diagonal refraction directions
      // The diagonals are at 45 degrees, so normals are at 45 degrees too
      float diagNorm = 0.707; // 1/sqrt(2)
      
      // For "/" diagonal (y=x): normal is (1,-1)/sqrt(2) pointing toward lower-right
      // For "\" diagonal (x+y=1): normal is (1,1)/sqrt(2) pointing toward upper-right
      // We apply refraction perpendicular to the edge
      
      // Left edge in triangle context: either a vertical edge or a diagonal
      // If leftDist is small and we're on a diagonal, use diagonal normal
      // Simple heuristic: use diagonal direction for refraction on all triangle edges
      
      if (triUpward > 0.5) {
        // Lower triangles (pointing up): diagonal edge has normal pointing inward
        // "/" pattern lower: diagonal is y=x, we're below, normal points toward (1,1)
        // "\" pattern lower: diagonal is x+y=1, we're below, normal points toward (1,-1)
        leftChromaOffset = vec2(diagNorm, -diagNorm) * (-edgeChromaShift * leftEdgeZone);
        rightChromaOffset = vec2(diagNorm, diagNorm) * (edgeChromaShift * rightEdgeZone);
      } else {
        // Upper triangles (pointing down): diagonal edge normal points other way
        leftChromaOffset = vec2(-diagNorm, diagNorm) * (-edgeChromaShift * leftEdgeZone);
        rightChromaOffset = vec2(-diagNorm, -diagNorm) * (edgeChromaShift * rightEdgeZone);
      }
    } else {
      // For rectangles: horizontal refraction
      leftChromaOffset = vec2(-edgeChromaShift * leftEdgeZone, 0.0);
      rightChromaOffset = vec2(edgeChromaShift * rightEdgeZone, 0.0);
    }
    
    vec2 topChromaOffset = vec2(0.0, edgeChromaShift * topEdgeZone);
    vec2 bottomChromaOffset = vec2(0.0, -edgeChromaShift * bottomEdgeZone);
    
    // Sample with chromatic offset at edges
    vec3 leftEdgeColor = vec3(0.0);
    if (hasTriDiagonals > 0.5) {
      // Diagonal edge: refract along the diagonal
      vec2 diagRefract = leftChromaOffset * edgeRefract * 0.5;
      leftEdgeColor.r = getBackgroundColor((sampleUv + leftChromaOffset + diagRefract) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
      leftEdgeColor.g = getBackgroundColor((sampleUv + leftChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
      leftEdgeColor.b = getBackgroundColor((sampleUv - leftChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    } else {
      leftEdgeColor.r = getBackgroundColor((sampleUv + leftChromaOffset + vec2(edgeRefract * 0.02 * leftEdgeZone, 0.0)) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
      leftEdgeColor.g = getBackgroundColor((sampleUv + leftChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
      leftEdgeColor.b = getBackgroundColor((sampleUv - leftChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    }
    
    vec3 rightEdgeColor = vec3(0.0);
    if (hasTriDiagonals > 0.5) {
      // Diagonal edge: refract along the diagonal
      vec2 diagRefract = rightChromaOffset * edgeRefract * 0.5;
      rightEdgeColor.r = getBackgroundColor((sampleUv + rightChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
      rightEdgeColor.g = getBackgroundColor((sampleUv + rightChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
      rightEdgeColor.b = getBackgroundColor((sampleUv + rightChromaOffset + diagRefract) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    } else {
      rightEdgeColor.r = getBackgroundColor((sampleUv + rightChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
      rightEdgeColor.g = getBackgroundColor((sampleUv + rightChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
      rightEdgeColor.b = getBackgroundColor((sampleUv + rightChromaOffset - vec2(edgeRefract * 0.015 * rightEdgeZone, 0.0)) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    }
    
    vec3 topEdgeColor = vec3(0.0);
    topEdgeColor.r = getBackgroundColor((sampleUv + topChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
    topEdgeColor.g = getBackgroundColor((sampleUv + topChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
    topEdgeColor.b = getBackgroundColor((sampleUv + topChromaOffset - vec2(0.0, edgeRefract * 0.015 * topEdgeZone)) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    
    vec3 bottomEdgeColor = vec3(0.0);
    bottomEdgeColor.r = getBackgroundColor((sampleUv + bottomChromaOffset + vec2(0.0, edgeRefract * 0.02 * bottomEdgeZone)) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).r;
    bottomEdgeColor.g = getBackgroundColor((sampleUv + bottomChromaOffset * 0.5) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).g;
    bottomEdgeColor.b = getBackgroundColor((sampleUv - bottomChromaOffset * 0.3) * vec2(aspect * 0.5, 1.0), u_time, paneHueShift).b;
    
    // Blend edge refracted colors
    col = mix(col, leftEdgeColor, leftEdgeZone * edgeRefract * 0.3);
    col = mix(col, rightEdgeColor, rightEdgeZone * edgeRefract * 0.25);
    col = mix(col, topEdgeColor, topEdgeZone * edgeRefract * 0.25);
    col = mix(col, bottomEdgeColor, bottomEdgeZone * edgeRefract * 0.3);
    
    // === APPLY 3D BEVEL SHADING ===
    // Outer bevel catches light - bright highlights
    col += warmHighlight * leftOuterBevel * 0.5 * edgeIntensity * bevelDepth;
    col += coolHighlight * rightOuterBevel * 0.25 * edgeIntensity * bevelDepth;
    col += coolHighlight * topOuterBevel * 0.25 * edgeIntensity * bevelDepth;
    col += warmHighlight * bottomOuterBevel * 0.5 * edgeIntensity * bevelDepth;
    
    // Inner bevel - very subtle depth, mostly warm glow
    col *= mix(1.0, 0.95, leftInnerBevel * bevelDepth * 0.2);
    col *= mix(1.0, 0.97, rightInnerBevel * bevelDepth * 0.15);
    col *= mix(1.0, 0.97, topInnerBevel * bevelDepth * 0.15);
    col *= mix(1.0, 0.95, bottomInnerBevel * bevelDepth * 0.2);
    // Add warm glow instead of shadow
    col += warmOrange * leftInnerBevel * 0.15 * edgeIntensity * warmth;
    col += warmOrange * bottomInnerBevel * 0.12 * edgeIntensity * warmth;
    
    // === APPLY EDGE HIGHLIGHTS ===
    // Left edge - warm orange/amber primary line
    col = mix(col, warmHighlight, leftPrimaryLine * 0.45 * edgeIntensity);
    col += amber * leftInnerZone * 0.08 * edgeIntensity * warmth;
    
    // Right edge - cool blue/white
    col = mix(col, coolHighlight, rightPrimaryLine * 0.18 * edgeIntensity);
    col += coolHighlight * rightInnerZone * 0.05 * edgeIntensity;
    
    // Top edge - cool blue/white
    col = mix(col, coolHighlight, topPrimaryLine * 0.18 * edgeIntensity);
    col += coolHighlight * topInnerZone * 0.05 * edgeIntensity;
    
    // Bottom edge - warm orange/amber
    col = mix(col, warmHighlight, bottomPrimaryLine * 0.45 * edgeIntensity);
    col += amber * bottomInnerZone * 0.08 * edgeIntensity * warmth;
    
    // === SUBTLE DEPTH GRADIENT ===
    // Very minimal darkening - the reference image has no dark bevels
    float leftBevelShadow = smoothstep(edgeW * 2.0, edgeW * 4.0, leftDist) * (1.0 - smoothstep(edgeW * 4.0, edgeW * 6.0, leftDist));
    float bottomBevelShadow = smoothstep(edgeW * 2.0, edgeW * 4.0, bottomDist) * (1.0 - smoothstep(edgeW * 4.0, edgeW * 6.0, bottomDist));
    
    // Almost no darkening - just very subtle depth
    col *= mix(1.0, 0.98, leftBevelShadow * bevelDepth * 0.15);
    col *= mix(1.0, 0.98, bottomBevelShadow * bevelDepth * 0.15);
    
    // === CORNER ACCENTS ===
    // Warm corners where edges meet
    float cornerBL = pow((1.0 - smoothstep(0.0, 0.12, leftDist)) * (1.0 - smoothstep(0.0, 0.12, bottomDist)), 0.6);
    float cornerTL = pow((1.0 - smoothstep(0.0, 0.12, leftDist)) * (1.0 - smoothstep(0.0, 0.12, topDist)), 0.6);
    float cornerBR = pow((1.0 - smoothstep(0.0, 0.1, rightDist)) * (1.0 - smoothstep(0.0, 0.1, bottomDist)), 0.6);
    float cornerTR = pow((1.0 - smoothstep(0.0, 0.1, rightDist)) * (1.0 - smoothstep(0.0, 0.1, topDist)), 0.6);
    
    // Warm corners (especially bottom-left and top-left like reference)
    col += warmOrange * cornerBL * 0.12 * edgeIntensity * warmth;
    col += amber * cornerTL * 0.08 * edgeIntensity * warmth;
    col += coolHighlight * cornerBR * 0.04 * edgeIntensity;
    col += coolHighlight * cornerTR * 0.03 * edgeIntensity;
    
    // === WET/GLOSSY HIGHLIGHTS ===
    float wetHighlight = getWetHighlight(barX, barY, paneRand.x, paneRand.y);
    col += whiteHighlight * wetHighlight * 0.20 * edgeIntensity;
    
    // === GLASS CENTER SPECULAR ===
    float specular = pow(glassProfile, 2.0) * 0.02 * edgeIntensity;
    col += whiteHighlight * specular;
    
    // === INTERNAL WAVE HIGHLIGHT RIDGES ===
    // Add bright lines at the peaks of internal waves (like light catching folds)
    // Use multiple frequencies for more organic look
    float waveRidge1 = abs(sin(barY * INTERNAL_WAVES * 3.14159 + paneRand.x * 6.28));
    float waveRidge2 = abs(sin(barY * (INTERNAL_WAVES + 1.5) * 3.14159 + paneRand.y * 4.0));
    float waveRidgeHighlight = max(pow(waveRidge1, 12.0), pow(waveRidge2, 10.0) * 0.7);
    
    // Vary intensity along the pane
    float ridgeVariation = 0.5 + 0.5 * sin(barY * 3.0 + paneRand3 * 10.0);
    float ridgeCenterFade = 1.0 - abs(centerDist) * 0.8; // Fade toward edges
    col += whiteHighlight * waveRidgeHighlight * ridgeCenterFade * ridgeVariation * 0.08 * edgeIntensity;
    
    // === CAUSTIC SHIMMER ===
    float caustic = sin(barX * 15.0 + barY * 5.0 + u_time * 0.4 * u_speed) * 0.5 + 0.5;
    caustic = pow(caustic, 2.5) * glassProfile * 0.025 * u_causticIntensity;
    col += whiteHighlight * caustic;
    
    // === SUBTLE GLASS BEVEL EDGES ===
    // Gentle warm glow on left/bottom edges like real glass refraction
    
    float bevelEdgeWidth = u_edgeWidth * 2.5;
    
    // Left edge - subtle warm amber glow
    float leftBevelGlow = smoothstep(bevelEdgeWidth, 0.0, leftDist);
    leftBevelGlow = pow(leftBevelGlow, 0.6);
    vec3 leftBevelColor = mix(warmOrange, amber, 0.5);
    col = mix(col, leftBevelColor, leftBevelGlow * 0.35 * edgeIntensity * warmth);
    
    // Thin bright line at the very edge
    float leftEdgeLine = smoothstep(bevelEdgeWidth * 0.15, 0.0, leftDist);
    leftEdgeLine = pow(leftEdgeLine, 0.4);
    col += vec3(1.0, 0.95, 0.85) * leftEdgeLine * 0.25 * edgeIntensity;
    
    // Right edge - very subtle cool highlight
    float rightBevelGlow = smoothstep(bevelEdgeWidth * 0.4, 0.0, rightDist);
    rightBevelGlow = pow(rightBevelGlow, 0.7);
    col = mix(col, coolHighlight, rightBevelGlow * 0.12 * edgeIntensity);
    
    // Top edge - subtle cool tint
    float topBevelGlow = smoothstep(bevelEdgeWidth * 0.35, 0.0, topDist);
    topBevelGlow = pow(topBevelGlow, 0.7);
    col = mix(col, coolHighlight * 0.9, topBevelGlow * 0.08 * edgeIntensity);
    
    // Bottom edge - warm amber
    float bottomBevelGlow = smoothstep(bevelEdgeWidth * 0.8, 0.0, bottomDist);
    bottomBevelGlow = pow(bottomBevelGlow, 0.6);
    col = mix(col, leftBevelColor * 0.85, bottomBevelGlow * 0.3 * edgeIntensity * warmth);
    
    // Bottom edge line
    float bottomEdgeLine = smoothstep(bevelEdgeWidth * 0.12, 0.0, bottomDist);
    bottomEdgeLine = pow(bottomEdgeLine, 0.5);
    col += vec3(1.0, 0.9, 0.75) * bottomEdgeLine * 0.18 * edgeIntensity;
    
    // Apply noise texture overlay
    vec3 noiseTexture = getNoiseTexture(uv, u_time);
    col += noiseTexture * barMask; // Only apply noise inside bars, not in gaps
    
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

// Helper to convert RGB (0-1) to hex
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper to convert hex to RGB (0-1)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0 };
}

interface ColorPickerProps {
  colorR: number;
  colorG: number;
  colorB: number;
  onChange: (r: number, g: number, b: number) => void;
}

interface PopoverPosition {
  vertical: "top" | "bottom";
  horizontal: "left" | "right";
}

function ColorPicker({ colorR, colorG, colorB, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({ vertical: "bottom", horizontal: "left" });
  const popoverRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLDivElement>(null);
  
  // Approximate dimensions of the SketchPicker
  const PICKER_WIDTH = 220;
  const PICKER_HEIGHT = 300;
  const MARGIN = 8;
  
  const hexValue = rgbToHex(colorR, colorG, colorB);
  const rgbColor = {
    r: Math.round(colorR * 255),
    g: Math.round(colorG * 255),
    b: Math.round(colorB * 255),
  };
  
  const handleColorChange = (color: ColorResult) => {
    onChange(color.rgb.r / 255, color.rgb.g / 255, color.rgb.b / 255);
  };
  
  // Calculate optimal position when opening
  const calculatePosition = useCallback(() => {
    if (!swatchRef.current) return;
    
    const rect = swatchRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Check vertical space
    const spaceBelow = windowHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const vertical: "top" | "bottom" = spaceBelow >= PICKER_HEIGHT ? "bottom" : 
                                        spaceAbove >= PICKER_HEIGHT ? "top" : 
                                        spaceBelow >= spaceAbove ? "bottom" : "top";
    
    // Check horizontal space
    const spaceRight = windowWidth - rect.left;
    const spaceLeft = rect.right;
    const horizontal: "left" | "right" = spaceRight >= PICKER_WIDTH ? "left" :
                                          spaceLeft >= PICKER_WIDTH ? "right" : 
                                          spaceRight >= spaceLeft ? "left" : "right";
    
    setPosition({ vertical, horizontal });
  }, []);
  
  // Handle opening the picker
  const handleOpen = useCallback(() => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  }, [isOpen, calculatePosition]);
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  
  // Recalculate position on window resize while open
  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => calculatePosition();
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, calculatePosition]);
  
  // Get dynamic styles based on calculated position
  const getPopoverStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: "absolute",
      zIndex: 1001,
    };
    
    // Vertical positioning
    if (position.vertical === "bottom") {
      baseStyles.top = "100%";
      baseStyles.marginTop = MARGIN;
    } else {
      baseStyles.bottom = "100%";
      baseStyles.marginBottom = MARGIN;
    }
    
    // Horizontal positioning
    if (position.horizontal === "left") {
      baseStyles.left = 0;
    } else {
      baseStyles.right = 0;
    }
    
    // Animation based on direction
    const animationName = position.vertical === "bottom" ? "fadeInDown" : "fadeInUp";
    baseStyles.animation = `${animationName} 150ms cubic-bezier(0.16, 1, 0.3, 1)`;
    
    return baseStyles;
  };
  
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, width: "fit-content", position: "relative" }}>
      {/* Emil Kowalski: Spring-like hover effect for interactive elements */}
      <div
        ref={swatchRef}
        className="color-picker-wrapper"
        onClick={handleOpen}
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: 8,
          overflow: "hidden",
          cursor: "pointer",
          background: hexValue,
          boxShadow: isOpen ? "0 0 0 2px rgba(255, 255, 255, 0.5)" : "none",
        }}
      />
      <span
        className="value-badge"
        style={{
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: 9,
          fontFamily: "monospace",
          textTransform: "uppercase",
          background: "rgba(255, 255, 255, 0.1)",
          padding: "2px 4px",
          borderRadius: 4,
        }}
      >
        {hexValue.toUpperCase()}
      </span>
      
      {/* Sketch Color Picker Popover with edge detection */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={getPopoverStyles()}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <SketchPicker
            color={rgbColor}
            onChange={handleColorChange}
            disableAlpha={true}
            presetColors={[
              "#5BC4E8", "#1B3BA8", "#E84420", "#F5A623",
              "#C850A0", "#00CCC0", "#8B5CF6", "#FFFFFF",
              "#000000", "#FF6B6B", "#4ECDC4", "#45B7D1",
            ]}
            styles={{
              default: {
                picker: {
                  background: "#1a1a1a",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
                },
                saturation: {
                  borderRadius: "4px 4px 0 0",
                },
                hue: {
                  borderRadius: "2px",
                },
                activeColor: {
                  boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

type Corner = "top-right" | "top-left" | "bottom-right" | "bottom-left";

// Compare two ShaderParams objects for equality
function paramsEqual(a: ShaderParams, b: ShaderParams): boolean {
  const keys = Object.keys(a) as (keyof ShaderParams)[];
  for (const key of keys) {
    const aVal = a[key];
    const bVal = b[key];
    // Handle string comparison
    if (typeof aVal === 'string' || typeof bVal === 'string') {
      if (aVal !== bVal) return false;
    } else {
      // Use small epsilon for floating point comparison
      if (Math.abs(aVal - bVal) > 0.0001) return false;
    }
  }
  return true;
}

function ControlPanel({ params, onChange, onReset, onSave }: ControlPanelProps) {
  // Track hydration to prevent position jank on reload
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCollapsedState, setIsCollapsedState] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("colors");
  const [corner, setCornerState] = useState<Corner>("top-right");
  
  // Load saved corner and collapsed state on mount, then mark as hydrated
  useEffect(() => {
    const savedCorner = loadSavedCorner();
    setCornerState(savedCorner);
    setIsCollapsedState(loadSavedCollapsed());
    
    // Compute initial snapped position synchronously based on saved corner
    const isRight = savedCorner.endsWith("right");
    const x = isRight ? window.innerWidth - panelWidth - margin : margin;
    setSnappedPosition({ x });
    
    // Mark hydrated after state is loaded so we render in the correct position
    setIsHydrated(true);
  }, []);
  
  // Wrapper to save corner when it changes
  const setCorner = useCallback((newCorner: Corner) => {
    setCornerState(newCorner);
    saveCorner(newCorner);
  }, []);
  
  // Wrapper to save collapsed state when it changes
  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    saveCollapsed(collapsed);
  }, []);
  
  const isCollapsed = isCollapsedState;
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [savedParams, setSavedParams] = useState<ShaderParams>(defaultParams);
  const [snappedPosition, setSnappedPosition] = useState<{ x: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const isTop = corner.startsWith("top");
  const isRight = corner.endsWith("right");
  
  // Check if current params match saved params
  const hasChanges = !paramsEqual(params, savedParams);

  // Load saved params on mount
  useEffect(() => {
    const saved = loadSavedParams();
    setSavedParams(saved);
  }, []);

  // Update saved params when save is called
  const handleSave = () => {
    onSave();
    setSavedParams({ ...params });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging when collapsed
    if (!isCollapsed) return;
    if ((e.target as HTMLElement).tagName === "BUTTON" || 
        (e.target as HTMLElement).tagName === "INPUT") return;
    
    const panel = panelRef.current;
    if (!panel) return;
    
    // Store initial mouse position to detect intentional drag vs click
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    wasDraggingRef.current = false;
    
    const rect = panel.getBoundingClientRect();
    // Calculate offset from mouse position to panel's top-left corner
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      
      // Only consider it a drag if moved more than 5 pixels from initial position
      const startPos = mouseDownPosRef.current;
      if (startPos) {
        const dx = Math.abs(e.clientX - startPos.x);
        const dy = Math.abs(e.clientY - startPos.y);
        if (dx < 5 && dy < 5) {
          // Not enough movement to be considered a drag
          return;
        }
      }
      
      const panelWidth = 320;
      const panelHeight = panel.getBoundingClientRect().height;
      
      // Calculate new position based on mouse and offset
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - panelWidth;
      const maxY = window.innerHeight - panelHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      // Mark that actual dragging occurred (movement happened)
      wasDraggingRef.current = true;
      
      setDragPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      // Only snap to corner if actual dragging occurred
      if (wasDraggingRef.current) {
        // Determine which corner to snap to based on final position
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        const panel = panelRef.current;
        if (panel && dragPosition) {
          const rect = panel.getBoundingClientRect();
          const panelCenterX = rect.left + rect.width / 2;
          const panelCenterY = rect.top + rect.height / 2;
          
          const newIsRight = panelCenterX > windowWidth / 2;
          const newIsTop = panelCenterY < windowHeight / 2;
          
          const newCorner: Corner = `${newIsTop ? "top" : "bottom"}-${newIsRight ? "right" : "left"}`;
          setCorner(newCorner);
        }
      }
      
      mouseDownPosRef.current = null;
      setDragPosition(null);
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, dragPosition, setCorner]);

  const handleChange = (key: keyof ShaderParams, value: number) => {
    onChange({ ...params, [key]: value });
  };
  
  const handleColorChange = (colorPrefix: string) => (r: number, g: number, b: number) => {
    onChange({
      ...params,
      [`${colorPrefix}R`]: r,
      [`${colorPrefix}G`]: g,
      [`${colorPrefix}B`]: b,
    } as ShaderParams);
  };

  const colorControls = [
    { prefix: "color1" },
    { prefix: "color2" },
    { prefix: "color3" },
    { prefix: "color4" },
    { prefix: "color5" },
    { prefix: "color6" },
    { prefix: "color7" },
    { prefix: "color8" },
  ];

  const controls: {
    key: keyof ShaderParams;
    label: string;
    min: number;
    max: number;
    step: number;
    section: string;
  }[] = [
    // Grid controls
    { key: "cols", label: "Columns", min: 1, max: 80, step: 1, section: "grid" },
    { key: "rows", label: "Rows", min: 1, max: 30, step: 1, section: "grid" },
    // Glass controls
    { key: "refractionStrength", label: "Refraction", min: 0, max: 0.2, step: 0.005, section: "glass" },
    { key: "chromaStrength", label: "Chromatic Aberration", min: 0, max: 0.05, step: 0.001, section: "glass" },
    { key: "glassEdgeIntensity", label: "Glass Edge Intensity", min: 0, max: 2, step: 0.1, section: "glass" },
    { key: "edgeWidth", label: "Edge Width", min: 0.01, max: 0.1, step: 0.005, section: "glass" },
    { key: "edgeWarmth", label: "Edge Warmth", min: 0, max: 1, step: 0.05, section: "glass" },
    { key: "edgeRefraction", label: "Edge Refraction", min: 0, max: 1, step: 0.05, section: "glass" },
    { key: "edgeBevelDepth", label: "Edge Bevel Depth", min: 0, max: 1, step: 0.05, section: "glass" },
    { key: "edgeChroma", label: "Edge Chroma Split", min: 0, max: 1, step: 0.05, section: "glass" },
    // Color controls
    { key: "colorContrast", label: "Color Contrast", min: 0.5, max: 2, step: 0.05, section: "colors" },
    { key: "colorMix", label: "Color Blending", min: 0, max: 1, step: 0.05, section: "colors" },
    { key: "saturation", label: "Saturation", min: 0, max: 3, step: 0.1, section: "colors" },
    { key: "brightness", label: "Brightness", min: 0.1, max: 2, step: 0.05, section: "colors" },
    { key: "edgeHardness", label: "Color Edge Hardness", min: 0, max: 1, step: 0.05, section: "colors" },
    // Animation controls
    { key: "speed", label: "Animation Speed", min: 0, max: 5, step: 0.1, section: "animation" },
    { key: "shimmerIntensity", label: "Shimmer Intensity", min: 0, max: 2, step: 0.1, section: "animation" },
    { key: "causticIntensity", label: "Caustic Intensity", min: 0, max: 3, step: 0.1, section: "animation" },
    // Noise controls
    { key: "noiseScale", label: "Pattern Scale", min: 0.1, max: 3, step: 0.1, section: "noise" },
    { key: "noiseTextureDensity", label: "Noise Density", min: 100, max: 2000, step: 50, section: "noise" },
    { key: "noiseTextureIntensity", label: "Noise Intensity", min: 0, max: 0.3, step: 0.01, section: "noise" },
    { key: "noiseTextureSaturation", label: "Noise Color", min: 0, max: 1, step: 0.05, section: "noise" },
    { key: "noiseTextureSpeed", label: "Noise Animation", min: 0, max: 60, step: 1, section: "noise" },
    // Per-pane variation
    { key: "paneBendVariance", label: "Pane Bend Variance", min: 0, max: 1, step: 0.05, section: "pane" },
    { key: "paneColorShift", label: "Pane Color Shift", min: 0, max: 1, step: 0.05, section: "pane" },
    { key: "paneDistortVariance", label: "Pane Distort Variance", min: 0, max: 1, step: 0.05, section: "pane" },
    { key: "vignetteStrength", label: "Vignette", min: 0, max: 0.5, step: 0.01, section: "colors" },
  ];
  
  const sections = [
    { id: "colors", label: "Colors", icon: Palette },
    { id: "grid", label: "Grid", icon: Grid3X3 },
    { id: "glass", label: "Glass", icon: Gem },
    { id: "animation", label: "Animation", icon: Sparkles },
    { id: "noise", label: "Noise", icon: Radio },
    { id: "pane", label: "Variation", icon: PanelTop },
  ];

  const getHeaderBorderRadius = () => {
    if (isCollapsed) return 12;
    if (isTop) return "12px 12px 0 0";
    return "0 0 12px 12px";
  };

  const getBodyBorderRadius = () => {
    if (isTop) return "0 0 12px 12px";
    return "12px 12px 0 0";
  };

  // Calculate corner positions
  const margin = 16;
  const panelWidth = 320;
  
  const getCornerPosition = useCallback(() => {
    if (typeof window === "undefined") return { x: margin };
    
    const x = isRight ? window.innerWidth - panelWidth - margin : margin;
    
    return { x };
  }, [isRight]);
  
  // Update snapped position when corner changes or on resize
  useEffect(() => {
    if (!isDragging) {
      const updatePosition = () => {
        setSnappedPosition(getCornerPosition());
      };
      
      updatePosition();
      window.addEventListener("resize", updatePosition);
      
      return () => {
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isDragging, corner, getCornerPosition]);

  // Get current position - drag position or snapped position
  // When dragging, use absolute top/left. When snapped, use corner-based positioning.
  const currentX = isDragging && dragPosition ? dragPosition.x : snappedPosition?.x ?? margin;
  const currentY = isDragging && dragPosition ? dragPosition.y : null;

  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    // Prevent toggle if we were just dragging
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    // Prevent event from bubbling to avoid double-triggers
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const headerElement = (
    <div
      className="panel-header"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: getHeaderBorderRadius(),
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderBottom: isCollapsed || !isTop ? undefined : "none",
        borderTop: isCollapsed || isTop ? undefined : "none",
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        userSelect: "none",
        cursor: isCollapsed ? (isDragging ? "grabbing" : "grab") : "pointer",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleToggleClick}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
        onClick={handleToggleClick}
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
        <span
          className="chevron-icon"
          data-collapsed={isCollapsed}
          data-top={isTop}
          data-right={isRight}
          data-dragging={isDragging}
        >
          <ChevronDown
            size={16}
            color="rgba(255, 255, 255, 0.6)"
          />
        </span>
      </div>
      {hasChanges && (
        <div style={{ display: "flex", gap: 12 }}>
            <button
            className="header-button"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
            }}
          >
            Save
          </button>
          <button
            className="header-button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );

  // Build positioning styles based on corner and drag state
  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "fixed",
      left: currentX,
      zIndex: 1000,
      width: panelWidth,
      maxHeight: `calc(100vh - ${margin * 2}px)`,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    };
    
    if (isDragging && currentY !== null) {
      // When dragging, use absolute top positioning
      return {
        ...base,
        top: currentY,
        bottom: "auto",
        transition: "none",
      };
    }
    
    // When snapped to corner, use top or bottom based on corner
    // Emil Kowalski: Custom easing (ease-out-expo) for snappy feel
    if (isTop) {
      return {
        ...base,
        top: margin,
        bottom: "auto",
        transition: "left 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      };
    } else {
      // Bottom corners: anchor to bottom so height grows upward
      return {
        ...base,
        top: "auto",
        bottom: margin,
        transition: "left 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      };
    }
  };

  // Don't render until hydrated to prevent position jank
  if (!isHydrated) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      style={getPositionStyles()}
    >
      {/* Header - render first if top corners */}
      {isTop && headerElement}

      {/* Controls Body */}
      {!isCollapsed && (
        <div
          className="controls-body"
          data-position={isTop ? "top" : "bottom"}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: getBodyBorderRadius(),
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderTop: isTop ? "none" : undefined,
            borderBottom: !isTop ? "none" : undefined,
            padding: 16,
            overflowY: "auto",
            flex: 1,
            order: isTop ? 1 : 0,
            // Emil Kowalski: Origin-aware animation with blur for smoother transitions
            // Using custom easing (--ease-out-expo) for snappy feel
            animation: isTop 
              ? "fadeInDown 180ms cubic-bezier(0.16, 1, 0.3, 1)" 
              : "fadeInUp 180ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Section Tabs - Emil Kowalski's subtle scale on press */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 16,
            }}
          >
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className="section-tab"
                data-active={activeSection === id}
                onClick={() => setActiveSection(id)}
                style={{
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  background: activeSection === id ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: activeSection === id ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 6,
                  color: activeSection === id ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Color Pickers Grid for Colors Section */}
            {activeSection === "colors" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, auto)",
                  columnGap: 24,
                  rowGap: 12,
                  marginBottom: 8,
                  marginLeft: -16,
                  marginRight: -16,
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              >
                {colorControls.map(({ prefix }) => (
                  <ColorPicker
                    key={prefix}
                    colorR={params[`${prefix}R` as keyof ShaderParams] as number}
                    colorG={params[`${prefix}G` as keyof ShaderParams] as number}
                    colorB={params[`${prefix}B` as keyof ShaderParams] as number}
                    onChange={handleColorChange(prefix)}
                  />
                ))}
              </div>
            )}

            {/* Grid Section - Shape dropdown and size controls */}
            {activeSection === "grid" && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255, 255, 255, 0.5)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Shape
                </div>
                <select
                  value={params.borderShape}
                  onChange={(e) => onChange({ ...params, borderShape: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 6,
                    color: "rgba(255, 255, 255, 0.95)",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    paddingRight: 30,
                  }}
                >
                  <option value={0} style={{ background: "#1a1a1a", color: "#fff" }}>Rectangle</option>
                  <option value={1} style={{ background: "#1a1a1a", color: "#fff" }}>Triangle</option>
                  <option value={2} style={{ background: "#1a1a1a", color: "#fff" }}>Hexagon</option>
                </select>
              </div>
            )}

            {/* Size slider for non-rectangle shapes */}
            {activeSection === "grid" && params.borderShape !== 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>Size</span>
                  <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)", fontFamily: "monospace" }}>
                    {params.cols}
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={60}
                  step={1}
                  value={params.cols}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    onChange({ ...params, cols: size, rows: Math.round(size * 0.3) });
                  }}
                  style={{
                    width: "100%",
                    height: 4,
                    background: `linear-gradient(to right, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.4) ${((params.cols - 4) / 56) * 100}%, rgba(255, 255, 255, 0.1) ${((params.cols - 4) / 56) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                />
              </div>
            )}

            {/* Slider Controls - Emil Kowalski: Spring-like slider interactions */}
            {controls
              .filter(({ section, key }) => {
                if (section !== activeSection) return false;
                // Hide cols and rows for non-rectangle shapes (use Size slider instead)
                if (params.borderShape !== 0 && (key === "cols" || key === "rows")) return false;
                return true;
              })
              .map(({ key, label, min, max, step }) => (
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
                      className="value-badge"
                      style={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: 11,
                        fontFamily: "monospace",
                        background: "rgba(255, 255, 255, 0.1)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {(params[key] as number).toFixed(step < 1 ? String(step).split(".")[1]?.length || 2 : 0)}
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
                      background: `linear-gradient(to right, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.35) ${((params[key] as number - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.12) ${((params[key] as number - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.12) 100%)`,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
          </div>

        </div>
      )}

      {/* Header - render last if bottom corners */}
      {!isTop && headerElement}

      {/* Emil Kowalski's Animation Principles Applied */}
      <style>{`
        /* Custom easing curves - Emil recommends stronger curves than CSS defaults */
        :root {
          --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
          --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
          --ease-in-out-quint: cubic-bezier(0.83, 0, 0.17, 1);
          --spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* Reduced motion support - accessibility first */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Chevron icon with custom easing */
        .chevron-icon {
          display: inline-flex;
          transition: transform 200ms var(--ease-out-expo), opacity 150ms var(--ease-out-expo);
        }
        /* Collapsed state: all corners point right */
        .chevron-icon[data-collapsed="true"] {
          transform: rotate(-90deg);
        }
        /* Expanded state: top corners point down, bottom corners point up */
        .chevron-icon[data-collapsed="false"][data-top="true"] {
          transform: rotate(0deg);
        }
        .chevron-icon[data-collapsed="false"][data-top="false"] {
          transform: rotate(180deg);
        }
        .chevron-icon[data-dragging="true"] {
          opacity: 0;
        }
        
        /* Panel enter animations with origin-aware transform + blur for smoother transitions */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        
        /* Button styles with Emil's scale-on-press principle (0.97 scale) */
        .control-button {
          transition: transform 120ms var(--ease-out-expo), 
                      background 150ms var(--ease-out-expo),
                      border-color 150ms var(--ease-out-expo),
                      color 150ms var(--ease-out-expo),
                      box-shadow 150ms var(--ease-out-expo);
          will-change: transform;
        }
        .control-button:hover {
          transform: translateY(-1px);
        }
        .control-button:active {
          transform: scale(0.97) translateY(0);
        }
        
        /* Section tab buttons with subtle scale and blur on state change */
        .section-tab {
          transition: transform 150ms var(--ease-out-expo),
                      background 200ms var(--ease-out-expo),
                      border-color 200ms var(--ease-out-expo),
                      color 180ms var(--ease-out-expo),
                      box-shadow 200ms var(--ease-out-expo);
          will-change: transform, background;
        }
        .section-tab:hover {
        }
        .section-tab:active {
          transform: scale(0.97);
        }
        .section-tab[data-active="true"] {
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
        }
        
        /* Header button with press effect */
        .header-button {
          transition: transform 100ms var(--ease-out-expo),
                      color 150ms var(--ease-out-expo);
        }
        .header-button:active {
          transform: scale(0.95);
        }
        
        /* Color picker with spring-like hover effect */
        .color-picker-wrapper {
          transition: box-shadow 200ms var(--ease-out-expo);
        }
        .color-picker-wrapper:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Force dark mode for react-color SketchPicker */
        .sketch-picker {
          background: #1a1a1a !important;
        }
        .sketch-picker input {
          background: #2a2a2a !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: none !important;
        }
        .sketch-picker label {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .sketch-picker span {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        /* Slider thumb with enhanced interactions */
        input[type="range"] {
          transition: opacity 150ms var(--ease-out-expo);
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 150ms var(--spring),
                      box-shadow 150ms var(--ease-out-expo);
          will-change: transform;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 150ms var(--spring);
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb:active {
          transform: scale(1.15);
        }
        
        /* Slider track hover effect */
        input[type="range"]:hover {
          opacity: 1;
        }
        
        /* Panel header with subtle hover effect */
        .panel-header {
          transition: background 200ms var(--ease-out-expo);
        }
        .panel-header:hover {
          background: rgba(0, 0, 0, 0.65);
        }
        
        /* Controls body smooth entrance */
        .controls-body {
          transform-origin: top center;
        }
        .controls-body[data-position="bottom"] {
          transform-origin: bottom center;
        }
        
        /* Value badge - static, not editable */
        .value-badge {
          /* No hover effects since not editable */
        }
        
        /* Interruptible transitions - CSS transitions are inherently interruptible */
        /* This allows users to change state mid-animation smoothly */
      `}</style>
    </div>
  );
}

const STORAGE_KEY = "glassBarShaderParams_v7";
const CORNER_STORAGE_KEY = "glassBarShaderCorner";
const COLLAPSED_STORAGE_KEY = "glassBarShaderCollapsed";

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

function loadSavedCorner(): Corner {
  if (typeof window === "undefined") return "top-right";
  try {
    const saved = localStorage.getItem(CORNER_STORAGE_KEY);
    if (saved && ["top-right", "top-left", "bottom-right", "bottom-left"].includes(saved)) {
      return saved as Corner;
    }
  } catch {
    // ignore parse errors
  }
  return "top-right";
}

function saveCorner(corner: Corner): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CORNER_STORAGE_KEY, corner);
  } catch {
    // ignore storage errors
  }
}

function loadSavedCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (saved !== null) {
      return saved === "true";
    }
  } catch {
    // ignore parse errors
  }
  return false;
}

function saveCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
  } catch {
    // ignore storage errors
  }
}

export default function GlassBarShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformLocationsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  
  const [params, setParams] = useState<ShaderParams>(defaultParams);

  useEffect(() => {
    const savedParams = loadSavedParams();
    setParams(savedParams);
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
      noiseTextureDensity: gl.getUniformLocation(program, "u_noiseTextureDensity"),
      noiseTextureIntensity: gl.getUniformLocation(program, "u_noiseTextureIntensity"),
      noiseTextureSaturation: gl.getUniformLocation(program, "u_noiseTextureSaturation"),
      noiseTextureSpeed: gl.getUniformLocation(program, "u_noiseTextureSpeed"),
      color1: gl.getUniformLocation(program, "u_color1"),
      color2: gl.getUniformLocation(program, "u_color2"),
      color3: gl.getUniformLocation(program, "u_color3"),
      color4: gl.getUniformLocation(program, "u_color4"),
      color5: gl.getUniformLocation(program, "u_color5"),
      color6: gl.getUniformLocation(program, "u_color6"),
      color7: gl.getUniformLocation(program, "u_color7"),
      color8: gl.getUniformLocation(program, "u_color8"),
      colorContrast: gl.getUniformLocation(program, "u_colorContrast"),
      colorMix: gl.getUniformLocation(program, "u_colorMix"),
      paneBendVariance: gl.getUniformLocation(program, "u_paneBendVariance"),
      paneColorShift: gl.getUniformLocation(program, "u_paneColorShift"),
      paneDistortVariance: gl.getUniformLocation(program, "u_paneDistortVariance"),
      borderShape: gl.getUniformLocation(program, "u_borderShape"),
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
    gl.uniform1f(locs.noiseTextureDensity, params.noiseTextureDensity);
    gl.uniform1f(locs.noiseTextureIntensity, params.noiseTextureIntensity);
    gl.uniform1f(locs.noiseTextureSaturation, params.noiseTextureSaturation);
    gl.uniform1f(locs.noiseTextureSpeed, params.noiseTextureSpeed);
    gl.uniform3f(locs.color1, params.color1R, params.color1G, params.color1B);
    gl.uniform3f(locs.color2, params.color2R, params.color2G, params.color2B);
    gl.uniform3f(locs.color3, params.color3R, params.color3G, params.color3B);
    gl.uniform3f(locs.color4, params.color4R, params.color4G, params.color4B);
    gl.uniform3f(locs.color5, params.color5R, params.color5G, params.color5B);
    gl.uniform3f(locs.color6, params.color6R, params.color6G, params.color6B);
    gl.uniform3f(locs.color7, params.color7R, params.color7G, params.color7B);
    gl.uniform3f(locs.color8, params.color8R, params.color8G, params.color8B);
    gl.uniform1f(locs.colorContrast, params.colorContrast);
    gl.uniform1f(locs.colorMix, params.colorMix);
    gl.uniform1f(locs.paneBendVariance, params.paneBendVariance);
    gl.uniform1f(locs.paneColorShift, params.paneColorShift);
    gl.uniform1f(locs.paneDistortVariance, params.paneDistortVariance);
    gl.uniform1f(locs.borderShape, params.borderShape);
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
