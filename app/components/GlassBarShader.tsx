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
  Square,
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
  // Organic edge controls
  organicEdgeIntensity: number;
  organicEdgeFrequency: number;
  // Advanced edge gradient controls - multi-band bevel with curvature
  edgeBandCount: number; // Number of color bands (1-5)
  edgeBandSpread: number; // How wide the band region extends (0-1)
  edgeBandCurvature: number; // How much bands bend/curve (0-1)
  edgeBandHardness: number; // Sharpness of band transitions (0-1)
  edgeInnerGlow: number; // Intensity of inner glow (0-1)
  edgeWarmColor: number; // Warm edge color hue shift (0-1)
  edgeCoolColor: number; // Cool edge color hue shift (0-1)
  // Border shape type: 0=rectangle, 1=triangle
  borderShape: 0 | 1;
}

const defaultParams: ShaderParams = {
  // Grid - matching reference: ~12 bars, 4 horizontal rows
  cols: 12,
  rows: 4,
  // Glass refraction effects - VERY STRONG for dramatic curved bands
  refractionStrength: 1.0,
  chromaStrength: 0.01,
  speed: 0.05,
  noiseScale: 0.6,
  saturation: 2.0, // High saturation for vibrant colors
  brightness: 1.1,
  glassEdgeIntensity: 0.0, // Disabled - reference has clean edges
  causticIntensity: 0.0,
  vignetteStrength: 0.0,
  edgeHardness: 0.1, // Very soft
  shimmerIntensity: 0.01,
  // Edge effects - disabled for clean reference look
  edgeWidth: 0.008,
  edgeWarmth: 0.5,
  edgeRefraction: 0.0, // Disabled - reference has clean edges
  edgeBevelDepth: 0.0,
  edgeChroma: 0.0, // Disabled chromatic aberration at edges
  // NO noise texture for clean look
  noiseTextureDensity: 100.0,
  noiseTextureIntensity: 0.0, // Disabled
  noiseTextureSaturation: 0.0,
  noiseTextureSpeed: 0.0,
  // RGB Color controls - EXACT colors from reference
  // Color 1: Bright Sky Cyan (#58D8FF)
  color1R: 0.35,
  color1G: 0.85,
  color1B: 1.0,
  // Color 2: Deep Blue (#0818B8)
  color2R: 0.03,
  color2G: 0.10,
  color2B: 0.72,
  // Color 3: Vermillion Orange-Red (#FF5020)
  color3R: 1.0,
  color3G: 0.31,
  color3B: 0.13,
  // Color 4: Golden Orange (#FFA830)
  color4R: 1.0,
  color4G: 0.66,
  color4B: 0.19,
  // Color 5: Pink (#FF70B0)
  color5R: 1.0,
  color5G: 0.44,
  color5B: 0.69,
  // Color 6: Cream White (#FFF8F0)
  color6R: 1.0,
  color6G: 0.97,
  color6B: 0.94,
  // Color 7: Bright Cyan (#40F0FF)
  color7R: 0.25,
  color7G: 0.94,
  color7B: 1.0,
  // Color 8: Royal Blue (#1020C0)
  color8R: 0.06,
  color8G: 0.13,
  color8B: 0.75,
  // Color balance - smooth organic blending
  colorContrast: 0.9, // Less contrast for smoother gradients
  colorMix: 0.85, // High mixing for smooth blends
  // Per-pane variation - for beautiful curve variety
  paneBendVariance: 1.5,
  paneColorShift: 2.0,
  paneDistortVariance: 1.2,
  // Organic edge controls - disabled for clean reference look
  organicEdgeIntensity: 0.0,
  organicEdgeFrequency: 0.0,
  // Edge gradient controls - disabled for clean reference look
  edgeBandCount: 2,
  edgeBandSpread: 0.3,
  edgeBandCurvature: 0.3,
  edgeBandHardness: 0.15,
  edgeInnerGlow: 0.0, // Disabled - reference has clean edges without colored bands
  edgeWarmColor: 0.5,
  edgeCoolColor: 0.5,
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
  uniform float u_organicEdgeIntensity;
  uniform float u_organicEdgeFrequency;
  uniform float u_edgeBandCount;
  uniform float u_edgeBandSpread;
  uniform float u_edgeBandCurvature;
  uniform float u_edgeBandHardness;
  uniform float u_edgeInnerGlow;
  uniform float u_edgeWarmColor;
  uniform float u_edgeCoolColor;
  uniform float u_borderShape;

  // Internal bend/wave controls - beautiful flowing S-curves like reference
  const float INTERNAL_WAVES = 0.4; // Very few waves for long, sweeping curves
  const float WAVE_AMPLITUDE = 5.0; // VERY strong bending for dramatic curved color bands
  const float WAVE_SHARPNESS = 0.1; // Ultra smooth wave transitions
  
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
  
  // === SINGLE DIRECTIONAL TAPER FUNCTION ===
  // Creates a single triangle taper per edge: thick at start (pos=0), thin at end (pos=1)
  // Like a wedge - high on one side, slopes down to the other
  float getOrganicEdgeOffset(float pos, float edgeSeed, float paneId) {
    // No wave offset - edges stay perfectly straight
    return 0.0;
  }
  
  // Get edge width - single directional taper (NOT symmetric)
  // Thick at pos=0 (e.g. left/bottom), linearly tapers to thin at pos=1 (e.g. right/top)
  // Creates one wedge/triangle shape per edge
  float getOrganicEdgeWidth(float pos, float paneId, float baseWidth) {
    // pos ranges from 0 to 1 along the edge
    // Single direction taper: thick at 0, thin at 1
    float taper = 1.0 - pos;
    
    // Per-pane variation in taper strength
    float paneVar = fract(sin(paneId * 127.1) * 43758.5453);
    float taperStrength = 0.85 + paneVar * 0.3;
    
    // Width multiplier: high at pos=0, low at pos=1
    // u_organicEdgeIntensity controls the max thickness at the thick end
    float widthMult = 1.0 + taper * u_organicEdgeIntensity * taperStrength;
    
    return widthMult;
  }

  // === MULTI-BAND EDGE GRADIENT FUNCTION ===
  // Creates smooth flowing gradients with organic color transitions
  // Like the reference image: beautiful smooth curves with warm->cool transitions
  vec3 getMultiBandEdgeColor(
    float edgeDist,      // Distance from edge (0 at edge, increases inward)
    float edgePos,       // Position along edge (0-1) for curvature
    float paneId,        // Unique pane ID for variation
    float bandCount,     // Number of color bands
    float bandSpread,    // How wide the band region is
    float curvature,     // How much bands curve
    float hardness,      // Sharpness of band transitions
    float warmColorAmt,  // Warm color intensity
    float coolColorAmt,  // Cool color intensity
    bool isWarmEdge      // true for left/bottom (warm), false for right/top (cool)
  ) {
    // Per-pane variation for organic look
    float paneVar = fract(sin(paneId * 127.1) * 43758.5453);
    float paneVar2 = fract(sin(paneId * 269.5) * 43758.5453);
    float paneVar3 = fract(sin(paneId * 183.3) * 43758.5453);
    
    // Organic curvature: flowing curves along the edge
    // Creates the beautiful sweeping curves seen in reference
    float curveOffset = sin(edgePos * 2.5 + paneVar * 4.0) * curvature * 0.35;
    curveOffset += sin(edgePos * 1.2 + paneVar2 * 3.0) * curvature * 0.25;
    curveOffset += sin(edgePos * 4.0 + paneVar3 * 5.0) * curvature * 0.1; // subtle detail
    
    // Adjusted edge distance with smooth curvature
    float adjustedDist = edgeDist + curveOffset * bandSpread * 0.25;
    adjustedDist = max(0.0, adjustedDist);
    
    // Normalize distance to band region (0-1 within the band spread)
    float bandRegionWidth = bandSpread * 0.4; // Wider region for smoother gradients
    float normalizedDist = clamp(adjustedDist / bandRegionWidth, 0.0, 1.0);
    
    // Apply smooth curve to normalized distance for organic falloff
    normalizedDist = pow(normalizedDist, 0.85);
    
    // Define color palette for bands - matched to reference
    // Rich warm colors
    vec3 deepOrange = vec3(1.0, 0.4, 0.08);
    vec3 amber = vec3(1.0, 0.65, 0.18);
    vec3 warmYellow = vec3(1.0, 0.8, 0.3);
    vec3 softPink = vec3(1.0, 0.55, 0.65);
    
    // Transition colors
    vec3 teal = vec3(0.15, 0.88, 0.78);
    vec3 cyan = vec3(0.35, 0.92, 1.0);
    vec3 skyBlue = vec3(0.45, 0.78, 1.0);
    
    // Cool colors
    vec3 deepBlue = vec3(0.08, 0.18, 0.68);
    vec3 royalBlue = vec3(0.12, 0.32, 0.88);
    
    // Apply warm/cool color adjustments with more saturation
    deepOrange = mix(deepOrange, vec3(1.0, 0.5, 0.12), warmColorAmt * 0.4);
    amber = mix(amber, vec3(1.0, 0.6, 0.22), warmColorAmt * 0.35);
    deepBlue = mix(deepBlue, vec3(0.06, 0.14, 0.72), coolColorAmt * 0.35);
    royalBlue = mix(royalBlue, vec3(0.1, 0.28, 0.92), coolColorAmt * 0.35);
    
    // Band edge softness - softer for organic look
    float edgeSoftness = mix(0.2, 0.06, hardness);
    
    // Compute band positions with per-pane variation
    float bandOffset = paneVar * 0.08;
    
    // Result color - use smooth gradient mixing
    vec3 bandColor;
    
    if (isWarmEdge) {
      // Warm edge: orange at edge -> smooth gradient through cyan to blue
      // Use smooth bezier-like interpolation for organic flow
      
      // Primary gradient: orange -> amber -> teal/cyan -> blue
      float orangeZone = 1.0 - smoothstep(0.0, 0.18 + bandOffset, normalizedDist);
      float amberZone = smoothstep(0.08, 0.25 + bandOffset, normalizedDist) * 
                        (1.0 - smoothstep(0.25, 0.42 + bandOffset, normalizedDist));
      float tealZone = smoothstep(0.22, 0.45 + bandOffset, normalizedDist) * 
                       (1.0 - smoothstep(0.45, 0.65 + bandOffset, normalizedDist));
      float cyanZone = smoothstep(0.4, 0.62 + bandOffset, normalizedDist) * 
                       (1.0 - smoothstep(0.62, 0.82 + bandOffset, normalizedDist));
      float blueZone = smoothstep(0.6, 0.85 + bandOffset, normalizedDist);
      
      // Smooth blending with overlapping zones
      bandColor = deepOrange * orangeZone;
      bandColor = mix(bandColor, amber, smoothstep(0.05, 0.22, normalizedDist) * 0.9);
      bandColor = mix(bandColor, warmYellow, amberZone * 0.5);
      bandColor = mix(bandColor, teal, tealZone * 0.85);
      bandColor = mix(bandColor, cyan, cyanZone * 0.8);
      bandColor = mix(bandColor, skyBlue, smoothstep(0.55, 0.75, normalizedDist) * 0.4);
      bandColor = mix(bandColor, royalBlue, blueZone * 0.7);
      
      // Add pink/magenta accent in transition zone
      float pinkAccent = smoothstep(0.15, 0.35, normalizedDist) * 
                         (1.0 - smoothstep(0.35, 0.55, normalizedDist));
      bandColor = mix(bandColor, softPink, pinkAccent * 0.25 * paneVar2);
      
    } else {
      // Cool edge: blue at edge -> smooth gradient through cyan to orange
      
      float blueZone = 1.0 - smoothstep(0.0, 0.16 + bandOffset, normalizedDist);
      float royalZone = smoothstep(0.06, 0.22 + bandOffset, normalizedDist) * 
                        (1.0 - smoothstep(0.22, 0.4 + bandOffset, normalizedDist));
      float cyanZone = smoothstep(0.18, 0.42 + bandOffset, normalizedDist) * 
                       (1.0 - smoothstep(0.42, 0.6 + bandOffset, normalizedDist));
      float tealZone = smoothstep(0.38, 0.58 + bandOffset, normalizedDist) * 
                       (1.0 - smoothstep(0.58, 0.78 + bandOffset, normalizedDist));
      float amberZone = smoothstep(0.55, 0.82 + bandOffset, normalizedDist);
      
      // Smooth blending
      bandColor = deepBlue * blueZone;
      bandColor = mix(bandColor, royalBlue, smoothstep(0.04, 0.2, normalizedDist) * 0.9);
      bandColor = mix(bandColor, skyBlue, royalZone * 0.6);
      bandColor = mix(bandColor, cyan, cyanZone * 0.85);
      bandColor = mix(bandColor, teal, tealZone * 0.8);
      bandColor = mix(bandColor, amber, amberZone * 0.65);
      bandColor = mix(bandColor, deepOrange, smoothstep(0.75, 0.95, normalizedDist) * 0.5);
    }
    
    // Add organic variation based on position along edge - gentler modulation
    float posVar = sin(edgePos * 8.0 + paneVar2 * 6.0) * 0.04 + 0.98;
    posVar *= sin(edgePos * 3.0 + paneVar3 * 4.0) * 0.03 + 0.99;
    bandColor *= posVar;
    
    // Subtle brightness variation for depth
    float depthVar = 1.0 + (paneVar - 0.5) * 0.08;
    bandColor *= depthVar;
    
    return bandColor;
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
  
  // Background color - VIBRANT flowing gradients like the reference
  // Creates smooth, beautiful color curves that will be distorted by cylindrical lens
  vec3 getBackgroundColor(vec2 uv, float time, float paneColorShift) {
    // Very slow shimmer
    float shimmerTime = time * u_speed * 0.5;
    float shimmerAmt = u_shimmerIntensity;
    
    // Scale for noise sampling
    float scale = u_noiseScale;
    
    // Per-pane offset for color variety
    vec2 paneOffset = vec2(paneColorShift * 1.2, paneColorShift * 0.6);
    vec2 samplePos = uv + paneOffset;
    
    // SMOOTH large-scale noise for flowing color regions
    float n1 = staticNoise(samplePos * 0.3 * scale, shimmerTime, shimmerAmt);
    float n2 = staticNoise(samplePos * 0.4 * scale + vec2(3.7, 2.1), shimmerTime * 0.4, shimmerAmt);
    float n3 = staticNoise(samplePos * 0.25 * scale + vec2(1.5, 5.3), shimmerTime * 0.3, shimmerAmt);
    
    // Normalize to 0-1
    float t1 = n1 * 0.5 + 0.5;
    float t2 = n2 * 0.5 + 0.5;
    float t3 = n3 * 0.5 + 0.5;
    
    // Very gentle contrast for smooth gradients
    float contrast = u_colorContrast;
    t1 = clamp((t1 - 0.5) * contrast + 0.5, 0.0, 1.0);
    t2 = clamp((t2 - 0.5) * contrast + 0.5, 0.0, 1.0);
    t3 = clamp((t3 - 0.5) * contrast + 0.5, 0.0, 1.0);
    
    // VIBRANT colors from uniforms
    vec3 cyan = u_color1;
    vec3 deepBlue = u_color2;
    vec3 red = u_color3;
    vec3 orange = u_color4;
    vec3 pink = u_color5;
    vec3 white = u_color6;
    vec3 teal = u_color7;
    
    // === SIMPLE, BEAUTIFUL FLOWING GRADIENT ===
    // The key is smooth blending between vibrant colors
    
    // Create a base position-based gradient
    float posGrad = samplePos.y * 0.5 + samplePos.x * 0.3;
    posGrad = fract(posGrad + t1 * 0.5);
    
    // Use sine-based smooth blending for organic color flow
    float blend1 = sin(posGrad * 6.28318 + t2 * 3.0) * 0.5 + 0.5;
    float blend2 = sin(posGrad * 4.0 + t1 * 4.0 + 1.0) * 0.5 + 0.5;
    float blend3 = sin(posGrad * 8.0 + t3 * 2.0) * 0.5 + 0.5;
    
    // Start with cyan-blue base
    vec3 col = mix(cyan, deepBlue, blend1);
    
    // Blend in warm colors (orange) where blend2 is high
    col = mix(col, orange, blend2 * smoothstep(0.3, 0.7, t2));
    
    // Add pink/magenta accents
    float pinkMix = smoothstep(0.4, 0.8, blend3) * smoothstep(0.3, 0.6, t1);
    col = mix(col, pink, pinkMix * 0.8);
    
    // Add teal transitions
    float tealMix = smoothstep(0.5, 0.8, blend1) * (1.0 - blend2 * 0.5);
    col = mix(col, teal, tealMix * 0.5);
    
    // Deep blue shadows
    float shadowMix = (1.0 - blend1) * (1.0 - blend2) * smoothstep(0.2, 0.5, 1.0 - t1);
    col = mix(col, deepBlue * 0.3, shadowMix * 0.8);
    
    // Add some red/vermillion where orange is strong
    float redMix = smoothstep(0.6, 0.9, blend2) * smoothstep(0.4, 0.7, t3);
    col = mix(col, red, redMix * 0.4);
    
    // Subtle white highlights
    float whiteMix = smoothstep(0.85, 0.95, blend1) * smoothstep(0.7, 0.9, blend3);
    col = mix(col, white, whiteMix * 0.3);
    
    // === ADDITIONAL COLOR BLENDING for smooth transitions ===
    float blendFactor = u_colorMix;
    
    // Cyan-orange gradient blend
    vec3 warmCoolMix = mix(cyan, orange, smoothstep(0.3, 0.7, blend2));
    col = mix(col, warmCoolMix, 0.2 * blendFactor);
    
    // Pink-blue gradient blend
    vec3 pinkBlueMix = mix(deepBlue, pink, smoothstep(0.35, 0.65, blend3));
    col = mix(col, pinkBlueMix, 0.15 * blendFactor);
    
    // HIGH saturation for vibrant colors
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, u_saturation);
    
    // Brightness
    col *= u_brightness;
    
    // Ensure colors stay vibrant (prevent muddy colors)
    col = max(col, vec3(0.0));
    
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
  // Creates beautiful flowing S-curves like the reference image
  // The key is strong horizontal displacement that varies smoothly along Y
  vec2 getInternalWaveDistortion(float barX, float barY, float paneRand1, float paneRand2, float paneRand3) {
    vec2 distort = vec2(0.0);
    
    // Phase offset per pane for variety - CRITICAL for different curve shapes per bar
    float phaseOffset = paneRand1 * 6.28318;
    float phaseOffset2 = paneRand2 * 6.28318;
    
    // === STRONG CYLINDRICAL LENS EFFECT ===
    // This creates the primary curved distortion within each bar
    float centerDist = barX - 0.5; // -0.5 to 0.5
    
    // Smooth lens profile - parabolic for realistic glass
    float lensStrength = 1.0 - 4.0 * centerDist * centerDist; // Parabola: 1 at center, 0 at edges
    lensStrength = max(0.0, lensStrength);
    
    // === PRIMARY S-CURVE WAVE ===
    // This is the KEY effect - creates the beautiful sweeping curves
    // Large amplitude sine wave that creates horizontal displacement
    float sCurve = sin(barY * INTERNAL_WAVES * 3.14159 * 2.0 + phaseOffset);
    
    // Add secondary wave for more organic shape
    float sCurve2 = sin(barY * INTERNAL_WAVES * 1.5 * 3.14159 + phaseOffset2) * 0.4;
    
    // Combine waves for complex organic curve
    float totalCurve = sCurve + sCurve2;
    
    // Apply lens profile - strongest in center of bar
    distort.x = totalCurve * WAVE_AMPLITUDE * 0.15 * lensStrength;
    
    // === PER-PANE CURVE DIRECTION ===
    // Some bars curve left-then-right, others right-then-left
    float curveDirection = (paneRand1 - 0.5) * 2.0; // -1 to 1
    distort.x *= mix(0.5, 1.5, abs(curveDirection));
    
    // Add overall bend bias per pane
    float bendBias = curveDirection * 0.1 * WAVE_AMPLITUDE * lensStrength;
    distort.x += bendBias;
    
    // === HORIZONTAL COMPRESSION AT EDGES ===
    // Creates the pinched look at bar edges, pushing colors toward center
    float edgeCompression = centerDist * WAVE_AMPLITUDE * 0.08;
    distort.x += edgeCompression;
    
    // === SMOOTH VERTICAL FLOW ===
    // Subtle vertical displacement for more organic feel
    float vWave = sin(barY * 1.5 * 3.14159 + phaseOffset) * 0.5;
    vWave += cos(barY * 0.8 * 3.14159 + phaseOffset2) * 0.3;
    distort.y = vWave * WAVE_AMPLITUDE * 0.03;
    
    // === VERY SMOOTH EDGE FALLOFF ===
    // Gentle falloff at bar edges
    float edgeFade = smoothstep(0.0, 0.08, barX) * smoothstep(1.0, 0.92, barX);
    distort *= edgeFade;
    
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
    
    // Shape selection flags (UI): 0=Rectangle, 1=Triangle (>=2 treated as legacy/unused)
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
    
    // === EDGE REFRACTION - THE KEY TO MATCHING REFERENCE ===
    // Create strong cylindrical lens effect at bar edges
    // This is applied BEFORE sampling to create true glass refraction
    
    float edgeW = u_edgeWidth;
    float edgeRefractStrength = u_edgeRefraction * 3.5; // Strong amplification for dramatic pinching
    
    // === ORGANIC EDGE CALCULATIONS ===
    // Create unique pane ID for consistent edge wave per pane
    float paneId = colIndex * 7.3 + rowIndex * 13.1;
    
    // Edge offset is now 0 - edges stay straight
    // The organic effect comes from the taper (thick at corners, thin in middle)
    float leftEdgeWave = getOrganicEdgeOffset(barY, 1.0, paneId) * edgeW * 4.0;
    float rightEdgeWave = getOrganicEdgeOffset(barY, 2.0, paneId) * edgeW * 4.0;
    float topEdgeWave = getOrganicEdgeOffset(barX, 3.0, paneId) * edgeW * 4.0;
    float bottomEdgeWave = getOrganicEdgeOffset(barX, 4.0, paneId) * edgeW * 4.0;
    
    // Get organic edge width variation - thick at corners, thin in middle
    float leftEdgeWidthMult = getOrganicEdgeWidth(barY, paneId + 1.0, edgeW);
    float rightEdgeWidthMult = getOrganicEdgeWidth(barY, paneId + 2.0, edgeW);
    float topEdgeWidthMult = getOrganicEdgeWidth(barX, paneId + 3.0, edgeW);
    float bottomEdgeWidthMult = getOrganicEdgeWidth(barX, paneId + 4.0, edgeW);
    
    // Distance from each edge (0 at edge, increases toward center)
    // Edges stay straight - no wave offset applied
    float leftDist = barX - leftEdgeWave;
    float rightDist = (1.0 - barX) - rightEdgeWave;
    
    // Store organic edge width multipliers for later use
    float organicEdgeW_left = edgeW * leftEdgeWidthMult;
    float organicEdgeW_right = edgeW * rightEdgeWidthMult;
    float organicEdgeW_top = edgeW * topEdgeWidthMult;
    float organicEdgeW_bottom = edgeW * bottomEdgeWidthMult;
    
    // Cylindrical lens profile - creates rounded glass edge effect
    // Softer profile for more organic, flowing curves like reference
    float edgeZoneWidth = edgeW * 15.0; // Wider edge zone for smoother transition
    
    // Left edge: lens curves inward - creates compression/stretching
    // Softer falloff for more organic look
    float leftEdgeFactor = 1.0 - smoothstep(0.0, edgeZoneWidth, leftDist);
    leftEdgeFactor = pow(leftEdgeFactor, 0.5); // Softer curve for organic flow
    
    // Right edge: same but mirrored
    float rightEdgeFactor = 1.0 - smoothstep(0.0, edgeZoneWidth, rightDist);
    rightEdgeFactor = pow(rightEdgeFactor, 0.5);
    
    // Combined edge factor (how much we're in any edge zone)
    float inEdgeZone = max(leftEdgeFactor, rightEdgeFactor);
    
    // Edge refraction offset - creates the "pinched" look
    // Colors get squeezed/compressed at the edges like looking through a cylindrical lens
    float edgeRefractionX = 0.0;
    
    // Strong inward compression at edges - this is the key effect
    edgeRefractionX -= leftEdgeFactor * edgeRefractStrength * 0.12; // Left edge: pull view inward
    edgeRefractionX += rightEdgeFactor * edgeRefractStrength * 0.12; // Right edge: pull view inward
    
    // Additional nonlinear squeeze for more dramatic effect near very edge
    float leftSqueeze = pow(1.0 - smoothstep(0.0, edgeW * 4.0, leftDist), 0.5);
    float rightSqueeze = pow(1.0 - smoothstep(0.0, edgeW * 4.0, rightDist), 0.5);
    edgeRefractionX -= leftSqueeze * edgeRefractStrength * 0.08;
    edgeRefractionX += rightSqueeze * edgeRefractStrength * 0.08;
    
    // Add a "rounding" effect - the cylindrical lens magnifies center, compresses edges
    float cylinderProfile = sin(barX * 3.14159); // 0 at edges, 1 at center
    float cylinderLens = (1.0 - cylinderProfile) * edgeRefractStrength * 0.06;
    
    // Per-pane variation in edge refraction direction
    float paneEdgeBend = (paneRand.x - 0.5) * 0.3;
    edgeRefractionX += inEdgeZone * paneEdgeBend * edgeRefractStrength * 0.04;
    
    // Base UV for sampling background - static per bar
    vec2 sampleUv = uv + refractOffset;
    
    // Apply edge refraction
    sampleUv.x += edgeRefractionX;
    
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
    
    // === ENHANCED CHROMATIC ABERRATION WITH STRONG EDGE SPLITTING ===
    // Key feature: MUCH stronger color splitting at edges for glass prism effect
    float chromaBase = u_chromaStrength;
    // Chromatic aberration increases DRAMATICALLY toward edges of each bar
    float chromaVariance = 1.0 + (paneRand.x - 0.5) * u_paneBendVariance;
    
    // Edge-based chromatic boost - this is critical for matching reference
    float edgeChromaticBoost = inEdgeZone * 4.0; // Strong boost at edges
    float chromaEdge = chromaBase * (1.0 + abs(centerDist) * 2.5 + edgeChromaticBoost) * chromaVariance;
    
    // Additional chromatic split at internal wave peaks (more pronounced)
    float wavePeakChroma = abs(sin(barY * INTERNAL_WAVES * 3.14159 + paneRand.y * 6.28));
    wavePeakChroma = pow(wavePeakChroma, 0.5); // Wider peaks
    chromaEdge *= (1.0 + wavePeakChroma * 0.8);
    
    // Per-pane chromatic direction variation
    float chromaAngle = paneRand.y * 3.14159 * 0.3 * u_paneBendVariance;
    vec2 chromaDir = vec2(cos(chromaAngle), sin(chromaAngle));
    
    vec3 col;
    
    // === MULTI-SAMPLE CHROMATIC ABERRATION WITH EDGE ENHANCEMENT ===
    // Sample at multiple points with different offsets for richer color splitting
    // CRITICAL: Much stronger separation at edges for glass prism effect
    
    // Edge direction - at left edge push red right, at right edge push red left
    float edgeDirection = leftEdgeFactor - rightEdgeFactor; // -1 at right edge, +1 at left edge
    float edgeChromaMult = inEdgeZone * u_edgeChroma * 0.5;
    
    // Primary chromatic split - enhanced at edges
    vec2 redOffset = chromaDir * chromaEdge + vec2(chromaEdge * 0.3, 0.0);
    // Add strong edge-based red shift
    redOffset.x += edgeDirection * edgeChromaMult * 0.15;
    redOffset.x -= inEdgeZone * edgeChromaMult * 0.08; // Red shifts outward at edges
    vec2 redUv = sampleUv + redOffset;
    
    // Green stays more central
    vec2 greenUv = sampleUv + chromaDir * chromaEdge * 0.1;
    
    // Blue shifts opposite to red
    vec2 blueOffset = -chromaDir * chromaEdge + vec2(-chromaEdge * 0.2, 0.0);
    blueOffset.x -= edgeDirection * edgeChromaMult * 0.12;
    blueOffset.x += inEdgeZone * edgeChromaMult * 0.06; // Blue shifts inward at edges
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
    // edgeW already defined above in edge refraction section
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
    // leftDist and rightDist already defined above in edge refraction section
    // Apply organic wave to top/bottom edges as well
    float topDist = (1.0 - barY) - topEdgeWave;
    float bottomDist = barY - bottomEdgeWave;

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
    // Create thick beveled glass edges with HARD top edge, linear taper down (triangular profile)
    // Use organic edge widths for tapered bevel contours
    float bevelWidth_L = organicEdgeW_left * 4.0;
    float bevelWidth_R = organicEdgeW_right * 4.0;
    float bevelWidth_T = organicEdgeW_top * 4.0;
    float bevelWidth_B = organicEdgeW_bottom * 4.0;
    float outerBevelWidth_L = organicEdgeW_left * 2.0;
    float outerBevelWidth_R = organicEdgeW_right * 2.0;
    float outerBevelWidth_T = organicEdgeW_top * 2.0;
    float outerBevelWidth_B = organicEdgeW_bottom * 2.0;

    // HARD edge at top of bevel, linear taper down (triangular cross-section)
    // Use step for hard start, linear falloff for taper
    float hardEdgeThreshold = 0.001; // Very tight for hard edge
    
    // Left edge - hard start, linear taper
    float leftBevelStart = step(hardEdgeThreshold, leftDist);
    float leftBevelTaper = 1.0 - clamp(leftDist / bevelWidth_L, 0.0, 1.0);
    float leftOuterBevel = leftBevelStart * leftBevelTaper;
    
    // Right edge - hard start, linear taper
    float rightBevelStart = step(hardEdgeThreshold, rightDist);
    float rightBevelTaper = 1.0 - clamp(rightDist / bevelWidth_R, 0.0, 1.0);
    float rightOuterBevel = rightBevelStart * rightBevelTaper;
    
    // Top edge - hard start, linear taper
    float topBevelStart = step(hardEdgeThreshold, topDist);
    float topBevelTaper = 1.0 - clamp(topDist / bevelWidth_T, 0.0, 1.0);
    float topOuterBevel = topBevelStart * topBevelTaper;
    
    // Bottom edge - hard start, linear taper  
    float bottomBevelStart = step(hardEdgeThreshold, bottomDist);
    float bottomBevelTaper = 1.0 - clamp(bottomDist / bevelWidth_B, 0.0, 1.0);
    float bottomOuterBevel = bottomBevelStart * bottomBevelTaper;

    // Inner bevel zone - slight darkening toward center transition
    float leftInnerBevel = smoothstep(bevelWidth_L * 0.6, bevelWidth_L, leftDist) * (1.0 - smoothstep(bevelWidth_L, bevelWidth_L * 1.3, leftDist));
    float rightInnerBevel = smoothstep(bevelWidth_R * 0.6, bevelWidth_R, rightDist) * (1.0 - smoothstep(bevelWidth_R, bevelWidth_R * 1.3, rightDist));
    float topInnerBevel = smoothstep(bevelWidth_T * 0.6, bevelWidth_T, topDist) * (1.0 - smoothstep(bevelWidth_T, bevelWidth_T * 1.3, topDist));
    float bottomInnerBevel = smoothstep(bevelWidth_B * 0.6, bevelWidth_B, bottomDist) * (1.0 - smoothstep(bevelWidth_B, bevelWidth_B * 1.3, bottomDist));
    
    // === PRIMARY EDGE LINES (warm amber on left/bottom edges) ===
    // Use organic edge widths for undulating, tapered hard edges
    float edgeSoftness = 0.003; // Sharper edges for hard edge look
    float innerBevelStart_L = organicEdgeW_left * 0.8;
    float innerBevelEnd_L = organicEdgeW_left * 2.5;
    float innerBevelStart_R = organicEdgeW_right * 0.8;
    float innerBevelEnd_R = organicEdgeW_right * 2.5;
    float innerBevelStart_T = organicEdgeW_top * 0.8;
    float innerBevelEnd_T = organicEdgeW_top * 2.5;
    float innerBevelStart_B = organicEdgeW_bottom * 0.8;
    float innerBevelEnd_B = organicEdgeW_bottom * 2.5;

    // LEFT EDGE - Primary warm orange line with organic width
    // Hard edge with sharper cutoff for the split light effect
    float leftPrimaryLine = smoothstep(-edgeSoftness, edgeSoftness, leftDist);
    leftPrimaryLine *= (1.0 - smoothstep(organicEdgeW_left * 0.35, organicEdgeW_left * 0.55, leftDist));

    // Left edge inner gradient (beveled glass depth) - follows organic contour
    float leftBevelGrad = smoothstep(0.0, innerBevelEnd_L, leftDist);
    float leftInnerZone = smoothstep(organicEdgeW_left * 0.4, innerBevelStart_L, leftDist) * (1.0 - smoothstep(innerBevelStart_L, innerBevelEnd_L, leftDist));

    // RIGHT EDGE - Cool blue/white highlight with organic width
    float rightPrimaryLine = smoothstep(-edgeSoftness, edgeSoftness, rightDist);
    rightPrimaryLine *= (1.0 - smoothstep(organicEdgeW_right * 0.3, organicEdgeW_right * 0.5, rightDist));

    // Right edge bevel - organic contour
    float rightInnerZone = smoothstep(organicEdgeW_right * 0.35, organicEdgeW_right * 0.7, rightDist) * (1.0 - smoothstep(organicEdgeW_right * 0.7, innerBevelEnd_R * 0.7, rightDist));

    // TOP EDGE - Cool blue/white highlight with organic width
    float topPrimaryLine = smoothstep(-edgeSoftness, edgeSoftness, topDist);
    topPrimaryLine *= (1.0 - smoothstep(organicEdgeW_top * 0.3, organicEdgeW_top * 0.5, topDist));

    // Top edge inner gradient - organic contour
    float topInnerZone = smoothstep(organicEdgeW_top * 0.35, organicEdgeW_top * 0.7, topDist) * (1.0 - smoothstep(organicEdgeW_top * 0.7, innerBevelEnd_T * 0.7, topDist));

    // BOTTOM EDGE - Warm orange/amber with organic width
    float bottomPrimaryLine = smoothstep(-edgeSoftness, edgeSoftness, bottomDist);
    bottomPrimaryLine *= (1.0 - smoothstep(organicEdgeW_bottom * 0.35, organicEdgeW_bottom * 0.55, bottomDist));

    // Bottom edge inner gradient - organic contour
    float bottomInnerZone = smoothstep(organicEdgeW_bottom * 0.4, innerBevelStart_B, bottomDist) * (1.0 - smoothstep(innerBevelStart_B, innerBevelEnd_B, bottomDist));
    
    // === CHROMATIC EDGE REFRACTION ===
    // Create color splitting at edges like real glass refraction
    // Use organic bevel widths for undulating chromatic zones
    float leftEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd_L * 1.5, leftDist);
    float rightEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd_R * 1.2, rightDist);
    float topEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd_T * 1.2, topDist);
    float bottomEdgeZone = 1.0 - smoothstep(0.0, innerBevelEnd_B * 1.5, bottomDist);
    
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
    
    // === MULTI-BAND EDGE GRADIENTS ===
    // Apply complex inner gradients with multiple color bands, bending, and hard bevels
    // Like the reference: orange -> amber -> cyan/teal -> deep blue with curved transitions
    float paneIdForBands = colIndex * 7.3 + rowIndex * 13.1;
    
    // Compute multi-band colors for each edge
    vec3 leftBandColor = getMultiBandEdgeColor(
      leftDist, barY, paneIdForBands, 
      u_edgeBandCount, u_edgeBandSpread, u_edgeBandCurvature, u_edgeBandHardness,
      u_edgeWarmColor, u_edgeCoolColor, true
    );
    vec3 rightBandColor = getMultiBandEdgeColor(
      rightDist, barY, paneIdForBands + 1.0,
      u_edgeBandCount, u_edgeBandSpread, u_edgeBandCurvature, u_edgeBandHardness,
      u_edgeWarmColor, u_edgeCoolColor, false
    );
    vec3 topBandColor = getMultiBandEdgeColor(
      topDist, barX, paneIdForBands + 2.0,
      u_edgeBandCount, u_edgeBandSpread, u_edgeBandCurvature, u_edgeBandHardness,
      u_edgeWarmColor, u_edgeCoolColor, false
    );
    vec3 bottomBandColor = getMultiBandEdgeColor(
      bottomDist, barX, paneIdForBands + 3.0,
      u_edgeBandCount, u_edgeBandSpread, u_edgeBandCurvature, u_edgeBandHardness,
      u_edgeWarmColor, u_edgeCoolColor, true
    );
    
    // Edge band zones - where to apply the multi-band effect
    float bandRegionWidth = u_edgeBandSpread * 0.35;
    float leftBandZone = 1.0 - smoothstep(0.0, bandRegionWidth, leftDist);
    float rightBandZone = 1.0 - smoothstep(0.0, bandRegionWidth, rightDist);
    float topBandZone = 1.0 - smoothstep(0.0, bandRegionWidth, topDist);
    float bottomBandZone = 1.0 - smoothstep(0.0, bandRegionWidth, bottomDist);
    
    // Apply inner glow intensity control
    float glowIntensity = u_edgeInnerGlow * edgeIntensity;
    
    // Blend multi-band colors with existing edge colors
    col = mix(col, leftBandColor, leftBandZone * glowIntensity * 0.6);
    col = mix(col, rightBandColor, rightBandZone * glowIntensity * 0.5);
    col = mix(col, topBandColor, topBandZone * glowIntensity * 0.45);
    col = mix(col, bottomBandColor, bottomBandZone * glowIntensity * 0.6);
    
    // === ORGANIC CYLINDRICAL EDGE EFFECT - MATCHING REFERENCE ===
    // The reference shows glass bars with:
    // 1. Very thin dark gap/shadow lines between bars (nearly black)
    // 2. Smooth, organic rounded edges like cylindrical glass rods
    // 3. Subtle 3D depth with smooth gradient falloff at edges
    
    // === GAP/SEPARATION LINES - MATCHING REFERENCE ===
    // Reference shows thin gray/dark lines between bars with subtle 3D depth
    float gapWidth = 0.012; // Thin gap matching reference
    
    // Calculate distances from edges directly (barX/barY are local 0-1 coords)
    float leftDistGap = barX;
    float rightDistGap = 1.0 - barX;
    float bottomDistGap = barY;
    float topDistGap = 1.0 - barY;
    
    // Gap intensity for each edge - sharp falloff
    float leftGap = smoothstep(gapWidth, 0.0, leftDistGap);
    float rightGap = smoothstep(gapWidth, 0.0, rightDistGap);
    float topGap = smoothstep(gapWidth, 0.0, topDistGap);
    float bottomGap = smoothstep(gapWidth, 0.0, bottomDistGap);
    
    // Combined gap intensity with sharp falloff
    float gapIntensity = max(max(leftGap, rightGap), max(topGap, bottomGap));
    gapIntensity = pow(gapIntensity, 0.5); // Sharp edge
    
    // Gap color - neutral dark gray like reference
    vec3 gapColor = vec3(0.06, 0.06, 0.08);
    
    // Apply gap as solid dark line
    col = mix(col, gapColor, gapIntensity * 0.95);
    
    // === SMOOTH CYLINDRICAL EDGE GRADIENT ===
    // Creates the smooth, organic rounded look of glass rods
    // Subtle darkening that follows a smooth parabolic curve from edge to center
    
    float cylinderWidth = 0.045; // Width of the smooth gradient zone
    
    // Left edge - smooth parabolic falloff
    float leftCylinder = 1.0 - smoothstep(0.0, cylinderWidth, leftDist);
    leftCylinder = leftCylinder * leftCylinder; // Parabolic curve for natural glass look
    
    // Right edge - smooth parabolic falloff
    float rightCylinder = 1.0 - smoothstep(0.0, cylinderWidth, rightDist);
    rightCylinder = rightCylinder * rightCylinder;
    
    // Top/bottom edges - same treatment for consistent look
    float topCylinder = 1.0 - smoothstep(0.0, cylinderWidth * 0.7, topDist);
    topCylinder = topCylinder * topCylinder;
    float bottomCylinder = 1.0 - smoothstep(0.0, cylinderWidth * 0.7, bottomDist);
    bottomCylinder = bottomCylinder * bottomCylinder;
    
    // Combine - take max of all edges for consistent treatment
    float cylinderDarkening = max(max(leftCylinder, rightCylinder), 
                                   max(topCylinder, bottomCylinder));
    
    // Apply subtle darkening - reduces brightness at edges smoothly
    // Exclude the gap zone (don't double-darken)
    float edgeDarkeningAmount = cylinderDarkening * (1.0 - gapIntensity) * 0.25;
    col *= (1.0 - edgeDarkeningAmount);
    
    // === SUBTLE SPECULAR HIGHLIGHT ===
    // Very thin bright highlight just inside the edge (like light reflecting off rounded glass)
    float highlightStart = 0.015;
    float highlightEnd = 0.035;
    
    // Left edge - thin highlight band
    float leftHighlight = smoothstep(gapWidth, highlightStart, leftDist) *
                          smoothstep(highlightEnd, highlightStart, leftDist);
    
    // Right edge - thin highlight band  
    float rightHighlight = smoothstep(gapWidth, highlightStart, rightDist) *
                           smoothstep(highlightEnd, highlightStart, rightDist);
    
    // Apply subtle white highlight
    vec3 highlightColor = vec3(1.0, 0.99, 0.97); // Slightly warm white
    col = mix(col, highlightColor, leftHighlight * 0.08 * edgeIntensity);
    col = mix(col, highlightColor, rightHighlight * 0.06 * edgeIntensity);
    
    // Keep colors clean - no additional processing
    
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
          boxShadow: isOpen ? "0 0 0 2px rgba(var(--glass-fg-rgb), 0.5)" : "none",
        }}
      />
      <span
        className="value-badge"
        style={{
          color: "rgba(var(--glass-fg-rgb), 0.5)",
          fontSize: 9,
          fontFamily: "monospace",
          textTransform: "uppercase",
          background: "rgba(var(--glass-fg-rgb), var(--glass-value-bg-alpha))",
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
                  background: "var(--glass-picker-bg)",
                  boxShadow: "0 4px 20px rgba(var(--glass-shadow-rgb), 0.5)",
                },
                saturation: {
                  borderRadius: "4px 4px 0 0",
                },
                hue: {
                  borderRadius: "2px",
                },
                activeColor: {
                  boxShadow: "inset 0 0 0 1px rgba(var(--glass-fg-rgb), 0.1)",
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
type GlassTheme = "light" | "dark" | "high-contrast";

const GLASS_THEME_OPTIONS: Array<{ id: GlassTheme; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "high-contrast", label: "High Contrast" },
];

type GlassThemeCssVars = Record<`--${string}`, string>;

const GLASS_THEME_VARS: Record<GlassTheme, GlassThemeCssVars> = {
  light: {
    "--glass-fg-rgb": "17, 24, 39",
    "--glass-bg-rgb": "255, 255, 255",
    "--glass-shadow-rgb": "15, 23, 42",
    "--glass-header-bg-alpha": "0.75",
    "--glass-body-bg-alpha": "0.68",
    "--glass-header-hover-alpha": "0.82",
    "--glass-border-alpha": "0.22",
    "--glass-tab-active-bg-alpha": "0.16",
    "--glass-tab-inactive-bg-alpha": "0.07",
    "--glass-tab-active-border-alpha": "0.32",
    "--glass-tab-inactive-border-alpha": "0.18",
    "--glass-input-bg-alpha": "0.10",
    "--glass-value-bg-alpha": "0.12",
    "--glass-track-active-alpha": "0.45",
    "--glass-track-inactive-alpha": "0.18",
    "--glass-picker-bg": "#f8fafc",
    "--glass-picker-input-bg": "#ffffff",
    "--glass-picker-text": "#111827",
    "--glass-select-option-bg": "#ffffff",
    "--glass-select-option-text": "#111827",
    "--glass-slider-thumb-color": "#111827",
  },
  dark: {
    "--glass-fg-rgb": "255, 255, 255",
    "--glass-bg-rgb": "0, 0, 0",
    "--glass-shadow-rgb": "0, 0, 0",
    "--glass-header-bg-alpha": "0.6",
    "--glass-body-bg-alpha": "0.5",
    "--glass-header-hover-alpha": "0.65",
    "--glass-border-alpha": "0.15",
    "--glass-tab-active-bg-alpha": "0.2",
    "--glass-tab-inactive-bg-alpha": "0.05",
    "--glass-tab-active-border-alpha": "0.3",
    "--glass-tab-inactive-border-alpha": "0.1",
    "--glass-input-bg-alpha": "0.08",
    "--glass-value-bg-alpha": "0.1",
    "--glass-track-active-alpha": "0.35",
    "--glass-track-inactive-alpha": "0.12",
    "--glass-picker-bg": "#1a1a1a",
    "--glass-picker-input-bg": "#2a2a2a",
    "--glass-picker-text": "#ffffff",
    "--glass-select-option-bg": "#1a1a1a",
    "--glass-select-option-text": "#ffffff",
    "--glass-slider-thumb-color": "#ffffff",
  },
  "high-contrast": {
    "--glass-fg-rgb": "255, 255, 255",
    "--glass-bg-rgb": "0, 0, 0",
    "--glass-shadow-rgb": "0, 0, 0",
    "--glass-header-bg-alpha": "0.92",
    "--glass-body-bg-alpha": "0.9",
    "--glass-header-hover-alpha": "1",
    "--glass-border-alpha": "0.65",
    "--glass-tab-active-bg-alpha": "0.34",
    "--glass-tab-inactive-bg-alpha": "0.12",
    "--glass-tab-active-border-alpha": "0.85",
    "--glass-tab-inactive-border-alpha": "0.5",
    "--glass-input-bg-alpha": "0.2",
    "--glass-value-bg-alpha": "0.24",
    "--glass-track-active-alpha": "0.7",
    "--glass-track-inactive-alpha": "0.28",
    "--glass-picker-bg": "#000000",
    "--glass-picker-input-bg": "#000000",
    "--glass-picker-text": "#ffffff",
    "--glass-select-option-bg": "#000000",
    "--glass-select-option-text": "#ffffff",
    "--glass-slider-thumb-color": "#ffffff",
  },
};

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
  const [glassTheme, setGlassThemeState] = useState<GlassTheme>("dark");
  
  // Load saved corner and collapsed state on mount, then mark as hydrated
  useEffect(() => {
    const savedCorner = loadSavedCorner();
    const initialTheme = loadSavedTheme();
    setCornerState(savedCorner);
    setIsCollapsedState(loadSavedCollapsed());
    setGlassThemeState(initialTheme);
    
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

  const setGlassTheme = useCallback((theme: GlassTheme) => {
    setGlassThemeState(theme);
    saveTheme(theme);
  }, []);

  const syncThemeWithVSCode = useCallback(() => {
    setGlassTheme(detectVSCodeThemeCategory());
  }, [setGlassTheme]);
  
  const isCollapsed = isCollapsedState;
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [savedParams, setSavedParams] = useState<ShaderParams>(defaultParams);
  const [snappedPosition, setSnappedPosition] = useState<{ x: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const panelThemeVars = GLASS_THEME_VARS[glassTheme] as React.CSSProperties;

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
    // Temperature slider controls both warm and cool (inverse relationship)
    if (key === "edgeWarmColor") {
      onChange({ 
        ...params, 
        edgeWarmColor: value,
        edgeCoolColor: 1 - value, // Cool is inverse of warm
      });
    } else {
      onChange({ ...params, [key]: value });
    }
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
    { key: "noiseScale", label: "Pattern Scale", min: 0.1, max: 3, step: 0.1, section: "glass" },
    // Edge controls (separate section)
    { key: "edgeWidth", label: "Width", min: 0.01, max: 0.1, step: 0.005, section: "edges" },
    { key: "edgeWarmth", label: "Warmth", min: 0, max: 1, step: 0.05, section: "edges" },
    { key: "edgeRefraction", label: "Refraction", min: 0, max: 1, step: 0.05, section: "edges" },
    { key: "edgeBevelDepth", label: "Bevel Depth", min: 0, max: 1, step: 0.05, section: "edges" },
    { key: "edgeChroma", label: "Chroma Split", min: 0, max: 1, step: 0.05, section: "edges" },
    { key: "glassEdgeIntensity", label: "Intensity", min: 0, max: 2, step: 0.1, section: "edges" },
    { key: "organicEdgeIntensity", label: "Organic Taper", min: 0, max: 2, step: 0.1, section: "edges" },
    { key: "organicEdgeFrequency", label: "Taper Variance", min: 0.2, max: 3, step: 0.1, section: "edges" },
    // Edge gradient/band controls
    { key: "edgeBandCount", label: "Band Count", min: 1, max: 5, step: 1, section: "edges" },
    { key: "edgeBandSpread", label: "Band Spread", min: 0.1, max: 1.5, step: 0.05, section: "edges" },
    { key: "edgeBandCurvature", label: "Band Curvature", min: 0, max: 1, step: 0.05, section: "edges" },
    { key: "edgeBandHardness", label: "Band Hardness", min: 0, max: 1, step: 0.05, section: "edges" },
    { key: "edgeInnerGlow", label: "Inner Glow", min: 0, max: 1, step: 0.05, section: "edges" },
    // Combined warm/cool as Temperature (0 = warm, 1 = cool)
    { key: "edgeWarmColor", label: "Temperature", min: 0, max: 1, step: 0.05, section: "edges" },
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
    { id: "edges", label: "Edges", icon: Square },
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
        background: "rgba(var(--glass-bg-rgb), var(--glass-header-bg-alpha))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: getHeaderBorderRadius(),
        border: "1px solid rgba(var(--glass-fg-rgb), var(--glass-border-alpha))",
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
            color: "rgba(var(--glass-fg-rgb), 0.9)",
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
            color="rgba(var(--glass-fg-rgb), 0.6)"
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
              color: "rgba(var(--glass-fg-rgb), 0.7)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(var(--glass-fg-rgb), 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(var(--glass-fg-rgb), 0.7)";
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
              color: "rgba(var(--glass-fg-rgb), 0.7)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(var(--glass-fg-rgb), 1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(var(--glass-fg-rgb), 0.7)";
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
      style={{ ...getPositionStyles(), ...panelThemeVars }}
    >
      {/* Header - render first if top corners */}
      {isTop && headerElement}

      {/* Controls Body */}
      {!isCollapsed && (
        <div
          className="controls-body"
          data-position={isTop ? "top" : "bottom"}
          style={{
            background: "rgba(var(--glass-bg-rgb), var(--glass-body-bg-alpha))",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: getBodyBorderRadius(),
            border: "1px solid rgba(var(--glass-fg-rgb), var(--glass-border-alpha))",
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
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "rgba(var(--glass-fg-rgb), 0.55)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Theme
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {GLASS_THEME_OPTIONS.map(({ id, label }) => {
                const isActive = glassTheme === id;
                return (
                  <button
                    key={id}
                    className="section-tab"
                    type="button"
                    data-active={isActive}
                    onClick={() => setGlassTheme(id)}
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      background: isActive
                        ? "rgba(var(--glass-fg-rgb), var(--glass-tab-active-bg-alpha))"
                        : "rgba(var(--glass-fg-rgb), var(--glass-tab-inactive-bg-alpha))",
                      border: isActive
                        ? "1px solid rgba(var(--glass-fg-rgb), var(--glass-tab-active-border-alpha))"
                        : "1px solid rgba(var(--glass-fg-rgb), var(--glass-tab-inactive-border-alpha))",
                      borderRadius: 6,
                      color: isActive
                        ? "rgba(var(--glass-fg-rgb), 0.96)"
                        : "rgba(var(--glass-fg-rgb), 0.68)",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                className="section-tab"
                type="button"
                onClick={syncThemeWithVSCode}
                style={{
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "rgba(var(--glass-fg-rgb), var(--glass-tab-inactive-bg-alpha))",
                  border: "1px solid rgba(var(--glass-fg-rgb), var(--glass-tab-inactive-border-alpha))",
                  borderRadius: 6,
                  color: "rgba(var(--glass-fg-rgb), 0.72)",
                  cursor: "pointer",
                }}
              >
                Match VS Code
              </button>
            </div>
          </div>

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
                  background: activeSection === id
                    ? "rgba(var(--glass-fg-rgb), var(--glass-tab-active-bg-alpha))"
                    : "rgba(var(--glass-fg-rgb), var(--glass-tab-inactive-bg-alpha))",
                  border: activeSection === id
                    ? "1px solid rgba(var(--glass-fg-rgb), var(--glass-tab-active-border-alpha))"
                    : "1px solid rgba(var(--glass-fg-rgb), var(--glass-tab-inactive-border-alpha))",
                  borderRadius: 6,
                  color: activeSection === id
                    ? "rgba(var(--glass-fg-rgb), 0.95)"
                    : "rgba(var(--glass-fg-rgb), 0.6)",
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
                    color: "rgba(var(--glass-fg-rgb), 0.5)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Shape
                </div>
                <select
                  value={params.borderShape}
                  onChange={(e) => {
                    const next: 0 | 1 = e.target.value === "1" ? 1 : 0;
                    onChange({ ...params, borderShape: next });
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    fontSize: 13,
                    background: "rgba(var(--glass-fg-rgb), var(--glass-input-bg-alpha))",
                    border: "1px solid rgba(var(--glass-fg-rgb), var(--glass-border-alpha))",
                    borderRadius: 6,
                    color: "rgba(var(--glass-fg-rgb), 0.95)",
                    cursor: "pointer",
                    outline: "none",
                    paddingRight: 12,
                  }}
                >
                  <option value={0} style={{ background: "var(--glass-select-option-bg)", color: "var(--glass-select-option-text)" }}>Rectangle</option>
                  <option value={1} style={{ background: "var(--glass-select-option-bg)", color: "var(--glass-select-option-text)" }}>Triangle</option>
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
                  <span style={{ fontSize: 12, color: "rgba(var(--glass-fg-rgb), 0.7)" }}>Size</span>
                  <span style={{ fontSize: 11, color: "rgba(var(--glass-fg-rgb), 0.4)", fontFamily: "monospace" }}>
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
                    background: `linear-gradient(to right, rgba(var(--glass-fg-rgb), var(--glass-track-active-alpha)) 0%, rgba(var(--glass-fg-rgb), var(--glass-track-active-alpha)) ${((params.cols - 4) / 56) * 100}%, rgba(var(--glass-fg-rgb), var(--glass-track-inactive-alpha)) ${((params.cols - 4) / 56) * 100}%, rgba(var(--glass-fg-rgb), var(--glass-track-inactive-alpha)) 100%)`,
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
                        color: "rgba(var(--glass-fg-rgb), 0.8)",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </label>
                    <span
                      className="value-badge"
                      style={{
                        color: "rgba(var(--glass-fg-rgb), 0.5)",
                        fontSize: 11,
                        fontFamily: "monospace",
                        background: "rgba(var(--glass-fg-rgb), var(--glass-value-bg-alpha))",
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
                      background: `linear-gradient(to right, rgba(var(--glass-fg-rgb), var(--glass-track-active-alpha)) 0%, rgba(var(--glass-fg-rgb), var(--glass-track-active-alpha)) ${((params[key] as number - min) / (max - min)) * 100}%, rgba(var(--glass-fg-rgb), var(--glass-track-inactive-alpha)) ${((params[key] as number - min) / (max - min)) * 100}%, rgba(var(--glass-fg-rgb), var(--glass-track-inactive-alpha)) 100%)`,
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
          box-shadow: 0 2px 8px rgba(var(--glass-fg-rgb), 0.1);
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
          box-shadow: 0 4px 12px rgba(var(--glass-shadow-rgb), 0.3);
        }

        /* Keep picker aligned with active Glass window theme */
        .sketch-picker {
          background: var(--glass-picker-bg) !important;
        }
        .sketch-picker input {
          background: var(--glass-picker-input-bg) !important;
          color: var(--glass-picker-text) !important;
          border: 1px solid rgba(var(--glass-fg-rgb), 0.1) !important;
          box-shadow: none !important;
        }
        .sketch-picker label {
          color: rgba(var(--glass-fg-rgb), 0.6) !important;
        }
        .sketch-picker span {
          color: rgba(var(--glass-fg-rgb), 0.6) !important;
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
          background: var(--glass-slider-thumb-color);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(var(--glass-shadow-rgb), 0.3);
          transition: transform 150ms var(--spring),
                      box-shadow 150ms var(--ease-out-expo);
          will-change: transform;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 3px 10px rgba(var(--glass-shadow-rgb), 0.4);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(var(--glass-shadow-rgb), 0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--glass-slider-thumb-color);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(var(--glass-shadow-rgb), 0.3);
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
          background: rgba(var(--glass-bg-rgb), var(--glass-header-hover-alpha));
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
const THEME_STORAGE_KEY = "glassBarShaderTheme_v1";

function isGlassTheme(value: string | null): value is GlassTheme {
  return value === "light" || value === "dark" || value === "high-contrast";
}

function detectVSCodeThemeCategory(): GlassTheme {
  if (typeof window === "undefined") return "dark";

  const bodyClasses = document.body?.classList;
  const rootClasses = document.documentElement.classList;
  const classNames = new Set<string>([
    ...(bodyClasses ? Array.from(bodyClasses) : []),
    ...Array.from(rootClasses),
  ]);

  if (
    classNames.has("vscode-high-contrast") ||
    classNames.has("vscode-high-contrast-light")
  ) {
    return "high-contrast";
  }
  if (classNames.has("vscode-light")) return "light";
  if (classNames.has("vscode-dark")) return "dark";

  const themeHints = [
    document.body?.dataset.vscodeThemeKind,
    document.documentElement.dataset.vscodeThemeKind,
    document.body?.dataset.vscodeThemeName,
    document.documentElement.dataset.vscodeThemeName,
    document.body?.dataset.vscodeThemeClass,
    document.documentElement.dataset.vscodeThemeClass,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (themeHints.includes("high") && themeHints.includes("contrast")) return "high-contrast";
  if (themeHints.includes("light")) return "light";
  if (themeHints.includes("dark")) return "dark";

  if (window.matchMedia("(forced-colors: active)").matches) {
    return "high-contrast";
  }
  if (window.matchMedia("(prefers-contrast: more)").matches) {
    return "high-contrast";
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function loadSavedTheme(): GlassTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (isGlassTheme(saved)) return saved;

    const detected = detectVSCodeThemeCategory();
    localStorage.setItem(THEME_STORAGE_KEY, detected);
    return detected;
  } catch {
    return detectVSCodeThemeCategory();
  }
}

function saveTheme(theme: GlassTheme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

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
      organicEdgeIntensity: gl.getUniformLocation(program, "u_organicEdgeIntensity"),
      organicEdgeFrequency: gl.getUniformLocation(program, "u_organicEdgeFrequency"),
      edgeBandCount: gl.getUniformLocation(program, "u_edgeBandCount"),
      edgeBandSpread: gl.getUniformLocation(program, "u_edgeBandSpread"),
      edgeBandCurvature: gl.getUniformLocation(program, "u_edgeBandCurvature"),
      edgeBandHardness: gl.getUniformLocation(program, "u_edgeBandHardness"),
      edgeInnerGlow: gl.getUniformLocation(program, "u_edgeInnerGlow"),
      edgeWarmColor: gl.getUniformLocation(program, "u_edgeWarmColor"),
      edgeCoolColor: gl.getUniformLocation(program, "u_edgeCoolColor"),
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
    gl.uniform1f(locs.organicEdgeIntensity, params.organicEdgeIntensity);
    gl.uniform1f(locs.organicEdgeFrequency, params.organicEdgeFrequency);
    gl.uniform1f(locs.edgeBandCount, params.edgeBandCount);
    gl.uniform1f(locs.edgeBandSpread, params.edgeBandSpread);
    gl.uniform1f(locs.edgeBandCurvature, params.edgeBandCurvature);
    gl.uniform1f(locs.edgeBandHardness, params.edgeBandHardness);
    gl.uniform1f(locs.edgeInnerGlow, params.edgeInnerGlow);
    gl.uniform1f(locs.edgeWarmColor, params.edgeWarmColor);
    gl.uniform1f(locs.edgeCoolColor, params.edgeCoolColor);
    // Clamp to supported UI options (rectangle/triangle).
    const safeBorderShape: 0 | 1 = params.borderShape === 1 ? 1 : 0;
    gl.uniform1f(locs.borderShape, safeBorderShape);
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
