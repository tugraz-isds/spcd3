import { csvParse } from 'd3-dsv';

export function loadCSV(csv: string): any {
  let completeArray = csv.split(/\r?\n/);
  if (checkIfDuplicatesExists(completeArray[0])) {
    csv = removeDuplicateColumnNames(csv);
  }
  let tempData = csvParse(csv);
  
  let isComplete = checkDatasetCompleteness(tempData);
  if (!isComplete) return;

  return tempData.sort((a: { Name: number; }, b: { Name: number; }) => a.Name > b.Name ? 1 : -1);
}

function checkDatasetCompleteness(tempData: any): boolean {
    const invalidRows = tempData.filter(d =>
    tempData.columns.some(col => d[col] === "" || d[col] == null || d[col].trim() === "")
  );

  const box = document.getElementById("parallelcoords");

  if (invalidRows.length > 0) {
    box.innerHTML = `Dataset is incomplete!<br>
      <strong style="color:#e74c3c;">⚠️ ${invalidRows.length} row(s) affected:</strong>
      <pre>${JSON.stringify(invalidRows.slice(0, 5), null, 2)}</pre>
    `;
    box.style.marginLeft = "2em";
    box.style.paddingTop = "2em";
    return false;
  }
  return true;
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
