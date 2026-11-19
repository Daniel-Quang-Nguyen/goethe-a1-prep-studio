const fs = require('fs');
const path = require('path');

// WCAG Contrast Calculation
function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function contrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const lightBgs = ['#f7f6f2', '#ffffff', '#faf9f5'];
const darkBgs = ['#141312', '#1e1c19', '#2a2723'];

const lightTexts = [
  { name: 'Primary Text', hex: '#1f1d1a' },
  { name: 'Brand Primary', hex: '#433428' },
  { name: 'Secondary Text', hex: '#524b45' },
  { name: 'Muted Subtext', hex: '#736b63' },
  { name: 'Emerald Correct', hex: '#2d6a4f' },
  { name: 'Terracotta Error', hex: '#b25e3b' }
];

const darkTexts = [
  { name: 'Dark Mode Primary', hex: '#f7f6f2' },
  { name: 'Dark Mode Secondary', hex: '#e7e4dc' },
  { name: 'Dark Mode Muted', hex: '#a8a29e' },
  { name: 'Dark Mode Emerald', hex: '#6ee7b7' },
  { name: 'Dark Mode Terracotta', hex: '#fca5a5' }
];

console.log('=== LIGHT MODE CONTRAST AUDIT (WCAG AA Normal: >= 4.5, Large/UI: >= 3.0) ===');
let failedLight = 0;
lightTexts.forEach(t => {
  lightBgs.forEach(bg => {
    const cr = contrastRatio(t.hex, bg);
    const passAA = cr >= 4.5;
    const passAALarge = cr >= 3.0;
    console.log(`[${passAA ? 'PASS' : passAALarge ? 'PASS-LARGE' : 'FAIL'}] ${t.name} (${t.hex}) on ${bg}: ${cr.toFixed(2)}:1`);
    if (!passAALarge) failedLight++;
  });
});

console.log('\n=== DARK MODE CONTRAST AUDIT ===');
let failedDark = 0;
darkTexts.forEach(t => {
  darkBgs.forEach(bg => {
    const cr = contrastRatio(t.hex, bg);
    const passAA = cr >= 4.5;
    const passAALarge = cr >= 3.0;
    console.log(`[${passAA ? 'PASS' : passAALarge ? 'PASS-LARGE' : 'FAIL'}] ${t.name} (${t.hex}) on ${bg}: ${cr.toFixed(2)}:1`);
    if (!passAALarge) failedDark++;
  });
});

console.log(`\nContrast summary: ${failedLight} light failures, ${failedDark} dark failures.`);
