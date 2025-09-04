<?php

namespace Drupal\Tests\dynamic_text_token\Kernel;

use Drupal\dynamic_token_manager\Entity\DynamicTokenInstance;
use Drupal\filter\Entity\FilterFormat;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;

/**
 * @group dynamic_tokens
 */
class DynamicTextTokenKernelTest extends KernelTestBase {

  protected static $modules = [
    'system', 'user',
    'dynamic_token_manager',
    'dynamic_text_token',
  ];

  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installConfig(['dynamic_token_manager']);
    $this->enableFilter('full_text', 'dynamic_tokens');
  }

  /**
   * Enable a filter on a given text format.
   */
  protected function enableFilter($format_id, $filter_id) {
    // Load the text format.
    $format = FilterFormat::load($format_id);
  
    if ($format) {
      $filters = $format->get('filters');
  
      // If the filter exists in the format definition, enable it.
      if (isset($filters[$filter_id])) {
        $filters[$filter_id]['status'] = TRUE;

  
        $format->set('filters', $filters);
        $format->save();
  
        \Drupal::logger('mymodule')->notice("Enabled filter {$filter_id} on format {$format_id}.");
      }
      else {
        \Drupal::logger('mymodule')->warning("Filter {$filter_id} not found in format {$format_id}.");
      }
    }
    else {
      \Drupal::logger('mymodule')->error("Text format {$format_id} not found.");
    }
  }
  

  public function testValueStableWithinBucket() {
    $instance = DynamicTokenInstance::create([
      'id' => 'greet',
      'label' => 'Greet',
      'plugin' => 'dynamic_text_token',
      'speed' => 5,
      'plugin_config' => ['values' => ['A','B','C'], 'seed' => 42],
      'status' => TRUE,
    ]);
    $instance->save();

    $manager = $this->container->get('plugin.manager.dynamic_token');
    $plugin = $manager->createWithInstance('dynamic_text_token', $instance);
    $v1 = $plugin->value();
    $v2 = $plugin->value();
    $this->assertSame($v1, $v2, 'Value remains stable within bucket');
    $this->assertNotSame('', $v1);

    $node = Node::create([
      'type' => 'article',
      'title' => 'Test',
      'body' => [
        'value' => 'before [dynamic:greet] after',
        'format' => 'full_text',
      ],
    ]);
    $node->save();
    $this->assertNotSame('before [dynamic:greet] after', $node->body->value);
  }

}
