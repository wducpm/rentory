import { currentBuilding, currentBuildingSlug } from "@/lib/building";

/**
 * Trang chủ tạm — M3 sẽ thay bằng S-02 (danh sách phòng).
 * Ở đây chỉ để xác nhận middleware subdomain và RLS chạy đúng.
 */
export default async function Home() {
  const slug = await currentBuildingSlug();
  const building = await currentBuilding();

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Rentory
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Tòa nhà: <span className="font-medium">{building?.name ?? slug}</span>
      </p>
      <p className="text-muted-foreground mt-6 text-sm">
        Màn hình quản lý phòng sẽ có ở milestone tiếp theo.
      </p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button
          type="submit"
          className="focus-visible:ring-ring inline-flex h-11 items-center rounded-md border px-4 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          Đăng xuất
        </button>
      </form>
    </main>
  );
}
