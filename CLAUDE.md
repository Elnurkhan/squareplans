## Стек

- Vue 3 — Composition API, `<script setup>` only, никакого Options API
- OGL — WebGL рендерер (НЕ Three.js). Import: `import { Renderer, Camera, Program, Mesh, Plane, Texture } from 'ogl'`
- GSAP 3 + ScrollTrigger — все анимации. Никаких CSS transitions для layout-анимаций
- Lenis — smooth scroll. Интеграция: `lenis.on('scroll', ScrollTrigger.update)`
- Vite 7 — сборка. GLSL файлы импортировать через `?raw` суффикс или vite-plugin-glsl

## Шрифты

- Petrov Sans Trial — основной

## Шейдеры

- Хранить в отдельных `.glsl` файлах рядом с компонентом в `gl/` папке
- Импорт: `import fragmentShader from './gl/shader.frag.glsl?raw'`
- Все uniforms типизировать в JSDoc или комментарием рядом с объявлением

## Структура компонентов
src/components/
FeatureName/
FeatureName.vue          — основной компонент
SubComponent.vue         — дочерние компоненты
gl/
SomeLayer.js           — OGL Mesh/Program обёртки
shader.vert.glsl       — vertex shader
shader.frag.glsl       — fragment shader
