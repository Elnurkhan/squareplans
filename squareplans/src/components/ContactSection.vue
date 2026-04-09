<template>
  <section id="contact" class="section section--contact">
    <div class="contact-content">
      <h2 class="contact-heading">Get in Touch</h2>
      <p class="contact-text">Interested in working together?</p>
      <a href="mailto:hello@example.com" class="contact-link">hello@example.com</a>
    </div>
  </section>
</template>

<style scoped>
.section--contact {
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-content {
  text-align: center;
  padding: 0 2rem;
}

.contact-heading {
  font-size: 1.5rem;
  font-weight: 200;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
}

.contact-text {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
  margin-bottom: 2rem;
}

.contact-link {
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 0.25rem;
  transition: color 0.3s, border-color 0.3s;
}

.contact-link:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.5);
}
</style>
