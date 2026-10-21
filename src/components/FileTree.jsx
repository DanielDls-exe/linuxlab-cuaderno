import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText, Eye, EyeOff } from 'lucide-react';
import { shortPath } from '../lib/shell.js';

export default function FileTree({ vfs, cwd }) {
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(new Set());
  function toggle(path) { setCollapsed(previous => { const next = new Set(previous); next.has(path) ? next.delete(path) : next.add(path); return next; }); }
  function node(path, level = 0) {
    const item = vfs[path];
    if (!item) return null;
    const name = path === '/' ? '/ raíz' : path.split('/').pop();
    if (name.startsWith('.') && !hidden && !cwd.startsWith(path)) return null;
    const isDirectory = item.type === 'dir', isCurrent = path === cwd, isClosed = collapsed.has(path);
    const Icon = isDirectory ? isClosed ? Folder : FolderOpen : FileText;
    return <li key={path}>
      {isDirectory ? <button className={`tree-node ${isCurrent ? 'current' : ''}`} style={{ paddingLeft: 10 + level * 16 }} onClick={() => toggle(path)} aria-expanded={!isClosed} aria-current={isCurrent ? 'location' : undefined}>
        {isClosed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}<Icon size={14} /><span>{name}</span>{isCurrent && <span className="tree-here">aquí</span>}
      </button> : <div className={`tree-node tree-file ${name.startsWith('.') ? 'hidden-file' : ''}`} style={{ paddingLeft: 26 + level * 16 }}><Icon size={13} /><span>{name}</span></div>}
      {isDirectory && !isClosed && <ul>{item.children.map(child => node(`${path === '/' ? '' : path}/${child}`, level + 1))}</ul>}
    </li>;
  }
  return <section className="file-explorer" aria-label="Sistema de archivos virtual">
    <div className="panel-heading"><span>EXPLORADOR</span><button className="icon-button" onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Ocultar archivos ocultos' : 'Mostrar archivos ocultos'} aria-pressed={hidden}>{hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
    <ul className="tree-root">{node('/')}</ul><div className="tree-location"><span>Ubicación actual</span><code>{shortPath(cwd)}</code></div>
  </section>;
}
