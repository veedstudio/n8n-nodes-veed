# n8n-nodes-veed

Interact with Veed AI services in your n8n workflows.

## Features

- **Fabric Video Generation**: Create AI-powered talking head videos from images and audio
- Powered by [fal.ai](https://fal.ai)
- Support for multiple model versions (Standard & Fast)
- Automatic progress tracking during generation
- Configurable timeouts and polling intervals

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
3. Add the **Veed** node to your workflow

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
- Duration: Automatically detected from audio file

**Model Version**

- **Fabric 1.0 (Standard)**: Higher quality (recommended for final output)
- **Fabric 1.0 Fast**: Faster generation (good for testing and iterations)

**Resolution**

- `480p`: Faster generation (~5-8 minutes)
- `720p`: Higher quality (~10-15 minutes)

**Aspect Ratio**

- `16:9`: Landscape (YouTube, presentations)
- `9:16`: Portrait (TikTok, Instagram Stories, Reels)
- `1:1`: Square (Instagram Feed, LinkedIn)

#### Options (Advanced)

**Polling Interval** (default: 5 seconds)

- How often to check generation status
- Lower = more frequent updates, more API calls
- Range: 1-30 seconds

**Timeout** (default: 10 minutes)

- Maximum time to wait for generation
- Recommended: 10+ minutes for longer videos, 15+ for 720p
- Range: 1-60 minutes

### Example: Basic Video Generation

```json
{
	"nodes": [
		{
			"type": "n8n-nodes-veed.veed",
			"name": "Generate Video",
			"parameters": {
				"resource": "fabric",
				"operation": "generateVideo",
				"model": "fal-ai/veed/fabric-1.0",
				"imageUrl": "https://example.com/portrait.jpg",
				"audioUrl": "https://example.com/speech.mp3",
				"resolution": "720p",
				"aspectRatio": "16:9"
			},
			"credentials": {
				"falAiApi": "your-credential-name"
			}
		}
	]
}
```

### Example: Batch Processing

Use with CSV or database inputs to generate multiple videos:

1. Read data source (CSV, Airtable, Google Sheets)
2. Connect to Veed node
3. Use expressions: `={{ $json['image_url'] }}` and `={{ $json['audio_url'] }}`
4. Process results and save

## Performance

- **Generation time**: 5-15 minutes depending on video length and resolution
- **Progress updates**: Real-time progress shown in execution logs
- **Timeout handling**: Configurable timeout with clear error messages
- **Batch support**: Use "Continue on Fail" for batch operations

## Troubleshooting

### Authentication Failed

- Verify your API key is correct (copy-paste from fal.ai dashboard)
- Check that the API key hasn't expired
- Try generating a new API key

### Generation Timeout

- Increase timeout in Options (default: 10 minutes)
- Use 480p resolution for faster generation
- Try the "Fast" model variant
- Check [fal.ai status](https://status.fal.ai) for service issues

### Invalid URL Errors

- Ensure URLs are publicly accessible (not behind authentication)
- Verify file extensions (.jpg, .png, .webp for images; .mp3, .wav, etc. for audio)
- Test URLs in your browser
- Use HTTPS URLs (not HTTP)

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
pnpm test:ui       # Vitest UI
pnpm test:coverage # Coverage report
```

### Local Development

```bash
pnpm dev  # Starts n8n with your node at localhost:5678
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `pnpm lint:fix`
6. Submit a pull request

## License

MIT

## Support

For issues and questions:

- [GitHub Issues](https://github.com/veedstudio/n8n-nodes-veed/issues)
- [n8n Community Forum](https://community.n8n.io)

---
