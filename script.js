const display = document.querySelector('#display');
const expression = document.querySelector('#expression');
const operationCount = document.querySelector('#operation-count');
const displayPanel = document.querySelector('.display-panel');
const keypad = document.querySelector('#keypad');

let current = '0';
let stored = null;
let operator = null;
let waitingForOperand = false;
let lastExpression = '';
let operations = 0;

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(12));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10, useGrouping: false });
}

function refresh() {
  display.textContent = current;
  operationCount.textContent = `${operations} OPS`;
  expression.textContent = lastExpression || '\u00a0';
  display.classList.remove('bump');
  void display.offsetWidth;
  display.classList.add('bump');
  displayPanel.classList.toggle('active', current !== '0' || stored !== null);
  display.classList.toggle('error', current === 'Error');
}

function inputDigit(digit) {
  if (current === 'Error' || waitingForOperand) {
    current = digit;
    waitingForOperand = false;
  } else {
    current = current === '0' ? digit : current + digit;
  }
  lastExpression = '';
  refresh();
}

function inputDecimal() {
  if (current === 'Error' || waitingForOperand) { current = '0.'; waitingForOperand = false; }
  else if (!current.includes('.')) current += '.';
  refresh();
}

function calculate(first, second, selectedOperator) {
  const a = Number(first);
  const b = Number(second);
  if (selectedOperator === '+') return a + b;
  if (selectedOperator === '−') return a - b;
  if (selectedOperator === '×') return a * b;
  if (selectedOperator === '÷') return b === 0 ? NaN : a / b;
  return b;
}

function chooseOperator(nextOperator) {
  if (current === 'Error') return;
  const input = Number(current);
  if (stored === null) stored = input;
  else if (operator) {
    const result = calculate(stored, input, operator);
    current = formatNumber(result);
    stored = result;
  }
  operator = nextOperator;
  waitingForOperand = true;
  lastExpression = `${formatNumber(stored)} ${nextOperator}`;
  refresh();
}

function equals() {
  if (operator === null || stored === null || current === 'Error') return;
  const input = Number(current);
  const left = formatNumber(stored);
  const result = calculate(stored, input, operator);
  lastExpression = `${left} ${operator} ${formatNumber(input)} =`;
  current = formatNumber(result);
  stored = null;
  operator = null;
  waitingForOperand = true;
  operations += 1;
  refresh();
}

function clear() {
  current = '0'; stored = null; operator = null; waitingForOperand = false; lastExpression = ''; refresh();
}

function toggleSign() {
  if (current !== '0' && current !== 'Error') current = current.startsWith('-') ? current.slice(1) : `-${current}`;
  refresh();
}

function percent() {
  if (current !== 'Error') current = formatNumber(Number(current) / 100);
  refresh();
}

function press(button, event) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  ripple.className = 'ripple'; ripple.style.width = `${size}px`; ripple.style.height = `${size}px`;
  ripple.style.left = `${(event.clientX || rect.left + rect.width / 2) - rect.left - size / 2}px`;
  ripple.style.top = `${(event.clientY || rect.top + rect.height / 2) - rect.top - size / 2}px`;
  button.append(ripple); ripple.addEventListener('animationend', () => ripple.remove());
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  press(button, event);
  const { value, action } = button.dataset;
  if (value && /\d/.test(value)) inputDigit(value);
  else if (value === '.') inputDecimal();
  else if (value) chooseOperator(value);
  else if (action === 'equals') equals();
  else if (action === 'clear') clear();
  else if (action === 'sign') toggleSign();
  else if (action === 'percent') percent();
});

document.addEventListener('keydown', (event) => {
  const keyMap = { '*': '×', '/': '÷', '-': '−', '+': '+', Enter: 'equals', '=': 'equals', Escape: 'clear', '%': 'percent' };
  const button = [...keypad.querySelectorAll('button')].find((candidate) => candidate.dataset.value === (keyMap[event.key] || event.key) || candidate.dataset.action === keyMap[event.key]);
  if (button) { event.preventDefault(); button.classList.add('pressed'); setTimeout(() => button.classList.remove('pressed'), 120); button.click(); }
});

refresh();
