<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use Spatie\Permission\Models\Permission;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Gunakan store 'array' di pengujian agar tidak menulis berkas cache
        // ke disk (rawan Permission denied / file lock di Windows).
        config(['cache.default' => 'array']);

        // tenant.switch permission is required by HandleInertiaRequests::share()
        // which evaluates $user->can('tenant.switch') on every authenticated request.
        Permission::firstOrCreate([
            'name' => 'tenant.switch',
            'guard_name' => 'web',
        ]);
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
