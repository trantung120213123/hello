export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code = "", options = {} } = req.body || {};
    const minifyOpt = options.minify !== false; // default true

    // 1) Minify (simple): remove block comments --[[...]] and single-line --...
    function minifyLuau(src) {
      if (!src) return "";
      let s = src.replace(/--\[\[[\s\S]*?\]\]/g, ""); // block
      s = s.replace(/--[^\n\r]*/g, ""); // single-line
      s = s.split(/\r?\n/).map(l => l.replace(/[ \t]+$/g, "")).join("\n");
      s = s.replace(/\n{2,}/g, "\n").trim();
      return s;
    }

    const src = minifyOpt ? minifyLuau(String(code)) : String(code);

    // 2) Helper: encode a string to Luau-style escapes "\047\065..."
    function encodeToEscapes(str) {
      let out = "";
      for (let i = 0; i < str.length; i++) {
        const n = str.charCodeAt(i);
        out += "\\" + String(n).padStart(3, "0");
      }
      return out;
    }

    // 3) Split main code into chunks (by characters)
    const CHUNK_SIZE = 80; // characters per chunk (adjustable)
    const chunks = [];
    for (let i = 0; i < src.length; i += CHUNK_SIZE) {
      const part = src.slice(i, i + CHUNK_SIZE);
      chunks.push(encodeToEscapes(part));
    }

    // 4) Create junk code whose total characters ~ src.length
    const totalLen = Math.max(1, src.length);
    const minJunkItems = 5;
    const estimatedItems = Math.max(minJunkItems, Math.ceil(totalLen / 30));
    const junkItemsCount = estimatedItems;

    // distribute totalLen into junkItemsCount parts approximately
    const baseLen = Math.floor(totalLen / junkItemsCount);
    let remainder = totalLen - baseLen * junkItemsCount;
    const junkStrings = [];
    for (let i = 0; i < junkItemsCount; i++) {
      const len = baseLen + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      // generate random alnum string length=len
      let s = "";
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (let k = 0; k < len; k++) s += chars.charAt(Math.floor(Math.random() * chars.length));
      junkStrings.push(encodeToEscapes(s));
    }

    // 5) Build one-line Lua output with main code first, junk code after, non-executable
    const quoteParts = chunks.map(p => `"${p}"`);
    const mainCode = `local p={${quoteParts.join(",")}}return p`;
    const junkCode = `local j={${junkStrings.map(p => `"${p}"`).join(",")}}`;
    const oneLine = `--[[obfuscated by hello obf]] return(function(...) ${mainCode} end)();${junkCode}`;

    // 6) Respond
    res.status(200).json({ obfuscated: oneLine });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
