<?php

namespace JMac\Testing\Traits;

use ReflectionMethod;

trait AdditionalAssertions
{
    /**
     * Assert that a controller action type-hints a specific FormRequest.
     */
    public function assertActionUsesFormRequest(string $controller, string $method, string $formRequest): void
    {
        $reflection = new ReflectionMethod($controller, $method);
        foreach ($reflection->getParameters() as $parameter) {
            if ($parameter->getType() && $parameter->getType()->getName() === $formRequest) {
                $this->assertTrue(true);
                return;
            }
        }
        $this->fail("Action {$method} on controller {$controller} does not use FormRequest {$formRequest}");
    }
}
