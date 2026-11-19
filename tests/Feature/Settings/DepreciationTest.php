<?php

namespace Tests\Feature\Settings;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepreciationTest extends TestCase
{
    use RefreshDatabase;

    public function test_depreciation_page_route_exists(): void
    {
        $response = $this->get(route('settings.depreciation.index'));

        $this->assertNotNull(route('settings.depreciation.index'));
    }

    public function test_depreciation_run_route_exists(): void
    {
        $this->assertNotNull(route('settings.depreciation.run'));
    }
}
