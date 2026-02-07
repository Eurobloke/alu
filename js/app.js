/**
 * AluminioRD Pro - Main Application
 * SPA con routing por hash, auth con PIN, y modulos CRUD
 */

const API = {
  login: async (hash) => {
    // Simulated API response
    return { success: true, usuario: { nombre: 'John Doe', rol: 'Admin' } };
  },
  getStats: async () => {
    // Simulated API response
    return { success: true, data: { total_mes: 100000, cotizaciones_activas: 50, tasa_conversion: 80, m2_vendidos: 200, total_mes_cambio: 10, cotizaciones_cambio: 5 } };
  },
  getClientes: async () => {
    // Simulated API response
    return { success: true, data: [{ id: 1, nombre: 'Cliente 1', telefono: '1234567890', email: 'cliente1@example.com', cedula: '123456789', direccion: 'Direccion 1', ciudad: 'Ciudad 1', sector: 'Sector 1', tipo_persona: 'fisica', tipo_cliente: 'retail', notas: 'Notas 1' }] };
  },
  guardarCliente: async (data) => {
    // Simulated API response
    return { success: true };
  },
  eliminarCliente: async (id) => {
    // Simulated API response
    return { success: true };
  },
  getCotizaciones: async () => {
    // Simulated API response
    return { success: true, data: [{ id: 1, numero: 'COT-001', cliente: { id: 1, nombre: 'Cliente 1' }, proyecto: 'Proyecto 1', estado: 'borrador', total: 50000 }] };
  },
  guardarCotizacion: async (data) => {
    // Simulated API response
    return { success: true };
  },
  getPagos: async () => {
    // Simulated API response
    return { success: true, data: [{ id: 1, cotizacion_id: 1, monto: 50000, fecha: '2023-10-01', metodo: 'efectivo', referencia: 'REF-001', notas: 'Notas 1' }] };
  },
  guardarPago: async (data) => {
    // Simulated API response
    return { success: true };
  },
  getEventos: async (fi, ff) => {
    // Simulated API response
    return { success: true, data: [{ id: 1, titulo: 'Evento 1', tipo: 'medicion', fecha: '2023-10-01', hora_inicio: '09:00', hora_fin: '10:00', direccion: 'Direccion 1', notas: 'Notas 1' }] };
  },
  guardarEvento: async (data) => {
    // Simulated API response
    return { success: true };
  }
};

const PRODUCTOS = {
  ventana_corrediza_2h: {
    nombre: 'Ventana Corrediza 2h',
    sistemas: ['Serie 400'],
    vidrios: ['6mm templado']
  }
};

const COLORES_PERFIL = ['Blanco', 'Negro'];

const calcularElemento = (tipo, ancho, alto, sistema) => {
  return { m2: ancho * alto / 10000, totalMetros: 10, m2Vidrio: 5, cortes: [{ pieza: 'Perfil 1', long: 100, cant: 2, perfil: 'Perfil 1' }] };
};

const calcularPrecio = (tipo, calc, sistema, vidrio, cantidad) => {
  return { unitario: 1000, total: calc.m2 * cantidad * 1000, perfiles: 500, vidrios: 300, accesorios: 200 };
};

const calcularTotales = (elems, inst, desc) => {
  const subtotalMateriales = elems.reduce((s, e) => s + e.precio_total, 0);
  const instalacion = inst ? 10000 : 0;
  const baseImponible = subtotalMateriales + instalacion;
  const itbis = baseImponible * 0.18;
  const descuento = baseImponible * (desc / 100);
  const total = baseImponible - descuento + itbis;
  const totalM2 = elems.reduce((s, e) => s + e.m2, 0);
  return { subtotalMateriales, instalacion, descuento, baseImponible, itbis, total, totalM2 };
};

const formatMonto = (monto) => {
  return monto.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' }).replace('RD$', '');
};

