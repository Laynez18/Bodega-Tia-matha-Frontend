# Cambios aplicados en `bodega.sql` — guía de migración para el backend

> **Origen de verdad:** `bodega.sql` (reescrito). Todo lo que sigue describe el esquema **nuevo**.
> El agente de backend debe asumir que la BD se crea ejecutando ese script y que Hibernate
> **nunca** debe generar el DDL (`spring.jpa.hibernate.ddl-auto=validate`).

---

## 1. Resumen de los 3 problemas reportados y su solución

| Problema | Antes | Ahora |
|---|---|---|
| Nombres fuera de la convención `snake_case` de Postgres | `DEPARTAMENTO`, `ID_Departamento`, `ID_AperturaCaja`, `PK_DEPARTAMENTO`… | `departamento`, `id_departamento`, `id_apertura_caja`, `pk_departamento`… |
| `serial` limitado a ~2.1 mil millones | `serial` (int4) | `bigserial` (int8) en PK y `bigint` (int8) en FK |
| `char(n)` rellena con espacios | `char(1)`, `char(3)`, `char(11)`… | `varchar(n)` en **todas** las columnas afectadas |

Detalle importante: el `char(n)` no solo sufría padding en `estado`/`moneda`, sino en
**77 columnas** (75 en tablas + 2 en firmas de funciones). Ejemplos reales de bugs que existían:

- `empresa.telefono char(8)` con valor `'056234'` → se guardaba como `'056234  '` (2 espacios).
- `venta.tipo_documento char(11) DEFAULT 'TICKET'` → el default se guardaba como `'TICKET     '`,
  por lo que `WHERE tipo_documento = 'TICKET'` **no encontraba nada** salvo que se usara `= 'TICKET'::char(11)`
  o `LIKE 'TICKET%'`. Esto afectaba a las vistas `vw_ventas_detalle` y `vw_ventas_diarias`.
- `caja.moneda char(3) DEFAULT 'PEN'` → `'PEN'` (3 chars, sin padding) pero cualquier valor de
  1–2 chars habría quedado con relleno. Ahora `varchar(3)` no rellena nunca.

---

## 2. Convenciones finales (útiles para configurar Hibernate)

| Elemento | Patrón | Ejemplo |
|---|---|---|
| Tabla | `snake_case` minúscula | `apertura_caja` |
| Columna | `snake_case` minúscula | `id_apertura_caja` |
| PK constraint | `pk_<tabla>` | `pk_apertura_caja` |
| FK constraint | `fk_<tabla>_<tabla_ref>` | `fk_apertura_caja_caja` |
| Unique | `uq_<tabla>_<cols>` | `uq_boleta_serie_numero` |
| Check | `ck_<tabla>_<regla>` | `ck_cliente_tipo_cliente` |
| Índice | `ix_<tabla>_<cols>` / `ux_<tabla>_<cols>` | `ix_venta_fecha` |
| Vista | `vw_<nombre>` | `vw_arqueo_caja` |
| Tipo compuesto | `tt_<nombre>` | `tt_detalle_venta` |
| Función | `usp_<nombre>` (SP) / `fn_<nombre>` (helper) | `usp_aperturar_caja` |
| Trigger | `tr_<tabla>_<evento>` | `tr_producto_auditoria` |

