<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- ponytail: Inter is bundled via @fontsource-variable/inter in CSS, no external request needed. --}}

        {{-- Scripts --}}
        @routes
        @inertiaHead
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
