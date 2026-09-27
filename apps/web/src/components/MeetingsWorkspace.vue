<script setup lang="ts">
import { shallowRef } from 'vue';
import { useMeetings } from '../composables/useMeetings';
import type { MeetingCreate } from '../api/client';
import MeetingForm from './MeetingForm.vue';
import MeetingList from './MeetingList.vue';
import MeetingsSummary from './MeetingsSummary.vue';
import StatusMessage from './StatusMessage.vue';
import WorkspaceHeader from './WorkspaceHeader.vue';

const { meetings, email, status, pending, feedback, load, create, logout } =
  useMeetings();
const composerOpen = shallowRef(false);

async function createMeeting(meeting: MeetingCreate) {
  if (await create(meeting)) composerOpen.value = false;
}
</script>

<template>
  <main class="workspace">
    <WorkspaceHeader @logout="logout" />
    <MeetingsSummary
      :email="email"
      :count="meetings.length"
      :status="status"
      :pending="pending"
      :composer-open="composerOpen"
      @toggle-composer="composerOpen = !composerOpen"
    />
    <MeetingForm
      v-if="composerOpen"
      :pending="pending"
      @submit="createMeeting"
    />
    <StatusMessage :feedback="feedback" class="workspace-message" />
    <MeetingList :meetings="meetings" :status="status" @retry="load" />
  </main>
</template>

<style scoped>
.workspace {
  width: min(1180px, 100%);
  min-height: 100dvh;
  margin: auto;
  padding: 20px clamp(20px, 5vw, 48px) 72px;
}
@media (width <= 600px) {
  .workspace {
    padding: 16px 20px 48px;
  }
}

.workspace-message {
  margin-bottom: 16px;
}
</style>
