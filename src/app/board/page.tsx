import Board from "@/components/Board";
import { t, getServerLang } from "@/lib/i18n-server";

export default async function BoardPage() {
  const lang = await getServerLang();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t(lang, "board.title")}</h1>
        <p className="text-sm text-[#64748B]">{t(lang, "board.dragHint")}</p>
      </header>
      <Board />
    </div>
  );
}
