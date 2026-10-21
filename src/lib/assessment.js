import { createBaseVFS } from '../data/curriculum.js';

const HOME = '/home/ana';
const READERS = ['cat', 'less', 'head', 'tail'];
const hasAll = (array, expected) => expected.every(value => array.includes(value));

export function assess(activity, session) {
  const { vfs, cwd } = session;
  const events = session.events.filter(event => event.status === 'ok' && !event.args.includes('--help'));
  const initial = createBaseVFS(activity.vfsPreset);
  const happened = (command, predicate = () => true) => events.some(event => (Array.isArray(command) ? command.includes(event.command) : event.command === command) && predicate(event));
  const file = path => vfs[path]?.type === 'file';
  const directory = path => vfs[path]?.type === 'dir';
  const intact = path => file(path) && vfs[path].content === initial[path]?.content;
  const read = path => happened(READERS, event => event.paths.includes(path) && event.output.length > 0);
  const listedHidden = path => happened('ls', event => event.paths.includes(path) && event.args.some(arg => /^-[al]*a[al]*$/.test(arg)));
  const removed = path => !vfs[path] && happened('rm', event => event.confirmed && event.paths.includes(path));
  const moved = (sources, destinations, glob = false) => happened('mv', event => hasAll(event.paths, sources) && hasAll(event.destinations || [], destinations) && (!glob || event.globPatterns.length > 0));
  const results = [];
  const check = (label, done) => results.push({ label, done: Boolean(done) });
  switch (activity.id) {
    case '0.1': check('Imprime el saludo «Hola Linux» con echo.', happened('echo', event => event.output.toLowerCase() === 'hola linux')); break;
    case '1.1': check('Consulta tu ubicación con pwd.', happened('pwd')); break;
    case '1.2': check('Entra en /home/ana/docs con cd.', cwd === `${HOME}/docs` && happened('cd', event => event.paths.includes(`${HOME}/docs`))); break;
    case '1.3': check('Lista los archivos ocultos de tu carpeta personal.', listedHidden(HOME) && happened('ls', event => event.paths.includes(HOME) && event.output.includes('.config_secreta'))); break;
    case '1.4': check('Lee la pista que está dentro de docs/pista.txt.', read(`${HOME}/docs/pista.txt`)); break;
    case 'reto1':
      check('Entra en la carpeta proyectos.', happened('cd', event => event.cwdAfter === `${HOME}/proyectos` || event.cwdAfter.startsWith(`${HOME}/proyectos/`)));
      check('Descubre .tesoro con un listado de archivos ocultos.', listedHidden(`${HOME}/proyectos`));
      check('Lee el archivo .tesoro/clave.txt.', read(`${HOME}/proyectos/.tesoro/clave.txt`)); break;
    case '2.1':
      check('Crea la carpeta web.', directory(`${HOME}/web`) && happened('mkdir', event => event.paths.some(path => path === `${HOME}/web` || path.startsWith(`${HOME}/web/`))));
      check('Crea index.html dentro de web.', file(`${HOME}/web/index.html`) && happened('touch', event => event.paths.includes(`${HOME}/web/index.html`))); break;
    case '2.2':
      check('Copia notas.txt a docs/ y conserva el original.', intact(`${HOME}/notas.txt`) && file(`${HOME}/docs/notas.txt`) && vfs[`${HOME}/docs/notas.txt`].content === initial[`${HOME}/notas.txt`].content && happened('cp', event => event.paths.includes(`${HOME}/notas.txt`) && event.destinations.includes(`${HOME}/docs/notas.txt`)));
      check('Renombra borrador.txt como final.txt.', !vfs[`${HOME}/borrador.txt`] && file(`${HOME}/final.txt`) && vfs[`${HOME}/final.txt`].content === initial[`${HOME}/borrador.txt`].content && moved([`${HOME}/borrador.txt`], [`${HOME}/final.txt`])); break;
    case '2.3':
      check('Borra basura.tmp y confirma la operación.', removed(`${HOME}/basura.tmp`));
      check('Conserva importante.txt sin cambios.', intact(`${HOME}/importante.txt`)); break;
    case '2.4':
      check('Mueve ambas fotografías a imagenes/ usando un comodín.', ['foto1.jpg', 'foto2.jpg'].every(name => file(`${HOME}/imagenes/${name}`) && !vfs[`${HOME}/${name}`]) && moved(['foto1.jpg', 'foto2.jpg'].map(name => `${HOME}/${name}`), ['foto1.jpg', 'foto2.jpg'].map(name => `${HOME}/imagenes/${name}`), true));
      check('Conserva reporte.pdf en su lugar.', intact(`${HOME}/reporte.pdf`)); break;
    case 'reto2': {
      const base = `${HOME}/descargas`;
      check('Crea la carpeta fotos dentro de descargas.', directory(`${base}/fotos`) && happened('mkdir', event => event.paths.includes(`${base}/fotos`)));
      check('Mueve las dos fotografías a fotos/ usando un comodín.', ['vacaciones.jpg', 'perfil.jpg'].every(name => file(`${base}/fotos/${name}`) && !vfs[`${base}/${name}`]) && moved(['vacaciones.jpg', 'perfil.jpg'].map(name => `${base}/${name}`), ['vacaciones.jpg', 'perfil.jpg'].map(name => `${base}/fotos/${name}`), true));
      check('Borra temp.txt con confirmación y conserva informe.pdf.', removed(`${base}/temp.txt`) && intact(`${base}/informe.pdf`)); break;
    }
    case '3.1': check('Localiza los archivos .txt con find.', happened('find', event => event.foundPaths?.includes(`${HOME}/proyectos/backend/claves_backup.txt`) && event.args.includes('-name'))); break;
    case '3.2': {
      const expected = initial[`${HOME}/servidor.log`].content.split('\n').filter(line => line.includes('ERROR'));
      check('Filtra todos los errores de servidor.log con grep.', happened('grep', event => event.sources.includes(`${HOME}/servidor.log`) && expected.every(line => event.output.includes(line)) && !event.output.includes('Usuario ana inició sesión'))); break;
    }
    case '3.3': check('Conecta una lectura o listado con grep mediante una tubería.', happened('grep', event => event.piped && event.output.length > 0 && (event.sources.includes(`${HOME}/servidor.log`) || event.inputCommand === 'ls'))); break;
    case '3.4': {
      const expected = initial[`${HOME}/servidor.log`].content.split('\n').filter(line => line.includes('ERROR')).join('\n');
      const target = `${HOME}/reporte_errores.txt`;
      check('Guarda exactamente las líneas de ERROR en reporte_errores.txt.', file(target) && vfs[target].content.trim() === expected.trim() && happened('grep', event => event.writtenPath === target && event.sources.includes(`${HOME}/servidor.log`))); break;
    }
    case 'reto3': {
      const base = `${HOME}/auditoria`, logs = [`${base}/web/acceso.log`, `${base}/seguridad/firewall.log`], target = `${base}/evidencia.txt`;
      check('Encuentra los registros de auditoría con find.', happened('find', event => hasAll(event.foundPaths || [], logs)));
      check('Filtra eventos INTRUSO de uno o ambos registros.', happened('grep', event => event.sources.some(source => logs.includes(source)) && event.output.includes('INTRUSO') && event.output.split('\n').every(line => line.includes('INTRUSO'))));
      const lines = (vfs[target]?.content || '').trim().split('\n');
      const validLines = logs.flatMap(path => initial[path].content.split('\n').filter(line => line.includes('INTRUSO')));
      check('Guarda evidencia real filtrada en evidencia.txt.', file(target) && lines.length > 0 && lines.every(line => validLines.some(valid => line === valid || line.endsWith(':' + valid))) && happened('grep', event => event.writtenPath === target && event.sources.some(source => logs.includes(source)))); break;
    }
    default: break;
  }
  return { complete: results.length > 0 && results.every(result => result.done), results };
}

export function practicedCommands(events) {
  return [...new Set(events.filter(event => event.status === 'ok' && !event.args.includes('--help')).flatMap(event => [event.command, ...(event.piped ? ['|'] : []), ...(event.redirect ? [event.redirect] : [])]))];
}
