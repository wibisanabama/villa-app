import type { User } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      authUser?: User;
      profile?: {
        id: string;
        email: string;
        full_name: string | null;
        phone_number: string | null;
        avatar_url: string | null;
        system_role: "USER" | "SUPER_ADMIN";
        is_suspended: boolean;
      };
    }
  }
}

export {};

