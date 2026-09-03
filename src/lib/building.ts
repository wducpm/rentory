import "server-only";
import { headers } from "next/headers";
import { BUILDING_SLUG_HEADER } from "@/lib/tenant";
import { DEFAULT_BUILDING_SLUG } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Building = Database["public"]["Tables"]["buildings"]["Row"];
export type BuildingSettingsRow =
  Database["public"]["Tables"]["building_settings"]["Row"];

/** Slug tòa nhà của request hiện tại (middleware đã tách từ host). */
export async function currentBuildingSlug(): Promise<string> {
  const h = await headers();
  return h.get(BUILDING_SLUG_HEADER) ?? DEFAULT_BUILDING_SLUG;
}

/**
 * Tòa nhà của request hiện tại, đọc dưới RLS — chỉ trả về nếu admin đăng nhập
 * đúng là admin của tòa đó.
 */
export async function currentBuilding(): Promise<Building | null> {
  const slug = await currentBuildingSlug();
  const supabase = await createClient();
  const { data } = await supabase
    .from("buildings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}
