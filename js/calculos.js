/**
 * AluminioRD Pro - Motor de Calculos
 * Calculos de cortes, vidrios, accesorios y precios
 */

const PRODUCTOS = {
  ventana_corrediza_2h: { nombre: 'Ventana Corrediza 2 Hojas', categoria: 'ventanas', sistemas: ['Serie 300','Serie 400','Serie 600'], vidrios: ['4mm transparente','6mm transparente','6mm templado','8mm templado','6mm bronce','8mm reflectivo'] },
  ventana_fija: { nombre: 'Ventana Fija', categoria: 'ventanas', sistemas: ['Serie 300','Serie 400'], vidrios: ['4mm transparente','6mm transparente','6mm templado','8mm templado','6mm bronce'] },
  puerta_corrediza_2h: { nombre: 'Puerta Corrediza 2 Hojas', categoria: 'puertas', sistemas: ['Serie 450','Serie 600','Serie 700'], vidrios: ['6mm templado','8mm templado','10mm templado','8mm laminado'] },
  mampara_corrediza: { nombre: 'Mampara Bano Corrediza', categoria: 'mamparas', sistemas: ['Estandar cromado','Premium inoxidable'], vidrios: ['6mm templado transparente','6mm templado esmerilado','8mm templado'] }
};

const COLORES_PERFIL = ['Natural','Blanco','Bronce','Negro','Champagne'];

const PRECIOS = {
  perfiles: { serie_300: 380, serie_400: 450, serie_600: 580, serie_450: 520, serie_700: 680, mampara: 420 },
  vidrios: { '4mm': 450, '6mm': 650, '6mm_templado': 1100, '8mm_templado': 1400, '10mm_templado': 1800 },
  instalacion: { precio_m2: 800, minimo: 2500 },
  itbis: 0.18
};

function calcularElemento(tipo, ancho, alto, sistema) {
  switch(tipo) {
    case 'ventana_corrediza_2h': return calcVentanaCorrediza(ancho, alto, sistema);
    case 'ventana_fija': return calcVentanaFija(ancho, alto, sistema);
    case 'puerta_corrediza_2h': return calcPuertaCorrediza(ancho, alto, sistema);
    case 'mampara_corrediza': return calcMampara(ancho, alto, sistema);
    default: return calcVentanaFija(ancho, alto, sistema);
  }
}

function calcVentanaCorrediza(AT, ALT, sis) {
  var anchoHoja = (AT/2)+4, altoHoja = ALT-7.5;
  var av = anchoHoja-11, hv = altoHoja-11;
  var m2v = (av/100)*(hv/100);
  var cortes = [
    {pieza:'Marco sup.',long:AT,cant:1,perfil:sis+' Marco'},
    {pieza:'Marco inf.',long:AT,cant:1,perfil:sis+' Marco riel'},
    {pieza:'Jamba lat.',long:ALT-5,cant:2,perfil:sis+' Marco'},
    {pieza:'Vert. hoja',long:altoHoja,cant:4,perfil:sis+' Hoja'},
    {pieza:'Horiz. hoja',long:anchoHoja-10,cant:4,perfil:sis+' Hoja'}
  ];
  return { m2:(AT*ALT)/10000, m2Vidrio:m2v*2, cortes:cortes, totalMetros:calcTotalMetros(cortes),
    accesorios:{rodamientos:8,cerradura:1,felpa:Math.ceil((2*(anchoHoja+altoHoja)*2)/100),tornillos:24,silicon:1} };
}

function calcVentanaFija(AT, ALT, sis) {
  var av=AT-6,hv=ALT-6,m2v=(av/100)*(hv/100);
  var cortes=[{pieza:'Marco sup.',long:AT,cant:1,perfil:sis},{pieza:'Marco inf.',long:AT,cant:1,perfil:sis},{pieza:'Marco lat.',long:ALT-5,cant:2,perfil:sis}];
  return {m2:(AT*ALT)/10000,m2Vidrio:m2v,cortes:cortes,totalMetros:calcTotalMetros(cortes),accesorios:{silicon:2,tacos:4,tornillos:16}};
}

