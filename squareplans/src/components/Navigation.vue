<template>
  <nav class="nav" aria-label="Main navigation">
    <a href="#hero" class="nav-logo" aria-label="ink — home">ink</a>
    <ul class="nav-links">
      <li><a href="#hero">Home</a></li>
      <li><a href="#story">Story</a></li>
      <li><a href="#tech">Tech</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 3rem;
  pointer-events: auto;
}

.nav-logo {
  font-size: 1.25rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
  list-style: none;
}

.nav-links a {
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: rgba(255, 255, 255, 0.9);
}
</style>