**Configuración Hibernate sugerida** (evita tener que anotar cada `@Column`):

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.globally_quoted_identifiers=true
```

Aunque el esquema ya es 100 % `snake_case` minúscula (que es lo que produce la
`ImplicitNamingStrategy` por defecto de Hibernate), **usa `@Table(name=...)` y `@Column(name=...)`
explícitos** en las entidades. Es lo más seguro y evita depender de la estrategia de nombres.
`globally_quoted_identifiers=true` es opcional: sin ella Hibernate simplemente no pone comillas,
lo cual en Postgres es equivalente porque todos los nombres son minúsculos y sin caracteres
especiales.

---

## 3. Mapeo de tipos: `Integer` → `Long` (obligatorio en todo el backend)

**Todas** las claves primarias y foráneas cambiaron de `int4` a `int8`.

| En la BD | Antes | Ahora | Java |
|---|---|---|---|
| PK (43 tablas) | `serial` | `bigserial` | `Long` |
| FK (todas) | `integer` | `bigint` | `Long` |
| Tipo compuesto `tt_detalle_*` | `integer` | `bigint` | `Long` |
| `auditoria.id_registro` | `integer` | `bigint` | `Long` |

**NO cambia** (siguen siendo `Integer`): `tipo_identidad.longitud`, `modulo.orden`, `rol.nivel`,
`cliente.puntos`, `proveedor.dias_credito`, y el `orden` que devuelve `usp_permisos_usuario`.

Lista de columnas que pasan a `Long` (agrupadas por tabla, solo las que son id):

```
departamento              id_departamento
provincia                 id_provincia, id_departamento
distrito                  id_distrito, id_provincia
tipo_identidad            id_tipo_identidad
persona                   id_persona, id_distrito, id_tipo_identidad
empresa                   id_empresa
cargo                     id_cargo
contrato                  id_contrato
empleado                  id_empleado, id_persona, id_contrato, id_cargo
tipo_usuario              id_tipo_usuario
usuario                   id_usuario, id_tipo_usuario, id_empleado
modulo                    id_modulo
rol                       id_rol
permiso                   id_permiso, id_modulo
rol_permiso               id_rol_permiso, id_rol, id_permiso
usuario_rol               id_usuario_rol, id_usuario, id_rol
auditoria                 id_auditoria, id_usuario, id_registro
caja                      id_caja
apertura_caja             id_apertura_caja, id_caja, id_usuario, id_usuario_cierre
tipo_movimiento_caja      id_tipo_movimiento
concepto_caja             id_concepto, id_tipo_movimiento
almacen                   id_almacen
unidad_medida             id_unidad_medida
marca                     id_marca
categoria_producto        id_categoria_producto
producto                  id_producto, id_categoria_producto, id_marca
presentacion_producto     id_presentacion_producto, id_producto, id_unidad_medida
inventario                id_inventario, id_producto, id_almacen
lote_producto             id_lote, id_producto, id_almacen
tipo_movimiento_inv       id_tipo_movimiento_inv
metodo_pago               id_metodo_pago
cliente                   id_cliente, id_persona, id_empresa
proveedor                 id_proveedor, id_empresa, id_persona
compra                    id_compra, id_proveedor, id_usuario, id_almacen, id_metodo_pago
detalle_compra            id_detalle_compra, id_compra, id_producto,
                          id_presentacion_producto, id_lote
venta                     id_venta, id_cliente, id_usuario, id_apertura_caja, id_metodo_pago
detalle_venta             id_detalle, id_venta, id_producto, id_presentacion_producto
boleta                    id_boleta, id_venta
factura                   id_factura, id_venta
cuenta_cobrar             id_cuenta, id_venta, id_cliente
pago_cuenta               id_pago_cuenta, id_cuenta, id_metodo_pago, id_usuario, id_apertura_caja
movimiento_inventario     id_movimiento_inv, id_producto, id_almacen,
                          id_tipo_movimiento_inv, id_lote, id_usuario, id_venta, id_compra
movimiento_caja           id_movimiento_caja, id_apertura_caja, id_tipo_movimiento,
                          id_concepto, id_metodo_pago, id_usuario, id_compra, id_venta
