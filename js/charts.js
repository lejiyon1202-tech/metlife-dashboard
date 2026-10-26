/* 차트 그리기. 색은 CSS 변수에서 읽는다. */
(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // 차수별 전체 평균의 흐름을 작은 선으로 표시한다. 세로 범위는 모든 과정에 같게 둔다.
  function sparkline(values, min, max) {
    const w = 96, h = 28, pad = 4;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('class', 'sparkline');
    svg.setAttribute('aria-hidden', 'true');
    const x = i => pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1);
    const y = v => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    const line = document.createElementNS(SVG_NS, 'polyline');
    line.setAttribute('points', values.map((v, i) => `${x(i)},${y(v)}`).join(' '));
    line.setAttribute('class', 'sparkline__line');
    svg.appendChild(line);
    const last = document.createElementNS(SVG_NS, 'circle');
    last.setAttribute('cx', x(values.length - 1));
    last.setAttribute('cy', y(values[values.length - 1]));
    last.setAttribute('r', 3);
    last.setAttribute('class', 'sparkline__dot');
    svg.appendChild(last);
    return svg;
  }

  let trend = null;
  // 영역 4개를 차수 순서로 잇는다. 세로축은 모든 과정에서 4.0~5.0으로 고정해 과정 간 비교가 되게 한다.
  function trendChart(canvas, course, areas) {
    const labels = course.rounds.map(r => `${r.round}차`);
    const datasets = areas.map((a, i) => ({
      label: a.label,
      data: course.rounds.map(r => r.area[a.key]),
      borderColor: css(`--series-${i + 1}`),
      backgroundColor: css(`--series-${i + 1}`),
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBorderColor: css('--color-surface'),
      pointBorderWidth: 2,
      tension: 0
    }));
    if (trend) trend.destroy();
    trend = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        maintainAspectRatio: false,
        animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: c => ` ${c.dataset.label} ${c.parsed.y.toFixed(2)}점` },
            titleFont: { family: 'Pretendard' }, bodyFont: { family: 'Pretendard' }
          }
        },
        scales: {
          y: {
            min: 4.0, max: 5.0,
            ticks: { stepSize: 0.2, color: css('--color-ink-3'), font: { family: 'Pretendard', size: 12 } },
            grid: { color: css('--color-line') }, border: { display: false }
          },
          x: {
            ticks: { color: css('--color-ink-3'), font: { family: 'Pretendard', size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  window.DashCharts = { sparkline, trendChart };
})();
