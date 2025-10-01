<?php

namespace Drupal\Tests\dynamic_text_token\Kernel;

use Drupal\dynamic_token_manager\Entity\DynamicTokenInstance;
use Drupal\filter\Entity\FilterFormat;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\Component\Utility\Html;

/**
 * @group dynamic_tokens
 */
class DynamicTextTokenKernelTest extends KernelTestBase {

  protected static $modules = [
    'system', 
    'dynamic_token_manager',
    'dynamic_text_token',
    'filter',
  ];

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
  } 

  public function testValueChangesWithFilter() {
    $instance = DynamicTokenInstance::create([
      'id' => 'greet',
      'label' => 'Greet',
      'plugin' => 'dynamic_text_token',
      'speed' => 5,
      'plugin_config' => ['values' => ['NEW VALUE'], 'seed' => 42],
      'status' => TRUE,
    ]);
    $instance->save();

    // Ensure the full_html text format exists and has the dynamic_tokens filter enabled.
    $format = FilterFormat::create([
      'format' => 'dynamic_text_token_test',
      'name' => 'Dynamic Text Token Test',
      'status' => TRUE,
      'weight' => 0,
      'filters' => [
        'dynamic_tokens' => [
          'status' => TRUE,
          'settings' => [],
          'weight' => 0,
        ],
      ],
    ]);
    $format->save();

    // Apply the text format and verify that the token was processed.
    $input = 'before [dynamic:greet] after';
    $output = check_markup($input, 'dynamic_text_token_test');
    $this->assertIsString($output->__toString());
    $this->assertStringNotContainsString('[dynamic:greet]', $output->__toString());
    $this->assertStringContainsString('NEW VALUE', $output->__toString());

    // Verify the wrapper span and its attributes are present.
    $html = $output->__toString();
    $doc = Html::load($html);               // Returns \DOMDocument
    $xpath = new \DOMXPath($doc);
    $nodes = $xpath->query('//span');
    $this->assertNotEmpty($nodes);

    /** @var \DOMElement $span */
    $span = $nodes->item(0);
    
    $this->assertNotNull($span);

    // Verify class is in the list
    $classes = preg_split('/\s+/', trim($span->getAttribute('class')));
    $this->assertContains('dynamic-token', $classes);

    // Verify attributes
    $this->assertSame('greet', $span->getAttribute('data-token-id'));
    $this->assertSame('dynamic_text_token', $span->getAttribute('data-token-type-id'));
    $this->assertSame('5', $span->getAttribute('data-speed'));
    $this->assertSame('status', $span->getAttribute('role'));
    $this->assertSame('polite', $span->getAttribute('aria-live'));
    

    // Verify the span contains the token value
    $this->assertSame('NEW VALUE', $span->textContent); 
  }

}
