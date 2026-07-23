<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use MongoDB\Laravel\Query\Builder as MongoQueryBuilder;
use Spatie\Multitenancy\Models\Tenant as SpatieTenant;

class Tenant extends SpatieTenant
{
    protected $connection = 'mongodb';

    protected $fillable = [
        'id',
        'name',
    ];

    protected $casts = [
        'id' => 'string',
    ];

    protected function newBaseQueryBuilder()
    {
        $connection = $this->getConnection();

        if ($connection->getDriverName() === 'mongodb') {
            return new MongoQueryBuilder($connection, $connection->getQueryGrammar(), $connection->getPostProcessor());
        }

        return new QueryBuilder($connection, $connection->getQueryGrammar(), $connection->getPostProcessor());
    }

    public function newEloquentBuilder($query)
    {
        if ($this->getConnection()->getDriverName() === 'mongodb') {
            return parent::newEloquentBuilder($query);
        }

        return new EloquentBuilder($query);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_tenants', 'tenant_id', 'user_id');
    }
}
