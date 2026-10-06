const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert latin digits to Persian digits. */
export function fa(input: number | string): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** Zero-padded Persian number, e.g. 8 -> «۰۸» */
export function faNum(n: number, pad = 2): string {
  return fa(String(n).padStart(pad, "0"));
}

export function faTime(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return fa(`${hh}:${mm}`);
}

/** «حدود ۲۰ دقیقه» style text; 0 → «همین حالا» */
export function waitText(min: number): string {
  if (min <= 0) return "همین حالا نوبتته";
  if (min < 60) return `حدود ${fa(min)} دقیقه`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!m) return `حدود ${fa(h)} ساعت`;
  return `حدود ${fa(h)} ساعت و ${fa(m)} دقیقه`;
}

export function pluralPeople(n: number): string {
  return `${fa(n)} نفر`;
}
