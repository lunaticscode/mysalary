const SELECTOR = {
  SALARY_INPUT: "#salary-input",
  SALARY_INPUT_WRAPPER: "#salary-input-wrapper",
  RESULT_SECTION: "#app-result-section",
};
const TAX_RATIO = {
  PUBLIC_PENSION: 4.5 / 100,
  HEALTH_INSURANCE: 3.495 / 100,
  LONGTERM_CARE_INSURANCE: 12.27 / 100 /** :: HEALTH_INSURANCE */,
  EMPLOYMENT_INSURANCE: 0.9 / 100,
  LOCAL_INCOME: 0.1 / 100 /** :: INCOME_TAX */,
};
const FIX_NONE_TAX = 1200000;
const OVER_TAX_INCOME = 10000000;
const LIMIT_PUBLIC_PENSION = 248850 * 12;
const _incomeRange = [
  12000000, 46000000, 88000000, 150000000, 300000000, 500000000, 1000000000,
];
const _incomeTaxRatioRange = [0.06, 0.15, 0.24, 0.35, 0.38, 0.4, 0.42, 0.45];
const _incomeHelpRange = [
  0, 1080000, 5220000, 14900000, 19400000, 25400000, 35400000, 65400000,
];

const getIncomeTax = (salary, familyCnt = 1) => {
  const salarySectionMinValue =
    SALARY_VALUE_LIST[
      SALARY_VALUE_LIST.findIndex((val) => salary / 12 < val) - 1
    ];
  if (salarySectionMinValue) {
    console.log(salarySectionMinValue);
    const incomeTax =
      MAP_INCOME_TO_TAX_LIST[salarySectionMinValue][familyCnt - 1];
    console.log(incomeTax);
    return { value: incomeTax * 12 };
  }
  return { value: 0 };
};

const getOverIncomeTax = (salary, familyCnt = 1) => {
  const basicTax = MAP_INCOME_TO_TAX_LIST[OVER_TAX_INCOME][familyCnt - 1];
  let fixTax = 0;
  let percentTax = 0;

  if (salary > 87000000) {
    fixTax = 31009600;
    percentTax = (salary - 87000000) * 0.45;
  } else if (salary > 45000000) {
    fixTax = 13369600;
    percentTax = (salary - 45000000) * 0.42;
  } else if (salary > 30000000) {
    fixTax = 7369600;
    percentTax = (salary - 30000000) * 0.4;
  } else if (salary > 28000000) {
    fixTax = 6585600;
    percentTax = (salary - 28000000) * 0.98 * 0.4;
  } else if (salary > 14000000) {
    fixTax = 1372000;
    percentTax = (salary - 14000000) * 0.98 * 0.38;
  } else {
    percentTax = (salary - 10000000) * 0.98 * 0.35;
  }

  const overIncomeTax = percentTax + fixTax + basicTax;
  return overIncomeTax * 12;
};

const getSubtractValues = (salary) => {
  const resultArr = [];
  const targetSalary = salary - FIX_NONE_TAX;
  for (let key in TAX_RATIO) {
    if (key === "PUBLIC_PENSION") {
      resultArr.push({
        title: "국민연금",
        ratioLabel: "4.5%",
        value:
          targetSalary * TAX_RATIO[key] > LIMIT_PUBLIC_PENSION
            ? LIMIT_PUBLIC_PENSION
            : targetSalary * TAX_RATIO[key],
      });
    }
    if (key === "HEALTH_INSURANCE") {
      resultArr.push({
        title: "건강보험",
        ratioLabel: "3.495%",
        value: targetSalary * TAX_RATIO[key],
      });
    }
    if (key === "LONGTERM_CARE_INSURANCE") {
      resultArr.push({
        title: "요양보험",
        ratioLabel: "건강보험의 12.27%",
        value: targetSalary * TAX_RATIO["HEALTH_INSURANCE"] * TAX_RATIO[key],
      });
    }
    if (key === "EMPLOYMENT_INSURANCE") {
      resultArr.push({
        title: "고용보험",
        ratioLabel: "0.9%",
        value: targetSalary * TAX_RATIO[key],
      });
    }
  }

  let incomeTaxValue;
  if (targetSalary / 12 > OVER_TAX_INCOME) {
    incomeTaxValue = getOverIncomeTax(targetSalary / 12);
  } else {
    const { value } = getIncomeTax(targetSalary);
    incomeTaxValue = value;
  }
  resultArr.push({
    title: "근로소득세",
    ratioLabel: "*간이소득세표",
    value: incomeTaxValue,
  });
  resultArr.push({
    title: "지방소득세",
    ratioLabel: "근로소득세의 10%",
    value: incomeTaxValue * 0.1,
  });

  return resultArr.map((val) => {
    return {
      ...val,
      value: Math.floor(val.value),
    };
  });
};

