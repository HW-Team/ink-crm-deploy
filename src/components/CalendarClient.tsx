"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Event = {
  id: string; lead_id: string | null; contact_id: string | null;
  due_date: string; due_time: string | null; task_type: string | null;
  status: string; latest_note: string | null; owner: string | null;
  contact_name: string | null; lead_name: string | null; crm_stage: string | null;
  location: string | null; confirmed: boolean; primary_phone?: string | null;
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
  if ((e.task_type ?? "").includes("นัดดู")) return e.confirmed ? "bg-[#7C3AED] text-white" : "bg-[#EDE9FE] text-[#6D28D9]";
  return "bg-[#FEF3C7] text-[#B45309]";
}

function phoneHref(phone: string | null | undefined): string | null {
  const p = (phone ?? "").replace(/[^\d]/g, "");
  return p.length >= 9 ? `tel:${p}` : null;
}

function dayLabel(d: string): string {
  const x = new Date(d + "T12:00:00");
  return `${MONTHS[x.getMonth()]} ${x.getDate()}${x.getFullYear() !== new Date().getFullYear() ? " " + x.getFullYear() : ""}`;
}

export default function CalendarClient({ initialMonth }: { initialMonth: string }) {
  const [anchor, setAnchor] = useState<Date>(() => new Date(initialMonth + "T12:00:00"));
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [leads, setLeads] = useState<LeadOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [quickDay, setQuickDay] = useState<string | null>(null);
  const [detail, setDetail] = useState<Event | null>(null);
  const [daySheet, setDaySheet] = useState<string | null>(null);
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
    for (const k of m.keys()) m.get(k)!.sort((a, b) => (a.due_time ?? "99").localeCompare(b.due_time ?? "99"));
    return m;
  }, [events]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const monthCells = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = startOfWeek(first);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
    return cells;
  }, [anchor]);

  const onDrop = async (day: string) => {
    if (!dragId) return;
    const e = events.find((x) => x.id === dragId);
    setDragId(null);
    if (!e) return;
    if (String(e.due_date).slice(0, 10) === day) return;
    const res = await fetch(`/api/follow-ups/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ due_date: day, status: e.status === "done" ? "open" : undefined }),
    });
    if (res.ok) { notify(`ย้ายไป ${dayLabel(day)}`); load(); }
    else notify("ย้ายไม่สำเร็จ");
  };

  const patch = async (id: string, body: Record<string, unknown>, msg: string) => {
    const res = await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (res.ok) { notify(msg); load(); return true; }
    notify("บันทึกไม่สำเร็จ");
    return false;
  };

  const openDay = (day: string) => { setSelected(day); setDaySheet(day); };

  const quickAdd = async (form: { lead_id: string; due_time: string; task_type: string; note: string; location: string }) => {
    const lead = leads.find((l) => l.id === form.lead_id);
    if (!lead) return notify("เลือกลีดก่อน");
    const res = await fetch("/api/follow-ups", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: lead.contact_id, lead_id: lead.id, due_date: quickDay, due_time: form.due_time || null, task_type: form.task_type, latest_note: form.note || null, location: form.location || null }),
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
              const visits = dayEvents.filter((e) => (e.task_type ?? "").includes("นัดดู")).length;
              const follows = dayEvents.filter((e) => !(e.task_type ?? "").includes("นัดดู") && e.status === "open").length;
              return (
                <div
                  key={key}
                  onClick={() => openDay(key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onDrop(key); }}
                  className={`min-h-[96px] border-b border-r border-[#F1F5F9] p-1.5 cursor-pointer transition-colors ${
                    inMonth ? "bg-white" : "bg-[#F8FAFC]"
                  } ${isSel ? "bg-[#E0F2FE]" : "hover:bg-[#F8FAFC]"}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center text-xs rounded-full mb-1 ${
                    isToday ? "bg-[#0E7490] text-white font-bold" : inMonth ? "text-[#334155]" : "text-[#CBD5E1]"
                  }`}>{d.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div key={e.id} draggable
                        onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", e.id); setDragId(e.id); }}
                        onClick={(ev) => { ev.stopPropagation(); setDetail(e); }}
                        className={`text-[10.5px] leading-tight px-1.5 py-0.5 rounded truncate cursor-grab ${typeColor(e, today)}`}
                        title={`${e.contact_name ?? e.lead_name ?? ""} ${e.due_time ?? ""} ${e.latest_note ?? ""}`}
                      >
                        {e.due_time ? `${e.due_time} ` : ""}{e.contact_name ?? e.lead_name ?? "—"}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-[#94A3B8] px-1">+{dayEvents.length - 2} รายการ</div>
                    )}
                  </div>
                  {(visits > 0 || follows > 0) && dayEvents.length <= 2 && (
                    <div className="flex gap-1 mt-1">
                      {visits > 0 && <span className="text-[9px] bg-[#EDE9FE] text-[#6D28D9] rounded-full px-1.5 py-px">นัดดู {visits}</span>}
                      {follows > 0 && <span className="text-[9px] bg-[#FEF3C7] text-[#B45309] rounded-full px-1.5 py-px">ติดตาม {follows}</span>}
                    </div>
                  )}
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
                  onClick={() => openDay(key)} onDragOver={(e) => e.preventDefault()}
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
          <h2 className="text-base font-semibold text-[#0F172A] mb-3">{dayLabel(iso(anchor))}</h2>
          {(byDay.get(iso(anchor)) ?? []).length === 0 && <p className="text-sm text-[#94A3B8]">ไม่มีนัดหมายวันนี้</p>}
          <div className="space-y-2">
            {(byDay.get(iso(anchor)) ?? []).map((e) => (
              <button key={e.id} className="w-full text-left flex items-center justify-between border border-[#E2E8F0] rounded-md px-3 py-2 hover:border-[#0E7490]"
                onClick={() => setDetail(e)}>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{e.contact_name ?? e.lead_name ?? "—"}</p>
                  <p className="text-xs text-[#64748B]">{e.due_time ?? "ทั้งวัน"} · {e.task_type ?? "ติดตาม"}{e.latest_note ? ` · ${e.latest_note}` : ""}</p>
                </div>
                <span className={`badge ${typeColor(e, today).split(" ")[0]}`}>{e.status === "done" ? "เสร็จ" : e.status === "cancelled" ? "ยกเลิก" : "ค้าง"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-[#64748B]">กำลังโหลด...</p>}

      {/* quick add modal */}
      {quickDay && (
        <QuickAddModal day={quickDay} leads={leads} onClose={() => setQuickDay(null)} onSubmit={quickAdd} />
      )}

      {/* day sheet — รายการของวัน */}
      {daySheet && !detail && (
        <DaySheet day={daySheet} dayEvents={byDay.get(daySheet) ?? []} today={today}
          onClose={() => setDaySheet(null)} onEvent={(e) => setDetail(e)}
          onAdd={() => setQuickDay(daySheet)} onPatch={patch} />
      )}

      {/* event detail sheet — bottom (mobile) / right panel (desktop) */}
      {detail && (
        <EventSheet event={detail} today={today} onClose={() => setDetail(null)} onPatch={patch} />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0E7490] text-white text-sm font-medium px-4 py-2 rounded-full z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,.4)]" onClick={onClose}>
      <div
        className="absolute bottom-0 inset-x-0 md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-[400px] md:h-full bg-white rounded-t-2xl md:rounded-none shadow-2xl max-h-[88dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center md:justify-end pt-2.5 pb-0 md:pt-4 md:pr-4 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 rounded-full bg-[#E2E8F0] md:hidden" />
          <button className="hidden md:block w-8 h-8 rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] text-lg leading-none" onClick={onClose}>×</button>
        </div>
        <div className="px-5 pb-6 pt-2 md:pt-0">{children}</div>
      </div>
    </div>
  );
}

function EventSheet({ event: e, today, onClose, onPatch }: {
  event: Event; today: string; onClose: () => void; onPatch: (id: string, body: Record<string, unknown>, msg: string) => Promise<boolean>;
}) {
  const tel = phoneHref(e.primary_phone ?? null);
  const isVisit = (e.task_type ?? "").includes("นัดดู");
  const done = e.status === "done";
  return (
    <Sheet onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <span className={`badge ${typeColor(e, today).split(" ")[0]}`}>{e.task_type ?? "ติดตาม"}</span>
          {done && <span className="badge st-won">เสร็จแล้ว</span>}
          {isVisit && e.confirmed && <span className="badge st-site_visit">ยืนยันนัด</span>}
          {!done && !isVisit && String(e.due_date).slice(0, 10) < today && <span className="badge st-lost">เลยกำหนด</span>}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[#0F172A]">{e.contact_name ?? e.lead_name ?? "ไม่ระบุชื่อ"}</h3>
          <p className="text-sm text-[#64748B] mt-1">
            {dayLabel(String(e.due_date).slice(0, 10))}{e.due_time ? ` · ${e.due_time}` : " · ทั้งวัน"}
            {e.owner ? ` · ${e.owner}` : ""}
          </p>
        </div>

        {tel && (
          <a href={tel} className="btn-primary w-full flex items-center justify-center gap-2 !py-3 text-base">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2Z" />
            </svg>
            โทรหาลูกค้า
          </a>
        )}

        <div className="space-y-3 text-sm">
          {e.location && (
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 text-[#64748B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              </svg>
              <div>
                <p className="text-[#334155]">{e.location}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}`}
                  target="_blank" rel="noreferrer"
                  className="text-[#0E7490] font-medium hover:underline text-xs"
                >เปิดแผนที่</a>
              </div>
            </div>
          )}
          {e.latest_note && (
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 text-[#64748B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <p className="text-[#334155]">{e.latest_note}</p>
            </div>
          )}
        </div>

        {e.lead_id && (
          <a href={`/leads/${e.lead_id}`} className="text-sm text-[#0E7490] font-medium hover:underline inline-block">เปิดหน้าลีด</a>
        )}

        <div className="flex gap-3 pt-1">
          {isVisit && !e.confirmed && !done && (
            <button className="btn-primary flex-1" onClick={() => onPatch(e.id, { confirmed: true }, "ยืนยันนัดแล้ว")}>ยืนยันนัด</button>
          )}
          <button className={isVisit && !e.confirmed && !done ? "btn-secondary flex-1" : "btn-primary flex-1"}
            onClick={() => onPatch(e.id, { status: done ? "open" : "done" }, done ? "เปิดงานใหม่" : "เสร็จแล้ว")}>
            {done ? "เปิดงานใหม่" : "เสร็จแล้ว"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function DaySheet({ day, dayEvents, today, onClose, onEvent, onAdd, onPatch }: {
  day: string; dayEvents: Event[]; today: string; onClose: () => void;
  onEvent: (e: Event) => void; onAdd: () => void;
  onPatch: (id: string, body: Record<string, unknown>, msg: string) => Promise<boolean>;
}) {
  const isToday = day === today;
  return (
    <Sheet onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">{dayLabel(day)}</h3>
            <p className="text-sm text-[#64748B]">{isToday ? "วันนี้" : ""} {dayEvents.length} รายการ</p>
          </div>
          <button className="btn-primary !px-4" onClick={onAdd}>+ เพิ่มนัด</button>
        </div>
        {dayEvents.length === 0 && <p className="text-sm text-[#94A3B8]">วันนี้ว่าง ไม่มีนัดหมาย</p>}
        <div className="space-y-2">
          {dayEvents.map((e) => (
            <button key={e.id} onClick={() => onEvent(e)}
              className="w-full text-left border border-[#E2E8F0] rounded-lg px-3.5 py-3 hover:border-[#0E7490] transition-colors">
              <div className="flex items-center gap-2">
                <span className={`badge ${typeColor(e, today).split(" ")[0]}`}>{e.due_time ?? "ทั้งวัน"}</span>
                <span className="text-sm font-medium text-[#0F172A]">{e.contact_name ?? e.lead_name ?? "—"}</span>
              </div>
              <div className="text-xs text-[#64748B] mt-1">{e.task_type ?? "ติดตาม"}{e.location ? ` · ${e.location}` : ""}</div>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function QuickAddModal({ day, leads, onClose, onSubmit }: {
  day: string; leads: LeadOpt[]; onClose: () => void;
  onSubmit: (f: { lead_id: string; due_time: string; task_type: string; note: string; location: string }) => void;
}) {
  const [form, setForm] = useState({ lead_id: "", due_time: "", task_type: "โทรติดตาม", note: "", location: "" });
  return (
    <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,.4)] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-xl border border-[#E2E8F0] w-full max-w-sm p-5 max-h-[88dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-[#0F172A] mb-1">เพิ่มนัดหมาย {dayLabel(day)}</h3>
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
            <label className="inp-label">สถานที่ (นัดดู)</label>
            <input className="inp" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="โชว์รูม / ที่อยู่หน้างาน" />
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
