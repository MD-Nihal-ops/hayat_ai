export function calculateInsuranceDemo(billTotal, items, { coveragePercent, deductible }) {
  const total = Number(billTotal);
  const coverage = Number(coveragePercent);
  const deductibleAmount = deductible == null || deductible === "" ? 0 : Number(deductible);
  if (!Number.isFinite(total) || total < 0 || !Array.isArray(items) ||
      !Number.isFinite(coverage) || coverage < 0 || coverage > 100 ||
      !Number.isFinite(deductibleAmount) || deductibleAmount < 0) {
    throw new TypeError("Bill total, coverage percent, deductible, and items must contain valid non-negative values.");
  }

  const deductibleApplied = Math.min(total, deductibleAmount);
  const amountAfterDeductible = total - deductibleApplied;
  const covered = amountAfterDeductible * coverage / 100;
  const patientPays = deductibleApplied + (amountAfterDeductible - covered);

  return {
    billTotal: total,
    itemizedTotal: items.reduce((sum, item) => {
      const amount = Number(item.amount);
      return sum + (Number.isFinite(amount) && amount >= 0 ? amount : 0);
    }, 0),
    deductibleApplied,
    amountAfterDeductible,
    covered,
    patientPays,
    steps: [
      { key: "deductible", amount: deductibleApplied },
      { key: "remaining", amount: amountAfterDeductible },
      { key: "covered", amount: covered },
      { key: "patientPays", amount: patientPays }
    ]
  };
}
