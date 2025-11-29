# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-11-29

### Added
- New PNG logo (xr2-logo.png) for better icon display in n8n
- Comprehensive error messages with emojis and actionable steps
- "Any (Default)" option for Status parameter - recommended for most use cases
- Detailed troubleshooting section in README with common issues
- Understanding Response Fields section explaining API response structure

### Changed
- **BREAKING**: Fixed Get Prompt response format in README to match actual API
  - Changed from `content` to `system_prompt`, `user_prompt`, `assistant_prompt`
  - Changed `variables` from object to array format
  - Added missing fields: `deployed_at`, `created_at`, `updated_at`, `ab_test_*`
- Improved error handling with specific HTTP status code messages:
  - 401/403: Authentication guidance
  - 404: Prompt not found with detailed troubleshooting
  - 429: Rate limit exceeded
  - 500+: Server error guidance
- Updated all code examples to use correct field names
- Enhanced Status parameter description with warning about 404 errors
- Improved Version Number parameter description

### Fixed
- Authentication now correctly uses `requestWithAuthentication` method
- Fixed form-data vulnerability by using overrides in package.json
- Corrected OpenAI integration example with proper prompt field usage
- Fixed automatic asset copying for PNG and SVG files

### Documentation
- Updated README.md with accurate API response formats
- Added emoji icons for better error message readability
- Expanded Features section with detailed capabilities
- Added concrete examples for all common use cases

## [0.1.0] - 2025-11-28

### Added
- Initial release
- Get Prompt operation
- Track Event operation
- Basic authentication support
- TypeScript support
- SVG icon

[0.1.1]: https://github.com/channeler-ai/xr2/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/channeler-ai/xr2/releases/tag/v0.1.0
