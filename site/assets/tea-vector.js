const TeaVector = (() => {
  const dimensions = [
    ["T01", "嫩度"], ["T02", "完整度"], ["P01", "氧化"], ["P02", "发酵"],
    ["P03", "焙火"], ["P04", "陈化"], ["C01", "多酚"], ["C02", "儿茶素"],
    ["C03", "聚合物"], ["C04", "氨基酸"], ["C05", "咖啡碱"], ["C06", "香气"],
    ["C07", "浸出物"], ["C08", "矿物"], ["S01", "苦涩"], ["S02", "甜醇"]
  ];
  const featuredKeys = ["T01", "P01", "P02", "P03", "C06", "S01", "S02"];
  const keyLabels = Object.fromEntries(dimensions);

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines.shift().split(",");
    return lines.map((line) => {
      const values = line.split(",");
      return Object.fromEntries(headers.map((key, index) => [key, values[index]]));
    });
  }

  function score(record, key) {
    return Number(record[key] || 0);
  }

  function renderBars(record, target) {
    const element = typeof target === "string" ? document.getElementById(target) : target;
    if (!element) return;
    element.innerHTML = featuredKeys.map((key) => {
      const value = score(record, key);
      return `<div class="bar"><span>${keyLabels[key]}</span><div class="track"><div class="fill" style="width:${value * 10}%"></div></div><span>${value}</span></div>`;
    }).join("");
  }

  function renderTable(records, target) {
    const element = typeof target === "string" ? document.getElementById(target) : target;
    if (!element) return;
    element.innerHTML = records.map((record) => `
      <tr>
        <td>${record.name}</td>
        <td>${record.category}</td>
        <td>${record.origin}</td>
        <td>${record.P01}</td>
        <td>${record.P02}</td>
        <td>${record.P03}</td>
        <td>${record.C06}</td>
        <td>${record.S02}</td>
      </tr>
    `).join("");
  }

  function drawRadar(record, target) {
    const canvas = typeof target === "string" ? document.getElementById(target) : target;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2 + 8;
    const radius = Math.min(width, height) * .34;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.font = "13px system-ui, sans-serif";

    for (let ring = 1; ring <= 5; ring += 1) {
      ctx.beginPath();
      dimensions.forEach((_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / dimensions.length;
        const pointRadius = radius * ring / 5;
        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = "#d7ded0";
      ctx.stroke();
    }

    dimensions.forEach(([key, label], index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / dimensions.length;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#e0e5da";
      ctx.stroke();
      ctx.fillStyle = "#59685e";
      const labelX = centerX + Math.cos(angle) * (radius + 28);
      const labelY = centerY + Math.sin(angle) * (radius + 22);
      ctx.textAlign = labelX < centerX - 10 ? "right" : labelX > centerX + 10 ? "left" : "center";
      ctx.fillText(label, labelX, labelY);
    });

    ctx.beginPath();
    dimensions.forEach(([key], index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / dimensions.length;
      const pointRadius = radius * score(record, key) / 10;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(47, 106, 67, .22)";
    ctx.strokeStyle = "#2f6a43";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  function selectRecord(records, record, options = {}) {
    if (options.nameId) document.getElementById(options.nameId).textContent = record.name;
    if (options.metaId) document.getElementById(options.metaId).textContent = `${record.origin} · ${record.category} · ${record.basis}`;
    renderBars(record, options.barsId || "bars");
    drawRadar(record, options.radarId || "radar");
  }

  function loadInteractiveTea(options = {}) {
    const dataPath = options.dataPath || "data/example-teas.csv";
    fetch(dataPath)
      .then((response) => response.text())
      .then((text) => {
        const records = parseCsv(text);
        const select = document.getElementById(options.selectId || "tea-select");
        if (select) {
          select.innerHTML = records.map((record, index) => `<option value="${index}">${record.name}</option>`).join("");
          const defaultIndex = Math.max(0, records.findIndex((record) => record.id === (options.defaultId || "yancha-rougui-demo")));
          select.value = String(defaultIndex);
          selectRecord(records, records[defaultIndex], options);
          select.addEventListener("change", () => selectRecord(records, records[Number(select.value)], options));
        }
        renderTable(records, options.tableId || "tea-table");
      })
      .catch(() => {
        const errorTarget = document.getElementById(options.errorId || options.barsId || "bars");
        if (errorTarget) errorTarget.textContent = "样例数据加载失败，请检查 data/example-teas.csv。";
      });
  }

  return { dimensions, featuredKeys, keyLabels, parseCsv, score, renderBars, renderTable, drawRadar, selectRecord, loadInteractiveTea };
})();
