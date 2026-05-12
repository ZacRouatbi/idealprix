"use client"

import { Github } from "@medusajs/icons"
import { Button, Heading } from "@modules/common/components/ui"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-gray-200 relative bg-white">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-red-600 font-normal"
          >
            Ecommerce Starter Template
          </Heading>
          <Heading
            level="h2"
            className="text-3xl leading-10 text-red-600 font-normal"
          >
            Powered by Medusa and Next.js
          </Heading>
        </span>
        <a href="https://github.com/medusajs/dtc-starter" target="_blank">
          <Button variant="secondary">
            View on GitHub <Github />
          </Button>
        </a>
      </div>
    </div>
  )
}

export default Hero
