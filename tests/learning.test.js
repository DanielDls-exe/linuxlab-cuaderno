import test from 'node:test';
import assert from 'node:assert/strict';
import { createBaseVFS, CURRICULUM } from '../src/data/curriculum.js';
import { assess, practicedCommands } from '../src/lib/assessment.js';
import { confirmAction, executeBashLine, tokenize } from '../src/lib/shell.js';

function practice(id = '1.1') {
  const activity = CURRICULUM.find(item => item.id === id);
  let session = { vfs: createBaseVFS(activity.vfsPreset), cwd: activity.initialCwd, prevCwd: activity.initialCwd, events: [] };
  return {
    get state() { return session; },
    run(line) { const response = executeBashLine(line, session); session = { ...session, ...response, events: [...session.events, ...response.events] }; return response; },
    confirm(approved) { const response = confirmAction(session, session.pendingAction, approved); session = { ...session, ...response, events: [...session.events, ...response.events] }; return response; },
    get evaluation() { return assess(activity, session); }
  };
}

const routes = {
  '0.1': ['echo Hola Linux'], '1.1': ['pwd'], '1.2': ['cd docs'], '1.3': ['ls -a'], '1.4': ['cat docs/pista.txt'],
  reto1: ['cd proyectos', 'ls -a', 'cd .tesoro', 'cat clave.txt'],
  '2.1': ['mkdir -p web', 'touch web/index.html'], '2.2': ['cp notas.txt docs/', 'mv borrador.txt final.txt'], '2.3': ['rm basura.tmp', ':confirm'], '2.4': ['mv *.jpg imagenes'],
  reto2: ['mkdir fotos', 'mv *.jpg fotos', 'rm temp.txt', ':confirm'],
  '3.1': ['find . -name "*.txt"'], '3.2': ['grep "ERROR" servidor.log'], '3.3': ['ls -la | grep "\\.txt"'], '3.4': ['grep "ERROR" servidor.log > reporte_errores.txt'],
  reto3: ['find . -name "*.log"', 'grep "INTRUSO" seguridad/firewall.log > evidencia.txt']
};
for (const [id, commands] of Object.entries(routes)) test(`actividad ${id}: el recorrido correcto cumple sus objetivos`, () => {
  const p = practice(id);
  for (const command of commands) { const response = command === ':confirm' ? p.confirm(true) : p.run(command); assert.notEqual(response.status, 'error', response.output); }
  assert.equal(p.evaluation.complete, true, JSON.stringify(p.evaluation.results));
});

