"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Event = {
  id: string; lead_id: string | null; contact_id: string | null;
  due_date: string; due_time: string | null; task_type: string | null;
  status: string; latest_note: string | null; owner: string | null;
  contact_name: string | null; lead_name: string | null; crm_stage: string | null;
};
type LeadOpt = { id: string; full_name: string; phone: string | null; contact_id: string | null };

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function iso(d: Date): string { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d: Date): Date { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return x; }

function typeColor(e: Event, today: string): string {
  if (e.status === "done") return "bg-[#EEF2F7] text-[#94A3B8]";
  if (e.status === "cancelled") return "bg-[#F1F5F9] text-[#CBD5E1] line-through";
  if (String(e.due_date).slice(0, 10) < today) return "bg-[#FEE2E2] text-[#B91C1C]";
  if ((e.task_type ?? "").includes("นัดดู")) return "bg-[#EDE9FE] text-[#6D28D9]";
  return "bg-[#FEF3C7] text-[#B45309]";
}

export default function CalendarClient({ initialMonth }: { initialMonth: string }) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<Date>(() => new Date(initialMonth + "T12:00:00"));
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [leads, setLeads] = useState<LeadOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [quickDay, setQuickDay] = useState<string | null>(null);
  const [detail, setDetail] = useState<Event | null>(null);
  const [toast, setToast] = useState("");

  const range = useMemo(() => {
    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      return { from: iso(startOfWeek(first)), to: iso(addDays(addDays(startOfWeek(first), 41), 1)) };
    }
    if (view === "week") {
      const s = startOfWeek(anchor);
      return { from: iso(s), to: iso(addDays(s, 7)) };
    }
    return { from: iso(anchor), to: iso(anchor) };
  }, [anchor, view]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/calendar?from=${range.from}&to=${range.to}`);
    const d = await r.json();
    setEvents(d.events ?? []);
    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/leads?limit=500").then((r) => r.json()).then((d) => setLeads(d.leads ?? []));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const byDay = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of events) {
      const k = String(e.due_date).slice(0, 10);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [events]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  // ── month grid ──
  const monthCells = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = startOfWeek(first);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
    return cells;
  }, [anchor]);

  const onDrop = async (day: string) => {
    if (!dragId) return;
    const target = new Date(day + "T12:00:00");
    const e = events.find((x) => x.id === dragId);
    setDragId(null);
    if (!e) return;
    if (String(e.due_date).slice(0, 10) === day) return;
    const res = await fetch(`/api/follow-ups/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ due_date: day, status: e.status === "done" ? "open" : undefined }),
    });
    if (res.ok) { notify(`ย้าย "${e.contact_name ?? e.lead_name ?? "งาน"}" ไป ${day}`); load(); }
    else notify("ย้ายไม่สำเร็จ");
    void target;
  };

  const complete = async (e: Event) => {
    const res = await fetch(`/api/follow-ups/${e.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: e.status === "done" ? "open" : "done" }),
    });
    if (res.ok) { notify(e.status === "done" ? "เปิดงานใหม่" : "เสร็จแล้ว"); setDetail(null); load(); }
  };

  const quickAdd = async (form: { lead_id: string; due_time: string; task_type: string; note: string }) => {
    const lead = leads.find((l) => l.id === form.lead_id);
    if (!lead) return notify("เลือกลีดก่อน");
    const res = await fetch("/api/follow-ups", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: lead.contact_id, lead_id: lead.id, due_date: quickDay, due_time: form.due_time || null, task_type: form.task_type, latest_note: form.note || null }),
    });
    if (res.ok) { notify("เพิ่มงานเรียบร้อย"); setQuickDay(null); load(); }
    else notify("เพิ่มไม่สำเร็จ");
  };

  const monthLabel = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-secondary !px-3" onClick={() => setAnchor(new Date())}>วันนี้</button>
          <div className="flex items-center gap-1">
            <button className="btn-secondary !px-2.5" onClick={() => setAnchor((d) => view === "month" ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : addDays(d, view === "week" ? -7 : -1))}>‹</button>
            <button className="btn-secondary !px-2.5" onClick={() => setAnchor((d) => view === "month" ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : addDays(d, view === "week" ? 7 : 1))}>›</button>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-1 bg-[#EEF2F7] rounded-lg p-1">
          {([["month", "เดือน"], ["week", "สัปดาห์"], ["day", "วัน"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setView(k)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${view === k ? "bg-white text-[#0E7490] shadow-sm" : "text-[#64748B]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && (
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
            {DOW.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? "text-[#B91C1C]" : "text-[#64748B]"}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((d) => {
              const key = iso(d);
              const dayEvents = byDay.get(key) ?? [];
              const inMonth = d.getMonth() === anchor.getMonth();
              const isToday = key === today;
              const isSel = key === selected;
              return (
                <div
                  key={key}
                  onClick={() => { setSelected(key); setQuickDay(key); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDrop(key); }}
                  className={`min-h-[92px] border-b border-r border-[#F1F5F9] p-1.5 cursor-pointer transition-colors ${
                    inMonth ? "bg-white" : "bg-[#F8FAFC]"
                  } ${isSel ? "bg-[#E0F2FE]" : "hover:bg-[#F8FAFC]"}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center text-xs rounded-full mb-1 ${
                    isToday ? "bg-[#0E7490] text-white font-bold" : inMonth ? "text-[#334155]" : "text-[#CBD5E1]"
                  }`}>{d.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} draggable
                        onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", e.id); setDragId(e.id); }}
                        onClick={(ev) => { ev.stopPropagation(); setDetail(e); }}
                        className={`text-[10.5px] leading-tight px-1.5 py-0.5 rounded truncate cursor-grab ${typeColor(e, today)}`}
                        title={`${e.contact_name ?? e.lead_name ?? ""} ${e.due_time ?? ""} ${e.latest_note ?? ""}`}
                      >
                        {e.due_time ? `${e.due_time} ` : ""}{e.contact_name ?? e.lead_name ?? "—"}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-[#94A3B8] px-1">+{dayEvents.length - 3} รายการ</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="card p-0 overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[720px]">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(startOfWeek(anchor), i);
              const key = iso(d);
              const dayEvents = byDay.get(key) ?? [];
              const isToday = key === today;
              return (
                <div key={key} className="border-r border-[#F1F5F9] last:border-r-0 min-h-[420px]"
                  onClick={() => setQuickDay(key)} onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDrop(key); }}>
                  <div className={`py-2 text-center text-sm font-semibold border-b border-[#F1F5F9] ${isToday ? "text-[#0E7490]" : "text-[#334155]"}`}>
                    {DOW[i]} {d.getDate()}
                  </div>
                  <div className="p-1.5 space-y-1">
                    {dayEvents.map((e) => (
                      <div key={e.id} draggable
                        onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", e.id); setDragId(e.id); }}
                        onClick={(ev) => { ev.stopPropagation(); setDetail(e); }}
                        className={`text-xs px-2 py-1.5 rounded truncate cursor-grab ${typeColor(e, today)}`}>
                        {e.due_time ? `${e.due_time} ` : ""}{e.contact_name ?? e.lead_name ?? "—"}
                      </div>
                    ))}
                    {dayEvents.length === 0 && <p className="text-[11px] text-[#CBD5E1] text-center pt-6">ว่าง</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "day" && (
        <div className="card">
          <h2 className="text-base font-semibold text-[#0F172A] mb-3">{iso(anchor)}</h2>
          {(byDay.get(iso(anchor)) ?? []).length === 0 && <p className="text-sm text-[#94A3B8]">ไม่มีนัดหมายวันนี้</p>}
          <div className="space-y-2">
            {(byDay.get(iso(anchor)) ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between border border-[#E2E8F0] rounded-md px-3 py-2"
                onClick={() => setDetail(e)}>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{e.contact_name ?? e.lead_name ?? "—"}</p>
                  <p className="text-xs text-[#64748B]">{e.due_time ?? "ทั้งวัน"} · {e.task_type ?? "ติดตาม"}{e.latest_note ? ` · ${e.latest_note}` : ""}</p>
                </div>
                <span className={`badge ${typeColor(e, today).split(" ")[0]}`}>{e.status === "done" ? "เสร็จ" : e.status === "cancelled" ? "ยกเลิก" : "ค้าง"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-[#64748B]">กำลังโหลด...</p>}

      {/* quick add modal */}
      {quickDay && (
        <QuickAddModal day={quickDay} leads={leads} onClose={() => setQuickDay(null)} onSubmit={quickAdd} />
      )}

      {/* detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,.35)] flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl border border-[#E2E8F0] w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0F172A]">{detail.contact_name ?? detail.lead_name ?? "งาน"}</h3>
              <button className="text-[#94A3B8] text-lg leading-none" onClick={() => setDetail(null)}>×</button>
            </div>
            <div className="space-y-1.5 text-sm text-[#334155]">
              <p>{String(detail.due_date).slice(0, 10)}{detail.due_time ? ` ${detail.due_time}` : ""}</p>
              <p>{detail.task_type ?? "ติดตาม"}{detail.owner ? ` · ${detail.owner}` : ""}</p>
              {detail.latest_note && <p className="text-[#64748B]">{detail.latest_note}</p>}
            </div>
            {detail.lead_id && (
              <a href={`/leads/${detail.lead_id}`} className="text-sm text-[#0E7490] font-medium mt-3 inline-block hover:underline">เปิดหน้าลีด</a>
            )}
            <div className="flex gap-3 mt-5">
              <button className="btn-primary" onClick={() => complete(detail)}>
                {detail.status === "done" ? "เปิดงานใหม่" : "เสร็จแล้ว"}
              </button>
              <button className="btn-secondary" onClick={() => setDetail(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0E7490] text-white text-sm font-medium px-4 py-2 rounded-full z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function QuickAddModal({ day, leads, onClose, onSubmit }: {
  day: string; leads: LeadOpt[]; onClose: () => void;
  onSubmit: (f: { lead_id: string; due_time: string; task_type: string; note: string }) => void;
}) {
  const [form, setForm] = useState({ lead_id: "", due_time: "", task_type: "โทรติดตาม", note: "" });
  return (
    <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,.35)] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-[#E2E8F0] w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-[#0F172A] mb-1">เพิ่มนัดหมาย {day}</h3>
        <p className="text-xs text-[#64748B] mb-4">เลือกลีดและตั้งเวลาติดตาม</p>
        <div className="space-y-3">
          <div>
            <label className="inp-label">ลีด</label>
            <select className="inp" value={form.lead_id} onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}>
              <option value="">เลือกลีด</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.full_name}{l.phone ? ` (${l.phone})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inp-label">เวลา</label>
              <input className="inp" type="time" value={form.due_time} onChange={(e) => setForm((f) => ({ ...f, due_time: e.target.value }))} />
            </div>
            <div>
              <label className="inp-label">ประเภท</label>
              <select className="inp" value={form.task_type} onChange={(e) => setForm((f) => ({ ...f, task_type: e.target.value }))}>
                <option>โทรติดตาม</option>
                <option>นัดดูโชว์รูม/ที่ดิน</option>
                <option>ส่งข้อเสนอ</option>
                <option>อื่นๆ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="inp-label">หมายเหตุ</label>
            <input className="inp" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="โน้ตเตือน" />
          </div>
          <div className="flex gap-3 pt-1">
            <button className="btn-primary flex-1" onClick={() => onSubmit(form)} disabled={!form.lead_id}>เพิ่ม</button>
            <button className="btn-secondary" onClick={onClose}>ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  );
}
