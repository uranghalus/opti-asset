<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_page_returns_ok()
    {
        $response = $this->get(route('home'));

        $response->assertOk();
    }
}
