import { randomUUID } from 'node:crypto';

export function createState() {
  return {
    revision: 1,
    profile: { name: 'Alex', goal: 'ค่าใช้จ่ายเดือนหน้า', target: 500, due: '2026-10-22', callEnabled: true },
    reserve: 620, available: 880,
    assets: [
      { symbol: 'AVAX', name: 'Avalanche', units: 80, price: 25, color: '#d37251' },
      { symbol: 'USDC', name: 'USD Coin', units: 1500, price: 1, color: '#70978a' },
    ],
    incident: null, action: null, history: [],
    events: [{ id: 'supply-demo', token: 'AVAX', date: '2026-10-20', amount: 1800000, label: 'Illustrative supply release', source: 'Tokenomist fixture — not a real unlock schedule' }],
  };
}
export function assessment(s) {
  const gap = Math.max(0, Math.round((s.profile.target - s.reserve) * 100) / 100);
  const total = s.assets.reduce((n, a) => n + a.units * a.price, 0);
  return { gap, coverage: Math.round(s.reserve / s.profile.target * 100), total,
    concentration: Math.round(s.assets[0].units * s.assets[0].price / total * 100),
    status: gap > 0 ? 'attention' : 'on-track', source: 'simulation', updatedAt: new Date().toISOString() };
}
export function updateProfile(s, p) {
  if (!Number.isFinite(p.target) || p.target < 1 || p.target > 1000000) throw new Error('เป้าหมายต้องอยู่ระหว่าง 1–1,000,000 demo USDC');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.due) || !Number.isFinite(Date.parse(p.due))) throw new Error('กรุณาระบุวันใช้เงิน');
  s.profile = { ...s.profile, goal: String(p.goal || '').trim().slice(0, 100) || 'เงินสำรอง', target: p.target, due: p.due, callEnabled: !!p.callEnabled };
  s.revision++; s.action = null;
  reconcile(s);
}
function reconcile(s) {
  const a = assessment(s);
  if (a.gap && (!s.incident || s.incident.status === 'resolved')) {
    s.incident = { id: randomUUID(), type: 'reserve-shortfall', createdAt: new Date().toISOString(), status: 'open', callOffered: false };
  } else if (!a.gap && s.incident) s.incident.status = 'resolved';
}
export function triggerIncident(s) {
  if (s.incident && s.incident.status !== 'resolved') return { repeated: true, shouldCall: false };
  const before = s.reserve;
  s.reserve = Math.min(s.reserve, Math.round(s.profile.target * .64 * 100) / 100);
  // Move within the illustrative portfolio. Total USDC remains constant.
  s.available += before - s.reserve;
  s.revision++; s.action = null; reconcile(s);
  const shouldCall = s.profile.callEnabled;
  s.incident.callOffered = shouldCall;
  s.history.unshift({ id: randomUUID(), kind: 'incident', text: 'จำลองเงินสำรองลดลง', at: new Date().toISOString() });
  return { repeated: false, shouldCall };
}
export function simulate(s, amount) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > s.available) throw new Error('จำนวนต้องมากกว่า 0 และไม่เกินยอด demo ที่พร้อมใช้');
  const rounded = Math.round(amount * 100) / 100;
  if (rounded <= 0) throw new Error('จำนวนต่ำเกินไป');
  return { amount: rounded, before: s.reserve, after: Math.round((s.reserve + rounded) * 100) / 100,
    remaining: Math.max(0, Math.round((s.profile.target - s.reserve - rounded) * 100) / 100), source: 'simulation' };
}
export function prepare(s, amount) {
  const result = simulate(s, amount);
  s.action = { id: randomUUID(), ...result, revision: s.revision, destination: 'Your demo reserve', asset: 'demo USDC', network: 'Local simulation', expiresAt: Date.now() + 300000, status: 'draft' };
  return s.action;
}
export function confirm(s, id) {
  const d = s.action;
  if (!d || d.id !== id || d.status !== 'draft') throw new Error('ไม่มีรายการรอยืนยัน หรือรายการนี้ยืนยันแล้ว');
  if (d.revision !== s.revision || Date.now() > d.expiresAt) throw new Error('รายการหมดอายุ กรุณาเตรียมรายการใหม่');
  simulate(s, d.amount);
  s.reserve = d.after; s.available = Math.round((s.available - d.amount) * 100) / 100; s.revision++;
  d.status = 'confirmed'; d.receipt = 'DEMO-' + randomUUID().slice(0, 8).toUpperCase();
  s.history.unshift({ id: d.receipt, kind: 'transfer', text: `เติมเงินสำรอง ${d.amount} demo USDC`, at: new Date().toISOString() });
  reconcile(s);
  return d;
}
export function toolsFor(s) {
  return {
    get_wallet_snapshot: () => ({ reserve: s.reserve, available: s.available, assets: s.assets, source: 'Avalanche mock' }),
    get_supply_events: () => s.events,
    assess_goal_risk: () => ({ ...assessment(s), goal: s.profile }),
    simulate_reserve_topup: ({ amount }) => simulate(s, Number(amount)),
    prepare_reserve_transfer: ({ amount }) => prepare(s, Number(amount)),
  };
}
export function demoPlan(message, s) {
  const n = message.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  const amount = n ? Number(n[0]) : assessment(s).gap || 100;
  if (/เตรียม|prepare|draft/i.test(message)) return { tool: 'prepare_reserve_transfer', args: { amount } };
  if (/จำลอง|simulate|what if|เติม|top.?up/i.test(message)) return { tool: 'simulate_reserve_topup', args: { amount } };
  if (/unlock|supply|ปลดล็อก|โทเคน|tokenomist/i.test(message)) return { tool: 'get_supply_events', args: {} };
  return { tool: 'assess_goal_risk', args: {} };
}
export function demoReply(tool, result, s) {
  if (tool === 'simulate_reserve_topup') return `ถ้าเติม ${result.amount} demo USDC เงินสำรองจะเปลี่ยนจาก ${result.before} เป็น ${result.after} ${result.remaining ? `ยังขาดอีก ${result.remaining} เพื่อถึงเป้าหมาย` : 'ถึงเป้าหมายที่คุณตั้งไว้แล้ว'} นี่เป็นการคำนวณจำลอง ยังไม่มีการโอนเงิน`;
  if (tool === 'prepare_reserve_transfer') return `เตรียมรายการ ${result.amount} demo USDC ไปที่กระเป๋าสำรองแล้ว กรุณาตรวจรายละเอียดและกดยืนยันในหน้าต่าง review การยืนยันจะเปลี่ยนเฉพาะยอดจำลองใน POC นี้`;
  if (tool === 'get_supply_events') return 'ตัวอย่างนี้แสดง supply event ของ AVAX เพื่อทดสอบการอธิบายเท่านั้น วันที่และจำนวนเป็นข้อมูลสมมติ ไม่ใช่ข้อมูล Tokenomist จริง การปลดล็อกเพิ่ม supply ที่อาจพร้อมใช้ แต่ไม่ได้ยืนยันว่าราคาจะลดลง';
  const a = assessment(s);
  return a.gap ? `เงินสำรองสำหรับ “${s.profile.goal}” เหลือ ${s.reserve} demo USDC จากเป้าหมาย ${s.profile.target} ขาดอีก ${a.gap} เหตุการณ์นี้สำคัญเพราะเกี่ยวกับเงินที่คุณกันไว้โดยตรง ลองถามว่า “จำลองเติม ${a.gap}” เพื่อดูผลก่อนตัดสินใจ ข้อมูล wallet และเหตุการณ์ทั้งหมดเป็นตัวอย่าง` : `เงินสำรอง ${s.reserve} demo USDC ครอบคลุมเป้าหมาย ${s.profile.target} แล้ว (${a.coverage}%) สำหรับ “${s.profile.goal}” ตอนนี้กติกาเงินสำรองไม่เข้าเงื่อนไขเตือน ส่วน AVAX คิดเป็น ${a.concentration}% ของมูลค่าพอร์ตตัวอย่าง นี่ไม่ใช่ผลประเมิน wallet จริง`;
}
