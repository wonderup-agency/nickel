import js from '@eslint/js'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        AbortController: 'readonly',
        MutationObserver: 'readonly',
        NodeFilter: 'readonly',
        CustomEvent: 'readonly',
        gsap: 'readonly',
        ScrollTrigger: 'readonly',
        Swiper: 'readonly',
      },
    },
  },
]
