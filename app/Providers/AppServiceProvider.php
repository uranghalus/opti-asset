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
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerOidcProvider();
        $this->registerActivityObservers();
        $this->registerAssetObservers();
        $this->grantSuperAdmin();
        $this->syncUserRolesOnLogin();
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

    protected function registerOidcProvider(): void
    {
        Event::listen(SocialiteWasCalled::class, function (SocialiteWasCalled $event): void {
            $event->extendSocialite('oidc', OIDCProvider::class);
        });
    }

    // Grant Super Admin role to the first user (FR-14).
    // This is a temporary solution until a proper user management system is implemented.
    // In a production environment, this should be handled with caution.
    protected function grantSuperAdmin(): void
    {
        Gate::before(function ($user, $ability) {
            return $user->hasRole('super-admin') ? true : null;
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
