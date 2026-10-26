/* 문항별 점수, 점수 분포, 산출 기준 */
(function () {
  let A;
  const AREA_OF_ITEM = ['교육 만족', '교육 만족', '현업 적용', '강사 만족', '강사 만족', '운영 만족', '운영 만족'];

  function renderItems() {
    const t = A.$('items-table');
    const head = A.el('thead'), hr = A.el('tr');
    ['문항', '영역', ...A.courses.map(c => A.SHORT[c.id])].forEach(x => {
      const th = A.el('th', '', x); th.scope = 'col'; hr.append(th);
    });
    head.append(hr);
    const body = A.el('tbody');
    A.D.items.labels.forEach((label, i) => {
      const tr = A.el('tr');
      const th = A.el('th', '', `Q${i + 1}. ${label}`); th.scope = 'row';
      tr.append(th, A.el('td', '', AREA_OF_ITEM[i]));
      A.courses.forEach(c => { const td = A.el('td'); td.append(A.scoreCell(A.D.items.byCourse[c.id][i])); tr.append(td); });
      body.append(tr);
    });
    t.append(head, body);
    A.$('items-note').textContent = 'AI 데이터 정리 1차(14명)는 원본 응답 파일이 없어 이 표에서 빠졌습니다. AI 데이터 정리는 2~5차 102명, 나머지 과정은 전 차수 기준입니다.';
  }

  function renderDist() {
    const legend = A.$('dist-legend');
    [5, 4, 3, 2, 1].forEach(s => {
      const item = A.el('span', 'chart-legend__item');
      item.append(A.el('span', `chart-legend__mark chart-legend__mark--box mark--score-${s}`), document.createTextNode(`${s}점`));
      legend.append(item);
    });
    const rows = A.$('dist-rows');
    let all = 0;
    A.courses.forEach(c => {
      const d = A.distTotals([c]);
      const total = A.sum(Object.values(d));
      all += total;
      const row = A.el('div', 'dist-row');
      const bar = A.el('div', 'dist-row__bar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', [5, 4, 3, 2, 1].map(s => `${s}점 ${(d[s] / total * 100).toFixed(1)}%`).join(', '));
      [5, 4, 3, 2, 1].forEach(s => {
        if (!d[s]) return;
        const seg = A.el('span', `dist-row__seg dist-row__seg--${s}`);
        seg.style.setProperty('flex', `${d[s]} 0 0`);
        seg.title = `${s}점 ${d[s]}건 (${(d[s] / total * 100).toFixed(1)}%)`;
        bar.append(seg);
      });
      const share = A.el('p', 'dist-row__share');
      share.append('4점 이상 ', A.el('strong', '', `${((d[5] + d[4]) / total * 100).toFixed(1)}%`));
      row.append(A.el('p', 'dist-row__name', A.SHORT[c.id]), bar, share);
      rows.append(row);
    });
    A.$('dist-note').textContent = `7개 문항 응답 ${all.toLocaleString()}건을 과정별로 합산했습니다. AI 데이터 정리 1차는 원본 응답 파일이 없어 빠졌습니다.`;
  }

  function renderMethod() {
    [
      '영역은 문항을 묶어 계산합니다. 교육 만족은 Q1과 Q2, 현업 적용은 Q3, 강사 만족은 Q4와 Q5, 운영 만족은 Q6과 Q7입니다.',
      '테스트 계정과 관리자 계정의 응답 4건은 제외했습니다.',
      '과정 통합 평균은 그 과정의 모든 차수 응답을 합쳐 계산합니다. 전체 평균과 영역 전체 값은 과정별 값을 응답자 수로 가중해 계산합니다.',
      '점수 구간 색은 4.5 미만, 4.5 이상 4.7 미만, 4.7 이상 4.9 미만, 4.9 이상의 네 단계입니다. 표에는 숫자를 함께 적었습니다.',
      'AI 데이터 정리 1차(14명)는 원본 응답 파일이 없어 문항별 점수와 점수 분포에서 빠졌습니다. 영역 점수와 평균에는 포함됩니다.'
    ].forEach(t => A.$('method-list').append(A.el('li', '', t)));
  }

  window.DashSections = {
    init() { A = window.DashApp; renderItems(); renderDist(); renderMethod(); }
  };
})();
