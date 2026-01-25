"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"

const navItems = [
    { name: "Features", href: "#features" },
    { name: "Community", href: "#community" },
    { name: "Security", href: "#security" },
]

export function FloatingNav() {
    const [hovered, setHovered] = useState<string | null>(null)

    return (
        <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
                <Link
                    key={item.name}
                    href={item.href}
                    onMouseEnter={() => setHovered(item.name)}
                    onMouseLeave={() => setHovered(null)}
                    className="relative px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                    {hovered === item.name && (
                        <motion.div
                            layoutId="nav-pill"
                            className="absolute inset-0 bg-white/10 rounded-full -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {item.name}
                </Link>
            ))}
        </nav>
    )
}
