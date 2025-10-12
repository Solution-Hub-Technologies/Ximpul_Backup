
"use client"

import { HeroSection } from "@/components/ui/hero-section"

export function HeroSectionDemo() {
  return (
    <HeroSection
      title="Carry Your Freedom"
      description="In Bangladesh, we still rely on natural groundwater — but we buy bottled water daily, wrapped in plastic, priced unfairly. Ximpul Flow is your tool to change that. Built to last. Designed for freedom. This isn't just a bottle — it's a movement."
      actions={[]}
      image={{
        light: "/ximpul-uploads/7f9c38b9-1af0-4100-bd39-a29962064023.png",
        dark: "/ximpul-uploads/7f9c38b9-1af0-4100-bd39-a29962064023.png",
        alt: "Pure water flowing into cupped hands representing water freedom",
      }}
    />
  )
}