test('no se aprueba un ls que termina en error', () => { const p = practice('1.3'); assert.equal(p.run('ls -a noexiste').status, 'error'); assert.equal(p.evaluation.complete, false); });
test('echo no sustituye descubrir y leer archivos en el reto 1', () => { const p = practice('reto1'); ['cd proyectos', 'echo .tesoro', 'echo LINUX-MASTER-2026'].forEach(line => p.run(line)); assert.equal(p.evaluation.complete, false); });
test('renombrar basura no acredita un borrado confirmado', () => { const p = practice('2.3'); p.run('mv basura.tmp otra.tmp'); assert.equal(p.evaluation.complete, false); });
test('una frase inventada no acredita un reporte filtrado', () => { const p = practice('3.4'); p.run('echo "Certificado SSL" > reporte_errores.txt'); assert.equal(p.evaluation.complete, false); });
test('evidencia artificial no acredita el reto 3', () => { const p = practice('reto3'); p.run('find . -name "*.log"'); p.run('echo INTRUSO > evidencia.txt'); assert.equal(p.evaluation.complete, false); });
test('2.2 requiere copiar y renombrar, conservando el contenido', () => { const p = practice('2.2'); p.run('cp notas.txt docs/'); assert.equal(p.evaluation.complete, false); p.run('mv borrador.txt final.txt'); assert.equal(p.evaluation.complete, true); });
test('menos y más opciones de ls válidas se aceptan sin fijar una cadena exacta', () => { for (const line of ['ls -al ~', 'ls -l -a /home/ana']) { const p = practice('1.3'); p.run(line); assert.equal(p.evaluation.complete, true); } });
test('mkdir -p sobre un archivo devuelve error sin modificar el VFS', () => { const p = practice(); const before = structuredClone(p.state.vfs); assert.equal(p.run('mkdir -p notas.txt/subcarpeta').status, 'error'); assert.deepEqual(p.state.vfs, before); });
test('no se puede mover o copiar un directorio dentro de sí mismo', () => { for (const line of ['mv docs docs/otra', 'cp -r docs docs/otra', 'cp -r docs docs']) { const p = practice(); const before = structuredClone(p.state.vfs); assert.equal(p.run(line).status, 'error'); assert.deepEqual(p.state.vfs, before); } });
test('una copia conserva el original y un movimiento conserva el contenido', () => { const p = practice(); p.run('cp -r docs copia'); assert.deepEqual(p.state.vfs['/home/ana/copia/pista.txt'], p.state.vfs['/home/ana/docs/pista.txt']); p.run('mv copia respaldo'); assert.ok(p.state.vfs['/home/ana/respaldo/pista.txt']); assert.equal(p.state.vfs['/home/ana/copia'], undefined); });
test('los operadores citados no dividen la línea', () => { const p = practice(); assert.equal(p.run('echo "a && b | c > d"').output, 'a && b | c > d'); assert.equal(p.state.vfs['/home/ana/d'], undefined); });
test('los comodines citados no se expanden', () => { const p = practice(); assert.equal(p.run('ls "*.txt"').status, 'error'); assert.equal(p.run('ls *.txt').output, 'notas.txt'); });
test('las comillas sin cerrar generan un error explicativo', () => { const p = practice(); assert.equal(p.run('echo "hola').status, 'error'); assert.throws(() => tokenize('echo "hola'), /comilla/); });
test('las redirecciones distinguen sobrescribir y añadir, incluidos echo -n', () => { const p = practice(); p.run('echo -n uno > salida.txt'); p.run('echo dos >> salida.txt'); assert.equal(p.state.vfs['/home/ana/salida.txt'].content, 'unodos\n'); p.run('echo tres > salida.txt'); assert.equal(p.state.vfs['/home/ana/salida.txt'].content, 'tres\n'); });
test('cat archivo > archivo trunca antes de leerlo', () => { const p = practice(); p.run('echo texto > salida.txt'); p.run('cat salida.txt > salida.txt'); assert.equal(p.state.vfs['/home/ana/salida.txt'].content, ''); });
test('una confirmación cancelada conserva los archivos y detiene &&', () => { const p = practice('2.3'); assert.equal(p.run('rm basura.tmp && touch despues.txt').status, 'confirm'); p.confirm(false); assert.ok(p.state.vfs['/home/ana/basura.tmp']); assert.equal(p.state.vfs['/home/ana/despues.txt'], undefined); assert.equal(p.evaluation.complete, false); });
test('una confirmación afirmativa reanuda && y registra el borrado', () => { const p = practice('2.3'); p.run('rm basura.tmp && touch despues.txt'); p.confirm(true); assert.equal(p.state.vfs['/home/ana/basura.tmp'], undefined); assert.ok(p.state.vfs['/home/ana/despues.txt']); assert.equal(p.evaluation.complete, true); });
test('el borrado recursivo masivo se bloquea', () => { const p = practice(); assert.equal(p.run('rm -rf *').status, 'error'); assert.ok(p.state.vfs['/home/ana/docs/pista.txt']); });
test('grep recursivo, sort y wc aceptan entradas por tubería', () => { const p = practice(); assert.match(p.run('grep -r "Pista" docs').output, /Pista de supervivencia/); p.run('echo "b\na\nb" > orden.txt'); assert.equal(p.run('cat orden.txt | sort -u').output, 'a\nb'); assert.equal(p.run('cat orden.txt | wc -l').output, '3'); });
test('un grep sin coincidencias detiene &&', () => { const p = practice(); p.run('grep IMPOSIBLE notas.txt && touch no.txt'); assert.equal(p.state.vfs['/home/ana/no.txt'], undefined); });
test('--help devuelve documentación y no acredita la actividad', () => { const p = practice('1.3'); assert.match(p.run('ls --help').output, /Uso:/); assert.equal(p.evaluation.complete, false); });
test('less proporciona el contenido al visor, no un texto que afirma paginar', () => { const p = practice('1.4'); const r = p.run('less docs/pista.txt'); assert.equal(r.pager, p.state.vfs['/home/ana/docs/pista.txt'].content); assert.equal(p.evaluation.complete, true); assert.deepEqual(practicedCommands(p.state.events), ['less']); });
test('cd - vuelve a la ubicación previa', () => { const p = practice(); p.run('cd docs'); p.run('cd -'); assert.equal(p.state.cwd, '/home/ana'); });
test('una ruta absoluta de lectura también cumple el objetivo', () => { const p = practice('1.4'); p.run('cat /home/ana/docs/pista.txt'); assert.equal(p.evaluation.complete, true); });
test('cp -i permite cancelar una sobrescritura', () => { const p = practice(); p.run('echo original > destino.txt'); const before = p.state.vfs['/home/ana/destino.txt'].content; assert.equal(p.run('cp -i notas.txt destino.txt').status, 'confirm'); p.confirm(false); assert.equal(p.state.vfs['/home/ana/destino.txt'].content, before); });
test('mv -i reemplaza solo después de confirmar y reanuda &&', () => { const p = practice(); p.run('echo original > destino.txt'); const content = p.state.vfs['/home/ana/notas.txt'].content; assert.equal(p.run('mv -i notas.txt destino.txt && touch listo.txt').status, 'confirm'); p.confirm(true); assert.equal(p.state.vfs['/home/ana/destino.txt'].content, content); assert.equal(p.state.vfs['/home/ana/notas.txt'], undefined); assert.ok(p.state.vfs['/home/ana/listo.txt']); });
test('cat -n numera las líneas y grep conserva escapes de expresiones regulares', () => { const p = practice(); assert.match(p.run('cat -n docs/pista.txt').output, /^\s+1/); p.run('echo "a.txt\nabtxt" > patron.txt'); assert.equal(p.run('grep "a\\.txt" patron.txt').output, 'a.txt'); });
test('los movimientos de orígenes anidados se rechazan sin perder archivos', () => { const p = practice(); p.run('mkdir destino'); const before = structuredClone(p.state.vfs); assert.equal(p.run('mv -i docs docs/pista.txt destino').status, 'error'); assert.deepEqual(p.state.vfs, before); });
