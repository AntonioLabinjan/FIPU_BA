<script setup>
defineProps({
  title: {
    type: String,
    default: 'Blockchain Template',
  },
})
</script>

<template>
  <main>
    <h1>{{ title }}</h1>
    <p>Vue 3 projekt je spreman za razvoj.</p>
  </main>
</template>
