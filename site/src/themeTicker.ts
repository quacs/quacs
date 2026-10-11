// Lines for the Artisanal theme's bottom ticker. This file is the only copy of them: applyTicker()
// shuffles them into an SVG tile and hands it, with the tile width and loop duration, to
// body::after in themes/artisanal.css through custom properties. Without JavaScript there is no
// ticker.
export const TICKER_LINES: readonly string[] = [
  "ASKED A CHATBOT TO DEFINE WATER. IT DRANK IT.",
  "SLOP WAS WORD OF THE YEAR. WELL EARNED.",
  "CITATION NEEDED. CITATION INVENTED.",
  "YOUR BOT EMAILED MY BOT. NOBODY READ IT.",
  "AGENT. AGENT. AGENT. HUMAN. PLEASE.",
  "5 STARS FROM A REVIEWER WHO NEVER EXISTED",
  "LET'S DELVE INTO WHY NOBODY SAYS DELVE",
  "NOW WITH AI. NOW WORSE. NOW PRICIER.",
  "YOUR POWER BILL IS FUNDING ITS POETRY",
  "THE CASE LAW WAS VERY CONVINCING AND FAKE",
  "SIX FINGERS. NO SOUL. NICE TRY.",
  "HUMBLED TO ANNOUNCE A BOT WROTE THIS POST",
  "PRESS 0 FOR A HUMAN. THERE IS NO 0.",
  "NO EM DASHES HERE - JUST THIS SAD HYPHEN",
  "NOBODY ASKED FOR AI IN THE TOASTER",
  "SAVE WATER. SKIP THE CHATBOT.",
  "MORE CONTENT THAN EVER. NOTHING TO READ.",
  "THE BOT SAID GLUE ON PIZZA. WE SAY NO.",
  "ITS POSTERS SAY 'HAPPPY BRITHDAY'",
  "WORKSLOP: SAVED YOU 5 MIN. COST ME 2 HRS.",
  "A CHATBOT INVENTED A REFUND. COURT: PAY IT.",
  "'AS AN AI LANGUAGE MODEL, I LOVED THIS MOP'",
  "IT'S NOT JUST A TICKER - IT'S A TESTAMENT",
  "NEW AI FEATURE! PRICE UP! OFF SWITCH GONE!",
  "THE GRID IS SWEATING SO YOU CAN SKIP READING",
  "SUMMER READING LIST: BOOKS THAT DON'T EXIST",
  "CONFIDENTLY WRONG, NOW IN EVERY SEARCH BAR",
  "'GREAT QUESTION!' WAS NOT A GREAT ANSWER",
  "I'M SORRY YOU FEEL THAT WAY, SAID THE LOOP",
  "THE REPLY GUY IS A BOT. SO ARE HIS FANS.",
  "HANDS DRAWN HERE HAVE FIVE FINGERS. MOSTLY.",
  "THIS ZINE: 0 GPUS, 0 AQUIFERS, 1 DUCK",
  "WE DREW THE DUCK. NOBODY SCRAPED THE DUCK.",
  "HANDMADE BY TIRED HUMANS. ZERO SLOP ADDED.",
  "'YOU ARE ABSOLUTELY RIGHT,' SAID THE CHATBOT",
];

// Tile width in px. textLength stretches the letter spacing to fill it, so every order of the lines
// produces a tile of exactly this width.
export const TICKER_WIDTH = 17696;
// Scroll speed in px per second.
export const TICKER_SPEED = 75;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildTickerSvg(lines: readonly string[]): string {
  const text = lines.join(" • ") + " • ";
  const w = TICKER_WIDTH;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="34" viewBox="0 0 ${w} 34">` +
    `<rect width="${w}" height="34" fill="#000"/>` +
    `<rect width="${w}" height="3" fill="#ff2e88"/>` +
    `<text x="0" y="24" textLength="${w}" lengthAdjust="spacing" xml:space="preserve" ` +
    `font-family="'Comic Sans MS','Comic Sans','Comic Neue',cursive" font-weight="700" font-size="19" fill="#ffd400">` +
    `${escapeXml(text)}</text></svg>`
  );
}

export function applyTicker(): void {
  const lines = TICKER_LINES.slice();
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }
  // encodeURIComponent escapes every double quote, so the value is safe inside url("...")
  const dataUri =
    "data:image/svg+xml," + encodeURIComponent(buildTickerSvg(lines));
  const style = document.documentElement.style;
  style.setProperty("--artisanal-ticker", 'url("' + dataUri + '")');
  style.setProperty("--ticker-width", TICKER_WIDTH + "px");
  style.setProperty("--ticker-duration", TICKER_WIDTH / TICKER_SPEED + "s");
}
