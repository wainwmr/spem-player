/// <reference types="vitest" />
import { defineConfig } from "vite"

export default defineConfig ({
  assetsInclude: ['**/*.ohm', '**/*.ly'],
  test: {
    globals: true,
    environment: 'jsdom'
  }
})