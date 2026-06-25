import { PropsWithChildren } from "react";

export default function GuestLayout({ children }: PropsWithChildren) {
    return (
        <div
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
            style={{
                background: "linear-gradient(135deg, #00a982 0%, #007a60 50%, #006b5a 100%)",
            }}
        >
            {/* Decorative circles per brand guide */}
            <div
                className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)" }}
            />
            <div
                className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)" }}
            />

            <div className="relative z-10 mb-8 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-white/60">
                    Just Speak English Course
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                    Management OS
                </h1>
            </div>

            {/* Glass card */}
            <div
                className="relative z-10 w-full max-w-sm rounded-2xl p-8"
                style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
            >
                {children}
            </div>
        </div>
    );
}
