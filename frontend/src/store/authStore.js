import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('sg_user') || 'null'),
  token: localStorage.getItem('sg_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('sg_user', JSON.stringify(user));
    localStorage.setItem('sg_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('sg_user');
    localStorage.removeItem('sg_token');
    set({ user: null, token: null });
  },
}));
