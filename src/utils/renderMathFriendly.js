// Math-friendly formatter for AI output
export function renderMathFriendly(raw) {
  if (!raw) return '';
  
  // Store the original raw input to log at the end
  const originalRaw = String(raw);
  let s = String(raw);
  
  // Normalize different newline styles to \n
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove ALL newlines - they're breaking math expressions
  // We'll intelligently add paragraph breaks back after all formatting
  s = s.replace(/\n/g, ' ');
  
  // Normalize multiple spaces to single space
  s = s.replace(/[ \t]{2,}/g, ' ');
  
  const mathTransforms = (text) => {
    let t = text;
    // First, convert LaTeX commands to symbols
    t = t.replace(/\\\s*div/g, '÷');
    t = t.replace(/\\\s*times/g, '×');
    t = t.replace(/\\\s*cdot/g, '·');
    t = t.replace(/\\\s*text\s*\{\s*([^}]+?)\s*\}/g, (m, content) => ' ' + content.trim() + ' ');
    t = t.replace(/\\\s*frac\s*\{\s*([^}]+?)\s*\}\s*\{\s*([^}]+?)\s*\}/g, '($1/$2)');
    
    // Handle special LaTeX
    t = t.replace(/\%/g, '%');
    t = t.replace(/\\\s*%/g, '%');
    t = t.replace(/\\\s*sqrt\s*\[\s*(\d+)\s*\]\s*\{\s*([^}]+?)\s*\}/g, '$1√($2)');
    t = t.replace(/\\\s*sqrt\s*\{\s*([^}]+?)\s*\}/g, '√($1)');
    t = t.replace(/\\\s*left/g, '').replace(/\\\s*right/g, '');
    t = t.replace(/^\\\[(.*)\\\]$/s, '$1');
    t = t.replace(/^\\\((.*)\\\)$/s, '$1');
    
    // Convert exponents
    const toSup = (d) => d.split('').map(ch => ({'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[ch]||ch)).join('');
    t = t.replace(/(\d+)\^\{(\d+)\}/g, (m, base, exp) => `${base}${toSup(exp)}`);
    t = t.replace(/([A-Za-z0-9])\^(\d+)/g, (m, base, exp) => `${base}${toSup(exp)}`);
    
    // Remove spaces around decimal points: "48 . 6" → "48.6"
    t = t.replace(/(\d)\s*\.\s*(?=\d)/g, '$1.');
    
    // Remove spaces between consecutive digits
    t = t.replace(/(\d)\s+(?=\d)/g, '$1');
    
    // Add spaces around operators: "48.6÷2.7" → "48.6 ÷ 2.7", but be careful with decimals
    t = t.replace(/(\d)(÷|×|=|\+)(?=[a-zA-Z0-9(])/g, '$1 $2 ');
    t = t.replace(/([a-zA-Z0-9)])(÷|×|=|\+)/g, '$1 $2 ');
    
    // Space after punctuation (but not before %)
    t = t.replace(/([,;:!?])([^\s\n%])/g, '$1 $2');
    
    // Space after period ONLY if followed by non-space, non-digit, non-period character
    // This prevents adding space in decimals like "48.6" but adds space in "steps.First"
    t = t.replace(/(\.)([^\s\n.\d])/g, '$1 $2');
    
    // 'of' rule - preserve 'of' pattern in percentages
    t = t.replace(/(\d)\s+(of|Of|OF)\s+(\d)/ig, '$1 of $3');
    
    // Remove percentage spacing issues
    t = t.replace(/(\d)\s+%/g, '$1%');
    
    // Clean up minus sign spacing
    t = t.replace(/(\d|-)\s*-\s*(\d)/g, '$1 - $2');
    
    // Normalize multiple spaces to single space
    t = t.replace(/[ \t]{2,}/g, ' ');
    
    // ADD SPACING WHERE CHUNKS WERE CONCATENATED WITHOUT SPACES (final pass):
    // 1. Between lowercase letter and digit: "calculate35%" → "calculate 35%"
    t = t.replace(/([a-z])(\d)/g, '$1 $2');
    // 2. Between digit and uppercase letter: "2Next" → "2 Next"  
    t = t.replace(/(\d)([A-Z])/g, '$1 $2');
    // 3. Between closing bracket and uppercase: ")Next" → ") Next"
    t = t.replace(/(\))([A-Z])/g, '$1 $2');
    // 4. Between percentage and uppercase letter: "%Next" → "% Next"
    t = t.replace(/(%\s*)([A-Z])/g, '$1 $2');
    
    // Trim trailing whitespace
    t = t.trimRight();
    
    return t;
  };
  const tokens = [];
  let rest = s;
  const displayRe = /\\\[(.*?)\\\]/s;
  while (rest.length) {
    const m = rest.match(displayRe);
    if (!m) { tokens.push({ type: 'text', text: rest }); break; }
    const idx = m.index;
    if (idx > 0) tokens.push({ type: 'text', text: rest.slice(0, idx) });
    tokens.push({ type: 'math', text: m[0] });
    rest = rest.slice(idx + m[0].length);
  }
  const outLines = [];
  tokens.forEach(tok => {
    if (tok.type === 'math') {
      const inner = tok.text.replace(/^\\\[(.*?)\\\]$/s, '$1').trim();
      const transformed = mathTransforms(inner);
      outLines.push(transformed);
    } else {
      const text = tok.text.replace(/\n/g, '\n');
      const paragraphs = text.split(/\n{2,}/);
      paragraphs.forEach(p => {
        if (!p.trim()) return;
        // Extract inline math FIRST before applying text rules
        const mathBlocks = [];
        const withPlaceholders = p.replace(/\\\((.*?)\\\)/gs, (m, inner) => {
          const mathContent = mathTransforms(inner);
          mathBlocks.push(mathContent);
          return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
        });
        
        // Apply numbered steps rule only to non-math text
        // Match numbered steps: non-digit character, then digit(s), period, space, then content
        // This distinguishes step numbers from decimals (decimals have digits before the number)
        let fixed = withPlaceholders;
        
        // First pass: Match steps with capital letters: "text: 1. Calculate" → "text:\n**1**. Calculate"
        fixed = fixed.replace(/([^\d\s])\s*(\d+)\.\s+([A-Z])/g, (m, before, num, after) => {
          if (before.includes('___')) return m;
          return before + '\n**' + num + '**. ' + after;
        });
        
        // Second pass: Match remaining steps without requiring capital (e.g., "steps: 2. perform") → "steps:\n**2**. perform"
        fixed = fixed.replace(/([^\d\s])\s*(\d+)\.\s+(?!\*\*)/g, (m, before, num) => {
          if (before.includes('___')) return m;
          return before + '\n**' + num + '**. ';
        });
        
        // Restore math content
        const restored = fixed.replace(/___MATH_BLOCK_(\d+)___/g, (m, idx) => {
          return mathBlocks[parseInt(idx)] || '';
        });
        
        restored.split(/\n/).forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          outLines.push(mathTransforms(trimmed));
        });
      });
    }
  });
  let result = outLines.join('\n\n');
  
  result = result.replace(/\bboxed\b/gi, '');
  
  // Handle final answer format: \{147} → mark for bold display with space before it
  // Convert \{...} to a bold marker format with leading space
  result = result.replace(/\\\{([^}]+)\}/g, ' **$1**');
  
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/^[ \t]+|[ \t]+$/g, '');
  
  // ADD PARAGRAPH BREAKS: After processing all text and formatting
  // Only add newlines after period+space+capital (unambiguous sentence boundary)
  // This avoids breaking math expressions while preserving text paragraphs
  result = result.replace(/(\.\s+)([A-Z])/g, '$1\n\n$2');
  
  // Collapse excessive newlines back to double newlines
  result = result.replace(/\n{3,}/g, '\n\n');
  
  // Log the raw stream response received
  console.log('=== RAW STREAM RESPONSE ===');
  console.log(originalRaw);
  console.log('=== END RAW RESPONSE ===\n');
  
  return result;
}
