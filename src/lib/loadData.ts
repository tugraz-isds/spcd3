import { csvParse } from 'd3-dsv';

export function loadCSV(csv: string): any {
  let completeArray = csv.split(/\r?\n/);
  if (checkIfDuplicatesExists(completeArray[0])) {
    csv = removeDuplicateColumnNames(csv);
  }
  let tempData = csvParse(csv);
  let data = validateParsedCsv(tempData);

  if (data.invalidRows.length !== 0) {
    showInvalidRowsMessage(data.invalidRows, tempData.columns, data.removedColumns);
  }

  return data.validData;
}

export function showInvalidRowsMessage(
  invalidRows: any[],
  columns: string[],
  removedColumns: string[]
) {
  const overlay = document.createElement("div");
  overlay.className = 'modal-overlay-load';

  const closeButton = document.createElement("span");
  closeButton.className = 'close-button';
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  const box = document.createElement("div");
  box.className = 'box';
  box.addEventListener("click", e => e.stopPropagation());

  const msg = document.createElement("p");
  msg.textContent = `Dataset imported.`;

  box.appendChild(closeButton);
  box.appendChild(msg);

  const removedRowInfo = document.createElement("div");
  removedRowInfo.className = 'info';

  removedRowInfo.textContent = `${invalidRows.length} invalid rows found.`;
  box.appendChild(removedRowInfo);

  if (removedColumns.length > 0) {
    const removedColumnInfo = document.createElement("div");
    removedColumnInfo.className = 'info';

    removedColumnInfo.textContent = `${removedColumns.length} column(s) without data: ${removedColumns.join(", ")}`;
    box.appendChild(removedColumnInfo);
  }

  const btn = document.createElement("button");
  btn.textContent = "View";
  btn.className = 'view-button';

  btn.addEventListener("click", () => {
    document.body.removeChild(overlay);
    showInvalidRowsPopup(invalidRows, columns, removedColumns);
  });

  box.appendChild(btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function showInvalidRowsPopup(invalidRows: any[], columns: string[], removedColumns: string[] = []) {
  const overlay = document.createElement("div");
  overlay.className = 'modal-overlay-load';

  overlay.addEventListener("click", () => document.body.removeChild(overlay));

  const dialog = document.createElement("div");
  dialog.className = 'dialog';

  dialog.addEventListener("click", e => e.stopPropagation());

  const headerRow = document.createElement("div");
  headerRow.className = 'header-row';

  const title = document.createElement("h2");
  title.textContent = `Invalid Rows (${invalidRows.length})`;
  title.style.margin = "0";

  const closeButton = document.createElement("span");
  closeButton.className = 'close-button';
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  headerRow.appendChild(title);
  headerRow.appendChild(closeButton);

  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'scroll-wrapper';

  const tableWrapper = document.createElement("div");
  tableWrapper.className = 'table-wrapper';
  tableWrapper.innerHTML = `
    <table border="1" cellpadding="6" style="border-collapse: collapse; margin-top: 0.5rem; width: 100%;">
      ${renderInvalidTable(invalidRows, columns, removedColumns)}
    </table>
  `;

  scrollWrapper.appendChild(tableWrapper);

  dialog.appendChild(headerRow);
  dialog.appendChild(scrollWrapper);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

export function renderInvalidTable(
  rows: any[],
  columns: string[],
  removedColumns: string[] = []
): string {
  const headerHtml = `
    <thead>
      <tr>
        ${columns.map(c => {
          const isRemoved = removedColumns.includes(c);
          return `<th style="
            text-align:left;
            background:${isRemoved ? "#ffb3b3" : "rgb(201, 212, 221)"};
          ">${c}</th>`;
        }).join("")}
      </tr>
    </thead>
  `;

  const bodyHtml = rows.map(row => `
    <tr>
      ${columns.map(col => {
        const rawValue = row[col];
        const isInvalid =
          row.__invalidColumns?.includes(col) || removedColumns.includes(col);

        const isNumber =
          typeof rawValue === "number" ||
          (typeof rawValue === "string" &&
           rawValue.trim() !== "" &&
           !isNaN(Number(rawValue.replace(",", "."))));

        const align = isNumber ? "right" : "left";

        const displayValue =
          rawValue === null ? "(null)" :
          isEmptyCell(rawValue) ? "null" :
          rawValue;

        return `
          <td style="
            background: ${isInvalid ? "#ffb3b3" : "white"};
            text-align: ${align};
            font-size: 0.85rem;
            padding: 4px 8px;
          ">
            ${displayValue}
          </td>
        `;
      }).join("")}
    </tr>
  `).join("");

  return `${headerHtml}<tbody>${bodyHtml}</tbody>`;
}


interface CsvRow {
  [key: string]: string;
}

interface CsvData extends Array<CsvRow> {
  columns: string[];
}

interface CsvValidationResult {
  validData: CsvData;
  invalidRows: Array<any>;
  removedColumns: string[];
}

function isEmptyCell(value: any): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateParsedCsv(data: CsvData): CsvValidationResult {
  const originalColumns = data.columns;

  const removedColumns = originalColumns.filter(col =>
    data.every(row => isEmptyCell(row[col]))
  );

  const columns = originalColumns.filter(col => !removedColumns.includes(col));

  const validData = [] as CsvData;
  Object.defineProperty(validData, "columns", {
    value: columns,
    enumerable: false
  });

  const invalidRows = [] as Array<any>;
  Object.defineProperty(invalidRows, "columns", {
    value: columns,
    enumerable: false
  });

  for (const row of data) {
    const emptyCols: string[] = [];

    for (const col of columns) {
     if(isEmptyCell(row[col])) {
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
    invalidRows,
    removedColumns
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
