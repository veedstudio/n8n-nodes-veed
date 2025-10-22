# n8n-nodes-veed

Generate AI talking videos from images and audio using the Veed Fabric API. Automate creation of realistic talking videos, animation videos and AI avatars directly in your n8n workflows.

## Features

- **Fabric Video Generation**: Create AI-powered talking head videos from images and audio
- Powered by [fal.ai](https://fal.ai)
- Support for multiple model versions (Standard & Fast)
- Real-time progress tracking via streaming status updates
- Configurable timeouts

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in n8n
2. Search for `veed`
3. Click **Install**

### Manual Installation

```bash
npm install n8n-nodes-veed
```

## Prerequisites

- A fal.ai account ([sign up](https://fal.ai))
- A fal.ai personal API key ([get your key](https://fal.ai/dashboard/keys))
- n8n version 0.200.0 or higher
- Node.js 22 or higher

## Setup

1. In n8n, create a new **Fal.ai API** credential
2. Paste your personal API key
3. Add the **VEED AI Video API** node to your workflow

## Usage

### Fabric Video Generation

Generate realistic talking head videos from a still image and audio file.

#### Parameters

**Image URL** (required)

- Portrait image URL for the talking head
- Best results: Front-facing photos, clear facial features
- Supported formats: JPG, PNG, WebP

**Audio URL** (required)

- Speech audio URL for lip sync
- Supported formats: MP3, WAV, M4A, AAC

**Model Version**

- **Fabric 1.0**: Lower price
- **Fabric 1.0 Fast**: Faster generation, higher price

**Resolution**

- `480p`: Faster generation
- `720p`: Higher quality

**Aspect Ratio**

- `16:9`: Landscape (YouTube, presentations)
- `9:16`: Portrait (TikTok, Instagram Stories, Reels)
- `1:1`: Square (Instagram Feed, LinkedIn)

#### Options (Advanced)

**Timeout** (default: 10 minutes)

- Maximum time to wait for generation
- Recommended: 10+ minutes for longer videos, 15+ for 720p
- Range: 1-60 minutes
- Note: The node uses fal.ai's streaming API for real-time status updates

## 🎬 Showcase Workflows

> **Note:** These workflow examples are available in the repository for local development/testing only. They are not included in the published npm package.

Ready-to-use workflow templates demonstrating the Veed Fabric node in complete pipelines:

### 1. **Simple Text-to-Video** (Beginner-Friendly)

A minimal workflow to test the Veed Fabric node with pre-made assets.

**What it does:**

- Uses demo image and audio URLs
- Generates a talking head video using Fabric Fast model
- Shows generation progress and results
- Formats output with video URL and generation time

**Import:** `dev-workflow-examples/simple-text-to-video.json`

---

### 2. **Complete Text-to-Video Ad Generator** (Advanced)

Full automated pipeline from text prompt to social media post.

**What it does:**

```
Text Prompt ("animated bear advertising sunglasses")
    ↓
🤖 OpenAI GPT-4o-mini → Generates ad script + character description
    ↓
🎨 OpenAI DALL-E 3 → Creates character image
    ↓
🎙️ StreamElements TTS → Converts script to voice (FREE)
    ↓
🎬 Veed Fabric → Generates talking head video
    ↓
🐦 Twitter/X → Posts video with caption
```

**Import:** `dev-workflow-examples/text-to-video-showcase.json`

**Services used:**

- 💰 **OpenAI GPT-4o-mini** ($5 free trial, ~$0.01/video) - Script generation
- 💰 **OpenAI DALL-E 3** ($5 free trial, ~$0.04/image) - Image generation
- ✅ **StreamElements TTS** (FREE, no API key needed) - Text-to-speech
- 💰 **fal.ai** (Pay-per-use, ~$0.08-0.20/second) - Video generation
- ✅ **Twitter/X API** (FREE tier) - Social posting

---

### 💡 Quick Start with Showcase Workflows

> **Prerequisites:** These workflows are only available when running the node in development mode. See [Development](#development) section below for setup instructions.

1. **Import a workflow:**

   ```
   n8n (localhost:5678) → Workflows → Import from File → Select JSON from dev-workflow-examples/
   ```

2. **Set up credentials:**
   - **Simple workflow:** Only fal.ai API key required
   - **Advanced workflow:** OpenAI API key, Twitter OAuth2 credentials, fal.ai API key

3. **Customize:**
   - **Simple:** Replace imageUrl and audioUrl in "📝 Set Demo Image & Audio" node
   - **Advanced:** Change adPrompt in "📝 Set Ad Concept" node
   - Adjust video settings (resolution, aspect ratio)

4. **Execute and wait:**
   - Click "Test Workflow" button
   - Watch progress in execution logs

5. **Use your video:**
   - Get video URL from output
   - Download and use in your content
   - Automatically posted to Twitter (advanced workflow)

## Performance

- **Generation time**: Depending on audio length and video resolution
- **Progress updates**: Real-time progress shown in execution logs
- **Timeout handling**: Configurable timeout with clear error messages

## Troubleshooting

Having issues? See the [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for detailed solutions to common problems:

- Authentication errors
- Generation timeouts
- Invalid URL errors
- Rate limits
- Network issues
- And more...

## Compatibility

- **n8n**: 0.200.0+
- **Node.js**: 22+
- **Supported platforms**: Linux, macOS, Windows

## Resources

- [Veed Fabric Model on fal.ai](https://fal.ai/models/veed/fabric-1.0)
- [Fabric Playground](https://fal.ai/models/veed/fabric-1.0/playground)
- [fal.ai Documentation](https://docs.fal.ai)
- [Report Issues](https://github.com/veedstudio/n8n-nodes-veed/issues)
- [n8n Community Forum](https://community.n8n.io)

## Development

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
```

### Local Development

```bash
pnpm dev  # Starts n8n with your node at localhost:5678
```

For detailed testing instructions, see [docs/TESTING.md](docs/TESTING.md)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `pnpm lint:fix`
6. Submit a pull request

### n8n Community Node Restrictions

When contributing, be aware of n8n's community node restrictions:

- **❌ No `setTimeout` or `setInterval`**: These global timers are not allowed.
- **✅ Required properties**: All nodes must have `usableAsTool` property
- **✅ Credentials**: Must have `icon` and `test` properties

## License

MIT

## Support

For issues and questions:

- [GitHub Issues](https://github.com/veedstudio/n8n-nodes-veed/issues)
- [n8n Community Forum](https://community.n8n.io)

---
