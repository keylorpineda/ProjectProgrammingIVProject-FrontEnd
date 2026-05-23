const fs = require('fs');
const path = require('path');

const replacements = {
  'ESTACIÃ“N': 'ESTACIÓN',
  'BÃšNKER': 'BÚNKER',
  'BÃŠNKER': 'BÚNKER',
  'SITUACIÃ“N': 'SITUACIÓN',
  'MÃ‰DICO': 'MÉDICO',
  'MUNICIÃ“N': 'MUNICIÓN',
  'LÃ DER': 'LÍDER',
  'LDER': 'LÍDER',
  'EXPEDICIÃ“N': 'EXPEDICIÓN',
  'BÃšSQUEDA': 'BÚSQUEDA',
  'ENVÃ O': 'ENVÍO',
  'TRÃ NSITO': 'TRÁNSITO',
  'TRÃ\x81NSITO': 'TRÁNSITO',
  'ALMACÃ‰N': 'ALMACÉN',
  'ARRIBÃ“': 'ARRIBÓ',
  'EstadÃ\xADsticas': 'Estadísticas',
  'producciÃ³n': 'producción',
  'MECÃ NICO': 'MECÁNICO',
  'VEHÃ CULOS': 'VEHÍCULOS',
  'CARROÃ‘EROS': 'CARROÑEROS',
  'CARROÃ‘A': 'CARROÑA',
  'QUÃ MICO': 'QUÍMICO',
  'Ã CIDAS': 'ÁCIDAS',
  'CARDÃ ACA': 'CARDÍACA',
  'ELÃ‰CTRICO': 'ELÉCTRICO',
  'INFANTERÃ A': 'INFANTERÍA',
  'PUNTERÃ A': 'PUNTERÍA',
  'RAMÃ“N': 'RAMÓN',
  'GÃ“MEZ': 'GÓMEZ',
  'TÃšNELES': 'TÚNELES',
  'SUBTERRÃ NEO': 'SUBTERRÁNEO',
  'RECOLECCIÃ“N': 'RECOLECCIÓN',
  'SÃ‰PTICA': 'SÉPTICA',
  'ESTÃ ': 'ESTÁ',
  'MÃ NIMO': 'MÍNIMO',
  'POBLACIÃ“N': 'POBLACIÓN',
  'ARMERÃ A': 'ARMERÍA',
  'BÃºnker': 'Búnker',
  'producciÃ³n': 'producción',
  'vehÃ\xADculos': 'vehículos',
  'â€“': '–',
  'â€¢': '•',
  'â€œ': '“',
  'â€\x9D': '”',
  'Â¢': '•',
  'DÃ AS': 'DÍAS',
  'MÃ XIMO': 'MÁXIMO',
  'MÃ NIMA': 'MÍNIMA',
  'REVISIÃ“N': 'REVISIÓN',
  'CANCELACIÃ“N': 'CANCELACIÓN',
  'OPERACIÃ“N': 'OPERACIÓN',
  'PRODUCCIÃ“N': 'PRODUCCIÓN',
  'METABÃ“LICOS': 'METABÓLICOS',
  'PÃšBLICO': 'PÚBLICO'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('C:/Users/USUARIO/OneDrive/Documentos/UNA/ProjectProgrammingIVProject-FrontEnd/src/pages/CampLeader');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
