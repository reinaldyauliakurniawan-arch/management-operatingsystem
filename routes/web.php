<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::middleware(['web', 'auth'])->group(function () {
    if (file_exists(base_path('app/Modules/Organization/routes.php'))) {
        require base_path('app/Modules/Organization/routes.php');
    }
    if (file_exists(base_path('app/Modules/VTO/routes.php'))) {
        require base_path('app/Modules/VTO/routes.php');
    }
    if (file_exists(base_path('app/Modules/Rocks/routes.php'))) {
        require base_path('app/Modules/Rocks/routes.php');
    }
    if (file_exists(base_path('app/Modules/Scorecard/routes.php'))) {
        require base_path('app/Modules/Scorecard/routes.php');
    }
    if (file_exists(base_path('app/Modules/ToDo/routes.php'))) {
        require base_path('app/Modules/ToDo/routes.php');
    }
    if (file_exists(base_path('app/Modules/IDS/routes.php'))) {
        require base_path('app/Modules/IDS/routes.php');
    }
    if (file_exists(base_path('app/Modules/L10Meeting/routes.php'))) {
        require base_path('app/Modules/L10Meeting/routes.php');
    }
    if (file_exists(base_path('app/Modules/AccountabilityChart/routes.php'))) {
        require base_path('app/Modules/AccountabilityChart/routes.php');
    }
    if (file_exists(base_path('app/Modules/PeopleAnalyzer/routes.php'))) {
        require base_path('app/Modules/PeopleAnalyzer/routes.php');
    }
});
