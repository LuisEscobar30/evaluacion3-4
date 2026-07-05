import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Proyecto } from '../types/types';

export default function GestionProyectos() {
  // --- 1. ESTADOS ---
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenUrl, setImagenUrl] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroDisponible, setFiltroDisponible] = useState('Todos');
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // --- 2. EFECTO: Cargar desde Firestore al abrir ---
  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = async () => {
    try {
      setCargando(true);
      // getDocs trae TODOS los documentos de la colección 'proyectos' en Firestore
      const snapshot = await getDocs(collection(db, 'proyectos'));
      const lista: Proyecto[] = snapshot.docs.map(doc => ({
        id: doc.id,           // el id lo asigna Firestore automáticamente
        ...doc.data()         // el resto de campos vienen del documento
      } as Proyecto));
      setProyectos(lista);
    } catch (err) {
      setError('Error al cargar los proyectos.');
    } finally {
      setCargando(false);
    }
  };

  // --- 3. MANEJO DE IMÁGENES ---
  const agregarImagen = () => {
    const url = imagenUrl.trim();
    if (!url) return;
    setImagenes([...imagenes, url]);
    setImagenUrl('');
  };

  const quitarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const agregarImagenDesdeArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (archivo.size > 2 * 1024 * 1024) {
      setError('La imagen es muy pesada (máximo 2MB).');
      e.target.value = '';
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result === 'string') {
        setImagenes(prev => [...prev, lector.result as string]);
      }
    };
    lector.readAsDataURL(archivo);
    e.target.value = '';
  };

  // --- 4. CREAR O ACTUALIZAR ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nom = nombre.trim();
    const desc = descripcion.trim();
    const cat = categoria.trim();
    const precioNumerico = parseFloat(precio);

    if (!nom || !desc || !cat) { setError('Nombre, descripción y categoría son obligatorios.'); return; }
    if (nom.length < 3) { setError('El nombre debe tener al menos 3 caracteres.'); return; }
    if (precio.trim() === '' || isNaN(precioNumerico) || precioNumerico <= 0) { setError('El precio debe ser un número mayor a 0.'); return; }

    try {
      if (idEditando) {
        // updateDoc actualiza SOLO los campos que le pasas en el documento que tiene ese id
        await updateDoc(doc(db, 'proyectos', idEditando), {
          nombre: nom, descripcion: desc, precio: precioNumerico, categoria: cat, imagenes
        });
        setIdEditando(null);
      } else {
        // addDoc crea un documento nuevo en la colección y Firestore le asigna un id solo
        await addDoc(collection(db, 'proyectos'), {
          nombre: nom, descripcion: desc, precio: precioNumerico,
          imagenes, categoria: cat, disponible: true
        });
      }
      await cargarProyectos(); // vuelve a leer desde Firestore para tener todo actualizado
      setNombre(''); setDescripcion(''); setPrecio(''); setCategoria(''); setImagenes([]); setImagenUrl('');
    } catch (err) {
      setError('Error al guardar el proyecto.');
    }
  };

  // --- 5. EDITAR ---
  const editarProyecto = (p: Proyecto) => {
    setIdEditando(p.id);
    setNombre(p.nombre); setDescripcion(p.descripcion);
    setPrecio(String(p.precio)); setCategoria(p.categoria); setImagenes(p.imagenes); setError('');
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setNombre(''); setDescripcion(''); setPrecio(''); setCategoria(''); setImagenes([]); setImagenUrl(''); setError('');
  };

  // --- 6. ACTIVAR / DESACTIVAR ---
  const alternarDisponibilidad = async (p: Proyecto) => {
    try {
      // updateDoc con un solo campo: solo cambia "disponible", no toca lo demás
      await updateDoc(doc(db, 'proyectos', p.id), { disponible: !p.disponible });
      await cargarProyectos();
    } catch (err) {
      setError('Error al actualizar disponibilidad.');
    }
  };

  // --- 7. ELIMINAR ---
  const eliminarProyecto = async (id: string) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este proyecto permanentemente?');
    if (confirmar) {
      try {
        // deleteDoc elimina el documento completo de Firestore
        await deleteDoc(doc(db, 'proyectos', id));
        await cargarProyectos();
        if (idEditando === id) cancelarEdicion();
      } catch (err) {
        setError('Error al eliminar el proyecto.');
      }
    }
  };

  // --- 8. FILTRADO ---
  const categoriasDisponibles = Array.from(new Set(proyectos.map(p => p.categoria)));
  const proyectosFiltrados = proyectos.filter(p => {
    const cumpleTexto = p.nombre.toLowerCase().includes(filtroTexto.toLowerCase());
    const cumpleCategoria = filtroCategoria === 'Todas' || p.categoria === filtroCategoria;
    const cumpleDisponible = filtroDisponible === 'Todos' ||
      (filtroDisponible === 'Sí' && p.disponible) ||
      (filtroDisponible === 'No' && !p.disponible);
    return cumpleTexto && cumpleCategoria && cumpleDisponible;
  });

  // --- RENDERIZADO ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Gestión de Proyectos</h2>

      <form noValidate onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px', maxWidth: '500px' }}>
        <h3>{idEditando ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
        {error && <p style={{ color: '#d32f2f', fontWeight: 'bold', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Nombre del proyecto" value={nombre} onChange={e => setNombre(e.target.value)} />
          <textarea placeholder="Descripción del proyecto" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="Categoría (ej: Residencial, Industrial)" value={categoria} onChange={e => setCategoria(e.target.value)} />
          <input type="number" placeholder="Precio (CLP)" value={precio} onChange={e => setPrecio(e.target.value)} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="URL de imagen (internet)" value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} style={{ flex: 1 }} />
            <button type="button" onClick={agregarImagen} style={{ padding: '8px 12px', cursor: 'pointer' }}>Agregar URL</button>
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '4px' }}>O sube una imagen desde tu computador:</label>
            <input type="file" accept="image/*" onChange={agregarImagenDesdeArchivo} />
          </div>
          {imagenes.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {imagenes.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt={`imagen ${i + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc', display: 'block' }} />
                  <button type="button" onClick={() => quitarImagen(i)} title="Quitar imagen" style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', lineHeight: '20px', padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <button type="submit" style={{ background: '#ff922d', color: '#000', padding: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>
            {idEditando ? 'Guardar Cambios' : 'Registrar Proyecto'}
          </button>
          {idEditando && (
            <button type="button" onClick={cancelarEdicion} style={{ padding: '8px', marginTop: '5px', background: '#ccc', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      <div style={{ background: '#e0e0e0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Filtrar:</strong>
        <input type="text" placeholder="Buscar por nombre..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '220px' }} />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
          <option value="Todas">Todas las Categorías</option>
          {categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filtroDisponible} onChange={e => setFiltroDisponible(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
          <option value="Todos">Todos</option>
          <option value="Sí">Disponibles</option>
          <option value="No">No disponibles</option>
        </select>
      </div>

      {cargando ? (
        <p>Cargando proyectos...</p>
      ) : (
        <table border={1} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#333', color: 'white' }}>
            <tr>
              <th style={{ padding: '10px' }}>Nombre</th>
              <th style={{ padding: '10px' }}>Categoría</th>
              <th style={{ padding: '10px' }}>Precio</th>
              <th style={{ padding: '10px' }}>Imágenes</th>
              <th style={{ padding: '10px' }}>Disponible</th>
              <th style={{ padding: '10px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectosFiltrados.map(p => (
              <tr key={p.id} style={{ opacity: p.disponible ? 1 : 0.5 }}>
                <td style={{ padding: '10px' }}>{p.nombre}</td>
                <td style={{ padding: '10px' }}>{p.categoria}</td>
                <td style={{ padding: '10px' }}>${p.precio.toLocaleString('es-CL')}</td>
                <td style={{ padding: '10px' }}>
                  {p.imagenes.length > 0 ? (
                    <span>
                      <img src={p.imagenes[0]} alt={p.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover', verticalAlign: 'middle', marginRight: '6px', borderRadius: '4px' }} onError={e => (e.currentTarget.style.display = 'none')} />
                      {p.imagenes.length > 1 ? `+${p.imagenes.length - 1} más` : ''}
                    </span>
                  ) : <span style={{ color: '#999' }}>Sin imagen</span>}
                </td>
                <td style={{ padding: '10px', color: p.disponible ? 'green' : '#d32f2f', fontWeight: 'bold' }}>
                  {p.disponible ? 'Sí' : 'No'}
                </td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => editarProyecto(p)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => alternarDisponibilidad(p)} style={{ marginRight: '5px', padding: '5px 10px', cursor: 'pointer', background: p.disponible ? '#ff9800' : '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}>
                    {p.disponible ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => eliminarProyecto(p.id)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {proyectosFiltrados.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron proyectos.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
