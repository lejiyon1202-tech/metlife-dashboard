/* 화면 구성. 데이터는 window.DASH_DATA, 문장은 window.DASH_INSIGHTS 에서 읽는다.
   사용자 응답 문장은 textContent 로만 넣는다. */
(function () {
  const D = window.DASH_DATA;
  const AREAS = [
    { key: 'edu', label: '교육 만족' },
    { key: 'apply', label: '현업 적용' },
    { key: 'inst', label: '강사 만족' },
    { key: 'ops', label: '운영 만족' }
  ];
  const SHORT = { sw: 'Smart Writing', op: '원페이지 기획', ai: 'AI 데이터 정리', xl: '엑셀 비서', wf: '워크플로우 리부트' };
  const $ = id => document.getElementById(id);
  const fmt = v => v.toFixed(2);
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const weighted = (list, get) => sum(list.map(c => get(c) * c.n)) / sum(list.map(c => c.n));
  const courses = [...D.courses].sort((a, b) => b.avg - a.avg);

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  // 640px 이하에서 표를 카드로 바꿀 때 칸 이름으로 쓴다
  function labeled(node, label) { node.dataset.label = label; return node; }
  function scoreCell(v) {
    const level = v >= 4.9 ? 4 : v >= 4.7 ? 3 : v >= 4.5 ? 2 : 1;
    return el('span', `cell-score cell-score--${level}`, fmt(v));
  }
  function distTotals(list) {
    const t = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach(c => c.rounds.forEach(r => { if (r.dist) [5, 4, 3, 2, 1].forEach(s => { t[s] += r.dist[s]; }); }));
    return t;
  }

  function renderHeader() {
    $('header-meta').textContent =
      `${D.asOf} 기준, ${D.courses.length}개 과정 ${D.rounds}개 차수, 응답자 ${D.respondents.toLocaleString()}명`;
  }

  function renderStats() {
    const dist = distTotals(D.courses);
    const total = sum(Object.values(dist));
    const areaAvg = AREAS.map(a => ({ ...a, v: weighted(D.courses, c => c.area[a.key]) }));
    const low = areaAvg.reduce((m, a) => (a.v < m.v ? a : m));
    const stats = [
      { label: '전체 평균', value: fmt(weighted(D.courses, c => c.avg)), unit: '점', note: '5점 만점' },
      { label: '응답자', value: D.respondents.toLocaleString(), unit: '명', note: `${D.courses.length}개 과정 ${D.rounds}개 차수` },
      { label: '4점 이상 응답 비율', value: ((dist[5] + dist[4]) / total * 100).toFixed(1), unit: '%', note: `문항 응답 ${total.toLocaleString()}건 기준` },
      { label: '가장 낮은 영역', value: fmt(low.v), unit: '점', note: `${low.label}, 4개 영역 중` }
    ];
    const grid = $('stat-grid');
    stats.forEach(s => {
      const card = el('div', 'card stat');
      card.append(el('p', 'stat__label', s.label));
      const v = el('p', 'stat__value', s.value);
      v.append(el('span', 'stat__unit', s.unit));
      card.append(v, el('p', 'stat__note', s.note));
      grid.append(card);
    });
  }

  function renderInsights() {
    const I = window.DASH_INSIGHTS;
    I.strengths.forEach(t => $('insight-strengths').append(el('li', '', t)));
    I.improve.forEach(t => $('insight-improve').append(el('li', '', t)));
  }

  function renderCompare() {
    const table = $('compare-table');
    table.append(el('caption', 'visually-hidden', '과정별 통합 평균과 영역 점수'));
    const head = el('thead'), hr = el('tr');
    ['과정', '차수', '응답자', '통합 평균', ...AREAS.map(a => a.label), '차수별 추이'].forEach(t => {
      const th = el('th', '', t); th.scope = 'col'; hr.append(th);
    });
    head.append(hr);
    const body = el('tbody');
    courses.forEach((c, i) => {
      const tr = el('tr');
      const nameTd = el('td');
      const btn = el('button', 'course-link');
      btn.type = 'button';
      btn.append(el('span', 'course-link__rank', `${i + 1}`), document.createTextNode(c.name));
      btn.addEventListener('click', () => { selectCourse(c.id, true); });
      nameTd.append(btn);
      nameTd.className = 'compare__name';
      const avgTd = labeled(el('td', 'compare__avg'), '통합 평균');
      avgTd.append(el('span', 'avg-cell__value', fmt(c.avg)));
      const sparkTd = labeled(el('td', 'compare__spark'), '차수별 추이');
      sparkTd.append(window.DashCharts.sparkline(c.rounds.map(r => r.avg), 4.2, 5.0));
      tr.append(nameTd, labeled(el('td', '', `${c.rounds.length}개`), '차수'), labeled(el('td', '', `${c.n}명`), '응답자'), avgTd);
      AREAS.forEach(a => { const td = labeled(el('td', 'compare__area'), a.label); td.append(scoreCell(c.area[a.key])); tr.append(td); });
      tr.append(sparkTd);
      body.append(tr);
    });
    const foot = el('tfoot'), fr = el('tr');
    fr.append(el('th', 'compare__name', '전체 (응답자 수 가중)'), labeled(el('td', '', `${D.rounds}개`), '차수'),
      labeled(el('td', '', `${D.respondents}명`), '응답자'),
      labeled(el('td', 'compare__avg', fmt(weighted(D.courses, c => c.avg))), '통합 평균'));
    AREAS.forEach(a => fr.append(labeled(el('td', 'compare__area', fmt(weighted(D.courses, c => c.area[a.key]))), a.label)));
    fr.append(el('td', 'compare__spark compare__spark--empty'));
    fr.firstChild.scope = 'row';
    foot.append(fr);
    table.append(head, body, foot);
    const legend = $('scale-legend');
    legend.append(el('span', '', '점수 구간'));
    [['seq-4', '4.9 이상'], ['seq-3', '4.7 ~ 4.89'], ['seq-2', '4.5 ~ 4.69'], ['seq-1', '4.5 미만']].forEach(([k, t]) => {
      const item = el('span', 'scale-legend__item');
      item.append(el('span', `swatch swatch--${k}`), document.createTextNode(t));
      legend.append(item);
    });
  }

  window.DashApp = { D, AREAS, SHORT, courses, el, fmt, sum, scoreCell, distTotals, $ };
  let selectCourse = () => {};
  window.DashApp.setSelect = fn => { selectCourse = fn; };

  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderStats();
    renderInsights();
    renderCompare();
    window.DashDetail.init();
    window.DashSections.init();
  });
})();
