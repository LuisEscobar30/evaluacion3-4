import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Proyecto, Noticia } from '../types/types';
import CarruselImagenes from '../components/CarruselImagenes';
import { colorCategoria } from '../utils/colorCategoria';

export default function Inicio() {
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  // Lee desde Firestore — no desde localStorage
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const snapProyectos = await getDocs(collection(db, 'proyectos'));
        const listaProyectos: Proyecto[] = snapProyectos.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proyecto));
        setProyectos(listaProyectos);

        const snapNoticias = await getDocs(collection(db, 'noticias'));
        const listaNoticias: Noticia[] = snapNoticias.docs.map(doc => ({ id: doc.id, ...doc.data() } as Noticia));
        setNoticias(listaNoticias);
      } catch (err) {
        console.error('Error al cargar datos en Inicio:', err);
      }
    };
    cargarDatos();
  }, []);

  // Solo se muestran los proyectos marcados como disponibles.
  const proyectosDisponibles = proyectos.filter(p => p.disponible);

  // Las noticias siempre se agregan al final del arreglo cuando se publican,
  // así que invertir el orden equivale a "la más nueva primero", sin tener
  // que convertir el texto de la fecha de vuelta a un objeto Date.
  const ultimasNoticias = [...noticias].reverse().slice(0, 5);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ margin: '0 0 10px', textAlign: 'center' }}>Bienvenido a OBE SPA</h1>
      <p style={{ maxWidth: '700px', margin: '20px auto 32px', textAlign: 'center', lineHeight: 1.6 }}>
        Bienvenido a la Intranet de OBE SPA, un espacio diseñado para centralizar la gestión de
        proyectos, cotizaciones y procesos internos de la empresa. Desde aquí podrás acceder a las
        herramientas, información y recursos necesarios para facilitar el trabajo colaborativo,
        optimizar la comunicación y mejorar la eficiencia en las operaciones diarias.
      </p>

      <h2 style={{ marginBottom: '14px' }}>Últimas noticias</h2>
      {ultimasNoticias.length === 0 ? (
        <p style={{ color: '#999', marginBottom: '30px' }}>Todavía no hay noticias publicadas.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '30px' }}>
          {ultimasNoticias.map(n => (
            <div
              key={n.id}
              onClick={() => navigate(`/noticias/${n.id}`)}
              style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px 16px', background: '#fff', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                <span>
                  {n.autor}
                  {n.proyectoRelacionado && ` · Proyecto relacionado: ${n.proyectoRelacionado}`}
                </span>
                <span>{n.fecha}</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 'bold' }}>{n.titulo}</p>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#555' }}>
                {n.contenido.length > 150 ? `${n.contenido.slice(0, 150)}...` : n.contenido}
              </p>

              {/* Las imágenes van debajo del contenido, con carrusel si hay más de una */}
              <CarruselImagenes imagenes={n.imagenes} alt={n.titulo} altura="160px" />
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginBottom: '14px' }}>Nuestros proyectos</h2>
      {proyectosDisponibles.length === 0 ? (
        <p style={{ color: '#999' }}>Todavía no hay proyectos disponibles para mostrar.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {proyectosDisponibles.map(p => {
            const color = colorCategoria(p.categoria);
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/proyectos/${p.id}`)}
                style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px 16px', background: '#fff', cursor: 'pointer' }}
              >
                <span style={{ display: 'inline-block', background: color.fondo, color: color.texto, fontSize: '11px', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                  {p.categoria}
                </span>
                <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 'bold' }}>{p.nombre}</p>
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#555' }}>{p.descripcion}</p>

                {/* Las imágenes van debajo de la descripción, con carrusel si hay más de una */}
                <CarruselImagenes imagenes={p.imagenes} alt={p.nombre} altura="140px" />

                <p style={{ margin: '12px 0 0', fontSize: '15px', fontWeight: 'bold' }}>${p.precio.toLocaleString('es-CL')}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