function calcPuertaCorrediza(AT, ALT, sis) {
  var anchoHoja=(AT/2)+5,altoHoja=ALT-9;
  var av=anchoHoja-13,hv=altoHoja-13,m2v=(av/100)*(hv/100);
  var cortes=[
    {pieza:'Marco sup.',long:AT,cant:1,perfil:sis+' Ref.'},
    {pieza:'Marco inf.',long:AT,cant:1,perfil:sis+' Riel HD'},
    {pieza:'Jamba lat.',long:ALT-6,cant:2,perfil:sis+' Ref.'},
    {pieza:'Vert. hoja',long:altoHoja,cant:4,perfil:sis+' Hoja'},
    {pieza:'Horiz. hoja',long:anchoHoja-12,cant:4,perfil:sis+' Hoja'}
  ];
  return {m2:(AT*ALT)/10000,m2Vidrio:m2v*2,cortes:cortes,totalMetros:calcTotalMetros(cortes),
    accesorios:{rodamientos:8,cerradura:1,jaladores:4,felpa:Math.ceil((2*(anchoHoja+altoHoja)*2)/100),topes:2,tornillos:32,silicon:2}};
}

function calcMampara(AT, ALT, sis) {
  var anchoHoja=(AT/2)+3,altoHoja=ALT-5;
  var av=anchoHoja-4,hv=altoHoja-2,m2v=(av/100)*(hv/100);
  var cortes=[
    {pieza:'Riel sup.',long:AT,cant:1,perfil:sis+' Riel'},
    {pieza:'Riel inf.',long:AT,cant:1,perfil:sis+' Riel'},
    {pieza:'Perfil pared',long:ALT-3,cant:2,perfil:sis+' U'},
    {pieza:'Vert. hoja',long:altoHoja,cant:4,perfil:sis+' H'}
  ];
  return {m2:(AT*ALT)/10000,m2Vidrio:m2v*2,cortes:cortes,totalMetros:calcTotalMetros(cortes),
    accesorios:{rodamientos:4,jalador:1,sello_inf:Math.ceil(AT/100),sello_lat:Math.ceil((ALT*2)/100),tornillos:16,silicon:1}};
}

function calcTotalMetros(cortes) {
  return cortes.reduce(function(t,c){ return t + (c.long*c.cant)/100; },0);
}

function calcularPrecio(tipo, calculo, sistema, vidrio, cantidad) {
  var sk = sistema.toLowerCase().replace(/ /g,'_');
  var pm = PRECIOS.perfiles[sk] || PRECIOS.perfiles.serie_400 || 450;
  var vk = vidrio.includes('templado') ? (vidrio.includes('8mm')?'8mm_templado':vidrio.includes('10mm')?'10mm_templado':'6mm_templado') : (vidrio.includes('6mm')?'6mm':'4mm');
  var pv = PRECIOS.vidrios[vk] || 1100;
  var subtPerfiles = calculo.totalMetros * pm;
  var subtVidrios = calculo.m2Vidrio * pv;
  var subtAcc = 0;
  if(calculo.accesorios) {
    Object.entries(calculo.accesorios).forEach(function(e) {
      var k=e[0],v=e[1];
      var pa = k.includes('rodamiento')?85:k.includes('cerradura')?120:k.includes('felpa')?35:k.includes('silicon')?180:k.includes('jalador')?150:50;
      subtAcc += v * pa;
    });
  }
  var unitario = subtPerfiles + subtVidrios + subtAcc;
  return { perfiles:subtPerfiles, vidrios:subtVidrios, accesorios:subtAcc, unitario:unitario, total:unitario*cantidad };
}

function calcularTotales(elementos, incluyeInstalacion, descuentoPct) {
  var subtMat = elementos.reduce(function(s,e){return s+e.precio_total;},0);
  var totalM2 = elementos.reduce(function(s,e){return s+e.m2;},0);
  var inst = incluyeInstalacion ? Math.max(totalM2*PRECIOS.instalacion.precio_m2,PRECIOS.instalacion.minimo) : 0;
  var subtGen = subtMat + inst;
  var desc = subtGen * ((descuentoPct||0)/100);
  var base = subtGen - desc;
  var itbis = base * PRECIOS.itbis;
  return { subtotalMateriales:subtMat, instalacion:inst, subtotalGeneral:subtGen, descuento:desc, baseImponible:base, itbis:itbis, total:base+itbis, totalM2:totalM2 };
}

function formatMonto(n) { return new Intl.NumberFormat('es-DO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n); }
