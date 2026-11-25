// /features/comments/store/useCommentStore.ts
import { create } from "zustand";
import axios from "axios";
import type { Comment, CommentStore } from "../../../types";
import { ensureHttps } from "../../../shared/lib/utils";

export const useCommentStore = create<CommentStore>((set) => ({
  comments: [],
  loading: false,
  page: 0,
  ITEMS_PER_PAGE: 3,

  fetchComments: async () => {
    set({ loading: true });
    try {
      const res = await axios.get<Comment[]>("/data/Comments.json"); // Place your JSON file in /public/data
      const sanitizedComments = res.data.map(comment => ({
        ...comment,
        img: ensureHttps(comment.img)
      }));
      set({ comments: sanitizedComments, loading: false });
    } catch (err) {
      console.error("Failed to fetch comments", err);
      set({ loading: false });
    }
  },

  nextPage: () =>
    set((state) => ({
      page: Math.min(
        state.page + 1,
        Math.ceil(state.comments.length / state.ITEMS_PER_PAGE) - 1
      ),
    })),

  prevPage: () =>
    set((state) => ({
      page: Math.max(state.page - 1, 0),
    })),

  setPage: (page: number) => set({ page }),
}));
