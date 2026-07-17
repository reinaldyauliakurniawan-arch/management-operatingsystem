<?php

use App\Http\Controllers\HealthController;
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

// ponytail: override the default Laravel /up (which only checks app boot)
// with a real health check that probes DB + cache + queue. Load balancers
// and uptime monitors should hit this endpoint — a 503 means an upstream
// dependency is down, not just the process.
Route::get('/up', HealthController::class)->name('health');

Route::get('/dashboard', \App\Http\Controllers\DashboardController::class)
    ->middleware(['auth', \App\Http\Middleware\EnsureHasOrganization::class])
    ->name('dashboard');

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
});

Route::middleware(['web', 'auth', \App\Http\Middleware\EnsureHasOrganization::class, 'team.role:leader,member,tutor'])->group(function () {

    if (file_exists(base_path('app/Modules/Teams/routes.php'))) {
        require base_path('app/Modules/Teams/routes.php');
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
    if (file_exists(base_path('app/Modules/Kanban/routes.php'))) {
        require base_path('app/Modules/Kanban/routes.php');
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
    if (file_exists(base_path('app/Modules/Event/routes.php'))) {
        require base_path('app/Modules/Event/routes.php');
    }
    if (file_exists(base_path('app/Modules/Leaderboard/routes.php'))) {
        require base_path('app/Modules/Leaderboard/routes.php');
    }
    if (file_exists(base_path('app/Modules/LeadershipAssessment/routes.php'))) {
        require base_path('app/Modules/LeadershipAssessment/routes.php');
    }
});
