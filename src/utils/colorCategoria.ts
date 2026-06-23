// Paleta fija de colores para las etiquetas de categoría.
// No se mapea "a mano" cada nombre de categoría a un color: se elige
// de forma determinística según el texto, así la misma categoría
// siempre sale con el mismo color, sin importar cuántas categorías
// nuevas se agreguen en el futuro desde Gestión Proyectos.
const PALETA_CATEGORIAS = [
  { fondo: '#fff3e0', texto: '#e65100' },
  { fondo: '#e0f7fa', texto: '#00695c' },
  { fondo: '#fce4ec', texto: '#ad1457' },
  { fondo: '#ede7f6', texto: '#4527a0' },
];

export function colorCategoria(categoria: string) {
  const suma = categoria.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETA_CATEGORIAS[suma % PALETA_CATEGORIAS.length];
}
