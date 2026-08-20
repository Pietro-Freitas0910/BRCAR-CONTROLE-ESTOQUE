export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/"/g, '""').replace(/\r?\n/g, " ");
}

/** CSV com ; e BOM — abre corretamente no Excel em português. */
export function buildCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const head = columns.map((c) => `"${cell(c.header)}"`).join(";");
  const body = rows
    .map((row) => columns.map((c) => `"${cell(c.value(row))}"`).join(";"))
    .join("\r\n");
  return `\uFEFF${head}\r\n${body}`;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv<T>(filename: string, rows: T[], columns: ExportColumn<T>[]) {
  download(`${filename}.csv`, buildCsv(rows, columns), "text/csv;charset=utf-8;");
}

/** Planilha .xls (HTML) — abre direto no Excel/Google Sheets com formatação. */
export function exportExcel<T>(
  filename: string,
  title: string,
  rows: T[],
  columns: ExportColumn<T>[],
) {
  const head = columns.map((c) => `<th>${cell(c.header)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${cell(c.value(row))}</td>`).join("")}</tr>`,
    )
    .join("");
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head>
<body><h3>${cell(title)}</h3><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  download(`${filename}.xls`, html, "application/vnd.ms-excel;charset=utf-8;");
}

/** Abre a janela de impressão (permite salvar em PDF) com um layout limpo. */
export function printDocument(title: string, bodyHtml: string, logoUrl?: string | null) {
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) {
    alert("Libere os pop-ups para gerar o PDF.");
    return;
  }
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:"Segoe UI",Arial,sans-serif;color:#111;margin:32px;}
  header{display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #F5C518;padding-bottom:12px;margin-bottom:24px}
  header img{height:52px}
  h1{font-size:20px;margin:0}
  h2{font-size:15px;margin:24px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
  th,td{border:1px solid #ddd;padding:7px 9px;text-align:left}
  th{background:#111;color:#F5C518;text-transform:uppercase;font-size:10px;letter-spacing:.05em}
  tfoot td{font-weight:700;background:#faf7e6}
  .kpis{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:8px}
  .kpi{border:1px solid #eee;border-radius:10px;padding:10px 14px;min-width:150px}
  .kpi span{display:block;font-size:10px;text-transform:uppercase;color:#777;letter-spacing:.05em}
  .kpi strong{font-size:17px}
  footer{margin-top:32px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:8px}
  @media print{body{margin:12mm}}
</style></head><body>
<header>
  <div><h1>${title}</h1><p style="margin:4px 0 0;font-size:12px;color:#666">Emitido em ${new Date().toLocaleString("pt-BR")}</p></div>
  ${logoUrl ? `<img src="${logoUrl}" alt="" />` : ""}
</header>
${bodyHtml}
<footer>Documento gerado automaticamente pelo sistema de gestão BR Car Seminovos.</footer>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };<\/script>
</body></html>`);
  win.document.close();
}

export function htmlTable(headers: string[], rows: (string | number)[][], footer?: (string | number)[]) {
  return `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
${footer ? `<tfoot><tr>${footer.map((c) => `<td>${c}</td>`).join("")}</tr></tfoot>` : ""}</table>`;
}

export function htmlKpis(items: { label: string; value: string }[]) {
  return `<div class="kpis">${items
    .map((i) => `<div class="kpi"><span>${i.label}</span><strong>${i.value}</strong></div>`)
    .join("")}</div>`;
}
