<template>
  <p>
    Hello, world!
  </p>
</template>

<script setup lang="ts">
  import { rpcSetSuspend } from '../../js/rpc';
  rpcSetSuspend(false)
</script>

<style scoped>

</style>
