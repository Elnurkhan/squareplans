<template>
  <section id="hero" class="section section--hero">
    <h1 class="hero-title">ink</h1>
    <p class="hero-sub">Interactive WebGL Experience</p>
  </section>
</template>

<style scoped>
.section--hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hero-title {
  font-size: clamp(3rem, 10vw, 8rem);
  font-weight: 100;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
}

.hero-sub {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
}
</style>
