# Obsidian Magic Quick Start Guide

## Installation

1. In Obsidian, go to Settings → Community plugins → Browse
2. Search for "Obsidian Magic"
3. Click Install, then Enable

## Initial Setup

### API Key Configuration

1. Go to Settings → Obsidian Magic
2. Click "Add API Key"
3. Enter your OpenAI API key
   - If you don't have one, you can get it from [OpenAI API Keys](https://platform.openai.com/api-keys)
4. Select your preferred storage method:
   - **System Keychain** (recommended): Securely stores your key in your operating system's keychain
   - **Local Storage**: Encrypts and stores the key within your vault

### Basic Settings

1. **AI Model**: Choose your preferred AI model
   - GPT-4o (recommended for best results but higher cost)
   - GPT-3.5 Turbo (faster, lower cost)
2. **Default Tag Behavior**: Choose how to handle existing tags
   - Merge: Combines AI tags with existing tags (recommended)
   - Replace: Replaces existing tags with AI-generated ones
   - Suggest: Shows suggestions without modifying the document
3. **Auto-Sync**: Toggle whether to automatically tag files when they're modified

## Using Obsidian Magic

### Tagging Single Documents

#### Method 1: Command Palette

1. Open the document you want to tag
2. Press `Ctrl/Cmd+P` to open the command palette
3. Type "Tag Current File" and select the command

#### Method 2: Context Menu

1. Right-click on a file in the file explorer
2. Select "Tag with Obsidian Magic"

#### Method 3: Ribbon Button

1. Click the Obsidian Magic icon in the ribbon (left sidebar)
2. Select "Tag Current File"

### Batch Tagging

1. Right-click on a folder in the file explorer
2. Select "Tag folder with Obsidian Magic"
3. In the modal that appears:
   - Choose whether to include subfolders
   - Set the maximum number of files to process
   - Click "Start Tagging"

### Viewing and Managing Tags

1. Open the Tag Management view:
   - Via command palette: `Ctrl/Cmd+P` → "Open Tag Management"
   - Via ribbon: Click the Obsidian Magic icon → "Open Tag Management"
2. The Tag Management view shows:
   - All tags in your vault, categorized by type
   - Statistics on tag usage
   - Tools for renaming, merging, or deleting tags

### Tag Visualization

1. Open the Tag Visualization view:
   - Via command palette: `Ctrl/Cmd+P` → "Open Tag Visualization"
   - Via Tag Management view: Click "Visualize Tags"
2. Use the visualization to:
   - Explore relationships between tags
   - Identify clusters of related content
   - Navigate to documents with specific tag combinations

## Troubleshooting

### API Key Issues

- Make sure your OpenAI API key is valid and has sufficient credits
- Check your internet connection

### Performance Issues

- For large vaults, consider batch processing smaller folders
- Adjust the concurrency settings in the plugin settings

### Tag Conflicts

- Review the merge strategy in settings
- Use the Tag Management view to resolve conflicts manually

## Getting Help

- Check the [full documentation](https://github.com/obsidian-magic/obsidian-magic/wiki)
- Report issues on [GitHub](https://github.com/obsidian-magic/obsidian-magic/issues)
- Join the [Obsidian Discord](https://discord.gg/obsidianmd) and ask in the #plugin-discuss channel
