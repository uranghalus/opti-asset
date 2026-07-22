<?php

namespace App\Http\Controllers;

use Inertia\Response;

class WelcomeController extends Controller
{
    public function __invoke(): Response
    {
        return inertia('welcome');
    }
}
