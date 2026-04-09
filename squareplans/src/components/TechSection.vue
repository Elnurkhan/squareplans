<template>
  <section id="tech" class="section section--tech">
    <div class="tech-content">
      <h2 class="tech-heading">Technology</h2>
      <ul class="tech-list">
        <li class="tech-item">
          <span class="tech-label">Renderer</span>
          <span class="tech-value">OGL WebGL</span>
        </li>
        <li class="tech-item">
          <span class="tech-label">Framework</span>
          <span class="tech-value">Vue 3</span>
        </li>
        <li class="tech-item">
          <span class="tech-label">Animation</span>
          <span class="tech-value">GSAP</span>
        </li>
        <li class="tech-item">
          <span class="tech-label">Build</span>
          <span class="tech-value">Vite</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.section--tech {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tech-content {
  width: 100%;
  max-width: 28rem;
  padding: 0 2rem;
}

.tech-heading {
  font-size: 1.5rem;
  font-weight: 200;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2.5rem;
  text-align: center;
}

.tech-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tech-label {
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
}

.tech-value {
  font-size: 0.875rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.6);
}
</style>
