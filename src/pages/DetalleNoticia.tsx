import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Noticia } from '../types/types';
import CarruselImagenes from '../components/CarruselImagenes';

export default function DetalleNoticia() {
  // useParams lee el ":id" que viene en la URL (definido en la ruta de App.tsx: "/noticias/:id")
  const { id } = useParams<{ id: string }>();

  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardadas = localStorage.getItem('obe_noticias');
    if (guardadas) {
      const lista: Noticia[] = JSON.parse(guardadas);
      setNoticia(lista.find(n => n.id === id) ?? null);
    }
    setCargando(false);
  }, [id]);

  if (cargando) return null;

  if (!noticia) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <p>No encontramos esa noticia. Puede que ya no esté disponible.</p>
        <Link to="/" style={{ color: '#ff922d', fontWeight: 'bold', textDecoration: 'none' }}>← Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <Link
        to="/"
        style={{ display: 'inline-block', marginBottom: '20px', color: 'var(--text)', textDecoration: 'none', fontSize: '14px' }}
      >
        ← Volver al inicio
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '13px', color: '#999', marginBottom: '10px' }}>
        <span>
          {noticia.autor}
          {noticia.proyectoRelacionado && ` · Proyecto relacionado: ${noticia.proyectoRelacionado}`}
        </span>
        <span>{noticia.fecha}</span>
      </div>

      <h1 style={{ margin: '0 0 20px' }}>{noticia.titulo}</h1>

      <p style={{ fontSize: '15px', color: 'var(--text-h)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
        {noticia.contenido}
      </p>

      {/* La imagen va al final, debajo del contenido */}
      <CarruselImagenes imagenes={noticia.imagenes} alt={noticia.titulo} altura="320px" />
    </div>
  );
}
