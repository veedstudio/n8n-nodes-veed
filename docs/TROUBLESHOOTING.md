# Troubleshooting Guide - n8n-nodes-veed

## Common Issues

### Authentication Failed

**Symptoms:**

- 401 or 403 error when executing node
- Error message: "Authentication failed"

**Solutions:**

1. Verify your API key is correct:
   - Go to [fal.ai dashboard](https://fal.ai/dashboard/keys)
   - Copy the API key carefully
   - Paste into n8n credentials (no extra spaces)
2. Check API key hasn't expired
3. Ensure API key has appropriate permissions
4. Try generating a new API key if issues persist

---

### Generation Times Out

**Symptoms:**

- Node execution fails after 10+ minutes
- Error: "Video generation timed out"

**Solutions:**

1. **Increase timeout** in Options:
   - Click "Add Option" → "Timeout (Minutes)"
   - Set to 15 minutes or higher
2. **Use faster settings**:
   - Select "Fabric 1.0 Fast" model
   - Use 480p resolution instead of 720p
3. **Check fal.ai status**:
   - Visit [fal.ai status page](https://status.fal.ai)
   - High queue times may cause delays
4. **Try off-peak hours**: Queue is usually shorter during non-peak times

---

### Invalid Image URL

**Symptoms:**

- Error: "Invalid image URL format"
- Error: "Image URL must point to a valid image file"

**Solutions:**

1. **Check URL accessibility**:
   - Open URL in browser - should display image
   - Ensure URL is publicly accessible (not behind authentication)
   - No login or permissions required
2. **Verify file extension**:
   - URL must end with .jpg, .jpeg, .png, or .webp
   - Example: `https://example.com/photo.jpg` ✅
   - Not: `https://example.com/photo` ❌
3. **Use HTTPS**:
   - Prefer HTTPS over HTTP
   - Example: `https://...` ✅
4. **Test the URL**:
   ```bash
   curl -I https://your-image-url.jpg
   # Should return 200 OK with content-type: image/jpeg
   ```

---

### Invalid Audio URL

**Symptoms:**

- Error: "Invalid audio URL format"
- Error: "Audio URL must point to a valid audio file"

**Solutions:**

1. **Check URL accessibility**:
   - Open URL in browser - should play/download audio
   - Ensure publicly accessible
2. **Verify file extension**:
   - Must be: .mp3, .wav, .m4a, or .aac
   - Example: `https://example.com/speech.mp3` ✅
3. **Check audio duration**:
   - Very short audio (< 1 second) may fail
   - Very long audio (> 5 minutes) may timeout
4. **Test the URL**:
   ```bash
   curl -I https://your-audio-url.mp3
   # Should return 200 OK with content-type: audio/mpeg
   ```

---

### Rate Limit Exceeded

**Symptoms:**

- 429 error from fal.ai API
- Error: "Rate limit exceeded"

**Solutions:**

1. **Wait before retrying**:
   - fal.ai implements rate limits based on account tier
   - Wait 1-5 minutes before trying again
2. **Reduce concurrent executions**:
   - Don't run multiple generations simultaneously
   - Use batch processing with delays
3. **Upgrade fal.ai account**:
   - Higher tiers have higher rate limits
   - Check [fal.ai pricing](https://fal.ai/pricing)
4. **Implement queuing**:
   - Use n8n's "Wait" node between requests
   - Add delays in batch workflows

---

### Network Errors

**Symptoms:**

- "Network error: Unable to reach fal.ai API"
- Connection timeouts

**Solutions:**

1. Check internet connection
2. Verify firewall isn't blocking fal.ai domains
3. Check if fal.ai is accessible:
   ```bash
   curl https://fal.run/health
   ```
4. Try again - temporary network issues are common

---

### Generation Failed

**Symptoms:**

- Error: "Video generation failed"
- Status shows FAILED

**Solutions:**

1. **Check input quality**:
   - Image should have clear, visible face
   - Audio should be clear speech
   - Avoid extremely noisy or distorted inputs
2. **Try different inputs**:
   - Test with known-good example files
   - Verify image dimensions (not too small/large)
3. **Review fal.ai logs**:
   - Check error message for specific failure reason
   - May indicate content policy violations

---

## Debug Mode

Enable verbose logging to troubleshoot issues:

1. Check n8n execution logs
2. Look for progress updates: "Generation progress: 45%"
3. Review any error stack traces
4. Note the request_id for fal.ai support inquiries

## Getting Help

1. **Check this guide** first for common solutions
2. **Search GitHub Issues**: [n8n-nodes-veed issues](https://github.com/veedstudio/n8n-nodes-veed/issues)
3. **Ask the community**: [n8n Community Forum](https://community.n8n.io)
4. **Report bugs**: [Create new issue](https://github.com/veedstudio/n8n-nodes-veed/issues/new)

When reporting issues, include:

- n8n version
- Node version
- Error message (full text)
- Request ID (if available)
- Steps to reproduce

## FAQ

**Q: How long does video generation take?**
A: Typically 5-15 minutes depending on video length and resolution. 480p is faster than 720p, and the Fast model is quicker than Standard.

**Q: Can I cancel a running generation?**
A: Currently no - once submitted, the request continues on fal.ai's servers. Future versions may support cancellation.

**Q: What's the maximum video length?**
A: Determined by your audio file length. Most users generate 5-60 second videos.

**Q: Do I need a paid fal.ai account?**
A: fal.ai operates on pay-per-use. You'll be charged based on generation time. Check [fal.ai pricing](https://fal.ai/pricing).

**Q: Can I use my own Veed account?**
A: This node uses fal.ai's public Fabric model, not Veed's internal API. You need a fal.ai account and API key.

**Q: Why is my workflow blocking for so long?**
A: The node waits for video generation to complete (5-15 min). This is expected behavior. Future versions may support webhook callbacks for non-blocking operation.
