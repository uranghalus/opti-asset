<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class Error401Test extends TestCase
{
    use RefreshDatabase;

    public function test_401_view_exists_and_renders(): void
    {
        $this->assertFileExists(resource_path('views/errors/401.blade.php'));

        $view = view('errors.401')->render();

        $this->assertStringContainsString('Akses Ditolak', $view);
        $this->assertStringContainsString('401', $view);
        $this->assertStringContainsString('Kembali ke', $view);
        $this->assertStringContainsString('Login Ulang', $view);
        $this->assertStringContainsString('Hubungi Administrator', $view);
    }

    public function test_401_abort_renders_error_view(): void
    {
        // Create a temporary route that aborts 401
        Route::get('/test-401', function () {
            abort(401);
        });

        $response = $this->get('/test-401');

        $response->assertStatus(401);
        $response->assertSee('Akses Ditolak');
    }
}
