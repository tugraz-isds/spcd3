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
  overlay.className = "modal-overlay";
  overlay.style.display = "block";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "block";

  const header = document.createElement("div");
  header.className = "modal-header";

  const closeButton = document.createElement("span");
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  header.appendChild(closeButton);
  modal.appendChild(header);

  const contentDiv = document.createElement("div");
  contentDiv.className = "modal-content";
  contentDiv.addEventListener("click", (e) => e.stopPropagation());

  const importInfo = document.createElement("div");
  importInfo.className = "modal-info";
  importInfo.textContent = `Dataset imported.`;

  contentDiv.appendChild(importInfo);

  const removedRowInfo = document.createElement("div");
  removedRowInfo.className = "modal-info";

  removedRowInfo.textContent = `${invalidRows.length} invalid rows found.`;
  contentDiv.appendChild(removedRowInfo);

  if (removedColumns.length > 0) {
    const removedColumnInfo = document.createElement("div");
    removedColumnInfo.className = "modal-info";

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
  btn.className = "generic-button";

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
  overlay.className = "modal-tableoverlay";

  overlay.addEventListener("click", () => document.body.removeChild(overlay));

  const dialog = document.createElement("div");
  dialog.className = "modal-tabledata";

  dialog.addEventListener("click", (e) => e.stopPropagation());

  const headerRow = document.createElement("div");
  headerRow.className = "header-row";

  const title = document.createElement("h2");
  title.textContent = `Invalid Rows (${invalidRows.length})`;
  title.style.margin = "0";

  const closeButton = document.createElement("span");
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  closeButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  headerRow.appendChild(title);
  headerRow.appendChild(closeButton);

  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "scroll-wrapper";

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "tablecontainer";

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

  const validData = [] as CsvData;
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

function removeDuplicateColumnNames(value: string): any {
  let completeArray = value.split(/\r?\n/);
  let column_string = csvParse(completeArray[0]);
  let n = 0;
  const unique = (arr) =>
    arr.map(
      ((s) => (v) => (!s.has(v) && s.add(v) ? v : `${v}(${(n += 1)})`))(
        new Set(),
      ),
    );
  completeArray[0] = unique(column_string["columns"]).toString();
  return completeArray.join("\r\n");
}

function checkIfDuplicatesExists(value: string): any {
  return new Set(value).size !== value.length;
}
