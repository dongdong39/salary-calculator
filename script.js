// 숫자 입력 제한
document.querySelectorAll('input[inputmode="numeric"]').forEach(input => {
    input.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9.]/g, '');
    });
});

// 빠른 선택
document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.getElementById(this.dataset.target).value = this.dataset.value;
        this.closest('.quick-select').querySelectorAll('.quick-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
    });
});

function getVal(id) { return parseFloat(document.getElementById(id).value) || 0; }

function fmt(num) {
    const n = Math.round(num);
    const abs = Math.abs(n);
    if (abs >= 10000) {
        const eok = Math.floor(abs / 10000);
        const rest = abs % 10000;
        const sign = n < 0 ? '-' : '';
        if (rest === 0) return `${sign}${eok.toLocaleString('ko-KR')}억`;
        return `${sign}${eok.toLocaleString('ko-KR')}억 ${rest.toLocaleString('ko-KR')}`;
    }
    return n.toLocaleString('ko-KR');
}

function clearErrors() {
    document.querySelectorAll('.input-wrapper.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-msg').forEach(el => el.remove());
}

function showError(id, msg) {
    const wrapper = document.getElementById(id).closest('.input-wrapper');
    wrapper.classList.add('error');
    const el = document.createElement('div');
    el.className = 'error-msg';
    el.textContent = msg;
    wrapper.parentElement.appendChild(el);
}

function calculate() {
    clearErrors();
    const salary = getVal('salary');
    const rate = getVal('growthRate');
    const years = getVal('years');

    let valid = true;
    if (salary <= 0) { showError('salary', '연봉을 입력해주세요'); valid = false; }
    if (rate <= 0) { showError('growthRate', '인상률을 입력해주세요'); valid = false; }
    if (years <= 0 || years > 50) { showError('years', '기간을 입력해주세요'); valid = false; }
    if (!valid) return;

    const growthRate = rate / 100;
    const data = [];
    let totalEarned = 0;

    for (let y = 0; y <= years; y++) {
        const annualSalary = salary * Math.pow(1 + growthRate, y);
        const raise = y === 0 ? 0 : annualSalary - salary * Math.pow(1 + growthRate, y - 1);
        totalEarned += annualSalary;
        data.push({
            year: y,
            salary: Math.round(annualSalary),
            monthly: Math.round(annualSalary / 12),
            raise: Math.round(raise)
        });
    }

    const final = data[data.length - 1];
    const multiple = (final.salary / salary).toFixed(2);

    // 결과 표시
    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('resultFinal').textContent = `${fmt(final.salary)}만원`;
    document.getElementById('resultCurrent').textContent = `${fmt(salary)}만원`;
    document.getElementById('resultMonthly').textContent = `약 ${fmt(final.monthly)}만원`;
    document.getElementById('resultMultiple').textContent = `${multiple}배`;
    document.getElementById('resultTotalEarned').textContent = `약 ${fmt(Math.round(totalEarned))}만원`;

    // 연도별 테이블
    const tbody = document.getElementById('yearTableBody');
    tbody.innerHTML = data.map(d => `
        <div class="year-row">
            <span>${d.year === 0 ? '현재' : d.year + '년차'}</span>
            <span>${fmt(d.salary)}만원</span>
            <span>${fmt(d.monthly)}만원</span>
            <span>${d.year === 0 ? '-' : '+' + fmt(d.raise) + '만원'}</span>
        </div>
    `).join('');

    // 차트
    drawChart(data);

    setTimeout(() => {
        document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function drawChart(data) {
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 30, left: 60 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map(d => d.salary));
    const minVal = data[0].salary;

    // Y축
    ctx.fillStyle = '#6a6580';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const val = minVal + (maxVal - minVal) * i / 4;
        const y = pad.top + ch - (ch * i / 4);
        ctx.fillText(fmt(Math.round(val)), pad.left - 8, y + 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(w - pad.right, y);
        ctx.stroke();
    }

    // X축
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 6));
    data.forEach((d, i) => {
        if (i % step === 0 || i === data.length - 1) {
            const x = pad.left + (cw * i / (data.length - 1));
            ctx.fillStyle = '#6a6580';
            ctx.fillText(d.year === 0 ? '현재' : d.year + '년', x, h - 8);
        }
    });

    // 영역
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + ch);
    data.forEach((d, i) => {
        const x = pad.left + (cw * i / (data.length - 1));
        const y = pad.top + ch - (ch * (d.salary - minVal) / (maxVal - minVal));
        ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + cw, pad.top + ch);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, 'rgba(167,139,250,0.35)');
    grad.addColorStop(1, 'rgba(167,139,250,0.05)');
    ctx.fillStyle = grad;
    ctx.fill();

    // 라인
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = pad.left + (cw * i / (data.length - 1));
        const y = pad.top + ch - (ch * (d.salary - minVal) / (maxVal - minVal));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 시작점/끝점 점
    [0, data.length - 1].forEach(i => {
        const d = data[i];
        const x = pad.left + (cw * i / (data.length - 1));
        const y = pad.top + ch - (ch * (d.salary - minVal) / (maxVal - minVal));
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
        ctx.strokeStyle = '#24243e';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// URL 파라미터 자동 세팅
(function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return;

    const salary = params.get('salary');
    const rate = params.get('rate');
    const years = params.get('years');

    if (salary) document.getElementById('salary').value = salary;
    if (rate) document.getElementById('growthRate').value = rate;
    if (years) document.getElementById('years').value = years;

    if (salary && rate && years) {
        setTimeout(() => calculate(), 100);
    }
})();
