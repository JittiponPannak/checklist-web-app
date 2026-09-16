"use client";

import React, { useEffect, useState } from "react";

export function Confetti() {
    const [particles, setParticles] = useState<Array<{ id: number; color: string; left: number; delay: number; duration: number }>>([]);

    useEffect(() => {
        const colors = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899"];
        const p = [];
        for (let i = 0; i < 70; i++) {
            p.push({
                id: i,
                color: colors[Math.floor(Math.random() * colors.length)],
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 1.5 + Math.random() * 2
            });
        }
        setParticles(p);
    }, []);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute top-[-10%] w-2 h-4 sm:w-3 sm:h-6 opacity-0 animate-confetti-fall"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
        </div>
    );
}
