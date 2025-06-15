# Setting up Anthropic API for AI Content Repurposer Studio

This application uses Anthropic's Claude AI models for generating repurposed content. To use this feature, you'll need to obtain an API key from Anthropic and configure it in your environment.

## Step 1: Create an Anthropic Account

1. Go to [Anthropic's console](https://console.anthropic.com/)
2. Sign up for an account if you don't already have one

## Step 2: Get Your API Key

1. Log in to your Anthropic account
2. Navigate to the API Keys section
3. Create a new API key
4. Copy the API key (it will only be shown once)

## Step 3: Configure Your Application

Add the API key to your `.env` file:

```
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

Replace `your-anthropic-api-key` with the actual API key you obtained from Anthropic.

## Step 4: Restart Your Application

If your application is running, restart it to load the new environment variable:

```bash
npm run dev
```

## Usage Tiers in the Application

The application uses different Claude models based on the user's subscription tier:

- **Free tier**: Uses `claude-3-haiku` (fastest, but less capable)
- **Pro tier**: Uses `claude-3-sonnet` (balanced speed and capability)
- **Agency tier**: Uses `claude-3-opus` (highest quality, but slower)

## Troubleshooting

If you encounter issues with the Anthropic API:

1. Check that your API key is correctly set in the `.env` file
2. Ensure your Anthropic account has sufficient credits
3. Check the application logs for any error messages
4. Verify your internet connection

## API Usage and Costs

Be aware that using the Anthropic API incurs costs based on the number of tokens processed. The application is designed to be efficient, but you should monitor your usage through the Anthropic console to avoid unexpected charges.

For more information on Anthropic's pricing, visit their [pricing page](https://www.anthropic.com/api). 