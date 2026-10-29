[
  {
    "create_table_sql": "CREATE TABLE public.almacen (\n    id_almacen bigint NOT NULL,\n    n_almacen character varying(50) NOT NULL,\n    descripcion character varying(100),\n    ubicacion character varying(100),\n    es_principal character varying(1) NOT NULL,\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.apertura_caja (\n    id_apertura_caja bigint NOT NULL,\n    id_caja bigint NOT NULL,\n    id_usuario bigint NOT NULL,\n    id_usuario_cierre bigint,\n    numero_turno character varying(20),\n    f_apertura timestamp without time zone NOT NULL,\n    f_cierre timestamp without time zone,\n    monto_inicial numeric(12,2) NOT NULL,\n    total_ingresos numeric(12,2),\n    total_egresos numeric(12,2),\n    monto_sistema numeric(12,2),\n    monto_declarado numeric(12,2),\n    diferencia numeric(12,2),\n    situacion character varying(1) NOT NULL,\n    observacion character varying(200),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.auditoria (\n    id_auditoria bigint NOT NULL,\n    id_usuario bigint,\n    n_tabla character varying(50) NOT NULL,\n    accion character varying(20) NOT NULL,\n    id_registro bigint,\n    valor_anterior character varying(500),\n    valor_nuevo character varying(500),\n    f_evento timestamp without time zone,\n    ip character varying(20),\n    terminal character varying(30),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.boleta (\n    id_boleta bigint NOT NULL,\n    id_venta bigint NOT NULL,\n    f_emision timestamp without time zone NOT NULL,\n    numero character varying(8) NOT NULL,\n    serie character varying(5) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.caja (\n    id_caja bigint NOT NULL,\n    n_caja character varying(50) NOT NULL,\n    descripcion character varying(100),\n    ubicacion character varying(100),\n    serie_terminal character varying(30),\n    moneda character varying(3) NOT NULL,\n    monto_base numeric(12,2),\n    aperturada character varying(1) NOT NULL,\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.cargo (\n    id_cargo bigint NOT NULL,\n    n_cargo character varying(40) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.categoria_producto (\n    id_categoria_producto bigint NOT NULL,\n    n_categoria_producto character varying(50) NOT NULL,\n    descripcion character varying(100),\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.cliente (\n    id_cliente bigint NOT NULL,\n    id_persona bigint,\n    id_empresa bigint,\n    codigo_cliente character varying(20),\n    tipo_cliente character varying(1) NOT NULL,\n    limite_credito numeric(12,2) NOT NULL,\n    saldo_deuda numeric(12,2) NOT NULL,\n    puntos integer NOT NULL,\n    f_registro timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL,\n    observacion character varying(200)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.compra (\n    id_compra bigint NOT NULL,\n    id_proveedor bigint NOT NULL,\n    id_usuario bigint NOT NULL,\n    id_almacen bigint NOT NULL,\n    id_metodo_pago bigint,\n    tipo_documento character varying(11),\n    documento character varying(50),\n    f_compra timestamp without time zone NOT NULL,\n    sub_total numeric(12,2) NOT NULL,\n    igv numeric(12,2) NOT NULL,\n    total numeric(12,2) NOT NULL,\n    t_pagado numeric(12,2) NOT NULL,\n    saldo numeric(12,2) NOT NULL,\n    es_credito character varying(1) NOT NULL,\n    f_vencimiento date,\n    situacion character varying(1) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL,\n    numero_documento character varying(30),\n    observacion character varying(200)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.concepto_caja (\n    id_concepto bigint NOT NULL,\n    id_tipo_movimiento bigint NOT NULL,\n    n_concepto character varying(60) NOT NULL,\n    descripcion character varying(150),\n    afecta_efectivo character varying(1) NOT NULL,\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.contrato (\n    id_contrato bigint NOT NULL,\n    n_contrato character varying(40) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.credito (\n    id_credito bigint NOT NULL,\n    estado character varying(1) NOT NULL,\n    fec_cre timestamp without time zone,\n    fec_mod timestamp without time zone,\n    pc_cre character varying(30),\n    pc_mod character varying(30),\n    usu_cre character varying(30),\n    usu_mod character varying(30),\n    f_emision timestamp without time zone NOT NULL,\n    f_vencimiento timestamp without time zone,\n    monto numeric(12,2) NOT NULL,\n    numero_documento character varying(30),\n    observacion character varying(200),\n    saldo numeric(12,2) NOT NULL,\n    id_cliente bigint NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.cuenta_cobrar (\n    id_cuenta bigint NOT NULL,\n    id_venta bigint NOT NULL,\n    id_cliente bigint NOT NULL,\n    monto_total numeric(12,2) NOT NULL,\n    saldo numeric(12,2) NOT NULL,\n    f_emision timestamp without time zone NOT NULL,\n    f_vencimiento date,\n    situacion character varying(1) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.departamento (\n    id_departamento bigint NOT NULL,\n    n_departamento character varying(30) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.detalle_compra (\n    id_detalle_compra bigint NOT NULL,\n    id_compra bigint NOT NULL,\n    id_producto bigint NOT NULL,\n    id_presentacion_producto bigint NOT NULL,\n    id_lote bigint,\n    cantidad integer NOT NULL,\n    costo_unitario numeric(10,2) NOT NULL,\n    sub_total numeric(12,2) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.detalle_venta (\n    id_detalle bigint NOT NULL,\n    id_venta bigint NOT NULL,\n    id_producto bigint NOT NULL,\n    id_presentacion_producto bigint NOT NULL,\n    cantidad numeric(12,3) NOT NULL,\n    precio_unitario numeric(10,2) NOT NULL,\n    descuento numeric(10,2) NOT NULL,\n    sub_total numeric(12,2) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL,\n    id_detalle_venta bigint NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.distrito (\n    id_distrito bigint NOT NULL,\n    id_provincia bigint NOT NULL,\n    d_distrito character varying(40) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.empleado (\n    id_empleado bigint NOT NULL,\n    id_persona bigint NOT NULL,\n    id_contrato bigint,\n    id_cargo bigint,\n    salario numeric(8,2),\n    turno character varying(18),\n    fondo_pension character varying(3),\n    n_hps character varying(11),\n    essalud character varying(6),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.empresa (\n    id_empresa bigint NOT NULL,\n    ruc character varying(11) NOT NULL,\n    razon_social character varying(140) NOT NULL,\n    direccion character varying(150),\n    telefono character varying(8),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.factura (\n    id_factura bigint NOT NULL,\n    id_venta bigint NOT NULL,\n    f_emision timestamp without time zone NOT NULL,\n    numero character varying(8) NOT NULL,\n    serie character varying(5) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.inventario (\n    id_inventario bigint NOT NULL,\n    id_producto bigint NOT NULL,\n    id_almacen bigint NOT NULL,\n    stock numeric(12,3) NOT NULL,\n    stock_reservado numeric(12,3) NOT NULL,\n    ubicacion_fisica character varying(50),\n    f_actualizacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.lote_producto (\n    id_lote bigint NOT NULL,\n    id_producto bigint NOT NULL,\n    id_almacen bigint NOT NULL,\n    n_lote character varying(30),\n    f_produccion date,\n    f_vencimiento date,\n    cantidad_inicial numeric(12,3) NOT NULL,\n    cantidad_actual numeric(12,3) NOT NULL,\n    costo_unitario numeric(10,2),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.marca (\n    id_marca bigint NOT NULL,\n    n_marca character varying(50) NOT NULL,\n    descripcion character varying(100),\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.metodo_pago (\n    id_metodo_pago bigint NOT NULL,\n    n_metodo_pago character varying(30) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.modulo (\n    id_modulo bigint NOT NULL,\n    n_modulo character varying(50) NOT NULL,\n    descripcion character varying(100),\n    icono character varying(50),\n    orden integer,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.movimiento_caja (\n    id_movimiento_caja bigint NOT NULL,\n    id_apertura_caja bigint NOT NULL,\n    id_tipo_movimiento bigint NOT NULL,\n    id_concepto bigint NOT NULL,\n    id_metodo_pago bigint NOT NULL,\n    id_usuario bigint NOT NULL,\n    id_compra bigint,\n    id_venta bigint,\n    numero_operacion character varying(30),\n    documento character varying(50),\n    descripcion character varying(200),\n    monto numeric(12,2) NOT NULL,\n    afecta_efectivo character varying(1) NOT NULL,\n    f_movimiento timestamp without time zone NOT NULL,\n    ip character varying(20),\n    terminal character varying(30),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.movimiento_inventario (\n    id_movimiento_inv bigint NOT NULL,\n    id_producto bigint NOT NULL,\n    id_almacen bigint NOT NULL,\n    id_tipo_movimiento_inv bigint NOT NULL,\n    id_lote bigint,\n    id_usuario bigint NOT NULL,\n    id_venta bigint,\n    id_compra bigint,\n    cantidad numeric(12,3) NOT NULL,\n    costo_unitario numeric(10,2),\n    stock_anterior numeric(12,3) NOT NULL,\n    stock_nuevo numeric(12,3) NOT NULL,\n    f_movimiento timestamp without time zone NOT NULL,\n    documento character varying(30),\n    observacion character varying(200),\n    ip character varying(20),\n    terminal character varying(30),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.pago_cuenta (\n    id_pago_cuenta bigint NOT NULL,\n    id_cuenta bigint NOT NULL,\n    id_metodo_pago bigint NOT NULL,\n    id_usuario bigint NOT NULL,\n    id_apertura_caja bigint,\n    monto numeric(12,2) NOT NULL,\n    f_pago timestamp without time zone NOT NULL,\n    documento character varying(50),\n    observacion character varying(200),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.permiso (\n    id_permiso bigint NOT NULL,\n    id_modulo bigint NOT NULL,\n    n_permiso character varying(50) NOT NULL,\n    clave character varying(50) NOT NULL,\n    descripcion character varying(100),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.persona (\n    id_persona bigint NOT NULL,\n    id_distrito bigint,\n    id_tipo_identidad bigint NOT NULL,\n    n_documento character varying(15) NOT NULL,\n    nombre character varying(80) NOT NULL,\n    ap_paterno character varying(80),\n    ap_materno character varying(80),\n    f_nacimiento date,\n    email character varying(50),\n    celular character varying(9),\n    genero character varying(1),\n    direccion character varying(100),\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.presentacion_producto (\n    id_presentacion_producto bigint NOT NULL,\n    id_producto bigint NOT NULL,\n    id_unidad_medida bigint NOT NULL,\n    factor_conversion numeric(12,3) NOT NULL,\n    es_unidad_base character varying(1) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.producto (\n    id_producto bigint NOT NULL,\n    id_categoria_producto bigint NOT NULL,\n    id_marca bigint,\n    codigo_barras character varying(30),\n    n_producto character varying(50) NOT NULL,\n    detalle character varying(100),\n    p_compra numeric(10,2) NOT NULL,\n    p_venta numeric(10,2) NOT NULL,\n    p_mayoreo numeric(10,2),\n    stock_actual numeric(12,3) NOT NULL,\n    stock_minimo numeric(12,3) NOT NULL,\n    stock_maximo numeric(12,3),\n    afecto_igv character varying(1) NOT NULL,\n    es_perecible character varying(1) NOT NULL,\n    imagen character varying(200),\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.proveedor (\n    id_proveedor bigint NOT NULL,\n    id_empresa bigint,\n    id_persona bigint,\n    codigo_proveedor character varying(20),\n    contacto character varying(80),\n    telefono_contacto character varying(15),\n    email_contacto character varying(50),\n    dias_credito integer NOT NULL,\n    f_registro timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.provincia (\n    id_provincia bigint NOT NULL,\n    id_departamento bigint NOT NULL,\n    n_provincia character varying(30) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.rol (\n    id_rol bigint NOT NULL,\n    n_rol character varying(50) NOT NULL,\n    descripcion character varying(100),\n    nivel integer,\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.rol_permiso (\n    id_rol_permiso bigint NOT NULL,\n    id_rol bigint NOT NULL,\n    id_permiso bigint NOT NULL,\n    concedido character varying(1) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.tipo_identidad (\n    id_tipo_identidad bigint NOT NULL,\n    n_tipo_identidad character varying(20) NOT NULL,\n    abreviatura character varying(10),\n    longitud integer,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.tipo_movimiento_caja (\n    id_tipo_movimiento bigint NOT NULL,\n    n_tipo_movimiento character varying(30) NOT NULL,\n    abreviatura character varying(10),\n    signo character varying(1) NOT NULL,\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.tipo_movimiento_inv (\n    id_tipo_movimiento_inv bigint NOT NULL,\n    n_tipo_movimiento character varying(30) NOT NULL,\n    abreviatura character varying(10),\n    signo character varying(1) NOT NULL,\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.tipo_usuario (\n    id_tipo_usuario bigint NOT NULL,\n    n_tipo_usuario character varying(50) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.unidad_medida (\n    id_unidad_medida bigint NOT NULL,\n    n_unidad_medida character varying(30) NOT NULL,\n    abreviatura character varying(10),\n    f_creacion timestamp without time zone,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.usuario (\n    id_usuario bigint NOT NULL,\n    id_tipo_usuario bigint NOT NULL,\n    id_empleado bigint,\n    logeo character varying(30) NOT NULL,\n    clave character varying(200) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.usuario_rol (\n    id_usuario_rol bigint NOT NULL,\n    id_usuario bigint NOT NULL,\n    id_rol bigint NOT NULL,\n    f_asignacion timestamp without time zone,\n    vigente character varying(1) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.venta (\n    id_venta bigint NOT NULL,\n    id_cliente bigint NOT NULL,\n    id_usuario bigint NOT NULL,\n    id_apertura_caja bigint,\n    id_metodo_pago bigint NOT NULL,\n    f_venta timestamp without time zone NOT NULL,\n    sub_total numeric(12,2) NOT NULL,\n    igv numeric(12,2) NOT NULL,\n    descuento numeric(12,2) NOT NULL,\n    total numeric(12,2) NOT NULL,\n    t_pagado numeric(12,2) NOT NULL,\n    vuelto numeric(12,2) NOT NULL,\n    es_credito character varying(1) NOT NULL,\n    saldo numeric(12,2) NOT NULL,\n    tipo_documento character varying(11) NOT NULL,\n    situacion character varying(1) NOT NULL,\n    usu_cre character varying(30),\n    pc_cre character varying(30),\n    fec_cre timestamp without time zone,\n    usu_mod character varying(30),\n    pc_mod character varying(30),\n    fec_mod timestamp without time zone,\n    estado character varying(1) NOT NULL\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_arqueo_caja (\n    id_apertura_caja bigint,\n    n_caja character varying(50),\n    f_apertura timestamp without time zone,\n    f_cierre timestamp without time zone,\n    situacion character varying(1),\n    usuario_apertura character varying(30),\n    usuario_cierre character varying(30),\n    monto_inicial numeric(12,2),\n    total_ingresos numeric(12,2),\n    total_egresos numeric(12,2),\n    monto_sistema numeric(12,2),\n    monto_declarado numeric(12,2),\n    diferencia numeric(12,2)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_cuentas_por_cobrar (\n    id_cuenta bigint,\n    id_venta bigint,\n    f_emision timestamp without time zone,\n    f_vencimiento date,\n    monto_total numeric(12,2),\n    saldo numeric(12,2),\n    situacion character varying(1),\n    cliente text,\n    celular character varying(9),\n    dias_vencidos integer\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_kardex (\n    id_movimiento_inv bigint,\n    f_movimiento timestamp without time zone,\n    n_producto character varying(50),\n    n_almacen character varying(50),\n    n_tipo_movimiento character varying(30),\n    signo character varying(1),\n    cantidad numeric(12,3),\n    costo_unitario numeric(10,2),\n    stock_anterior numeric(12,3),\n    stock_nuevo numeric(12,3),\n    documento character varying(30),\n    observacion character varying(200),\n    usuario character varying(30)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_productos_mas_vendidos (\n    id_producto bigint,\n    n_producto character varying(50),\n    n_categoria_producto character varying(50),\n    cantidad_vendida numeric,\n    monto_vendidas numeric\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_productos_por_vencer (\n    id_lote bigint,\n    n_producto character varying(50),\n    n_lote character varying(30),\n    f_vencimiento date,\n    cantidad_actual numeric(12,3),\n    dias_restantes integer,\n    n_almacen character varying(50)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_stock_critico (\n    id_producto bigint,\n    codigo_barras character varying(30),\n    n_producto character varying(50),\n    n_categoria_producto character varying(50),\n    n_marca character varying(50),\n    stock_actual numeric(12,3),\n    stock_minimo numeric(12,3),\n    stock_maximo numeric(12,3),\n    cantidad_sugerida numeric,\n    p_compra numeric(10,2)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_ventas_detalle (\n    id_venta bigint,\n    f_venta timestamp without time zone,\n    tipo_documento character varying(11),\n    situacion character varying(1),\n    cliente character varying,\n    usuario character varying(30),\n    n_metodo_pago character varying(30),\n    n_producto character varying(50),\n    cantidad numeric(12,3),\n    precio_unitario numeric(10,2),\n    descuento numeric(10,2),\n    sub_total numeric(12,2),\n    total numeric(12,2)\n);"
  },
  {
    "create_table_sql": "CREATE TABLE public.vw_ventas_diarias (\n    fecha date,\n    nro_ventas bigint,\n    sub_total numeric,\n    igv numeric,\n    total numeric,\n    total_credito numeric\n);"
  }
]