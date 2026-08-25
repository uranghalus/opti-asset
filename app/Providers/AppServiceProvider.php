<?php

namespace App\Providers;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Observers\RecordsActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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
