// public/script.js
document.getElementById("btnObf").addEventListener("click", async () => {
  const input = document.getElementById("input").value;
  const minify = document.getElementById("optMinify").checked;
  if (!input.trim()) return alert("Nhập code trước đã");

  try {
    const res = await fetch("/api/obfuscate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: input, options: { minify } }),
    });
    const data = await res.json();
    if (data.error) return alert("Error: " + data.error);
    document.getElementById("output").value = data.obfuscated || "";
  } catch (e) {
    alert("Network lỗi: " + e.message);
  }
});

document.getElementById("btnCopy").addEventListener("click", async () => {
  const txt = document.getElementById("output").value;
  if (!txt) return alert("Không có output để copy");
  try {
    await navigator.clipboard.writeText(txt);
    alert("Copied to clipboard");
  } catch {
    alert("Copy thất bại");
  }
});

document.getElementById("btnDl").addEventListener("click", () => {
  const txt = document.getElementById("output").value;
  if (!txt) return alert("No output");
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "obfuscated.lua"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
});
