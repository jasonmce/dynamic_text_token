<?php

namespace Drupal\dynamic_text_token\Plugin\DynamicToken;

use Drupal\Core\Form\FormStateInterface;
use Drupal\dynamic_token_manager\Annotation\DynamicToken;
use Drupal\dynamic_token_manager\Plugin\DynamicTokenBase;

/**
 * @DynamicToken(
 *   id = "dynamic_text_token",
 *   label = @Translation("Dynamic Text Token")
 * )
 */
class DynamicTextToken extends DynamicTokenBase {

  public function buildConfigurationForm(array $form, FormStateInterface $form_state, array $config): array {
    $config = is_array($config) && $config ? $config : $this->cfg();
    $values = $config['values'] ?? '';
    $form['values'] = [
      '#type' => 'textarea',
      '#title' => t('Values (one per line)'),
      '#default_value' => $values,
      '#description' => t('Each line is a plaintext value.'),
      '#required' => TRUE,
    ];
    $form['seed'] = [
      '#type' => 'number',
      '#title' => t('Seed (optional)'),
      '#default_value' => isset($config['seed']) ? (int) $config['seed'] : 0,
      '#min' => 0,
    ];
    return $form;
  }

  public function submitConfigurationForm(array &$form, FormStateInterface $form_state): array {
    $raw = $form_state->getValue(['plugin_config','values']);
    if ($raw === NULL) { $raw = $form_state->getValue('values'); }
    $lines = preg_split('/\R/', (string) $raw, -1, PREG_SPLIT_NO_EMPTY);
    $clean = [];
    foreach ($lines as $l) {
      $t = trim($l);
      if ($t !== '') {
        $clean[] = $t;
      }
    }
    return [
      'values' => $clean ?: [''],
      'seed' => (int) (($form_state->getValue(['plugin_config','seed']) ?? $form_state->getValue('seed') ?? 0)) ,
    ];
  }

  public function value(): string {
    $cfg = $this->cfg();
    $values = isset($cfg['values']) ? preg_split('/\R/', $cfg['values'], -1, PREG_SPLIT_NO_EMPTY) : [''];
    if (empty($values)) {
      $values = [''];
    }
    $speed = max(1, $this->speed());
    $bucket = intdiv($this->requestTime(), $speed);
    $seed = isset($cfg['seed']) ? (int) $cfg['seed'] : 0;
    $key = sprintf('%s:%d:%d', $this->instanceId(), $seed, $bucket);
    $hash = crc32($key);
    $index = (int) ($hash % count($values));
    return (string) $values[$index];
  }

  /**
   * {@inheritdoc}
   */
  public function attachments(): array {
    return [
      'library' => ['dynamic_text_token/runtime'],
    ];
  }

}
