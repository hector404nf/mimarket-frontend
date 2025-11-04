import { useState, useEffect, useCallback, useMemo } from 'react';
import { productosService, ProductoFilters, ProductoResponse } from '@/lib/api/productos';
import { Producto } from '@/lib/types/producto';

export function useProductos(filters: ProductoFilters = {}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // Memoizar los filtros para evitar re-renders innecesarios
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  const fetchProductos = useCallback(async (newFilters: ProductoFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productosService.getProductos({ ...memoizedFilters, ...newFilters });
      setProductos(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      console.error('Error fetching productos:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const refetch = useCallback((newFilters?: ProductoFilters) => {
    fetchProductos(newFilters);
  }, [fetchProductos]);

  return {
    productos,
    loading,
    error,
    pagination,
    refetch,
  };
}

export function useProducto(id: number) {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productosService.getProducto(id);
        setProducto(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar producto');
        console.error('Error fetching producto:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProducto();
    }
  }, [id]);

  return {
    producto,
    loading,
    error,
  };
}

export function useProductosByCategoria(categoriaId: number, filters: Omit<ProductoFilters, 'categoria'> = {}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const fetchProductos = async (newFilters: Omit<ProductoFilters, 'categoria'> = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productosService.getProductosByCategoria(categoriaId, { ...filters, ...newFilters });
      setProductos(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      console.error('Error fetching productos by categoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoriaId) {
      fetchProductos();
    }
  }, [categoriaId]);

  const refetch = (newFilters?: Omit<ProductoFilters, 'categoria'>) => {
    fetchProductos(newFilters);
  };

  return {
    productos,
    loading,
    error,
    pagination,
    refetch,
  };
}

export function useProductosByTienda(tiendaId: number, filters: Omit<ProductoFilters, 'tienda'> = {}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const fetchProductos = async (newFilters: Omit<ProductoFilters, 'tienda'> = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productosService.getProductosByTienda(tiendaId, { ...filters, ...newFilters });
      setProductos(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      console.error('Error fetching productos by tienda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tiendaId) {
      fetchProductos();
    }
  }, [tiendaId]);

  const refetch = (newFilters?: Omit<ProductoFilters, 'tienda'>) => {
    fetchProductos(newFilters);
  };

  return {
    productos,
    loading,
    error,
    pagination,
    refetch,
  };
}