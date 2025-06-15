# Anthropic Claude Models

This document provides information about the Claude AI models used in the AI Content Repurposer Studio.

## Model Versions

As of June 2025, we are using the following Claude models:

| Configuration Name | Model Version | Description |
|-------------------|---------------|-------------|
| DEFAULT | claude-3-5-sonnet-20240620 | Our default model with balanced performance and quality |
| FAST | claude-3-haiku-20240307 | Faster, more efficient model for quick responses |
| BALANCED | claude-3-5-sonnet-20240620 | High-quality model with good balance of speed and capability |

## Model Mapping to Subscription Tiers

- **Free tier**: Uses `FAST` model (claude-3-haiku-20240307)
- **Pro tier**: Uses `BALANCED` model (claude-3-5-sonnet-20240620)
- **Agency tier**: Uses `DEFAULT` model (claude-3-5-sonnet-20240620)

## Recent Changes

- June 2025: Updated the `DEFAULT` and `BALANCED` models to `claude-3-5-sonnet-20240620` from the deprecated `claude-3-sonnet-20240229`
- Previously we were using older model versions which have been deprecated by Anthropic

## Troubleshooting

If you encounter errors like:
```
[ANTHROPIC_API_ERROR] Error: 404 {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-sonnet-20240229"}}
```

This indicates that the model version is no longer available. We've updated our configurations to use the latest model versions, but if you continue to experience issues:

1. Check that your `.env` file contains a valid `ANTHROPIC_API_KEY`
2. Verify that your account has access to the Claude models
3. Contact support if issues persist

## Future Updates

Anthropic regularly releases new model versions. We'll update our configurations as needed to ensure compatibility and optimal performance.

For more information about Claude models, visit [Anthropic's documentation](https://docs.anthropic.com/en/api/model-guide). 