// Calculator logic: handles button clicks and keyboard input
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');

let expression = '0';

function setExpression(value){
  expression = value;
  expressionEl.textContent = expression || '0';
  updatePreview();
}

function appendValue(v){
  if(expression === '0' && v !== '.' && /[0-9]/.test(v)) expression = v;
  else expression += v;
  setExpression(expression);
}

function clearAll(){ setExpression('0'); resultEl.textContent = '\u00A0'; }

function deleteLast(){
  if(expression.length <= 1) setExpression('0');
  else setExpression(expression.slice(0,-1));
}

function sanitizeForEval(expr){
  // Allow digits, spaces, parentheses, decimal point and operators + - * / %
  if(!/^[0-9+\-*/().%\s]*$/.test(expr)) return null;
  return expr.replace(/×/g,'*').replace(/÷/g,'/');
}

function evaluateExpression(expr){
  const clean = sanitizeForEval(expr);
  if(clean === null) throw new Error('Invalid characters');
  // Convert percent: '50%' -> '(50/100)'
  const withPercent = clean.replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');
  // Use Function to evaluate safely within this scope
  // Wrap in parentheses to allow leading unary +/-. Use try/catch at call site.
  // Note: This is a small local app; for production use a proper parser.
  // Prevent empty string
  if(!withPercent.trim()) return '';
  // Disallow expressions ending with operator (except ')') to avoid syntax errors
  const lastChar = withPercent.trim().slice(-1);
  if(/[-+*/.(]/.test(lastChar)) return '';
  return Function('return ' + withPercent)();
}

function updatePreview(){
  try{
    const val = evaluateExpression(expression);
    if(val === '' || val === undefined) resultEl.textContent = '\u00A0';
    else resultEl.textContent = String(val);
  }catch(e){
    resultEl.textContent = '\u00A0';
  }
}

function commitEquals(){
  try{
    const val = evaluateExpression(expression);
    if(val === '' || val === undefined) return;
    // Normalize result string
    const out = Number.isFinite(val) ? (Math.round((val + Number.EPSILON) * 1e12) / 1e12).toString() : String(val);
    setExpression(out);
    resultEl.textContent = '\u00A0';
  }catch(e){
    // Show brief error then reset preview
    resultEl.textContent = 'Error';
  }
}

// Wire up buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const value = btn.dataset.value;
    if(action === 'clear') clearAll();
    else if(action === 'delete') deleteLast();
    else if(action === 'equals') commitEquals();
    else if(value) appendValue(value);
  });
});

// Keyboard support
window.addEventListener('keydown', (e) => {
  if(e.ctrlKey || e.metaKey) return; // ignore shortcuts
  const k = e.key;
  if(/[0-9]/.test(k)) { appendValue(k); e.preventDefault(); return; }
  if(k === '.') { appendValue('.'); e.preventDefault(); return; }
  if(k === '+' || k === '-' || k === '*' || k === '/') { appendValue(k); e.preventDefault(); return; }
  if(k === 'Enter' || k === '=') { commitEquals(); e.preventDefault(); return; }
  if(k === 'Backspace') { deleteLast(); e.preventDefault(); return; }
  if(k === 'Escape') { clearAll(); e.preventDefault(); return; }
  if(k === '%'){ appendValue('%'); e.preventDefault(); return; }
  if(k === '(' || k === ')'){ appendValue(k); e.preventDefault(); return; }
});

// Initialize
clearAll();
