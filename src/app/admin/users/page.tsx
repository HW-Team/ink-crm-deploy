import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/supabase";
import UsersAdmin from "@/components/UsersAdmin";
import { t, getServerLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const lang = await getServerLang();
  const me = await getSessionUser();
  if (!me) redirect("/login");
  if (me.role !== "manager") redirect("/");

  const users = await q(
    `select u.id, u.email, u.full_name, u.role, u.active,
       (select count(*) from leads l where l.owner_id = u.id) as owned_leads,
       (select count(*) from follow_ups fu where fu.owner_id = u.id and fu.status = 'open') as open_followups
     from users u order by u.role desc, u.full_name`
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "users.title")} · ผู้ใช้</h1>
        <p className="text-sm text-[#64748B] mt-0.5">{t(lang, "users.subtitle")}</p>
      </header>
      <UsersAdmin users={users} meId={me.id} />
    </div>
  );
}
