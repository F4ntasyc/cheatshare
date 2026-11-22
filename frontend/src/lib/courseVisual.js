// Menentukan kunci ikon mata kuliah dari namanya (data-driven).
// Aturan berurutan: yang pertama cocok menang.
const RULES = [
  ['security', /keamanan|siber|security|kriptografi|forensik/],
  ['web', /\bweb\b|html|css|frontend|front-end|react|laravel/],
  ['db', /basis data|database|\bsql\b|gudang data|data warehouse/],
  ['net', /jaringan|network|internet|telekomunikasi|\biot\b/],
  [
    'os',
    /sistem operasi|operating system|arsitektur komputer|organisasi komputer|linux/,
  ],
  [
    'chart',
    /statistik|analitik|analisis data|sains data|data science|machine learning|big data|visualisasi|bisnis cerdas/,
  ],
  ['algo', /algoritma|struktur data|matematika diskrit|logika|kompleksitas/],
  [
    'code',
    /pemrograman|program|kode|coding|software|perangkat lunak|mobile|aplikasi/,
  ],
];

// Huruf kecil + hilangkan aksen (mis. "é" -> "e").
export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function courseVisual(course) {
  const name = normalizeText(course?.name);
  for (const [key, pattern] of RULES) if (pattern.test(name)) return key;
  return 'book';
}
