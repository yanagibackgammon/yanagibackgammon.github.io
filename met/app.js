(() => {
  "use strict";

  const MIN_AWAY = 2;
  const MAX_AWAY = 9;
  const MET = [[0.5,0.676888,0.751179,0.813772,0.841941,0.886867,0.907188,0.932313,0.943975],[0.323112,0.5,0.598994,0.668586,0.743447,0.798991,0.842141,0.875198,0.90172],[0.248821,0.401006,0.5,0.571438,0.647713,0.711608,0.762548,0.80485,0.840196],[0.186228,0.331414,0.428562,0.5,0.577415,0.643063,0.699664,0.746157,0.78829],[0.158059,0.256553,0.352287,0.422585,0.5,0.566621,0.626658,0.678181,0.725507],[0.113133,0.201009,0.288392,0.356937,0.433379,0.5,0.562783,0.616561,0.667856],[0.092812,0.157859,0.237452,0.300336,0.373342,0.437217,0.5,0.554919,0.608614],[0.067687,0.124802,0.19515,0.253843,0.321819,0.383439,0.445081,0.5,0.554384],[0.056025,0.09828,0.159804,0.21171,0.274493,0.332144,0.391386,0.445616,0.5]];

  function matchEquity(playerAway, opponentAway) {
    if (playerAway <= 0) return 1;
    if (opponentAway <= 0) return 0;
    return MET[playerAway - 1][opponentAway - 1];
  }

  function takePoint(playerAway, opponentAway, offeredCube) {
    const currentCube = offeredCube / 2;
    const passEquity = matchEquity(playerAway, opponentAway - currentCube);
    const takeWinEquity = matchEquity(playerAway - offeredCube, opponentAway);
    const takeLoseEquity = matchEquity(playerAway, opponentAway - offeredCube);
    const range = takeWinEquity - takeLoseEquity;

    if (range <= 0) return 0;
    const point = (passEquity - takeLoseEquity) / range;
    return Math.max(0, Math.min(1, point));
  }

  function maxShots(takePointValue) {
    const raw = 36 * (1 - takePointValue);
    return Math.max(0, Math.min(36, Math.floor(raw + 1e-10)));
  }

  function axisHeader() {
    let html = '<thead><tr><th class="corner">away</th>';
    for (let away = MIN_AWAY; away <= MAX_AWAY; away += 1) {
      html += `<th>${away}a</th>`;
    }
    html += '</tr></thead>';
    return html;
  }

  function renderMetTable() {
    const table = document.getElementById('met-table');
    let html = axisHeader() + '<tbody>';

    for (let playerAway = MIN_AWAY; playerAway <= MAX_AWAY; playerAway += 1) {
      html += `<tr><th class="black-axis">${playerAway}a</th>`;
      for (let opponentAway = MIN_AWAY; opponentAway <= MAX_AWAY; opponentAway += 1) {
        const value = matchEquity(playerAway, opponentAway) * 100;
        html += `
          <td class="met-cell">
            <span class="cell-primary">${Math.round(value)}</span>
            <span class="cell-secondary">${value.toFixed(2)}%</span>
          </td>`;
      }
      html += '</tr>';
    }

    html += '</tbody>';
    table.innerHTML = html;
  }

  function renderTakeTable(tableId, offeredCube) {
    const table = document.getElementById(tableId);
    let html = axisHeader() + '<tbody>';

    for (let playerAway = MIN_AWAY; playerAway <= MAX_AWAY; playerAway += 1) {
      html += `<tr><th class="black-axis">${playerAway}a</th>`;
      for (let opponentAway = MIN_AWAY; opponentAway <= MAX_AWAY; opponentAway += 1) {
        if (offeredCube === 4 && opponentAway === 2) {
          html += `
          <td class="met-cell">
            <span class="cell-primary">ー</span>
          </td>`;
          continue;
        }

        const point = takePoint(playerAway, opponentAway, offeredCube);
        const shots = maxShots(point);
        html += `
          <td class="met-cell">
            <span class="cell-primary">${shots}</span>
            <span class="cell-secondary">${(point * 100).toFixed(2)}%</span>
          </td>`;
      }
      html += '</tr>';
    }

    html += '</tbody>';
    table.innerHTML = html;
  }

  renderMetTable();
  renderTakeTable('take2-table', 2);
  renderTakeTable('take4-table', 4);
})();
