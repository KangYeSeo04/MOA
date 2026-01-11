import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthUser = {
  id: number;
  username?: string;
  email?: string;
  nickname?: string | null;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;

  // 앱 시작 시 persist가 복구되기 전/후 구분용
  hydrated: boolean;
  setHydrated: (v: boolean) => void;

  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,

      setHydrated: (v) => set({ hydrated: v }),

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "moa-auth",
      storage: createJSONStorage(() => AsyncStorage),

      // persist 복구 완료 시점 표시 (라우팅 깜빡임 방지)
      onRehydrateStorage: () => (state, error) => {
        state?.setHydrated(true);
      },
    }
  )
);