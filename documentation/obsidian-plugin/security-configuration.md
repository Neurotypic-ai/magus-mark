# Security & Configuration

The Obsidian Magic plugin provides robust security features and flexible configuration options to ensure safe and personalized use of AI tagging capabilities within Obsidian.

## API Key Management

### Secure Storage Options

- Multiple storage options for API keys:
  - Encrypted within Obsidian configuration
  - Environment variables
  - External credential manager integration
  - Integration with OS keychain (macOS, Windows, Linux)
- Configurable key rotation policies
- Usage monitoring with quota visualization
- Auto-detection of invalid or expired keys

### Permissions Model

- Granular permission controls for API access
- Per-folder authorization settings
- Configurable scope limitations
- Read-only mode option for viewing without modifying
- Permission audit logging

### Provider Configuration

- Support for multiple OpenAI account configurations
- Alternative AI provider options
- Proxy configuration for network constraints
- Fallback provider configuration
- Connection health monitoring

## Configuration Interface

### Settings Panel

- Comprehensive settings panel integrated with Obsidian preferences
- Mobile-friendly configuration layouts
- Profile-based configuration management
- Import/export of configurations (excluding secrets)
- Configuration validation and troubleshooting

### Advanced Options

- Customization of tag taxonomy
- Token usage limits and budgeting
- Batch processing constraints
- Network throttling and retry policies
- Caching policies for offline operation

### User Defaults

- Default tag categories
- Preferred visualization modes
- Confidence threshold settings
- Notification preferences
- Interface customization options

## Privacy & Data Handling

### Local Processing

- Options for local-only processing where possible
- Content filtering before API submission
- Data minimization techniques
- Configurable content redaction
- Controlled context window management

### Data Retention

- Configurable history retention policies
- Log management and rotation
- Cache expiration settings
- Session data handling
- Analytics opt-out options

### Compliance Features

- GDPR-friendly data handling options
- Data export and portability
- Audit trails for tag modifications
- Consent management for API submissions
- Clear privacy policy integration

## Security Best Practices

### Content Protection

- Selective processing to protect sensitive documents
- Folder exclusion mechanisms
- Regex-based content filtering
- Sensitive information detection
- Warning system for potential data exposure

### Authentication Options

- Optional authentication for plugin features
- Session timeout controls
- Device authorization options
- Restricted mode for shared devices
- Integration with Obsidian's authentication (if available)

### Monitoring & Alerts

- Unusual usage pattern detection
- Cost spike warnings
- Failed authentication attempt notifications
- Network security alerts
- Version and security update notifications

## Enterprise Features

### Team Management

- Shared configuration deployment
- Centralized API key management
- Usage quotas per user or team
- Team-specific tag taxonomies
- Synchronization with enterprise identity systems

### Audit & Compliance

- Detailed audit logs of all operations
- Compliance reporting for API usage
- Configurable data retention policies
- Role-based access controls
- Integration with enterprise security frameworks

### Network Configuration

- Enterprise proxy support
- Custom DNS configuration
- SSL/TLS customization
- IP allowlisting
- Network usage optimization 