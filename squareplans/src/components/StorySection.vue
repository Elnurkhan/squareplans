<template>
  <section id="story" class="section section--story">
    <div class="story-content">
      <h2 class="story-heading">The Story</h2>
      <p class="story-text">
        A blend of code and canvas, where every scroll reveals
        a new dimension of interactive design.
      </p>
    </div>
  </section>
</template>

<style scoped>
.section--story {
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-content {
  max-width: 36rem;
  text-align: center;
  padding: 0 2rem;
}

.story-heading {
  font-size: 1.5rem;
  font-weight: 200;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.story-text {
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 300;
}
</style>
