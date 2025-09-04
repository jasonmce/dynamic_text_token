# Dynamic Text Token for Drupal

A Drupal module that provides dynamic text tokens with configurable values based on current context.

## Features

- Create reusable text tokens with dynamic values
- Configure tokens with default values and overrides
- Supports context-based token values
- Integrates with Drupal's Token system
- Provides a simple API for developers

## Requirements

- Drupal 9 or 10
- PHP 8.1 or higher

## Installation

1. Place the `dynamic_text_token` directory in your Drupal installation's
   `web/modules/custom/` directory.
2. Enable the module via the admin interface or Drush:
   ```
   drush en dynamic_text_token
   ```

## Usage

### Creating Tokens

1. Navigate to `/admin/structure/dynamic-tokens`
2. Click "Add Dynamic Token"
3. Configure your token:
   - Machine name (used in [dynamic:token_name])
   - Default value
   - Optional context conditions
   - Value overrides based on conditions

### Using Tokens

Use your dynamic tokens anywhere Drupal tokens are supported:

```
[dynamic:my_token_name]
```

### Programmatic Usage

```php
// Get token value
$value = \Drupal::service('dynamic_text_token.manager')->getTokenValue('my_token_name');

// Or in a service-injected class:
$value = $this->dynamicTokenManager->getTokenValue('my_token_name');
```

## API

### Hooks

- `hook_dynamic_token_info_alter(&$tokens)` - Modify available tokens
- `hook_dynamic_token_value_alter(&$value, $token_name, $context)` - Modify token values

### Services

- `dynamic_text_token.manager` - Main service for token operations

## Development

### Running Tests

```bash
# Run all tests
../vendor/bin/phpunit modules/custom/dynamic_text_token/tests

# Run a specific test group
../vendor/bin/phpunit --group=dynamic_text_token
```

## License

This project is GPL v2 software. See the LICENSE.txt file in this directory for complete text.

## Maintainers

- Your Name - https://www.drupal.org/u/your-username

## Credits

- Sponsored by [Your Organization]
