import { Building2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/ui-kit";

/** Tài khoản đăng nhập chưa được gán làm admin của tòa nào (chưa seed). */
export function NoBuilding({ slug }: { slug: string }) {
  return (
    <>
      <AppHeader eyebrow="Rentory" title="Chưa có tòa nhà" />
      <main className="mx-auto max-w-3xl px-4 md:px-6">
        <EmptyState
          icon={<Building2 />}
          title={`Không tìm thấy tòa nhà "${slug}"`}
          description="Tài khoản này chưa được gán làm admin của tòa nào. Tạo bản ghi buildings với admin_id trỏ tới tài khoản hiện tại rồi tải lại trang."
        />
      </main>
    </>
  );
}