```

---

## 4. Mapeo de nombres: tabla y columna

### 4.1 Tablas (43) — el nombre solo baja a minúsculas salvo estas correcciones ortográficas

`DEPARTAMENTO`→`departamento`, `TIPO_IDENTIDAD`→`tipo_identidad`, `ROL_PERMISO`→`rol_permiso`,
`APERTURA_CAJA`→`apertura_caja`, `CAJA`→`caja`, `VENTA`→`venta`, `COMPRA`→`compra`,
`LOTE_PRODUCTO`→`lote_producto`, `CUENTA_COBRAR`→`cuenta_cobrar`, `PAGO_CUENTA`→`pago_cuenta`,
`METODO_PAGO`→`metodo_pago`, `TIPO_MOVIMIENTO_CAJA`→`tipo_movimiento_caja`,
`TIPO_MOVIMIENTO_INV`→`tipo_movimiento_inv`, `CONCEPTO_CAJA`→`concepto_caja`,
`CATEGORIA_PRODUCTO`→`categoria_producto`, `PRESENTACION_PRODUCTO`→`presentacion_producto`,
`MOVIMIENTO_INVENTARIO`→`movimiento_inventario`, `MOVIMIENTO_CAJA`→`movimiento_caja`,
`ROL_PERMISO`→`rol_permiso`, `USUARIO_ROL`→`usuario_rol`, … (las 43 quedan en minúscula).

### 4.2 Columnas que NO son un simple "bajar a minúsculas" (renombres reales)

Estas requieren cambio de nombre en entidades, DTOs, queries y vistas:

| Antes | Ahora |
|---|---|
| `ID_AperturaCaja` | `id_apertura_caja` |
| `ID_UsuarioCierre` | `id_usuario_cierre` |
| `ID_PresentacionProducto` | `id_presentacion_producto` |
| `ID_CategoriaProducto` / `N_CategoriaProducto` | `id_categoria_producto` / `n_categoria_producto` |
| `ID_TipoIdentidad` / `N_TipoIdentidad` | `id_tipo_identidad` / `n_tipo_identidad` |
| `ID_TipoUsuario` / `N_TipoUsuario` | `id_tipo_usuario` / `n_tipo_usuario` |
| `ID_UnidadMedida` / `N_UnidadMedida` | `id_unidad_medida` / `n_unidad_medida` |
| `ID_TipoMovimientoInv` | `id_tipo_movimiento_inv` |
| `ID_TipoMovimiento` / `N_TipoMovimiento` | `id_tipo_movimiento` / `n_tipo_movimiento` |
| `ID_MetodoPago` / `N_MetodoPago` | `id_metodo_pago` / `n_metodo_pago` |
| `ID_MovimientoInv` | `id_movimiento_inv` |
| `ID_MovimientoCaja` | `id_movimiento_caja` |
| `ID_DetalleCompra` | `id_detalle_compra` |
| `ID_PagoCuenta` | `id_pago_cuenta` |
| `ID_RolPermiso` | `id_rol_permiso` |
| `ID_UsuarioRol` | `id_usuario_rol` |
| `SubTotal` | `sub_total` |
| `TipoDocumento` | `tipo_documento` |
| `USUCRE` | `usu_cre` |
| `PCCRE` | `pc_cre` |
| `FECCRE` | `fec_cre` |
| `USUMOD` | `usu_mod` |
| `PCMOD` | `pc_mod` |
| `FECMOD` | `fec_mod` |

Además, columnas que ya eran `N_X`/`D_X`/`F_X` etc. pasaron a minúscula:
`N_Departamento`→`n_departamento`, `D_Distrito`→`d_distrito`, `F_Nacimiento`→`f_nacimiento`,
`N_Producto`→`n_producto`, `P_Compra`→`p_compra`, `P_Venta`→`p_venta`, `Stock_Actual`→`stock_actual`,
`Codigo_Barras`→`codigo_barras`, `Razon_Social`→`razon_social`, `F_Venta`→`f_venta`,
`F_Emision`→`f_emision`, `Numero_Turno`→`numero_turno`, `Serie_Terminal`→`serie_terminal`,
`Ubicacion_Fisica`→`ubicacion_fisica`, `Factor_Conversion`→`factor_conversion`, etc.
**Regla simple: el nombre de la columna es el nombre del atributo Java en `snake_case`.**

---

## 5. Columnas `char(n)` → `varchar(n)` — impacto en Java

Todas pasan a `String`. No hay ningún `char` que mapear, ni `@Convert`, ni `trim()` defensivo
en la aplicación. Las **77** columnas afectadas, agrupadas por nombre de columna:

| Columna | Tipo nuevo | Nº de tablas |
|---|---|---|
| `estado` | `varchar(1)` | 43 (una por tabla) |
| `situacion` | `varchar(1)` | 4 (`compra`, `venta`, `apertura_caja`, `cuenta_cobrar`) |
| `signo` | `varchar(1)` | 2 (`tipo_movimiento_caja`, `tipo_movimiento_inv`) |
| `afecta_efectivo` | `varchar(1)` | 2 (`concepto_caja`, `movimiento_caja`) |
| `es_credito` | `varchar(1)` | 2 (`compra`, `venta`) |
| `tipo_documento` | `varchar(11)` | 2 (`compra`, `venta`) + 1 parámetro de `usp_registrar_compra` |
| `numero` | `varchar(8)` | 2 (`boleta`, `factura`) |
| `serie` | `varchar(5)` | 2 (`boleta`, `factura`) |
| `aperturada` | `varchar(1)` | 1 (`caja`) |
| `concedido` | `varchar(1)` | 1 (`rol_permiso`) |
| `vigente` | `varchar(1)` | 1 (`usuario_rol`) |
| `es_principal` | `varchar(1)` | 1 (`almacen`) |
| `es_unidad_base` | `varchar(1)` | 1 (`presentacion_producto`) |
| `afecto_igv` | `varchar(1)` | 1 (`producto`) |
| `es_perecible` | `varchar(1)` | 1 (`producto`) |
| `tipo_cliente` | `varchar(1)` | 1 (`cliente`) |
| `genero` | `varchar(1)` | 1 (`persona`) |
| `celular` | `varchar(9)` | 1 (`persona`) |
| `moneda` | `varchar(3)` | 1 (`caja`) |
| `ruc` | `varchar(11)` | 1 (`empresa`) |
| `telefono` | `varchar(8)` | 1 (`empresa`) |
| `fondo_pension` | `varchar(3)` | 1 (`empleado`) |
| `n_hps` | `varchar(11)` | 1 (`empleado`) |
| `essalud` | `varchar(6)` | 1 (`empleado`) |

Los `CHECK` asociados se mantienen igual (`signo IN ('+','-')`, `genero IN ('M','F','O')`,
`tipo_cliente IN ('N','J')`, `es_unidad_base IN ('0','1')`, etc.).
**Los valores `'1'`/`'0'` de `estado` se conservan como `String`** (no se migraron a `boolean`),
y `situacion` sigue usando `'A'`/`'C'` en caja y `'R'`/`'P'` en ventas/créditos.

---

## 6. Funciones almacenadas — firmas nuevas

Todas en minúscula y con `bigint` en los parámetros/retornos de id:

| Antes | Ahora | Cambio en la firma |
|---|---|---|
| `USP_LOGIN(_Logeo varchar(30))` | `usp_login(_logeo varchar(30))` | `id_usuario`/`id_tipo_usuario` ahora `bigint`; `estado` ahora `varchar(1)` |
| `USP_PERMISOS_USUARIO(_ID_Usuario integer)` | `usp_permisos_usuario(_id_usuario bigint)` | parámetro `integer`→`bigint` |
| `USP_APERTURAR_CAJA(...)` | `usp_aperturar_caja(...)` | `_id_caja`, `_id_usuario` → `bigint`; `RETURNS bigint`; params `_usu_cre`, `_pc_cre` |
| `USP_CERRAR_CAJA(...)` | `usp_cerrar_caja(...)` | `_id_apertura_caja`, `_id_usuario_cierre` → `bigint`; params `_usu_mod` |
| `USP_REGISTRAR_COMPRA(...)` | `usp_registrar_compra(...)` | ids → `bigint`; `_tipo_documento` → `varchar(11)`; `_es_credito` → `varchar(1)`; `RETURNS bigint` |
| `USP_BUSCAR_PRODUCTO(_Texto varchar(50))` | `usp_buscar_producto(_texto varchar(50))` | `id_producto` de retorno → `bigint` |

Los **códigos de error** no cambian: `51001` (caja ya aperturada) y `51002` (no existe apertura
activa). La **lógica** de `usp_aperturar_caja` / `usp_cerrar_caja` es idéntica.

---

## 7. Vistas y tipos compuestos renombrados (columnas de salida también)

| Antes | Ahora | Columnas de salida que cambiaron |
|---|---|---|
| `VW_STOCK_CRITICO` | `vw_stock_critico` | `Cantidad_Sugerida`→`cantidad_sugerida` |
| `VW_PRODUCTOS_POR_VENCER` | `vw_productos_por_vencer` | `Dias_Restantes`→`dias_restantes` |
| `VW_VENTAS_DETALLE` | `vw_ventas_detalle` | `Cliente`→`cliente`, `Usuario`→`usuario` |
| `VW_VENTAS_DIARIAS` | `vw_ventas_diarias` | `Fecha`→`fecha`, `Nro_Ventas`→`nro_ventas`, `Total_Credito`→`total_credito` |
| `VW_KARDEX` | `vw_kardex` | `Usuario`→`usuario` |
| `VW_CUENTAS_POR_COBRAR` | `vw_cuentas_por_cobrar` | `Cliente`→`cliente`, `Dias_Vencidos`→`dias_vencidos` |
| `VW_ARQUEO_CAJA` | `vw_arqueo_caja` | `Usuario_Apertura`→`usuario_apertura`, `Usuario_Cierre`→`usuario_cierre` |
| `VW_PRODUCTOS_MAS_VENDIDOS` | `vw_productos_mas_vendidos` | `Cantidad_Vendida`→`cantidad_vendida`, `Monto_Vendidas`→`monto_vendidas` |
| `TT_DETALLE_VENTA` | `tt_detalle_venta` | `id_producto`, `id_presentacion_producto` → `bigint` |
| `TT_DETALLE_COMPRA` | `tt_detalle_compra` | ídem |

> Nota: `vw_ventas_detalle` y `vw_ventas_diarias` **exponen** `tipo_documento`. Antes devolvían
> `'TICKET     '` (con 5 espacios al final) y ahora devuelven `'TICKET'`. Cualquier comparación,
> filtro o test del backend que hardcodee `'TICKET     '` con espacios debe simplificarse a `'TICKET'`.

---

## 8. Triggers

| Antes | Ahora |
|---|---|
| `FN_TRG_PRODUCTO_AUDITORIA()` | `fn_trg_producto_auditoria()` |
| `TR_PRODUCTO_AUDITORIA` | `tr_producto_auditoria` |
| Valor auditado `'PRODUCTO'` en `auditoria.n_tabla` | **`'producto'`** (minúscula, coincide con el nombre real de la tabla) |

Si el backend consulta `auditoria` filtrando por `n_tabla`, debe usar `'producto'`, `'venta'`, etc.

---

## 9. Otros cambios menores

- `DROP DATABASE IF EXISTS bd_bodega_tia_martha;` → `... WITH (FORCE);` para que el script sea
  re-ejecutable aunque haya conexiones abiertas (requiere PostgreSQL 13+; el entorno local es 18).
- El script sigue usando el metacommando `\c bd_bodega_tia_martha;` de **psql**, así que hay que
  ejecutarlo con `psql -f bodega.sql`. Desde pgAdmin/DBeaver/JDBC hay que quitar esa línea y
  seleccionar la base destino manualmente.
- Los **datos semilla no cambian** (mismos ids, mismos roles, mismos permisos, mismos precios).
  El único valor de dato que cambió es `'PRODUCTO'`→`'producto'` en lo que escribe el trigger
  de auditoría.

---

## 10. Checklist para el agente de backend

- [ ] Cambiar **todas** las entidades: `Integer` → `Long` en PK y FK.
- [ ] Actualizar `@Column(name=...)` / `@Table(name=...)` con los nombres nuevos en minúscula.
- [ ] Renombrar atributos que antes mapeaban a `ID_AperturaCaja`, `ID_PresentacionProducto`,
      `USUCRE/PCCRE/FECCRE/USUMOD/PCMOD/FECMOD`, etc.
- [ ] Actualizar DTOs: `idAperturaCaja` sigue igual en JSON, pero si usabas nombres de columna
      como clave de respuesta, actualiza a `id_apertura_caja`.
- [ ] Actualizar las llamadas a las funciones: `SELECT * FROM usp_aperturar_caja(...)` con
      parámetros `named` (`_id_caja := ...`) en minúscula, y tipos `Long`.
- [ ] Actualizar queries nativos (`@Query(nativeQuery=true)`) a las vistas en minúscula
      (`vw_arqueo_caja`, etc.).
- [ ] Verificar que ya **no** hacen falta `TRIM()` defensivos ni `= 'TICKET'::char(11)`.
- [ ] `ddl-auto=validate` en `application.properties` (nunca `update`/`create`).
- [ ] Reejecutar `psql -f bodega.sql` para tener la BD con el esquema nuevo antes de arrancar.
