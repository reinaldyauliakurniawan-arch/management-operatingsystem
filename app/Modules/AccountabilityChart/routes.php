<?php

use App\Modules\AccountabilityChart\Controllers\AccountabilityChartController;
use Illuminate\Support\Facades\Route;

// Inertia page route
Route::get("/accountability-chart", [
    AccountabilityChartController::class,
    "index",
])->name("accountability.index");

// Pure JSON API routes (no Inertia, no redirect)
Route::prefix("api/accountability-chart")->group(function () {
    Route::get("/seats", [AccountabilityChartController::class, "apiSeats"])->name("accountability-chart.api.seats");
    Route::get("/users", [AccountabilityChartController::class, "apiUsers"])->name("accountability-chart.api.users");
    Route::post("/", [AccountabilityChartController::class, "store"])->name("accountability-chart.store");
    Route::patch("/{seat}", [AccountabilityChartController::class, "update"])->name("accountability-chart.update");
    Route::delete("/{seat}", [AccountabilityChartController::class, "destroy"])->name("accountability-chart.destroy");
    Route::post("/generate-from-teams", [AccountabilityChartController::class, "generateFromTeams"])->name("accountability-chart.generate");
});
