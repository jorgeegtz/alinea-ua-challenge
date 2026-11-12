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
        name: '3. Trial Start (7-Day Free Trial) ★',
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
      <strong>Live Signal-Volume Readout:</strong> At <strong>${fmtCurrency(budget, 0)}/mo</strong> (${fmtCurrency(weeklyScaleBudgetPerAdSet, 0)}/wk per Scaling Ad Set across ${scaleAdsets} Scaling Ad Sets), optimizing for <code>Trial Start (${fmtCurrency(cpaTrial)} CPT)</code> yields <strong>${trialEventsPerAdSet.toFixed(1)} events/week per Scaling Ad Set</strong> (${trialEventsPerAdSet >= 50 ? 'comfortably above' : 'below'} Meta’s 50/week Learning Phase threshold) while firing on Day 0. By contrast, optimizing directly for <code>Purchase (${fmtCurrency(cpaPaid)} CAC)</code> yields only <strong>${purchaseEventsPerAdSet.toFixed(1)} events/week per Ad Set</strong> and suffers a 7-day trial attribution blackout during Week 1. Projected 30-day acquisitions: <strong>${fmtInt(budget / cpaPaid)} Paid Annual Subscribers</strong>.
    `;
  }

  [inpBudget, inpCac, inpSuTrial, inpTrialPaid, inpScaleSplit, inpScaleAdsets].forEach((el) =>
    el.addEventListener('input', updateSimulator)
  );

  btnReset.addEventListener('click', () => {
    inpBudget.value = 100000;
    inpCac.value = 120;
    inpSuTrial.value = 30;
    inpTrialPaid.value = 40;
    inpScaleSplit.value = 70;
    inpScaleAdsets.value = 3;
    updateSimulator();
  });

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
    const depositRate = Number(inpEarlyDeposit.value) / 100;
    const survive24h = Number(inpEarlySurvive.value) / 100;

    valEarlyCpt.textContent = fmtCurrency(cpt, 2);
    valEarlyDeposit.textContent = Math.round(depositRate * 100) + '%';
    valEarlySurvive.textContent = Math.round(survive24h * 100) + '%';

    // Predictive model calibrated so baseline (65% deposit, 82% 24h survival) = 40.0% Trial->Paid CVR
    const survivalMultiplier = survive24h / 0.82;
    const unfundedAliveShare = Math.max(0, survive24h - depositRate);
    const rawPredictedTrialToPaid = (depositRate * 0.562 + unfundedAliveShare * 0.204) * survivalMultiplier;
    const predictedTrialToPaid = Math.min(0.75, Math.max(0.1, rawPredictedTrialToPaid));
    const predictedCac = cpt / predictedTrialToPaid;

    let badge = '';
    let actionText = '';
    if (predictedCac <= 120) {
      badge = `<span class="status-ok">ON TRACK FOR &le;$120 CAC</span>`;
      actionText = `Day-0/1 cohort quality is strong. Greenlight +15–20% budget scale on winning Post IDs.`;
    } else if (predictedCac <= 135) {
      badge = `<span class="status-warn">WATCHLIST ($121–$135 pCAC)</span>`;
      actionText = `Hold budgets steady; audit Plaid linkage friction and rotate fresh hooks into fatigued ad sets.`;
    } else {
      badge = `<span class="status-bad">OFF TRACK (&gt;$135 pCAC — INTERVENE)</span>`;
      actionText = `Pause high-CPT or "Ghost Trial" ads (low Day-0 deposit rate) immediately—do not wait 7 days!`;
    }

    earlyCacResult.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span>Predicted Trial &rarr; Paid CVR: <strong>${(predictedTrialToPaid * 100).toFixed(1)}%</strong></span>
        ${badge}
      </div>
      <div style="font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace;color:#fff;margin-bottom:6px;">
        Predicted Day-8 Paid CAC: ${fmtCurrency(predictedCac, 2)}
      </div>
      <div style="font-size:13px;color:#cbd5e1;"><strong>Recommended Action:</strong> ${actionText}</div>
    `;
  }

  [inpEarlyCpt, inpEarlyDeposit, inpEarlySurvive].forEach((el) =>
    el.addEventListener('input', updateEarlyChecker)
  );

  updateSimulator();
  updateEarlyChecker();
})();
