/* 과정별 상세: 과정 탭, 요약 수치, 추이 차트, 차수 표, 주관식 */
(function () {
  let A;

  function renderTabs() {
    const box = A.$('course-tabs');
    A.courses.forEach((c, i) => {
      const tab = A.el('button', 'tab', A.SHORT[c.id]);
      tab.type = 'button';
      tab.id = `tab-${c.id}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'course-panel');
      tab.dataset.course = c.id;
      tab.addEventListener('click', () => select(c.id));
      // 좌우 화살표로 탭 이동
      tab.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + A.courses.length) % A.courses.length;
        select(A.courses[next].id);
        A.$(`tab-${A.courses[next].id}`).focus();
      });
      box.append(tab);
    });
  }

  function deltaNode(raw) {
    const diff = Math.round(raw * 100) / 100 || 0;
    const cls = diff > 0.005 ? 'delta--up' : diff < -0.005 ? 'delta--down' : 'delta--flat';
    const word = diff > 0.005 ? '상승' : diff < -0.005 ? '하락' : '변동 없음';
    return A.el('span', cls, `${diff > 0 ? '+' : ''}${diff.toFixed(2)} ${word}`);
  }

  function renderStats(c) {
    const last = c.rounds[c.rounds.length - 1], prev = c.rounds[c.rounds.length - 2];
    const low = A.AREAS.reduce((m, a) => (last.area[a.key] < last.area[m.key] ? a : m));
    const box = A.$('detail-stats');
    box.replaceChildren();
    const items = [
      ['통합 평균', A.fmt(c.avg) + '점', `${c.rounds.length}개 차수, 응답자 ${c.n}명`],
      [`최근 차수 (${last.round}차)`, A.fmt(last.avg) + '점', null],
      [`최근 차수에서 가장 낮은 영역`, A.fmt(last.area[low.key]) + '점', low.label]
    ];
    items.forEach(([label, value, note], i) => {
      const card = A.el('div', 'mini-stat');
      card.append(A.el('p', 'mini-stat__label', label), A.el('p', 'mini-stat__value', value));
      const n = A.el('p', 'mini-stat__note');
      if (i === 1 && prev) { n.append(`${prev.round}차 대비 `, deltaNode(last.avg - prev.avg)); } else { n.textContent = note; }
      card.append(n);
      box.append(card);
    });
  }

  function renderRoundsTable(c) {
    const t = A.$('rounds-table');
    t.replaceChildren();
    const head = A.el('thead'), hr = A.el('tr');
    ['차수', '응답자', '전체', ...A.AREAS.map(a => a.label.replace(' 만족', ''))].forEach(x => {
      const th = A.el('th', '', x); th.scope = 'col'; hr.append(th);
    });
    head.append(hr);
    const body = A.el('tbody');
    c.rounds.forEach(r => {
      const tr = A.el('tr');
      const th = A.el('th', '', `${r.round}차`); th.scope = 'row';
      tr.append(th, A.el('td', '', `${r.n}명`), A.el('td', '', A.fmt(r.avg)));
      A.AREAS.forEach(a => { const td = A.el('td'); td.append(A.scoreCell(r.area[a.key])); tr.append(td); });
      body.append(tr);
    });
    t.append(head, body);
  }

  function renderLegend() {
    const box = A.$('trend-legend');
    A.AREAS.forEach((a, i) => {
      const item = A.el('span', 'chart-legend__item');
      item.append(A.el('span', `chart-legend__mark mark--series-${i + 1}`), document.createTextNode(a.label));
      box.append(item);
    });
  }

  function renderComments(c, idx) {
    const picker = A.$('round-picker');
    picker.replaceChildren();
    c.rounds.forEach((r, i) => {
      const b = A.el('button', 'segmented__btn', `${r.round}차`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(i === idx));
      b.addEventListener('click', () => renderComments(c, i));
      picker.append(b);
    });
    const cm = c.rounds[idx].comments || { good: [], improve: [], future: [] };
    const grid = A.$('comments-grid');
    grid.replaceChildren();
    [['good', '유익했던 점'], ['improve', '아쉬웠던 점'], ['future', '듣고 싶은 주제']].forEach(([k, title]) => {
      const list = cm[k].filter(t => !isNone(t));
      const col = A.el('div', 'comment-col');
      const h = A.el('h5', 'comment-col__title', title);
      h.append(A.el('span', 'comment-col__count', `${list.length}건`));
      col.append(h);
      if (!list.length) col.append(A.el('p', 'comment-col__empty', '내용이 있는 응답 없음'));
      else col.append(commentList(list));
      const skipped = cm[k].length - list.length;
      if (skipped) col.append(A.el('p', 'comment-col__empty', `"없음"과 같은 응답 ${skipped}건은 표시하지 않았습니다.`));
      grid.append(col);
    });
  }

  // "없습니다", "없어요"처럼 내용이 없는 응답을 가려낸다
  const NONE = /^(전혀|특별히|딱히|별로)?(없음|없습니다|없어요|없슴|없다|없네요|해당없음|무|x|개선할점은없습니다|개선할점없습니다|개선점없습니다)$/i;
  function isNone(t) { return NONE.test(String(t).replace(/[\s.!~,]/g, '')); }

  // 처음 6건만 보여 주고 나머지는 버튼으로 연다
  function commentList(list) {
    const wrap = A.el('div');
    const ul = A.el('ul', 'comment-col__list');
    list.forEach((t, i) => { const li = A.el('li', '', t); if (i >= 6) li.hidden = true; ul.append(li); });
    wrap.append(ul);
    if (list.length > 6) {
      const btn = A.el('button', 'more-btn', `나머지 ${list.length - 6}건 보기`);
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        [...ul.children].forEach((li, i) => { if (i >= 6) li.hidden = !open; });
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? '접기' : `나머지 ${list.length - 6}건 보기`;
      });
      wrap.append(btn);
    }
    return wrap;
  }

  function select(id, scroll) {
    const c = A.courses.find(x => x.id === id);
    document.querySelectorAll('#course-tabs .tab').forEach(t => {
      const on = t.dataset.course === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    A.$('course-panel').setAttribute('aria-labelledby', `tab-${id}`);
    A.$('detail-name').textContent = c.name;
    A.$('detail-sub').textContent = `차수 코드 ${c.rounds.map(r => r.code).join(', ')}`;
    renderStats(c);
    window.DashCharts.trendChart(A.$('trend-chart'), c, A.AREAS);
    renderRoundsTable(c);
    renderComments(c, c.rounds.length - 1);
    if (scroll) A.$('detail').scrollIntoView();
  }

  window.DashDetail = {
    init() {
      A = window.DashApp;
      renderTabs();
      renderLegend();
      A.setSelect(select);
      select(A.courses[0].id);
    }
  };
})();
