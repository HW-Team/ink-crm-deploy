import Board from "@/components/Board";

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0F172A]">บอร์ด</h1>
        <p className="text-sm text-[#64748B]">ลากการ์ดเพื่อเปลี่ยนสเตจ</p>
      </header>
      <Board />
    </div>
  );
}
