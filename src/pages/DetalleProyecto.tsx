import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Proyecto } from '../types/types';
import CarruselImagenes from '../components/CarruselImagenes';
import { colorCategoria } from '../utils/colorCategoria';

export default function DetalleProyecto() {
  // useParams lee el ":id" que viene en la URL (definido en la ruta de App.tsx: "/proyectos/:id")
  const { id } = useParams<{ id: string }>();

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardados = localStorage.getItem('obe_proyectos');
    if (guardados) {
      const lista: Proyecto[] = JSON.parse(guardados);
      setProyecto(lista.find(p => p.id === id) ?? null);
    }
    setCargando(false);
  }, [id]);

  // Mientras se lee localStorage, no mostramos nada todavía (es instantáneo,
  // pero evita un parpadeo donde se alcance a ver "no encontrado" por error).
  if (cargando) return null;

  // El proyecto pudo haber sido eliminado por un administrador después de
  // que el usuario guardó el link, o el id de la URL puede ser inválido.
  if (!proyecto) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <p>No encontramos ese proyecto. Puede que ya no esté disponible.</p>
        <Link to="/" style={{ color: '#ff922d', fontWeight: 'bold', textDecoration: 'none' }}>← Volver al inicio</Link>
      </div>
    );
  }

  const color = colorCategoria(proyecto.categoria);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <Link
        to="/"
        style={{ display: 'inline-block', marginBottom: '20px', color: 'var(--text)', textDecoration: 'none', fontSize: '14px' }}
      >
        ← Volver al inicio
      </Link>

      <span style={{ display: 'inline-block', background: color.fondo, color: color.texto, fontSize: '12px', padding: '3px 10px', borderRadius: '4px', marginBottom: '10px' }}>
        {proyecto.categoria}
      </span>

      <h1 style={{ margin: '0 0 12px' }}>{proyecto.nombre}</h1>

      <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 20px' }}>
        ${proyecto.precio.toLocaleString('es-CL')}
      </p>

      <p style={{ fontSize: '15px', color: 'var(--text-h)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {proyecto.descripcion}
      </p>

      <p style={{ fontSize: '13px', color: proyecto.disponible ? 'green' : '#d32f2f', fontWeight: 'bold', margin: '20px 0' }}>
        {proyecto.disponible ? 'Disponible' : 'No disponible actualmente'}
      </p>

      {/* La imagen va al final, debajo de toda la información */}
      <CarruselImagenes imagenes={proyecto.imagenes} alt={proyecto.nombre} altura="320px" />
    </div>
  );
}
