import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Proyecto } from '../types/types';
import CarruselImagenes from '../components/CarruselImagenes';
import { colorCategoria } from '../utils/colorCategoria';

export default function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        // getDoc trae UN solo documento por su id — más eficiente que traer todos
        const docRef = doc(db, 'proyectos', id!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProyecto({ id: docSnap.id, ...docSnap.data() } as Proyecto);
        } else {
          setProyecto(null);
        }
      } catch (err) {
        setProyecto(null);
      } finally {
        setCargando(false);
      }
    };
    cargar();
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
