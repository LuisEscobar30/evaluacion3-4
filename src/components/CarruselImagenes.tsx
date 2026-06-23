import { useState } from 'react';

// --- COMPONENTE REUTILIZABLE: Carrusel de imágenes ---
// Se usa en las tarjetas de Inicio y en las páginas de Detalle de Proyecto/Noticia,
// por eso vive en components/ en vez de estar repetido dentro de cada página.
export default function CarruselImagenes({ imagenes, alt, altura = '150px' }: { imagenes: string[]; alt: string; altura?: string }) {
  const [indice, setIndice] = useState(0);

  if (imagenes.length === 0) {
    return (
      <div style={{ height: altura, background: '#f0f0f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#bbb', fontSize: '13px' }}>Sin imagen</span>
      </div>
    );
  }

  // e.stopPropagation() es necesario porque este carrusel vive dentro de tarjetas
  // que, en Inicio.tsx, tienen su propio onClick para abrir el detalle. Sin esto,
  // hacer clic en "anterior/siguiente" también dispararía la navegación.
  const anterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndice(i => (i === 0 ? imagenes.length - 1 : i - 1));
  };
  const siguiente = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndice(i => (i === imagenes.length - 1 ? 0 : i + 1));
  };

  return (
    <div style={{ position: 'relative' }}>
      <img
        src={imagenes[indice]}
        alt={`${alt} (imagen ${indice + 1} de ${imagenes.length})`}
        style={{ width: '100%', height: altura, objectFit: 'cover', borderRadius: '6px', display: 'block' }}
        onError={e => (e.currentTarget.style.display = 'none')}
      />

      {imagenes.length > 1 && (
        <>
          <button
            type="button"
            onClick={anterior}
            aria-label="Imagen anterior"
            style={{ position: 'absolute', top: '50%', left: '6px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px', lineHeight: '26px', padding: 0 }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Imagen siguiente"
            style={{ position: 'absolute', top: '50%', right: '6px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '14px', lineHeight: '26px', padding: 0 }}
          >
            ›
          </button>
          <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
            {imagenes.map((_, i) => (
              <span
                key={i}
                style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === indice ? '#fff' : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
