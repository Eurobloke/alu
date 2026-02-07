/**
 * AluminioRD Pro - API Layer
 * Comunicacion con Google Apps Script backend
 * 
 * IMPORTANTE: Cambiar GAS_URL por tu URL de Web App
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQF1r4stXRu8Y1x9W6vcRW6SZbZFas4LvKmRIUXtSo01Icq3X1urvBD1R78Dm5IPGR/exec';

const API = {
  async call(action, data = {}) {
    try {
      const url = GAS_URL + '?action=' + encodeURIComponent(action);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.error('API Error:', action, e);
      return { success: false, error: 'Error de conexion' };
    }
  },

  // Auth
  login(pinHash) { return this.call('login', { pin_hash: pinHash }); },

  // Clientes
  getClientes() { return this.call('getClientes'); },
  guardarCliente(data) { return this.call('guardarCliente', data); },
  eliminarCliente(id) { return this.call('eliminarCliente', { id }); },

  // Cotizaciones
  getCotizaciones() { return this.call('getCotizaciones'); },
  getCotizacion(id) { return this.call('getCotizacion', { id }); },
  guardarCotizacion(data) { return this.call('guardarCotizacion', data); },
  eliminarCotizacion(id) { return this.call('eliminarCotizacion', { id }); },
  actualizarEstado(id, estado) { return this.call('actualizarEstadoCotizacion', { id, estado }); },

  // Pagos
  getPagos(cotId) { return this.call('getPagos', { cotizacion_id: cotId }); },
  guardarPago(data) { return this.call('guardarPago', data); },

  // Eventos
  getEventos(fi, ff) { return this.call('getEventos', { fecha_inicio: fi, fecha_fin: ff }); },
  guardarEvento(data) { return this.call('guardarEvento', data); },

  // Stats
  getStats() { return this.call('getStats'); },

  // Galeria
  getGaleria() { return this.call('getGaleria'); },
  guardarFoto(data) { return this.call('guardarFoto', data); },

  // Config
  getConfig() { return this.call('getConfig'); },
  guardarConfig(data) { return this.call('guardarConfig', data); }
};
