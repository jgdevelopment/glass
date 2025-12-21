# Design Experiments

A collection of interactive design experiments built with Next.js, featuring stunning WebGL shader effects.

![Glass Bar Shader](https://img.shields.io/badge/WebGL-Shader-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Featured: Glass Bar Shader

A real-time WebGL shader that creates a mesmerizing stained glass effect with:

- **Grid of Glass Panes** - Configurable rows and columns creating a beveled glass tile pattern
- **Refraction Effects** - Realistic light bending through glass with chromatic aberration
- **8 Customizable Colors** - Full RGB control over the color palette with color picker
- **Dynamic Edge Effects** - Beveled edges with warmth, refraction, and chromatic separation
- **Noise Textures** - Organic grain and subtle texture for visual depth
- **Per-Pane Variations** - Each glass pane has unique distortion and color shifting
- **Multiple Border Shapes** - Rectangle, triangle, wave, zigzag, and hexagon patterns
- **Real-time Controls** - Interactive UI to tweak every parameter live

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/design-experiments.git
cd design-experiments

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the experiment in your browser.

### Build

```bash
npm run build
npm start
```

## Shader Parameters

The Glass Bar Shader offers extensive customization through the following parameter groups:

### Grid Settings
| Parameter | Description | Default |
|-----------|-------------|---------|
| `cols` | Number of columns | 28 |
| `rows` | Number of rows | 6 |

### Glass Effects
| Parameter | Description | Default |
|-----------|-------------|---------|
| `refractionStrength` | Intensity of light bending | 0.15 |
| `chromaStrength` | Chromatic aberration intensity | 0.03 |
| `speed` | Animation speed | 0.0 |
| `noiseScale` | Scale of noise pattern | 0.25 |
| `saturation` | Color saturation | 1.55 |
| `brightness` | Overall brightness | 1.0 |
| `glassEdgeIntensity` | Edge highlight strength | 1.0 |
| `shimmerIntensity` | Shimmer/sparkle effect | 0.0 |

### Edge Controls
| Parameter | Description | Default |
|-----------|-------------|---------|
| `edgeWidth` | Width of glass edges | 0.025 |
| `edgeWarmth` | Warm color tint on edges | 0.85 |
| `edgeRefraction` | Edge refraction amount | 0.6 |
| `edgeBevelDepth` | 3D bevel depth | 0.75 |
| `edgeChroma` | Edge chromatic separation | 0.5 |

### Noise Texture
| Parameter | Description | Default |
|-----------|-------------|---------|
| `noiseTextureDensity` | Grain density | 800.0 |
| `noiseTextureIntensity` | Grain visibility | 0.012 |
| `noiseTextureSaturation` | Grain color saturation | 0.05 |
| `noiseTextureSpeed` | Grain animation speed | 0.0 |

### Color Palette
8 fully customizable colors using RGB values (0.0 - 1.0):
- **Color 1**: Bright Cyan (default: `#60D8F8`)
- **Color 2**: Deep Royal Blue (default: `#1535B8`)
- **Color 3**: Vermillion Red (default: `#E02010`)
- **Color 4**: Golden Orange (default: `#F88515`)
- **Color 5**: Pink/Magenta (default: `#E058A8`)
- **Color 6**: Pure White (default: `#FFFFFF`)
- **Color 7**: Teal/Aqua (default: `#20E8E0`)
- **Color 8**: Deep Blue (default: `#2830A8`)

### Per-Pane Variation
| Parameter | Description | Default |
|-----------|-------------|---------|
| `paneBendVariance` | Variation in pane distortion | 0.65 |
| `paneColorShift` | Color variation between panes | 0.85 |
| `paneDistortVariance` | Distortion variance | 0.55 |

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[WebGL](https://www.khronos.org/webgl/)** - GPU-accelerated graphics
- **[Lucide React](https://lucide.dev/)** - Beautiful icons
- **[React Color](https://casesandberg.github.io/react-color/)** - Color picker components

## 📁 Project Structure

```
design-experiments/
├── app/
│   ├── components/
│   │   └── GlassBarShader.tsx   # Main shader component
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── public/                      # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions

- New shader effects and experiments
- Performance optimizations
- Additional control options
- Preset save/load functionality
- Export to image/video
- Mobile touch controls
- Accessibility improvements

## License

This project is open source and available under the [MIT License](LICENSE).

---

Made by [Jason Ginsberg](https://github.com/jgdevelopment)
