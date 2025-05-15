import { auth } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { NotificationList } from "./components/notification-list";
import { fetchAllNotifications } from "./actions";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  await auth();

  const page = Number(searchParams.page) || 1;
  const { notifications, totalPages } = await fetchAllNotifications(page);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="通知中心" description="查看所有系统通知" />
        </div>
        <Separator />
        <NotificationList 
          initialNotifications={notifications}
          initialTotalPages={totalPages}
          initialPage={page}
        />
      </div>
    </div>
  );
} 