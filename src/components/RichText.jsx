import React from 'react';

// Render only the two inline formats used by our authored lessons; no HTML injection.
export default function RichText({ text = '' }) {
  return String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}
