import { csvParse } from "d3-dsv";

export function loadCSV(csv: string): any {
  let completeArray = csv.split(/\r?\n/);
  if (checkIfDuplicatesExists(completeArray[0])) {
    csv = removeDuplicateColumnNames(csv);
  }
  let tempData = csvParse(csv);
  let data = validateParsedCsv(tempData);

  if (data.invalidRows.length !== 0) {
    showInvalidRowsMessage(
      data.invalidRows,
      tempData.columns,
      data.removedColumns,
    );
  }

  return data.validData;
}

export function showInvalidRowsMessage(
  invalidRows: any[],
  columns: string[],
  removedColumns: string[],
) {
  const overlay = document.createElement("div");
  overlay.className = "spcd3-modal-overlay";
  overlay.style.display = "block";

  const modal = document.createElement("div");
  modal.className = "spcd3-modal";
  modal.style.display = "block";

  const header = document.createElement("div");
  header.className = "spcd3-modal-header";

  const closeButton = document.createElement("span");
  closeButton.className = "spcd3-close-button";
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  header.appendChild(closeButton);
  modal.appendChild(header);

  const contentDiv = document.createElement("div");
  contentDiv.className = "spcd3-modal-content";
  contentDiv.addEventListener("click", (e) => e.stopPropagation());

  const importInfo = document.createElement("div");
  importInfo.className = "spcd3-modal-info";
  importInfo.textContent = `Dataset imported.`;

  contentDiv.appendChild(importInfo);

  const removedRowInfo = document.createElement("div");
  removedRowInfo.className = "spcd3-modal-info";

  removedRowInfo.textContent = `${invalidRows.length} invalid rows found.`;
  contentDiv.appendChild(removedRowInfo);

  if (removedColumns.length > 0) {
    const removedColumnInfo = document.createElement("div");
    removedColumnInfo.className = "spcd3-modal-info";

    if (removedColumns.length > 1) {
      removedColumnInfo.textContent = `${removedColumns.length} columns without data: ${removedColumns.join(", ") + "."}`;
      contentDiv.appendChild(removedColumnInfo);
    } else {
      removedColumnInfo.textContent = `${removedColumns.length} column without data: ${removedColumns.join(", ") + "."}`;
      contentDiv.appendChild(removedColumnInfo);
    }
  }

  const btn = document.createElement("button");
  btn.textContent = "View";
  btn.className = "spcd3-button spcd3-generic-button";

  btn.addEventListener("click", () => {
    document.body.removeChild(overlay);
    showInvalidRowsPopup(invalidRows, columns, removedColumns);
  });

  contentDiv.appendChild(btn);
  modal.appendChild(contentDiv);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showInvalidRowsPopup(
  invalidRows: any[],
  columns: string[],
  removedColumns: string[] = [],
) {
  const overlay = document.createElement("div");
  overlay.className = "spcd3-modal-tableoverlay";

  overlay.addEventListener("click", () => document.body.removeChild(overlay));

  const dialog = document.createElement("div");
  dialog.className = "spcd3-modal-tabledata";

  dialog.addEventListener("click", (e) => e.stopPropagation());

  const headerRow = document.createElement("div");
  headerRow.className = "spcd3-header-row";

  const title = document.createElement("h2");
  title.textContent = `Invalid Rows (${invalidRows.length})`;
  title.style.margin = "0";

  const closeButton = document.createElement("span");
  closeButton.className = "spcd3-close-button";
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  headerRow.appendChild(title);
  headerRow.appendChild(closeButton);

  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "spcd3-scroll-wrapper";

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "spcd3-tablecontainer";

  const table = renderInvalidTable(invalidRows, columns, removedColumns);
  tableWrapper.appendChild(table);

  scrollWrapper.appendChild(tableWrapper);

  dialog.appendChild(headerRow);
  dialog.appendChild(scrollWrapper);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

export function renderInvalidTable(
  rows: any[],
  columns: string[],
  removedColumns: string[] = [],
): any {
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  columns.forEach((c) => {
    const th = document.createElement("th");
    th.className = "spcd3-th";

    const isRemoved = removedColumns.includes(c);

    th.textContent = c;

    th.style.textAlign = "left";
    th.style.background = isRemoved ? "#ffb3b3" : "rgb(201, 212, 221)";

    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  const tbody = document.createElement("tbody");

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    columns.forEach((col) => {
      const td = document.createElement("td");
      td.className = "spcd3-td";

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
        rawValue === null
          ? "(null)"
          : isEmptyCell(rawValue)
            ? "null"
            : rawValue;

      td.textContent = displayValue;

      td.style.background = isInvalid ? "#ffb3b3" : "white";
      td.style.textAlign = align;
      td.style.fontSize = "0.85rem";
      td.style.padding = "4px 8px";

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  const table = document.createElement("table");
  table.appendChild(thead);
  table.appendChild(tbody);

  return table;
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

  const removedColumns = originalColumns.filter((col) =>
    data.every((row) => isEmptyCell(row[col])),
  );

  const columns = originalColumns.filter(
    (col) => !removedColumns.includes(col),
  );

  const validData = [] as unknown as CsvData;
  Object.defineProperty(validData, "columns", {
    value: columns,
    enumerable: false,
  });

  const invalidRows = [] as Array<any>;
  Object.defineProperty(invalidRows, "columns", {
    value: columns,
    enumerable: false,
  });

  for (const row of data) {
    const emptyCols: string[] = [];

    for (const col of columns) {
      if (isEmptyCell(row[col])) {
        emptyCols.push(col);
      }
    }

    if (emptyCols.length > 0) {
      invalidRows.push({
        ...row,
        __invalidColumns: emptyCols,
      });
    } else {
      validData.push(row);
    }
  }

  return {
    validData,
    invalidRows,
    removedColumns,
  };
}

function removeDuplicateColumnNames(value: string): string {
  const { headerLine, rest } = splitHeaderFromCsv(value);
  const columns = parseCsvHeaderLine(headerLine);
  const seen = new Map<string, number>();

  const uniqueColumns = columns.map((column) => {
    const count = seen.get(column) ?? 0;
    seen.set(column, count + 1);
    return count === 0 ? column : `${column}(${count})`;
  });

  const rebuiltHeader = uniqueColumns.map(escapeCsvCell).join(",");
  return `${rebuiltHeader}${rest}`;
}

function checkIfDuplicatesExists(value: string): boolean {
  const columns = parseCsvHeaderLine(value);
  return new Set(columns).size !== columns.length;
}

function splitHeaderFromCsv(csv: string): {
  headerLine: string;
  rest: string;
} {
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        return {
          headerLine: csv.slice(0, i),
          rest: csv.slice(i),
        };
      }

      return {
        headerLine: csv.slice(0, i),
        rest: csv.slice(i),
      };
    }
  }

  return {
    headerLine: csv,
    rest: "",
  };
}

function parseCsvHeaderLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
