<?php

namespace Drupal\dynamic_text_token\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\dynamic_token_manager\Plugin\DynamicTokenManager;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Returns the current value for a Dynamic Text Token instance.
 */
class NextValueController extends ControllerBase {

  protected DynamicTokenManager $manager;

  public function __construct(DynamicTokenManager $manager) {
    $this->manager = $manager;
  }

  public static function create(ContainerInterface $container): self {
    return new self($container->get('plugin.manager.dynamic_token'));
  }

  public function next($dynamic_token_instance) {
    // Load the instance via the ControllerBase helper.
    $instance = $this->entityTypeManager()->getStorage('dynamic_token_instance')->load($dynamic_token_instance);
    if (!$instance || $instance->get('plugin') !== 'dynamic_text_token' || !$instance->status()) {
      return new JsonResponse(['value' => ''], 404);
    }
    $plugin = $this->manager->createWithInstance('dynamic_text_token', $instance);
    $value = $plugin->value();

    $response = new JsonResponse(['value' => $value]);
    $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return $response;
  }

}