const renderingResult = (salary) => {
  const substractValueList = getSubtractValues(salary);
  const resultSectionElem = document.querySelector(SELECTOR.RESULT_SECTION);
  resultSectionElem.innerHTML = "";
  const fragElem = document.createDocumentFragment();

  const initMonthlySalaryElem = document.createElement("div");
  initMonthlySalaryElem.innerHTML = `
    <div class='result-item-initvalue-wrapper'>
      <div class='result-item-initvalue-desc'>
        월 급여액(세전)
      </div>
      <div class='result-item-initvalue-value'>
        ${Math.floor(salary / 12).toLocaleString()}
        <span>원</span>
      </div>
    </div>
  `;
  fragElem.append(initMonthlySalaryElem);

  const substractHeaderElem = document.createElement("div");
  substractHeaderElem.setAttribute("class", "result-substract-header");
  substractHeaderElem.innerHTML = `차감 항목`;
  fragElem.append(substractHeaderElem);

  const substractItemsWrapper = document.createElement("div");
  substractItemsWrapper.setAttribute("class", "result-substract-items-wrapper");

  let substractSum = 0;
  for (let i = 0; i < substractValueList.length; i++) {
    const resultItemWrapperElem = document.createElement("div");
    resultItemWrapperElem.setAttribute(
      "class",
      "result-substract-item-wrapper"
    );
    substractSum = substractSum + substractValueList[i].value / 12;
    const targetSubstractValue =
      substractValueList[i].value / 12 > 0
        ? substractValueList[i].value / 12
        : 0;

    resultItemWrapperElem.innerHTML = `
      <div class='result-item-desc'>
        ${substractValueList[i].title}
        <div class='result-item-ratio' style='display:inline-block;'>
        ${substractValueList[i].ratioLabel}
        </div>
      </div>
      <div class='result-item-value'>
        ${Math.floor(targetSubstractValue).toLocaleString()}
        <span>원</span>
      </div>
    `;
    substractItemsWrapper.append(resultItemWrapperElem);
  }
  fragElem.append(substractItemsWrapper);
  const substractSumElem = document.createElement("div");
  substractSum = substractSum > 0 ? substractSum : 0;
  substractSumElem.setAttribute(
    "class",
    "result-substract-item-wrapper result-salary"
  );
  substractSumElem.innerHTML = `
    <div class='result-item-desc'>총 차감금액</div>
    <div class='result-item-value'>${Math.floor(
      substractSum
    ).toLocaleString()}<span>원</span></div>
  `;
  fragElem.append(substractSumElem);

  const resultSalaryElem = document.createElement("div");
  resultSalaryElem.setAttribute("class", "result-salary-wrapper");
  resultSalaryElem.innerHTML = `
    <div class='result-salary-header'>실수령액(세후)</div> 
    <div class='result-salary-item-wrapper'>
      <div class='result-salary-desc'>(<span>월 급여액</span> - <span>총 차감금액</span>) </div>
      <div class='result-salary-value'>${Math.floor(
        salary / 12 - substractSum
      ).toLocaleString()}
        <span>원</span>
      </div>
    <div>
  `;
  fragElem.append(resultSalaryElem);
  resultSectionElem.append(fragElem);
};

const salaryInputElem = document.querySelector(SELECTOR.SALARY_INPUT);
const salaryInputWrapperElem = document.querySelector(
  SELECTOR.SALARY_INPUT_WRAPPER
);

salaryInputElem.addEventListener("keyup", ({ target }) => {
  if (!target) return;
  const { value: inputValue } = target;

  const intValue = Number(
    inputValue.replace(/[^0-9]/gi, "").replaceAll(",", "")
  );
  if (isNaN(intValue)) {
    salaryInputElem.value = 0;
  }
  if (intValue > 0) {
    salaryInputWrapperElem.setAttribute("class", "active");
  } else {
    salaryInputWrapperElem.setAttribute("class", "");
  }
  renderingResult(intValue);
  const formatedStringValue = intValue.toLocaleString("ko-KR");
  salaryInputElem.value = formatedStringValue;
});
