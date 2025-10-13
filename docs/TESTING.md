# Testing Instructions - n8n-nodes-veed

## Quick Start Testing

### 1. Start the Development Server

```bash
cd /Users/d.baltak/Veed/n8n-nodes-veed
pnpm dev
```

This will:

- Compile the node
- Start n8n at `http://localhost:5678`
- Load your Veed node automatically
- Watch for changes and rebuild

### 2. Access n8n

1. Open your browser to `http://localhost:5678`
2. Create an account or sign in
3. You'll see the n8n workflow editor

### 3. Set Up Credentials

1. Click on your user icon → **Settings** → **Credentials**
2. Click **Add Credential**
3. Search for "Fal.ai API"
4. Enter your fal.ai API key:
   - Get it from: https://fal.ai/dashboard/keys
   - Paste the key (starts with `fal_`)
5. Click **Save**

### 4. Create Test Workflow

**Option A: Import a Dev Workflow Example (Recommended)**

1. In n8n (running at `localhost:5678`), click **Workflows** → **Import from File**
2. Navigate to `./dev-workflow-examples/` in this repository on your local machine
3. Select one of the example workflow JSON files:
   - `simple-text-to-video.json` - Basic test with demo assets
   - `text-to-video-showcase.json` - Full pipeline (requires OpenAI/Twitter credentials)
4. The workflow will be imported with pre-configured settings
5. Skip to step 6 to execute

**Option B: Create a New Workflow from Scratch**

1. Create a new workflow
2. Add a **Manual Trigger** node (already added by default)
3. Click the **+** button to add another node
4. Search for "Veed"
5. Select the **Veed** node
6. Continue to step 5 to configure

### 5. Configure the Veed Node

**Required Parameters:**

- **Resource**: Fabric (pre-selected)
- **Operation**: Generate Video (pre-selected)
- **Model Version**: Fabric 1.0 (Standard) or Fast
- **Image URL**:
  ```
  https://storage.googleapis.com/veed-public-assets/test-portrait.jpg
  ```
- **Audio URL**:
  ```
  https://storage.googleapis.com/veed-public-assets/test-speech.mp3
  ```
- **Resolution**: 480p (for faster testing)
- **Aspect Ratio**: 16:9

**Optional (Advanced):**

- Click "Add Option" to configure:
  - Polling Interval: 5 seconds (default)
  - Timeout: 10 minutes (default)

### 6. Execute the Workflow

1. Click **Test workflow** button (top right)
2. Watch the execution:
   - You'll see "Executing..." status
   - Check the logs for progress updates: "Generation progress: 45%"
   - Wait 1-5 minutes for completion (depending on audio length and resolution)
3. When complete, you'll see the output data:
   ```json
   {
   	"requestId": "req_...",
   	"status": "completed",
   	"videoUrl": "https://fal-cdn.com/...",
   	"duration": 30000
   }
   ```
4. Copy the `videoUrl` and open in browser to verify the video

---

## Test Checklist

### Basic Functionality ✅

- [ ] Node appears in n8n palette
- [ ] Icon displays correctly (purple "V")
- [ ] Credential type is available
- [ ] Can add and save fal.ai API credential
- [ ] All parameters display correctly
- [ ] Default values are set
- [ ] Hints are visible
- [ ] Notice about API key is shown

### Video Generation ✅

- [ ] Successfully generates video with valid inputs
- [ ] Progress updates appear in logs (0%, 25%, 50%, 75%, 100%)
- [ ] Returns valid video URL
- [ ] Video URL is accessible

### Error Handling ✅

- [ ] Invalid API key shows clear error
- [ ] Invalid image URL shows validation error
- [ ] Invalid audio URL shows validation error
- [ ] Timeout shows clear message
- [ ] Network errors handled gracefully

### Different Configurations ✅

- [ ] 480p resolution works
- [ ] 720p resolution works (slower)
- [ ] 16:9 aspect ratio works
- [ ] 9:16 aspect ratio works
- [ ] 1:1 aspect ratio works
- [ ] Standard model works
- [ ] Fast model works (faster)

### Advanced Features ✅

- [ ] Custom polling interval works
- [ ] Custom timeout works

---

## Troubleshooting Testing Issues

### Node doesn't appear in palette

```bash
# Rebuild and restart
pnpm build
# Stop dev server (Ctrl+C)
pnpm dev
```

### Changes not reflecting

- Refresh the browser (F5)
- Some changes may require restart of dev server

### API key not working

- Verify key from https://fal.ai/dashboard/keys
- Ensure no extra spaces when pasting
- Try creating a new API key

### Generation takes too long

- Use 480p resolution (faster)
- Use Fast model variant
- Use shorter audio file
- Increase timeout in Options
