<?php

namespace App\Providers;

use App\Actions\SyncUserRolesFromEmployeeAction;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\CapitalizationThreshold;
use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Models\User;
use App\Observers\AssetObserver;
use App\Observers\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Testing\TestResponse;
use Illuminate\Validation\Rules\Password;
use OneLogin\Saml2\Auth as SamlAuth;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SamlAuth::class, function ($app) {
            return new SamlAuth([
                'strict' => config('saml.strict', false),
                'debug' => config('saml.debug', false),
                'baseurl' => config('app.url'),
                'sp' => config('saml.sp', []),
                'idp' => config('saml.idp', []),
                'security' => config('saml.security', []),
            ]);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerActivityObservers();
        $this->registerAssetObservers();
        $this->grantSuperAdmin();
        $this->syncUserRolesOnLogin();

        Authenticate::redirectUsing(fn () => route('saml.login'));

        TestResponse::macro('session', function ($key = null, $default = null) {
            $session = app('session.store');
            if (! $session->isStarted()) {
                $session->start();
            }

            return $key !== null ? $session->get($key, $default) : $session;
        });
    }

    /**
     * Asset module specific observers (FR-13).
     */
    protected function registerAssetObservers(): void
    {
        Asset::observe(AssetObserver::class);
        CapitalizationThreshold::observe(RecordsActivity::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Model::preventLazyLoading(! app()->isProduction());

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }

    // Grant Super Admin role to the first user (FR-14).
    // This is a temporary solution until a proper user management system is implemented.
    // In a production environment, this should be handled with caution.
    protected function grantSuperAdmin(): void
    {
        Gate::before(function ($user, $ability) {
            return $user?->isSuperAdmin() ? true : null;
        });

        Gate::define('super-admin.view', function ($user): bool {
            return $user?->hasPermissionTo('super-admin.view') ?? false;
        });

        Gate::define('super-admin.grant', function ($user): bool {
            return $user?->hasPermissionTo('super-admin.grant') ?? false;
        });

        Gate::define('super-admin.revoke', function ($user): bool {
            return $user?->hasPermissionTo('super-admin.revoke') ?? false;
        });

        Gate::define('tenant.manage', function ($user): bool {
            return $user?->hasPermissionTo('tenant.manage') ?? false;
        });

        Gate::define('tenant.switch', function ($user): bool {
            return $user?->hasPermissionTo('tenant.switch') ?? false;
        });
    }

    /**
     * Roles are assigned to Employee records in the Employees section; sync
     * them onto the matching User at login so they take effect for gates.
     */
    protected function syncUserRolesOnLogin(): void
    {
        Event::listen(Login::class, function (Login $event): void {
            if ($event->user instanceof User) {
                app(SyncUserRolesFromEmployeeAction::class)->execute($event->user);
            }
        });
    }

    /**
     * Audit trail: record create/update/delete of master data (FR-12).
     *
     * @see RecordsActivity
     */
    protected function registerActivityObservers(): void
    {
        Asset::observe(RecordsActivity::class);
        Item::observe(RecordsActivity::class);
        Location::observe(RecordsActivity::class);
        Category::observe(RecordsActivity::class);
        AssetGroup::observe(RecordsActivity::class);
        AssetCategory::observe(RecordsActivity::class);
        AssetCluster::observe(RecordsActivity::class);
        AssetSubCluster::observe(RecordsActivity::class);
    }
}
