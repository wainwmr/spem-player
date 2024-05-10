import { defineConfig } from "vite"

export default defineConfig ({
  assetsInclude: ['**/*.ohm', '**/*.ly'],
  build: {
    rollupOptions: {
      external: [
        'src/ts/MusicCanvas.ts',
        'src/ts/MusicControls.ts',
        'src/ts/MusicScore.ts',
      ]
    }
  }
})