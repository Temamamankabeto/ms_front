import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/services/auth/auth.service";
type UserState = { user: AuthUser | null; roles: string[]; permissions: string[] };
const initialState: UserState = { user: null, roles: [], permissions: [] };
const userSlice = createSlice({ name: "auth", initialState, reducers: { setAuthState: (state, action: PayloadAction<UserState>) => { state.user = action.payload.user; state.roles = action.payload.roles; state.permissions = action.payload.permissions; }, clearAuthState: (state) => { state.user = null; state.roles = []; state.permissions = []; } } });
export const { setAuthState, clearAuthState } = userSlice.actions;
export default userSlice.reducer;
