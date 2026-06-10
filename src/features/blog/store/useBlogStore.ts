import { create } from "zustand";
import axios from "axios";
import type { BlogPost, BlogStore } from "../../../types";

export const useBlogStore = create<BlogStore>((set, get) => ({
  posts: [],
  loading: false,
  page: 0,
  ITEMS_PER_PAGE: 6,

  fetchPosts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<BlogPost[]>("/data/Blog.json");
      set({ posts: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch blog posts", err);
      set({ loading: false });
    }
  },

  getPostBySlug: (slug: string) => {
    return get().posts.find((post) => post.slug === slug);
  },

  nextPage: () =>
    set((state) => ({
      page: Math.min(
        state.page + 1,
        Math.ceil(state.posts.length / state.ITEMS_PER_PAGE) - 1
      ),
    })),

  prevPage: () =>
    set((state) => ({
      page: Math.max(state.page - 1, 0),
    })),

  setPage: (page: number) => set({ page }),
}));
