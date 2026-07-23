<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        if (!Auth::check()) {
            return Inertia::render('Central/welcome');
        }

        // return redirect()->intended('/dashboard');
    }
}
