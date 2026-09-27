import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from './api/session';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/meetings' },
    {
      path: '/auth/Login',
      component: () => import('./views/AuthView.vue'),
      props: { mode: 'login' },
    },
    {
      path: '/auth/Register',
      component: () => import('./views/AuthView.vue'),
      props: { mode: 'register' },
    },
    {
      path: '/meetings',
      component: () => import('./views/MeetingsView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/meetings' },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return '/auth/Login';
  }
});
