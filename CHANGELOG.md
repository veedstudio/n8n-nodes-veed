# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-09

### Added

- Initial release of n8n-nodes-veed
- Fabric video generation support
  - Generate talking head videos from image + audio
  - Support for Fabric 1.0 (Standard) and Fabric 1.0 Fast models
  - Resolution options: 480p, 720p
  - Aspect ratio support: 16:9, 9:16, 1:1
- Fal.ai API credential type with authentication
- Real-time progress tracking during generation
- Configurable timeout and polling intervals
- Comprehensive error handling and validation
- Input validation for image and audio URLs
- Full test coverage
- Complete documentation with examples
- Troubleshooting guide

### Technical Details

- Built with TypeScript 5.9.2
- Tested with Vitest 3.2.4
- Node.js 22+ required
- Programmatic node style for async polling support
- Modular architecture following n8n best practices
