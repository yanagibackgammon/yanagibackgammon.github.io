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

  function takePointDetails(playerAway, opponentAway, offeredCube) {
    const currentCube = offeredCube / 2;
    const passOpponentAway = opponentAway - currentCube;
    const winPlayerAway = playerAway - offeredCube;
    const loseOpponentAway = opponentAway - offeredCube;
    const passEquity = matchEquity(playerAway, passOpponentAway);
    const takeWinEquity = matchEquity(winPlayerAway, opponentAway);
    const takeLoseEquity = matchEquity(playerAway, loseOpponentAway);
    const range = takeWinEquity - takeLoseEquity;
    const rawPoint = range <= 0 ? 0 : (passEquity - takeLoseEquity) / range;
    const point = Math.max(0, Math.min(1, rawPoint));

    return {
      playerAway,
      opponentAway,
      offeredCube,
      currentCube,
      passOpponentAway,
      winPlayerAway,
      loseOpponentAway,
      passEquity,
      takeWinEquity,
      takeLoseEquity,
      range,
      rawPoint,
      point
    };
  }

  function takePoint(playerAway, opponentAway, offeredCube) {
    return takePointDetails(playerAway, opponentAway, offeredCube).point;
  }

  function maxHittingRollsForTake(takePointValue) {
    // Simple shot model: a hit is a loss, a miss is a win for the taker.
    // Take is possible while (36 - hitRolls) / 36 >= takePointValue.
    // Therefore hitRolls <= 36 * (1 - takePointValue).
    const maxHitRolls = 36 * (1 - takePointValue);
    return Math.max(0, Math.min(36, Math.floor(maxHitRolls + 1e-10)));
  }

  function takeCellColor(shots) {
    // Use the actual displayed range so the color differences stay clear.
    // Larger values: red -> yellow -> green -> blue as the value gets smaller.
    const minShots = 18;
    const maxShots = 30;
    const ratio = Math.max(0, Math.min(1, (shots - minShots) / (maxShots - minShots)));
    const hue = (1 - ratio) * 220;
    return `hsl(${hue.toFixed(1)} 88% 80%)`;
  }

  function axisHeader() {
    let html = '<thead><tr><th class="corner" aria-label="away"></th>';
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

  function theoryTendency(playerAway, opponentAway) {
    // Qualitative match-play guide for an initial double (1 -> 2), relative
    // to unlimited/money play. It intentionally gives direction rather than
    // an exact take point because gammon rates and recube efficiency are
    // position-dependent.

    if (playerAway === 2) {
      if (opponentAway === 2) {
        return { kind: 'pass', note: 'Cube死・G無価値' };
      }
      if (opponentAway === 3) {
        return { kind: 'pass', note: 'リダブル不可／相手G多で厳しい' };
      }
      if (opponentAway === 4) {
        return { kind: 'take', note: '低Gなら強い／相手G多で反転' };
      }
      if (opponentAway % 2 === 0) {
        return { kind: 'take', note: '低Gなら取りやすい／G注意' };
      }
      return { kind: 'pass', note: '奇数away傾向／相手G多で厳しい' };
    }

    if (playerAway === 3) {
      if (opponentAway === 2) {
        return { kind: 'take', note: 'Take後のリダブルが強力' };
      }
      if (opponentAway === 3) {
        return { kind: 'pass', note: '同点でもTP高め' };
      }
      if (opponentAway === 4) {
        return { kind: 'take', note: '低Gなら取りやすい／相手G多で慎重' };
      }
      return { kind: 'pass', note: 'リード側は慎重／低Gなら緩和' };
    }

    if (playerAway === 4) {
      if (opponentAway === 2) {
        return { kind: 'take', note: '即リダブルが強力' };
      }
      if (opponentAway === 3) {
        return { kind: 'even', note: '自分G多でTake／相手G多でPass' };
      }
      if (opponentAway === 4) {
        return { kind: 'even', note: '概ねマネー型' };
      }
      if (opponentAway >= 7) {
        return { kind: 'pass', note: '大差リードは慎重' };
      }
      return { kind: 'even', note: 'やや慎重／G率で変動' };
    }

    // Farther from the end of the match, close scores are generally
    // money-like. With a meaningful deficit the trailer benefits from cube
    // leverage, while a large leader can afford to be more conservative.
    const gap = playerAway - opponentAway;
    if (gap >= 2) {
      return { kind: 'take', note: 'トレーラー／リダブル価値あり' };
    }
    if (gap <= -2) {
      return { kind: 'pass', note: 'リード側はやや慎重' };
    }
    return { kind: 'even', note: '概ねマネー型／G率で変動' };
  }

  function tendencyLabel(kind) {
    if (kind === 'take') {
      return '<span class="tendency-word">テイク</span><span class="tendency-suffix">寄り</span>';
    }
    if (kind === 'pass') {
      return '<span class="tendency-word">パス</span><span class="tendency-suffix">寄り</span>';
    }
    return '<span class="tendency-word">アンリミと同程度</span>';
  }

  function renderTendencyTable() {
    const table = document.getElementById('tendency-table');
    if (!table) return;

    let html = axisHeader() + '<tbody>';

    for (let playerAway = MIN_AWAY; playerAway <= MAX_AWAY; playerAway += 1) {
      html += `<tr><th class="black-axis">${playerAway}a</th>`;
      for (let opponentAway = MIN_AWAY; opponentAway <= MAX_AWAY; opponentAway += 1) {
        const tendency = theoryTendency(playerAway, opponentAway);
        const toneClass = tendency.kind === 'take'
          ? 'tendency-take'
          : tendency.kind === 'pass'
            ? 'tendency-pass'
            : 'tendency-even';

        html += `
          <td class="met-cell tendency-cell ${toneClass}">
            <span class="cell-primary tendency-primary">${tendencyLabel(tendency.kind)}</span>
            <span class="tendency-condition">${tendency.note}</span>
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

        const details = takePointDetails(playerAway, opponentAway, offeredCube);
        const point = details.point;
        const maxHitRolls = maxHittingRollsForTake(point);
        const cellColor = takeCellColor(maxHitRolls);
        html += `
          <td class="met-cell take-cell" style="background:${cellColor}" tabindex="0" role="button" aria-label="自分${playerAway}a 相手${opponentAway}a ${offeredCube}倍テイクポイントの計算式を表示" data-player-away="${playerAway}" data-opponent-away="${opponentAway}" data-offered-cube="${offeredCube}">
            <span class="cell-primary">${maxHitRolls}</span>
            <span class="cell-secondary">${(point * 100).toFixed(2)}%</span>
          </td>`;
      }
      html += '</tr>';
    }

    html += '</tbody>';
    table.innerHTML = html;
  }


  function formatPct(value) {
    return `${(value * 100).toFixed(2)}%`;
  }

  function awayLabel(value) {
    return value <= 0 ? '0a（マッチ勝利）' : `${value}a`;
  }

  function ensureFormulaModal() {
    let modal = document.getElementById('take-formula-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'take-formula-modal';
    modal.className = 'formula-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="formula-modal-backdrop" data-modal-close></div>
      <section class="formula-modal-panel" role="dialog" aria-modal="true" aria-labelledby="take-formula-title">
        <button class="formula-modal-close" type="button" aria-label="閉じる" data-modal-close>×</button>
        <h3 id="take-formula-title"></h3>
        <div id="take-formula-body" class="formula-modal-body"></div>
      </section>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-modal-close]')) closeFormulaModal();
    });
    return modal;
  }

  function showFormulaModal(playerAway, opponentAway, offeredCube) {
    const details = takePointDetails(playerAway, opponentAway, offeredCube);
    const maxHitRolls = maxHittingRollsForTake(details.point);
    const modal = ensureFormulaModal();
    const title = modal.querySelector('#take-formula-title');
    const body = modal.querySelector('#take-formula-body');

    title.textContent = `${offeredCube}倍テイクポイント：自分 ${playerAway}a ／ 相手 ${opponentAway}a`;
    body.innerHTML = `
      <div class="formula-step">
        <strong>1. Passした場合</strong>
        <div>MET（自分 ${playerAway}a ／ 相手 ${awayLabel(details.passOpponentAway)}）</div>
        <div class="formula-value">P = ${formatPct(details.passEquity)}</div>
      </div>
      <div class="formula-step">
        <strong>2. Takeして勝った場合</strong>
        <div>MET（自分 ${awayLabel(details.winPlayerAway)} ／ 相手 ${opponentAway}a）</div>
        <div class="formula-value">W = ${formatPct(details.takeWinEquity)}</div>
      </div>
      <div class="formula-step">
        <strong>3. Takeして負けた場合</strong>
        <div>MET（自分 ${playerAway}a ／ 相手 ${awayLabel(details.loseOpponentAway)}）</div>
        <div class="formula-value">L = ${formatPct(details.takeLoseEquity)}</div>
      </div>
      <div class="formula-step formula-result">
        <strong>4. テイクポイント</strong>
        <div class="formula-equation">(P − L) ÷ (W − L)</div>
        <div class="formula-equation">(${details.passEquity.toFixed(6)} − ${details.takeLoseEquity.toFixed(6)}) ÷ (${details.takeWinEquity.toFixed(6)} − ${details.takeLoseEquity.toFixed(6)})</div>
        <div class="formula-value">= ${formatPct(details.point)}</div>
      </div>
      <div class="formula-step formula-result">
        <strong>5. ヒットされてもテイクできる最大目数</strong>
        <div class="formula-equation">⌊36 × (1 − ${details.point.toFixed(6)})⌋</div>
        <div class="formula-value">= ${maxHitRolls}通り</div>
      </div>`;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('formula-modal-open');
    const closeButton = modal.querySelector('.formula-modal-close');
    closeButton.focus();
  }

  function closeFormulaModal() {
    const modal = document.getElementById('take-formula-modal');
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('formula-modal-open');
  }

  function bindTakeCellPopups() {
    document.addEventListener('click', (event) => {
      const cell = event.target.closest('.take-cell');
      if (!cell) return;
      showFormulaModal(
        Number(cell.dataset.playerAway),
        Number(cell.dataset.opponentAway),
        Number(cell.dataset.offeredCube)
      );
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeFormulaModal();
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const cell = event.target.closest('.take-cell');
      if (!cell) return;
      event.preventDefault();
      cell.click();
    });
  }


  renderMetTable();
  renderTendencyTable();
  renderTakeTable('take2-table', 2);
  renderTakeTable('take4-table', 4);
  bindTakeCellPopups();
})();
