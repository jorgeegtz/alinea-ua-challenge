// Interactive Signal-Volume & Funnel Simulator + Early-Warning Cohort CAC Checker
(function () {
  const inpBudget = document.getElementById('inp-budget');
  const inpCac = document.getElementById('inp-cac');
  const inpSuTrial = document.getElementById('inp-su-trial');
  const inpTrialPaid = document.getElementById('inp-trial-paid');
  const inpScaleSplit = document.getElementById('inp-scale-split');
  const inpScaleAdsets = document.getElementById('inp-scale-adsets');
  const btnReset = document.getElementById('reset-sim');

  const valBudget = document.getElementById('val-budget');
  const valCac = document.getElementById('val-cac');
  const valSuTrial = document.getElementById('val-su-trial');
  const valTrialPaid = document.getElementById('val-trial-paid');
  const valScaleSplit = document.getElementById('val-scale-split');
  const valScaleAdsets = document.getElementById('val-scale-adsets');

  const simTableBody = document.getElementById('sim-table-body');
  const simInsightBox = document.getElementById('sim-insight-box');

  const fmtCurrency = (n, decimals = 2) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const fmtInt = (n) => Math.round(n).toLocaleString('en-US');

  function updateSimulator() {
    const budget = Number(inpBudget.value);
    const targetCac = Number(inpCac.value);
    const suToTrial = Number(inpSuTrial.value) / 100;
    const trialToPaid = Number(inpTrialPaid.value) / 100;
    const scaleShare = Number(inpScaleSplit.value) / 100;
    const scaleAdsets = Number(inpScaleAdsets.value);

    valBudget.textContent = fmtCurrency(budget, 0);
    valCac.textContent = fmtCurrency(targetCac, 2);
    valSuTrial.textContent = (suToTrial * 100).toFixed(1) + '%';
    valTrialPaid.textContent = (trialToPaid * 100).toFixed(1) + '%';
    valScaleSplit.textContent = `${Math.round(scaleShare * 100)}% Scale / ${Math.round((1 - scaleShare) * 100)}% Test`;
    valScaleAdsets.textContent = `${scaleAdsets} Ad Sets`;

    // Funnel decomposition:
    // Sign Up -> Bank Linked (50% baseline, scales proportionally with suToTrial)
    const suToBankLink = Math.min(0.85, Math.max(0.25, suToTrial / 0.6));
    const bankLinkToTrial = suToTrial / suToBankLink;
    // Trial -> Bank Deposit (65% baseline) & Deposit -> Purchase
    const trialToDeposit = Math.min(0.9, Math.max(0.35, trialToPaid / 0.6153846));
    const depositToPaid = trialToPaid / trialToDeposit;

    // Cumulative CVRs from Sign Up
    const cumSu = 1.0;
    const cumBankLink = suToBankLink;
    const cumTrial = suToTrial;
    const cumDeposit = suToTrial * trialToDeposit;
    const cumPaid = suToTrial * trialToPaid;

    // Target CPAs working backward from Target CAC
    const cpaPaid = targetCac;
    const cpaDeposit = cpaPaid * depositToPaid;
    const cpaTrial = cpaPaid * trialToPaid;
    const cpaBankLink = cpaTrial * bankLinkToTrial;
    const cpaSu = cpaPaid * cumPaid;

    const weeklyScaleBudgetPerAdSet = ((budget / 30) * 7 * scaleShare) / scaleAdsets;

    const stages = [
      {
        name: '1. Sign Up (Name + Email)',
        stepCvr: '64.0% (fr. Install)',
        cumCvr: (cumSu * 100).toFixed(1) + '%',
        cpa: cpaSu,
        vol30: budget / cpaSu,
        rowClass: ''
      },
      {
        name: '2. Bank Linked (Plaid Auth)',
        stepCvr: (suToBankLink * 100).toFixed(1) + '%',
        cumCvr: (cumBankLink * 100).toFixed(1) + '%',
        cpa: cpaBankLink,
        vol30: budget / cpaBankLink,
        rowClass: ''
      },
      {
        name: '3. Trial Start (7-Day Free Trial) (Anchor)',
        stepCvr: (bankLinkToTrial * 100).toFixed(1) + '%',
        cumCvr: (cumTrial * 100).toFixed(1) + '%',
        cpa: cpaTrial,
        vol30: budget / cpaTrial,
        rowClass: 'row-anchor'
      },
      {
        name: '4. Bank Deposit (Account Funded)',
        stepCvr: (trialToDeposit * 100).toFixed(1) + '%',
        cumCvr: (cumDeposit * 100).toFixed(1) + '%',
        cpa: cpaDeposit,
        vol30: budget / cpaDeposit,
        rowClass: ''
      },
      {
        name: '5. Purchase (Paid Annual Sub)',
        stepCvr: (depositToPaid * 100).toFixed(1) + '%',
        cumCvr: (cumPaid * 100).toFixed(1) + '%',
        cpa: cpaPaid,
        vol30: budget / cpaPaid,
        rowClass: 'row-goal'
      }
    ];

    simTableBody.innerHTML = stages
      .map((s) => {
        const wkVol = (s.vol30 / 30) * 7;
        const eventsPerScaleAdSet = weeklyScaleBudgetPerAdSet / s.cpa;
        const minWkSpend50 = s.cpa * 50;
        let statusHtml = '';
        if (eventsPerScaleAdSet >= 50) {
          statusHtml = `<span class="status-ok">EXITS LEARNING (${eventsPerScaleAdSet.toFixed(1)}/wk)</span>`;
        } else if (eventsPerScaleAdSet >= 35) {
          statusHtml = `<span class="status-warn">BORDERLINE (${eventsPerScaleAdSet.toFixed(1)}/wk)</span>`;
        } else {
          statusHtml = `<span class="status-bad">LEARNING LIMITED (${eventsPerScaleAdSet.toFixed(1)}/wk)</span>`;
        }

        return `
          <tr class="${s.rowClass}">
            <td><strong>${s.name}</strong></td>
            <td>${s.stepCvr}</td>
            <td>${s.cumCvr}</td>
            <td><strong>${fmtCurrency(s.cpa)}</strong></td>
            <td>${fmtInt(s.vol30)}</td>
            <td>${fmtInt(wkVol)} / wk</td>
            <td><strong>${eventsPerScaleAdSet.toFixed(1)} ev/wk</strong></td>
            <td>${fmtCurrency(minWkSpend50, 0)}/wk (${fmtCurrency(minWkSpend50 / 7, 0)}/d)</td>
            <td>${statusHtml}</td>
          </tr>
        `;
      })
      .join('');

    const trialEventsPerAdSet = weeklyScaleBudgetPerAdSet / cpaTrial;
    const purchaseEventsPerAdSet = weeklyScaleBudgetPerAdSet / cpaPaid;

    simInsightBox.innerHTML = `
      <strong>Live Signal-Volume Readout:</strong> At <strong>${fmtCurrency(budget, 0)}/mo</strong> (${fmtCurrency(weeklyScaleBudgetPerAdSet, 0)}/wk per Scaling Ad Set across ${scaleAdsets} Scaling Ad Sets), optimizing for <code>Trial Start (${fmtCurrency(cpaTrial)} CPT)</code> yields <strong>${trialEventsPerAdSet.toFixed(1)} events/week per Scaling Ad Set</strong> (${trialEventsPerAdSet >= 50 ? 'above' : 'below'} Meta's 50/week Learning Phase threshold) while firing on Day 0. Optimizing directly for <code>Purchase (${fmtCurrency(cpaPaid)} CAC)</code> yields only <strong>${purchaseEventsPerAdSet.toFixed(1)} events/week per Ad Set</strong> and misses Week 1 conversions due to the 7-day trial lag. Projected 30-day acquisitions: <strong>${fmtInt(budget / cpaPaid)} Paid Annual Subscribers</strong>.
    `;
  }

  if (inpBudget && simTableBody) {
    [inpBudget, inpCac, inpSuTrial, inpTrialPaid, inpScaleSplit, inpScaleAdsets].forEach((el) =>
      el.addEventListener('input', updateSimulator)
    );

    btnReset.addEventListener('click', () => {
      inpBudget.value = 100000;
      inpCac.value = 120;
      inpSuTrial.value = 30;
      inpTrialPaid.value = 40;
      inpScaleSplit.value = 85;
      inpScaleAdsets.value = 3;
      updateSimulator();
    });
    updateSimulator();
  }

  // Early-Warning Cohort CAC Checker (Question 3)
  const inpEarlyCpt = document.getElementById('inp-early-cpt');
  const inpEarlyDeposit = document.getElementById('inp-early-deposit');
  const inpEarlySurvive = document.getElementById('inp-early-survive');
  const valEarlyCpt = document.getElementById('val-early-cpt');
  const valEarlyDeposit = document.getElementById('val-early-deposit');
  const valEarlySurvive = document.getElementById('val-early-survive');
  const earlyCacResult = document.getElementById('early-cac-result');

  function updateEarlyChecker() {
    const cpt = Number(inpEarlyCpt.value);
    const rollingCvr = Number(inpEarlyDeposit.value) / 100;
    const trialChurn = Number(inpEarlySurvive.value) / 100;

    valEarlyCpt.textContent = fmtCurrency(cpt, 2);
    valEarlyDeposit.textContent = Math.round(rollingCvr * 100) + '%';
    valEarlySurvive.textContent = Math.round(trialChurn * 100) + '%';

    // Forecast model: 90D rolling Trial-to-Paid CVR adjusted by early trial churn (18% baseline)
    const churnFactor = (1 - trialChurn) / 0.82;
    const predictedTrialToPaid = Math.min(0.75, Math.max(0.1, rollingCvr * churnFactor));
    const predictedCac = cpt / predictedTrialToPaid;

    let badge = '';
    let actionText = '';
    let meterColor = '#047857';
    if (predictedCac <= 120) {
      badge = `<span class="status-ok">ON TRACK (&lt;= $120)</span>`;
      actionText = `Greenlight +20% / 72h BAU scale on winning concepts.`;
      meterColor = '#047857';
    } else if (predictedCac <= 135) {
      badge = `<span class="status-warn">WATCHLIST ($121-$135)</span>`;
      actionText = `Hold budgets steady. Audit trial churn and rotate fresh hooks.`;
      meterColor = '#b45309';
    } else {
      badge = `<span class="status-bad">INTERVENE (&gt; $135)</span>`;
      actionText = `Pause high-CPT or high-churn creatives immediately.`;
      meterColor = '#be123c';
    }

    // Meter scales from $0 to $180; $120 target sits at 66.7%
    const meterPct = Math.min(100, Math.max(8, (predictedCac / 180) * 100));
    const projectedSubsPer1k = 1000 / predictedCac;

    earlyCacResult.innerHTML = `
      <div class="forecast-hero-top">
        <div>
          <div class="forecast-kicker">Projected Same-Day CAC</div>
          <div class="forecast-big-cac">${fmtCurrency(predictedCac, 2)}</div>
        </div>
        ${badge}
      </div>
      <div class="forecast-meter">
        <div class="forecast-meter-track">
          <div class="forecast-meter-fill" style="width:${meterPct.toFixed(1)}%;background:${meterColor};"></div>
          <div class="forecast-meter-target" style="left:66.7%;" title="$120 Target CAC"></div>
        </div>
        <div class="forecast-meter-labels">
          <span>$0</span>
          <span>Target: $120</span>
          <span>$180+</span>
        </div>
      </div>
      <div class="forecast-sub-row">
        <span>Adj. CVR: <strong>${(predictedTrialToPaid * 100).toFixed(1)}%</strong></span>
        <span>Subs / $1k Spend: <strong>${projectedSubsPer1k.toFixed(1)}</strong></span>
      </div>
      <div style="font-size:12.5px;color:var(--text-secondary);margin-top:8px;">
        <strong>Next Step:</strong> ${actionText}
      </div>
    `;
  }

  const presetButtons = Array.from(document.querySelectorAll('.preset-btn[data-preset]'));
  const presets = {
    strong: { cpt: 38, cvr: 44, churn: 14 },
    baseline: { cpt: 48, cvr: 40, churn: 18 },
    churn: { cpt: 52, cvr: 36, churn: 28 }
  };

  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = presets[btn.dataset.preset];
      if (!p) return;
      inpEarlyCpt.value = p.cpt;
      inpEarlyDeposit.value = p.cvr;
      inpEarlySurvive.value = p.churn;
      presetButtons.forEach((b) => b.classList.toggle('active', b === btn));
      updateEarlyChecker();
    });
  });

  [inpEarlyCpt, inpEarlyDeposit, inpEarlySurvive].forEach((el) =>
    el.addEventListener('input', () => {
      presetButtons.forEach((b) => b.classList.remove('active'));
      updateEarlyChecker();
    })
  );

  updateEarlyChecker();

  // Deck Slide Navigation
  const slides = Array.from(document.querySelectorAll('.deck-slide'));
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[data-slide]'));
  const btnPrev = document.getElementById('btn-prev-slide');
  const btnNext = document.getElementById('btn-next-slide');
  const slideLabel = document.getElementById('deck-slide-label');

  const slideNames = [
    'A. Executive Summary',
    'B. Account Structure & Optimization Events',
    'C. Creative Testing & Scaling System',
    'D. Measurement',
    'E. AI in Your Workflow'
  ];

  let currentSlide = 0;

  function showSlide(index, scrollTop = true) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;

    slides.forEach((s, i) => {
      s.classList.toggle('active', i === currentSlide);
    });

    navLinks.forEach((link) => {
      const target = Number(link.dataset.slide);
      link.classList.toggle('active', target === currentSlide);
    });

    if (slideLabel) {
      slideLabel.innerHTML = `Slide <strong>${currentSlide + 1} / ${slides.length}</strong> | ${slideNames[currentSlide]}`;
    }

    if (btnPrev) btnPrev.disabled = currentSlide === 0;
    if (btnNext) btnNext.disabled = currentSlide === slides.length - 1;

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showSlide(Number(link.dataset.slide));
    });
  });

  if (btnPrev) {
    btnPrev.addEventListener('click', () => showSlide(currentSlide - 1));
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => showSlide(currentSlide + 1));
  }

  document.addEventListener('keydown', (e) => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
    if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
  });

  // Allow deep-linking via URL hash
  const hashMap = {
    '#executive-summary': 0,
    '#simulator': 0,
    '#account-structure': 1,
    '#creative-system': 2,
    '#measurement': 3,
    '#ai-workflow': 4
  };
  if (window.location.hash && hashMap[window.location.hash] !== undefined) {
    showSlide(hashMap[window.location.hash], false);
  } else {
    showSlide(0, false);
  }
})();
