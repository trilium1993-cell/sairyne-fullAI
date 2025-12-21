import { safeRemoveItem } from "../utils/storage";

// Central place to reset all persisted plugin UI data (support / troubleshooting).
const KEYS_TO_CLEAR = [
  "sairyne_access_token",
  "sairyne_current_user",
  "sairyne_users",
  "sairyne_projects",
  "sairyne_selected_project",
  "sairyne_functional_chat_state_v1",
  "sairyne_last_boot_id",
  "sairyne_ui_last_step",
  "sairyne_signin_draft_email",
] as const;

export function resetAllLocalData(): void {
  KEYS_TO_CLEAR.forEach((k) => {
    try {
      safeRemoveItem(k);
    } catch {
      // best-effort
    }
  });
}


