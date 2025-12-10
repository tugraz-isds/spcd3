import { csvParse } from 'd3-dsv';

export function loadCSV(csv: string): any {
  let completeArray = csv.split(/\r?\n/);
  if (checkIfDuplicatesExists(completeArray[0])) {
    csv = removeDuplicateColumnNames(csv);
  }
  let tempData = csvParse(csv);
  console.log(tempData);
  let data = validateParsedCsv(tempData);

  console.log(data.validData);
  console.log(data.invalidRows);

  if (data.invalidRows.length !== 0)
    showInvalidRowsMessage(data.invalidRows, tempData.columns);

  return data.validData;
}

export function showInvalidRowsMessage(invalidRows: any[], columns: string[]) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.4)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  overlay.addEventListener("click", () => document.body.removeChild(overlay));

  const box = document.createElement("div");
  box.style.background = "white";
  box.style.padding = "1.5rem";
  box.style.borderRadius = "0.5rem";
  box.style.minWidth = "10rem";
  box.style.position = "relative";
  box.style.textAlign = "center";
  box.style.boxShadow = "0 0.25rem 0.75rem rgba(0,0,0,0.2)";
  box.addEventListener("click", e => e.stopPropagation());

  const msg = document.createElement("p");
  msg.textContent = `Dataset imported and ${invalidRows.length} invalid rows are found.`;

  const btn = document.createElement("button");
  btn.textContent = "View";
  btn.style.marginTop = "1rem";
  btn.style.padding = "0.5rem 1rem";
  btn.style.cursor = "pointer";
  btn.style.border = "0.08rem solid gray";
  btn.style.borderRadius = "0.5rem";
  btn.style.background = "#f6f6f6";
  btn.style.fontSize = "1rem";

  btn.addEventListener("click", () => {
    document.body.removeChild(overlay);
    showInvalidRowsPopup(invalidRows, columns);
  });

  box.appendChild(msg);
  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}


export function showInvalidRowsPopup(invalidRows: any[], columns: string[]) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  overlay.addEventListener("click", () => document.body.removeChild(overlay));

  const dialog = document.createElement("div");
  dialog.style.position = "relative";
  dialog.style.background = "white";
  dialog.style.padding = "2rem";
  dialog.style.borderRadius = "0.5rem";
  dialog.style.maxHeight = "80vh";
  dialog.style.overflow = "auto";
  dialog.style.minWidth = "38rem";

  dialog.addEventListener("click", e => e.stopPropagation());

  const headerRow = document.createElement("div");
  headerRow.style.display = "flex";
  headerRow.style.justifyContent = "space-between";
  headerRow.style.alignItems = "center";
  headerRow.style.marginBottom = "1rem";

  const title = document.createElement("h2");
  title.textContent = `Invalid Rows (${invalidRows.length})`;
  title.style.margin = "0";

  const closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  closeButton.style.cursor = "pointer";
  closeButton.style.fontWeight = "bold";
  closeButton.style.fontSize = "1.5rem";
  closeButton.style.lineHeight = "1";
  closeButton.style.marginLeft = "1rem";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  headerRow.appendChild(title);
  headerRow.appendChild(closeButton);

  const tableWrapper = document.createElement("div");
  tableWrapper.innerHTML = `
    <table border="1" cellpadding="6" style="border-collapse: collapse; margin-top: 0.5rem; width: 100%;">
      ${renderInvalidTable(invalidRows, columns.reverse())}
    </table>
  `;

  dialog.appendChild(headerRow);
  dialog.appendChild(tableWrapper);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}


export function renderInvalidTable(rows: any[], columns: string[]): string {
  const headerHtml = `
    <thead>
      <tr>
        ${columns.map(c => `<th style="text-align:left; font-size:0.85rem; background-color:rgb(232, 232, 158); border:0.063rem solid #ddd;">${c}</th>`).join("")}
      </tr>
    </thead>
  `;

  const bodyHtml = rows.map(row => `
    <tr>
      ${columns.map(col => {
        const rawValue = row[col];
        const value = rawValue ?? "";
        const isInvalid = row.__invalidColumns?.includes(col);

        const isNumber =
          typeof rawValue === "number" ||
          (typeof rawValue === "string" &&
           rawValue.trim() !== "" &&
           !isNaN(Number(rawValue.replace(",", "."))));

        const align = isNumber ? "right" : "left";

        return `
          <td style="
            background: ${isInvalid ? '#ffb3b3' : 'white'};
            color: ${isInvalid ? 'black' : 'inherit'};
            text-align: ${align};
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            border: 0.063rem solid #ddd;
          ">
            ${value === "" ? "null" : value}
          </td>
        `;
      }).join("")}
    </tr>
  `).join("");

  return `${headerHtml}<tbody>${bodyHtml}</tbody>`;
}

export interface CsvRow {
  [key: string]: string;
}

export interface CsvData extends Array<CsvRow> {
  columns: string[];
}

export interface CsvValidationResult {
  validData: CsvData;
  invalidRows: Array<any>;
}

export function validateParsedCsv(data: CsvData): CsvValidationResult {
  const columns = data.columns;

  const validData = [] as CsvData;
  validData.columns = columns;

  const invalidRows = [] as Array<any>;
  (invalidRows as any).columns = columns;

  for (const row of data) {
    const emptyCols: string[] = [];
    for (const col of columns) {
      const value = row[col]?.trim() ?? "";
      if (value === "") {
        emptyCols.push(col);
      }
    }

    if (emptyCols.length > 0) {
      invalidRows.push({
        ...row,
        __invalidColumns: emptyCols
      });
    } else {
      validData.push(row);
    }
  }

  return {
    validData,
    invalidRows
  };
}

function removeDuplicateColumnNames(value: string): any {
  let completeArray = value.split(/\r?\n/);
  let column_string = csvParse(completeArray[0]);
  let n = 0;
  const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n += 1})`)(new Set));
  completeArray[0] = unique(column_string['columns']).toString();
  return completeArray.join('\r\n');
}

function checkIfDuplicatesExists(value: string): any {
  return new Set(value).size !== value.length
}