const App = {
  user: null,
  currentModule: 'dashboard',
  data: { clientes:[], cotizaciones:[], pagos:[], eventos:[] },

  async init() {
    const session = localStorage.getItem('ard_session');
    if (session) {
      try {
        const s = JSON.parse(session);
        if (s.expiry > Date.now()) { this.user = s.usuario; }
        else { localStorage.removeItem('ard_session'); }
      } catch(e) { localStorage.removeItem('ard_session'); }
    }
    if (!this.user) { this.renderLogin(); return; }
    this.renderApp();
    this.navigate(location.hash.replace('#','') || 'dashboard');
    window.addEventListener('hashchange', () => this.navigate(location.hash.replace('#','')));
  },

  // ======== AUTH ========
  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-page">
        <div class="glass-card login-card text-center">
          <div class="sidebar-logo" style="font-size:1.75rem;margin-bottom:.5rem">AluminioRD Pro</div>
          <p class="text-muted mb-6">Ingrese su PIN de acceso</p>
          <div class="pin-input" id="pinContainer">
            <input type="password" maxlength="1" class="pin-digit" inputmode="numeric" data-i="0" autofocus>
            <input type="password" maxlength="1" class="pin-digit" inputmode="numeric" data-i="1">
            <input type="password" maxlength="1" class="pin-digit" inputmode="numeric" data-i="2">
            <input type="password" maxlength="1" class="pin-digit" inputmode="numeric" data-i="3">
          </div>
          <div id="loginError" class="text-red text-sm mb-4" style="display:none"></div>
          <button class="btn btn-gradient w-full" id="loginBtn" onclick="App.doLogin()">Ingresar</button>
        </div>
      </div>`;
    this.setupPinInputs();
  },

  setupPinInputs() {
    const digits = document.querySelectorAll('.pin-digit');
    digits.forEach((d,i) => {
      d.addEventListener('input', () => {
        if (d.value && i < 3) digits[i+1].focus();
        if (i === 3 && d.value) this.doLogin();
      });
      d.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !d.value && i > 0) digits[i-1].focus();
      });
    });
  },

  async doLogin() {
    const digits = document.querySelectorAll('.pin-digit');
    const pin = Array.from(digits).map(d => d.value).join('');
    if (pin.length !== 4) return;
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Verificando...'; btn.disabled = true;
    const hash = await this.sha256(pin);
    const res = await API.login(hash);
    if (res.success && res.usuario) {
      this.user = res.usuario;
      localStorage.setItem('ard_session', JSON.stringify({ usuario: res.usuario, expiry: Date.now() + 8*3600*1000 }));
      this.renderApp();
      this.navigate('dashboard');
    } else {
      document.getElementById('loginError').style.display = 'block';
      document.getElementById('loginError').textContent = res.error || 'PIN incorrecto';
      btn.textContent = 'Ingresar'; btn.disabled = false;
      digits.forEach(d => d.value = '');
      digits[0].focus();
    }
  },

  async sha256(msg) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  },

  logout() {
    this.user = null;
    localStorage.removeItem('ard_session');
    this.renderLogin();
  },

  // ======== APP SHELL ========
  renderApp() {
    const nav = [
      {id:'dashboard',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',label:'Dashboard'},
      {id:'cotizaciones',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',label:'Cotizaciones'},
      {id:'clientes',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',label:'Clientes'},
      {id:'pagos',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',label:'Pagos'},
      {id:'calendario',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',label:'Calendario'},
      {id:'calculadora',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>',label:'Calculadora'}
    ];
    document.getElementById('app').innerHTML = `
      <div class="app">
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="App.toggleSidebar()"></div>
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">AluminioRD Pro</div>
            <div class="sidebar-sub">Sistema de Cotizaciones</div>
          </div>
          <nav class="sidebar-nav">
            ${nav.map(n => `<button class="nav-item" data-module="${n.id}" onclick="App.navigate('${n.id}')">${n.icon}<span>${n.label}</span></button>`).join('')}
          </nav>
          <div class="sidebar-footer">
            <div class="user-info">
              <div class="user-avatar">${(this.user.nombre||'A').charAt(0)}</div>
              <div><div class="user-name">${this.user.nombre}</div><div class="user-role">${this.user.rol}</div></div>
            </div>
            <button class="btn btn-ghost btn-sm w-full mt-3" onclick="App.logout()">Cerrar Sesion</button>
          </div>
        </aside>
        <main class="main">
          <div class="mobile-header">
            <div class="mobile-header-content">
              <button class="hamburger" onclick="App.toggleSidebar()"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
              <div class="sidebar-logo">AluminioRD Pro</div>
              <div style="width:40px"></div>
            </div>
          </div>
          <div class="content" id="moduleContent"><div class="text-center p-6"><div class="spinner" style="margin:0 auto"></div></div></div>
        </main>
      </div>`;
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  },

  navigate(module) {
    if (!module) module = 'dashboard';
    this.currentModule = module;
    location.hash = module;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.module === module));
    document.getElementById('moduleContent').innerHTML = '<div class="text-center p-6"><div class="spinner" style="margin:0 auto"></div></div>';
    if (window.innerWidth < 768) { document.getElementById('sidebar').classList.remove('show'); document.getElementById('sidebarOverlay').classList.remove('active'); }
    switch(module) {
      case 'dashboard': Modules.dashboard(); break;
      case 'cotizaciones': Modules.cotizaciones(); break;
      case 'clientes': Modules.clientes(); break;
      case 'pagos': Modules.pagos(); break;
      case 'calendario': Modules.calendario(); break;
      case 'calculadora': Modules.calculadora(); break;
      default: Modules.dashboard();
    }
  },

  toast(msg, type='success') {
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
};

// ======== MODULES ========
const Modules = {

  // ---- DASHBOARD ----
  async dashboard() {
    const el = document.getElementById('moduleContent');
    const res = await API.getStats();
    const s = res.success && res.data ? res.data : { total_mes:0, cotizaciones_activas:0, tasa_conversion:0, m2_vendidos:0, total_mes_cambio:0, cotizaciones_cambio:0 };
    el.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
      <div class="stats-grid mb-6">
        <div class="glass-card stat-card">
          <div class="text-dim text-sm">Ventas del Mes</div>
          <div class="stat-value text-green">RD$${formatMonto(s.total_mes)}</div>
          <div class="stat-change ${s.total_mes_cambio>=0?'positive':'negative'}">${s.total_mes_cambio>=0?'+':''}${s.total_mes_cambio}% vs mes anterior</div>
        </div>
        <div class="glass-card stat-card">
          <div class="text-dim text-sm">Cotizaciones Activas</div>
          <div class="stat-value text-blue">${s.cotizaciones_activas}</div>
          <div class="stat-change ${s.cotizaciones_cambio>=0?'positive':'negative'}">${s.cotizaciones_cambio>=0?'+':''}${s.cotizaciones_cambio} este mes</div>
        </div>
        <div class="glass-card stat-card">
          <div class="text-dim text-sm">Tasa Conversion</div>
          <div class="stat-value text-orange">${s.tasa_conversion}%</div>
          <div class="stat-label">Cotizaciones aprobadas</div>
        </div>
        <div class="glass-card stat-card">
          <div class="text-dim text-sm">M2 Vendidos</div>
          <div class="stat-value">${s.m2_vendidos}</div>
          <div class="stat-label">Este mes</div>
        </div>
      </div>
      <div class="flex gap-3 flex-wrap">
        <button class="btn btn-gradient" onclick="App.navigate('cotizaciones')">Nueva Cotizacion</button>
        <button class="btn btn-ghost" onclick="App.navigate('clientes')">Ver Clientes</button>
      </div>`;
  },

  // ---- CLIENTES ----
  async clientes() {
    const el = document.getElementById('moduleContent');
    const res = await API.getClientes();
    App.data.clientes = res.success && res.data ? res.data : [];
    this._renderClientes(el);
  },

  _renderClientes(el) {
    const cls = App.data.clientes;
    el.innerHTML = `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 class="text-2xl font-bold">Clientes</h1><p class="text-muted">${cls.length} clientes registrados</p></div>
        <button class="btn btn-gradient" onclick="Modules.showClienteForm()">+ Nuevo Cliente</button>
      </div>
      <div class="relative mb-4">
        <input type="text" class="input-dark" placeholder="Buscar por nombre, telefono..." id="clienteSearch" oninput="Modules.filterClientes()">
      </div>
      <div id="clientesList" class="space-y-3">${this._clienteCards(cls)}</div>`;
  },

  _clienteCards(cls) {
    if (!cls.length) return '<div class="glass-card text-center p-6"><p class="text-muted">No hay clientes</p></div>';
    return cls.map(c => `
      <div class="glass-card" style="cursor:pointer">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="avatar">${c.nombre.charAt(0).toUpperCase()}</div>
            <div>
              <div class="font-semibold">${c.nombre}</div>
              <div class="text-sm text-muted">${c.telefono}${c.email?' &middot; '+c.email:''}</div>
              ${c.direccion?'<div class="text-xs text-dim mt-1">'+c.direccion+'</div>':''}
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" onclick="Modules.showClienteForm('${c.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="Modules.deleteCliente('${c.id}')">Eliminar</button>
          </div>
        </div>
      </div>`).join('');
  },

  filterClientes() {
    const q = document.getElementById('clienteSearch').value.toLowerCase();
    const f = App.data.clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q) || (c.email||'').toLowerCase().includes(q));
    document.getElementById('clientesList').innerHTML = this._clienteCards(f);
  },

  showClienteForm(id) {
    const c = id ? App.data.clientes.find(x => x.id === id) : null;
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">${c?'Editar':'Nuevo'} Cliente</div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&#x2715;</button>
          </div>
          <form id="clienteForm" onsubmit="Modules.saveCliente(event,'${id||''}')">
            ${id?'<input type="hidden" name="id" value="'+id+'">':''}
            <div class="form-group"><label class="form-label">Tipo Persona</label><select name="tipo_persona" class="input-dark"><option value="fisica" ${c&&c.tipo_persona==='fisica'?'selected':''}>Persona Fisica</option><option value="juridica" ${c&&c.tipo_persona==='juridica'?'selected':''}>Empresa</option></select></div>
            <div class="form-group"><label class="form-label">Nombre *</label><input name="nombre" class="input-dark" value="${c?c.nombre:''}" required></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Telefono *</label><input name="telefono" class="input-dark" value="${c?c.telefono:''}" required></div>
              <div class="form-group"><label class="form-label">Email</label><input name="email" type="email" class="input-dark" value="${c?c.email||'':''}"></div>
            </div>
            <div class="form-group"><label class="form-label">Cedula/RNC</label><input name="cedula" class="input-dark" value="${c?c.cedula||'':''}"></div>
            <div class="form-group"><label class="form-label">Direccion</label><textarea name="direccion" class="input-dark">${c?c.direccion||'':''}</textarea></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Ciudad</label><input name="ciudad" class="input-dark" value="${c?c.ciudad||'Santo Domingo':'Santo Domingo'}"></div>
              <div class="form-group"><label class="form-label">Sector</label><input name="sector" class="input-dark" value="${c?c.sector||'':''}"></div>
            </div>
            <div class="form-group"><label class="form-label">Tipo Cliente</label><select name="tipo_cliente" class="input-dark"><option value="retail" ${c&&c.tipo_cliente==='retail'?'selected':''}>Retail</option><option value="constructor" ${c&&c.tipo_cliente==='constructor'?'selected':''}>Constructor</option><option value="mayorista" ${c&&c.tipo_cliente==='mayorista'?'selected':''}>Mayorista</option></select></div>
            <div class="form-group"><label class="form-label">Notas</label><textarea name="notas" class="input-dark">${c?c.notas||'':''}</textarea></div>
            <div class="form-actions"><button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn btn-gradient">${c?'Guardar':'Crear'}</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async saveCliente(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    if (id) data.id = id;
    const btn = e.target.querySelector('[type=submit]');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    const res = await API.guardarCliente(data);
    if (res.success) {
      App.toast('Cliente guardado');
      document.querySelector('.modal-overlay').remove();
      Modules.clientes();
    } else {
      App.toast(res.error || 'Error al guardar', 'error');
      btn.textContent = id?'Guardar':'Crear'; btn.disabled = false;
    }
  },

  async deleteCliente(id) {
    if (!confirm('Eliminar este cliente?')) return;
    const res = await API.eliminarCliente(id);
    if (res.success) { App.toast('Cliente eliminado'); Modules.clientes(); }
    else App.toast(res.error || 'Error', 'error');
  },

  // ---- COTIZACIONES ----
  async cotizaciones() {
    const el = document.getElementById('moduleContent');
    const [cotRes, cliRes] = await Promise.all([API.getCotizaciones(), API.getClientes()]);
    App.data.cotizaciones = cotRes.success && cotRes.data ? cotRes.data : [];
    App.data.clientes = cliRes.success && cliRes.data ? cliRes.data : [];
    this._renderCotizaciones(el);
  },

  _renderCotizaciones(el) {
    const cots = App.data.cotizaciones;
    const badges = {borrador:'borrador',enviada:'enviada',aprobada:'aprobada',produccion:'produccion',vencida:'vencida',rechazada:'vencida',completada:'aprobada',cancelada:'vencida',negociando:'pendiente',instalacion:'enviada',vista:'produccion'};
    el.innerHTML = `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 class="text-2xl font-bold">Cotizaciones</h1><p class="text-muted">${cots.length} cotizaciones</p></div>
        <button class="btn btn-gradient" onclick="Modules.showCotizacionForm()">+ Nueva Cotizacion</button>
      </div>
      <div class="mb-4"><input type="text" class="input-dark" placeholder="Buscar..." id="cotSearch" oninput="Modules.filterCots()"></div>
      <div id="cotsList" class="space-y-3">
        ${cots.length?cots.map(c => `
          <div class="glass-card card-${badges[c.estado]||'borrador'}">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2"><span class="font-bold">${c.numero||'Sin num.'}</span><span class="badge badge-${badges[c.estado]||'borrador'}">${c.estado}</span></div>
                <div class="text-sm text-muted mt-1">${c.cliente?c.cliente.nombre:'Sin cliente'} &middot; ${c.proyecto||'Sin proyecto'}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-lg">RD$${formatMonto(parseFloat(c.total)||0)}</div>
                <div class="text-xs text-dim">${c.fecha?new Date(c.fecha).toLocaleDateString('es-DO'):''}</div>
              </div>
            </div>
          </div>`).join(''):'<div class="glass-card text-center p-6"><p class="text-muted">No hay cotizaciones</p></div>'}
      </div>`;
  },

  filterCots() {
    const q = document.getElementById('cotSearch').value.toLowerCase();
    const f = App.data.cotizaciones.filter(c => (c.numero||'').toLowerCase().includes(q) || (c.cliente&&c.cliente.nombre||'').toLowerCase().includes(q) || (c.proyecto||'').toLowerCase().includes(q));
    const badges = {borrador:'borrador',enviada:'enviada',aprobada:'aprobada',produccion:'produccion',vencida:'vencida',rechazada:'vencida',completada:'aprobada',cancelada:'vencida',negociando:'pendiente',instalacion:'enviada',vista:'produccion'};
    document.getElementById('cotsList').innerHTML = f.map(c => `
      <div class="glass-card card-${badges[c.estado]||'borrador'}">
        <div class="flex items-center justify-between">
          <div><div class="flex items-center gap-2"><span class="font-bold">${c.numero||'Sin num.'}</span><span class="badge badge-${badges[c.estado]||'borrador'}">${c.estado}</span></div><div class="text-sm text-muted mt-1">${c.cliente?c.cliente.nombre:'Sin cliente'} &middot; ${c.proyecto||''}</div></div>
          <div class="text-right"><div class="font-bold text-lg">RD$${formatMonto(parseFloat(c.total)||0)}</div></div>
        </div>
      </div>`).join('');
  },

  showCotizacionForm() {
    const cls = App.data.clientes;
    const tipos = Object.entries(PRODUCTOS);
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
        <div class="modal modal-lg">
          <div class="modal-header"><div class="modal-title">Nueva Cotizacion</div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&#x2715;</button></div>
          <form id="cotForm" onsubmit="Modules.saveCotizacion(event)">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Cliente *</label><select name="cliente_id" class="input-dark" required><option value="">Seleccionar...</option>${cls.map(c=>'<option value="'+c.id+'">'+c.nombre+'</option>').join('')}</select></div>
              <div class="form-group"><label class="form-label">Proyecto</label><input name="proyecto" class="input-dark" placeholder="Ej: Residencia Perez"></div>
            </div>
            <hr style="border-color:rgba(255,255,255,0.1);margin:1rem 0">
            <h3 class="font-semibold mb-3">Elementos</h3>
            <div id="cotElementos" class="space-y-3"></div>
            <button type="button" class="btn btn-ghost btn-sm mt-3" onclick="Modules.addCotElemento()">+ Agregar Elemento</button>
            <hr style="border-color:rgba(255,255,255,0.1);margin:1rem 0">
            <div class="form-row">
              <div class="form-group"><label class="form-label flex items-center gap-2"><input type="checkbox" name="instalacion" checked> Incluir Instalacion</label></div>
              <div class="form-group"><label class="form-label">Descuento %</label><input name="descuento" type="number" min="0" max="20" value="0" class="input-dark"></div>
            </div>
            <div id="cotTotales" class="glass-card-static p-4 mt-4 mb-4"></div>
            <div class="form-actions"><button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn btn-gradient">Guardar Cotizacion</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    this._cotElementos = [];
    this.addCotElemento();
  },

  _cotElementos: [],

  addCotElemento() {
    const i = this._cotElementos.length;
    this._cotElementos.push({ tipo:'ventana_corrediza_2h', ancho:150, alto:120, cantidad:1, sistema:'Serie 400', color:'Blanco', vidrio:'6mm templado' });
    this._renderCotElementos();
  },

  removeCotElemento(i) {
    this._cotElementos.splice(i, 1);
    this._renderCotElementos();
  },

  _renderCotElementos() {
    const container = document.getElementById('cotElementos');
    if (!container) return;
    container.innerHTML = this._cotElementos.map((e,i) => {
      const prod = PRODUCTOS[e.tipo];
      return `
        <div class="glass-card-static p-4">
          <div class="flex items-center justify-between mb-3"><span class="font-semibold text-sm">Elemento ${i+1}</span><button type="button" class="btn btn-danger btn-sm" onclick="Modules.removeCotElemento(${i})">&times;</button></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Tipo</label><select class="input-dark" onchange="Modules._cotElementos[${i}].tipo=this.value;Modules._updateCotElemento(${i})">${Object.entries(PRODUCTOS).map(([k,v])=>'<option value="'+k+'" '+(e.tipo===k?'selected':'')+'>'+v.nombre+'</option>').join('')}</select></div>
            <div class="form-group"><label class="form-label">Sistema</label><select class="input-dark" onchange="Modules._cotElementos[${i}].sistema=this.value;Modules._updateCotTotales()">${(prod?prod.sistemas:['Serie 400']).map(s=>'<option '+(e.sistema===s?'selected':'')+'>'+s+'</option>').join('')}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Ancho (cm)</label><input type="number" class="input-dark" value="${e.ancho}" onchange="Modules._cotElementos[${i}].ancho=+this.value;Modules._updateCotTotales()"></div>
            <div class="form-group"><label class="form-label">Alto (cm)</label><input type="number" class="input-dark" value="${e.alto}" onchange="Modules._cotElementos[${i}].alto=+this.value;Modules._updateCotTotales()"></div>
            <div class="form-group"><label class="form-label">Cant.</label><input type="number" class="input-dark" value="${e.cantidad}" min="1" onchange="Modules._cotElementos[${i}].cantidad=+this.value;Modules._updateCotTotales()"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Color</label><select class="input-dark" onchange="Modules._cotElementos[${i}].color=this.value">${COLORES_PERFIL.map(c=>'<option '+(e.color===c?'selected':'')+'>'+c+'</option>').join('')}</select></div>
            <div class="form-group"><label class="form-label">Vidrio</label><select class="input-dark" onchange="Modules._cotElementos[${i}].vidrio=this.value;Modules._updateCotTotales()">${(prod?prod.vidrios:['6mm templado']).map(v=>'<option '+(e.vidrio===v?'selected':'')+'>'+v+'</option>').join('')}</select></div>
          </div>
        </div>`;
    }).join('');
    this._updateCotTotales();
  },

  _updateCotElemento(i) {
    var e = this._cotElementos[i];
    var prod = PRODUCTOS[e.tipo];
    if (prod) {
      e.sistema = prod.sistemas[0];
      e.vidrio = prod.vidrios[0] || '6mm templado';
    }
    this._renderCotElementos();
  },

  _updateCotTotales() {
    const elems = this._cotElementos.map(e => {
      var calc = calcularElemento(e.tipo, e.ancho, e.alto, e.sistema);
      var precio = calcularPrecio(e.tipo, calc, e.sistema, e.vidrio, e.cantidad);
      return { ...e, calculo: calc, precio_unitario: precio.unitario, precio_total: precio.total, m2: calc.m2 * e.cantidad };
    });
    const form = document.getElementById('cotForm');
    if (!form) return;
    const inst = form.querySelector('[name=instalacion]').checked;
    const desc = +form.querySelector('[name=descuento]').value || 0;
    const t = calcularTotales(elems, inst, desc);
    const el = document.getElementById('cotTotales');
    if (el) el.innerHTML = `
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-muted">Subtotal Materiales</span><span>RD$${formatMonto(t.subtotalMateriales)}</span></div>
        ${inst?'<div class="flex justify-between"><span class="text-muted">Instalacion</span><span>RD$'+formatMonto(t.instalacion)+'</span></div>':''}
        ${desc>0?'<div class="flex justify-between"><span class="text-muted">Descuento ('+desc+'%)</span><span class="text-red">-RD$'+formatMonto(t.descuento)+'</span></div>':''}
        <div class="flex justify-between"><span class="text-muted">Base Imponible</span><span>RD$${formatMonto(t.baseImponible)}</span></div>
        <div class="flex justify-between"><span class="text-muted">ITBIS (18%)</span><span>RD$${formatMonto(t.itbis)}</span></div>
        <div class="flex justify-between border-t pt-2 mt-2"><span class="font-bold text-lg">TOTAL</span><span class="font-bold text-lg text-green">RD$${formatMonto(t.total)}</span></div>
        <div class="text-xs text-dim text-right">${t.totalM2.toFixed(2)} m2 totales</div>
      </div>`;
    this._cotComputedElements = elems;
    this._cotComputedTotals = t;
  },

  async saveCotizacion(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const btn = ev.target.querySelector('[type=submit]');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    const t = this._cotComputedTotals || {};
    const data = {
      cliente_id: fd.get('cliente_id'),
      proyecto: fd.get('proyecto') || '',
      fecha: new Date().toISOString().split('T')[0],
      fecha_validez: new Date(Date.now()+15*86400000).toISOString().split('T')[0],
      estado: 'borrador',
      subtotal_materiales: t.subtotalMateriales||0,
      instalacion_incluida: fd.get('instalacion') === 'on',
      instalacion: t.instalacion||0,
      subtotal_general: t.subtotalGeneral||0,
      descuento_porcentaje: +fd.get('descuento')||0,
      descuento: t.descuento||0,
      base_imponible: t.baseImponible||0,
      itbis: t.itbis||0,
      total: t.total||0,
      total_m2: t.totalM2||0,
      validez_dias: 15,
      vendedor: App.user.nombre,
      vendedor_id: App.user.id,
      elementos: (this._cotComputedElements||[]).map(e => ({
        tipo_producto: e.tipo,
        descripcion: (PRODUCTOS[e.tipo]||{}).nombre||e.tipo,
        ancho: e.ancho, alto: e.alto, cantidad: e.cantidad,
        precio_unitario: e.precio_unitario, total: e.precio_total,
        color: e.color, vidrio: e.vidrio,
        detalles: e.calculo
      }))
    };
    const res = await API.guardarCotizacion(data);
    if (res.success) { App.toast('Cotizacion guardada'); document.querySelector('.modal-overlay').remove(); Modules.cotizaciones(); }
    else { App.toast(res.error||'Error','error'); btn.textContent='Guardar Cotizacion'; btn.disabled=false; }
  },

  // ---- PAGOS ----
  async pagos() {
    const el = document.getElementById('moduleContent');
    const [pRes, cRes] = await Promise.all([API.getPagos(), API.getCotizaciones()]);
    App.data.pagos = pRes.success && pRes.data ? pRes.data : [];
    App.data.cotizaciones = cRes.success && cRes.data ? cRes.data : [];
    const pagos = App.data.pagos;
    const total = pagos.reduce((s,p) => s+(parseFloat(p.monto)||0), 0);
    el.innerHTML = `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 class="text-2xl font-bold">Pagos</h1><p class="text-muted">Total recibido: <span class="text-green font-bold">RD$${formatMonto(total)}</span></p></div>
        <button class="btn btn-gradient" onclick="Modules.showPagoForm()">+ Registrar Pago</button>
      </div>
      <div class="space-y-3">
        ${pagos.length?pagos.map(p => {
          const cot = App.data.cotizaciones.find(c=>c.id===p.cotizacion_id);
          const metodo = p.metodo||p.tipo_pago||'efectivo';
          const colors = {efectivo:'text-green',transferencia:'text-blue',cheque:'text-orange',tarjeta:'text-purple'};
          return `<div class="glass-card"><div class="flex items-center justify-between"><div><div class="font-bold ${colors[metodo]||''}">RD$${formatMonto(parseFloat(p.monto)||0)}</div><div class="text-sm text-muted">${cot?cot.numero:'N/A'} &middot; ${cot&&cot.cliente?cot.cliente.nombre:''}</div><div class="text-xs text-dim">${p.fecha||''} &middot; ${metodo}</div></div><div class="badge badge-aprobada">${metodo}</div></div></div>`;
        }).join(''):'<div class="glass-card text-center p-6"><p class="text-muted">No hay pagos registrados</p></div>'}
      </div>`;
  },

  showPagoForm() {
    const cots = App.data.cotizaciones;
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
        <div class="modal">
          <div class="modal-header"><div class="modal-title">Registrar Pago</div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&#x2715;</button></div>
          <form id="pagoForm" onsubmit="Modules.savePago(event)">
            <div class="form-group"><label class="form-label">Cotizacion *</label><select name="cotizacion_id" class="input-dark" required><option value="">Seleccionar...</option>${cots.map(c=>'<option value="'+c.id+'">'+(c.numero||'Sin num.')+' - '+(c.cliente?c.cliente.nombre:'')+'</option>').join('')}</select></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Monto *</label><input name="monto" type="number" step="0.01" class="input-dark" required></div>
              <div class="form-group"><label class="form-label">Fecha *</label><input name="fecha" type="date" class="input-dark" value="${new Date().toISOString().split('T')[0]}" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Metodo</label><select name="metodo" class="input-dark"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="cheque">Cheque</option><option value="tarjeta">Tarjeta</option></select></div>
              <div class="form-group"><label class="form-label">Referencia</label><input name="referencia" class="input-dark"></div>
            </div>
            <div class="form-group"><label class="form-label">Notas</label><textarea name="notas" class="input-dark"></textarea></div>
            <div class="form-actions"><button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn btn-gradient">Registrar</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async savePago(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const btn = ev.target.querySelector('[type=submit]');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    const res = await API.guardarPago(Object.fromEntries(fd));
    if (res.success) { App.toast('Pago registrado'); document.querySelector('.modal-overlay').remove(); Modules.pagos(); }
    else { App.toast(res.error||'Error','error'); btn.textContent='Registrar'; btn.disabled=false; }
  },

  // ---- CALENDARIO ----
  async calendario() {
    const el = document.getElementById('moduleContent');
    const now = new Date();
    const fi = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const ff = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString();
    const res = await API.getEventos(fi, ff);
    const eventos = res.success && res.data ? res.data : [];
    const tipos = {medicion:{label:'Medicion',color:'blue'},instalacion:{label:'Instalacion',color:'green'},entrega:{label:'Entrega',color:'orange'},revision:{label:'Revision',color:'purple'},otro:{label:'Otro',color:'dim'}};
    el.innerHTML = `
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 class="text-2xl font-bold">Calendario</h1><p class="text-muted">${now.toLocaleDateString('es-DO',{month:'long',year:'numeric'})}</p></div>
        <button class="btn btn-gradient" onclick="Modules.showEventoForm()">+ Nuevo Evento</button>
      </div>
      <div class="space-y-3">
        ${eventos.length?eventos.map(e => {
          const t = tipos[e.tipo]||tipos.otro;
          return `<div class="glass-card"><div class="flex items-center justify-between"><div><div class="font-semibold">${e.titulo||e.tipo}</div><div class="text-sm text-muted">${e.fecha?new Date(e.fecha).toLocaleDateString('es-DO'):''} ${e.hora_inicio||''} ${e.hora_fin?'- '+e.hora_fin:''}</div>${e.direccion?'<div class="text-xs text-dim">'+e.direccion+'</div>':''}</div><span class="badge badge-${t.color==='blue'?'enviada':t.color==='green'?'aprobada':t.color==='orange'?'pendiente':'produccion'}">${t.label}</span></div></div>`;
        }).join(''):'<div class="glass-card text-center p-6"><p class="text-muted">No hay eventos este mes</p></div>'}
      </div>`;
  },

  showEventoForm() {
    const html = `
      <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
        <div class="modal">
          <div class="modal-header"><div class="modal-title">Nuevo Evento</div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&#x2715;</button></div>
          <form id="eventoForm" onsubmit="Modules.saveEvento(event)">
            <div class="form-group"><label class="form-label">Titulo *</label><input name="titulo" class="input-dark" required></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Tipo</label><select name="tipo" class="input-dark"><option value="medicion">Medicion</option><option value="instalacion">Instalacion</option><option value="entrega">Entrega</option><option value="revision">Revision</option><option value="otro">Otro</option></select></div>
              <div class="form-group"><label class="form-label">Fecha *</label><input name="fecha" type="date" class="input-dark" value="${new Date().toISOString().split('T')[0]}" required></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Hora Inicio</label><input name="hora_inicio" type="time" class="input-dark"></div>
              <div class="form-group"><label class="form-label">Hora Fin</label><input name="hora_fin" type="time" class="input-dark"></div>
            </div>
            <div class="form-group"><label class="form-label">Direccion</label><input name="direccion" class="input-dark"></div>
            <div class="form-group"><label class="form-label">Notas</label><textarea name="notas" class="input-dark"></textarea></div>
            <div class="form-actions"><button type="button" class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button><button type="submit" class="btn btn-gradient">Crear Evento</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  async saveEvento(ev) {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const btn = ev.target.querySelector('[type=submit]');
    btn.textContent = 'Guardando...'; btn.disabled = true;
    const res = await API.guardarEvento(Object.fromEntries(fd));
    if (res.success) { App.toast('Evento creado'); document.querySelector('.modal-overlay').remove(); Modules.calendario(); }
    else { App.toast(res.error||'Error','error'); btn.textContent='Crear Evento'; btn.disabled=false; }
  },

  // ---- CALCULADORA ----
  calculadora() {
    const el = document.getElementById('moduleContent');
    el.innerHTML = `
      <h1 class="text-2xl font-bold mb-6">Calculadora</h1>
      <div class="glass-card">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Tipo</label><select class="input-dark" id="calcTipo" onchange="Modules._updateCalc()">${Object.entries(PRODUCTOS).map(([k,v])=>'<option value="'+k+'">'+v.nombre+'</option>').join('')}</select></div>
          <div class="form-group"><label class="form-label">Sistema</label><select class="input-dark" id="calcSistema" onchange="Modules._updateCalc()"><option>Serie 400</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Ancho (cm)</label><input type="number" class="input-dark" id="calcAncho" value="150" onchange="Modules._updateCalc()"></div>
          <div class="form-group"><label class="form-label">Alto (cm)</label><input type="number" class="input-dark" id="calcAlto" value="120" onchange="Modules._updateCalc()"></div>
          <div class="form-group"><label class="form-label">Cantidad</label><input type="number" class="input-dark" id="calcCant" value="1" min="1" onchange="Modules._updateCalc()"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Color</label><select class="input-dark" id="calcColor">${COLORES_PERFIL.map(c=>'<option>'+c+'</option>').join('')}</select></div>
          <div class="form-group"><label class="form-label">Vidrio</label><select class="input-dark" id="calcVidrio" onchange="Modules._updateCalc()"><option>6mm templado</option></select></div>
        </div>
      </div>
      <div id="calcResultado" class="mt-4"></div>`;
    this._updateCalcSelects();
    this._updateCalc();
  },

  _updateCalcSelects() {
    const tipo = document.getElementById('calcTipo').value;
    const prod = PRODUCTOS[tipo];
    if (!prod) return;
    document.getElementById('calcSistema').innerHTML = prod.sistemas.map(s=>'<option>'+s+'</option>').join('');
    document.getElementById('calcVidrio').innerHTML = prod.vidrios.map(v=>'<option>'+v+'</option>').join('');
  },

  _updateCalc() {
    this._updateCalcSelects();
    const tipo = document.getElementById('calcTipo').value;
    const sis = document.getElementById('calcSistema').value;
    const ancho = +document.getElementById('calcAncho').value;
    const alto = +document.getElementById('calcAlto').value;
    const cant = +document.getElementById('calcCant').value || 1;
    const vid = document.getElementById('calcVidrio').value;
    if (ancho <= 0 || alto <= 0) return;
    const calc = calcularElemento(tipo, ancho, alto, sis);
    const precio = calcularPrecio(tipo, calc, sis, vid, cant);
    document.getElementById('calcResultado').innerHTML = `
      <div class="glass-card">
        <h3 class="font-bold mb-4">Resultado</h3>
        <div class="stats-grid mb-4">
          <div class="glass-card-static p-4 text-center"><div class="stat-value text-sm">${calc.m2.toFixed(2)}</div><div class="text-xs text-dim">M2 por unidad</div></div>
          <div class="glass-card-static p-4 text-center"><div class="stat-value text-sm">${calc.totalMetros.toFixed(2)}</div><div class="text-xs text-dim">Metros perfil</div></div>
          <div class="glass-card-static p-4 text-center"><div class="stat-value text-sm">${calc.m2Vidrio.toFixed(2)}</div><div class="text-xs text-dim">M2 Vidrio</div></div>
          <div class="glass-card-static p-4 text-center"><div class="stat-value text-sm text-green">RD$${formatMonto(precio.total)}</div><div class="text-xs text-dim">Total (${cant} ud.)</div></div>
        </div>
        <h4 class="font-semibold text-sm mb-2">Desglose de Precio</h4>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between"><span class="text-muted">Perfiles</span><span>RD$${formatMonto(precio.perfiles)}</span></div>
          <div class="flex justify-between"><span class="text-muted">Vidrios</span><span>RD$${formatMonto(precio.vidrios)}</span></div>
          <div class="flex justify-between"><span class="text-muted">Accesorios</span><span>RD$${formatMonto(precio.accesorios)}</span></div>
          <div class="flex justify-between border-t pt-2 mt-2"><span class="font-bold">Unitario</span><span class="font-bold">RD$${formatMonto(precio.unitario)}</span></div>
          ${cant>1?'<div class="flex justify-between"><span class="font-bold">Total (x'+cant+')</span><span class="font-bold text-green">RD$'+formatMonto(precio.total)+'</span></div>':''}
        </div>
        <h4 class="font-semibold text-sm mt-4 mb-2">Lista de Cortes</h4>
        <div class="overflow-auto"><table style="width:100%;border-collapse:collapse;font-size:.8rem"><thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1)"><th style="text-align:left;padding:.5rem;color:rgba(255,255,255,0.4)">Pieza</th><th style="text-align:right;padding:.5rem;color:rgba(255,255,255,0.4)">Long. (cm)</th><th style="text-align:right;padding:.5rem;color:rgba(255,255,255,0.4)">Cant.</th><th style="text-align:left;padding:.5rem;color:rgba(255,255,255,0.4)">Perfil</th></tr></thead><tbody>
        ${calc.cortes.map(c=>'<tr style="border-bottom:1px solid rgba(255,255,255,0.05)"><td style="padding:.5rem">'+c.pieza+'</td><td style="padding:.5rem;text-align:right">'+c.long.toFixed(1)+'</td><td style="padding:.5rem;text-align:right">'+c.cant+'</td><td style="padding:.5rem;color:rgba(255,255,255,0.4)">'+c.perfil+'</td></tr>').join('')}
        </tbody></table></div>
      </div>`;
  }
};

// ======== INIT ========
document.addEventListener('DOMContentLoaded', () => App.init());
