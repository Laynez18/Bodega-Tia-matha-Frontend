# PLAN: Backend Spring Boot — Módulo de Seguridad y Caja

Documento de referencia para desarrollar el backend del sistema **"Bodega Tía Martha"**.
Define arquitectura, reglas de negocio acordadas y contractos. El desarrollador debe
implementarlo siguiendo este plan y aclarar las decisiones marcadas como [DECISIÓN].

---

## 1. Objetivo y alcance (fase 1)

1. **Autenticación de usuarios** contra la base de datos PostgreSQL y **gestión de permisos** por rol.
2. **Módulo de Caja**: apertura y cierre de turno de caja.
   - Es el primer módulo funcional según el flujo de trabajo del negocio (para vender, el usuario debe tener un turno de caja abierto).
3. Todo lo demás (ventas, compras, inventario, etc.) queda fuera de alcance en esta fase.

## 2. Arquitectura y decisiones base

- **Frontend**: páginas HTML estáticas ya existentes (carpeta raíz del repo: `caja/`, `seguridad/`, etc.). Usan Bootstrap 5 + Bootstrap Icons.
- **Backend**: **Spring Boot** (Java), expone una **API REST JSON** que el frontend consumirá con `fetch`.
- **Base de datos**: **PostgreSQL** — script `bodega.sql` (BD `bd_bodega_tia_martha`).
- **Autenticación**: **basada en SESIÓN (HttpSession)**. **NO usar JWT** (decisión acordada).
- **Patrón de permisos**: RBAC. Al iniciar sesión se obtiene la lista de permisos y se guarda en el objeto `HttpSession` (o como `GrantedAuthority` en Spring Security). Cada endpoint verifica el permiso puntual required.

>[DECISIÓN] ¿El frontend lo servirá Spring Boot (misma origen, archivos en `src/main/resources/static`) o seguirá siendo servido por separado (origen distinto → CORS + CSRF)? Recomendado: servirlo desde Spring Boot para simplificar sesión/CSRF.

## 3. Hechos clave de la base de datos (`bodega.sql`)

### 3.1 Tablas principales

- **SEGURIDAD**: `TIPO_USUARIO`, `USUARIO`, `MODULO`, `ROL`, `PERMISO`, `ROL_PERMISO`, `USUARIO_ROL`, `AUDITORIA`.
- **CAJA**: `CAJA`, `APERTURA_CAJA`, `TIPO_MOVIMIENTO_CAJA`, `CONCEPTO_CAJA`, `MOVIMIENTO_CAJA`.

### 3.2 Modelo de permisos (RBAC)

```
USUARIO_ROL (usuario→rol) → ROL_PERMISO (rol→permiso, Concedido='1') → PERMISO (Clave) → MODULO (accesible)
```

- El permiso tiene `ID_Modulo`; la accesibilidad a un módulo **se deriva** de tener al menos un permiso activo en ese módulo.
- `TIPO_USUARIO` es SOLO etiqueta; **NO interviene** en permisos.
- `ROL.Nivel` (1=admin, 2=cajero/almacenero) existe pero **no se usa** como jerarquía de aprobación en la lógica de caja.

### 3.3 Roles y permisos sembrados (`seed`)

- Roles: `ADMINISTRADOR` (nivel 1, todos los permisos), `CAJERO` (nivel 2, incluye caja), `ALMACENERO` (nivel 2, compras/inventario).
- Permisos de caja (módulo CAJA, id 7): `CAJ_APERTURAR`, `CAJ_CERRAR`, `CAJ_MOVIMIENTO`.
- Otros relevantes: `SEG_USUARIO`, `SEG_ROL`, `SEG_AUDITORIA`, `MAN_*`, `COM_*`, `INV_*` (4), `VEN_REGISTRAR`, `VEN_ANULAR`, `VEN_DESCUENTO`, `CRE_*`, `REP_*`.
- Usuario sembrado: SOLO `admin` → rol ADMINISTRADOR. **No existe el usuario "CAJERO01"** (aparece como mock en la UI).
- **OJO con la clave del usuario admin**: `Clave = '$2a$10$DEMOHASHREEMPLAZARENPRODUCCION'` es un **placeholder** (formato bcrypt). El agente debe reemplazarla por un hash bcrypt real en el seed y documentarlo. Sin esto, el login no funcionará.

### 3.4 Funciones almacenadas existentes (usar, no duplicar lógica)

- **`USP_LOGIN(_Logeo varchar(30))`** → retorna tabla: `ID_Usuario, Logeo, Clave, ID_TipoUsuario, N_TipoUsuario, Nombre, Ap_Paterno, Ap_Materno, ESTADO`. Filtra por `Logeo` y `ESTADO='1'`. La comparación de contraseña (bcrypt) la hace la aplicación.
- **`USP_PERMISOS_USUARIO(_ID_Usuario int)`** → retorna: `N_Modulo, Icono, Orden, Clave, N_Permiso`. Aplica los filtros de vigencia/estado y `DISTINCT`, ordenado por `M.Orden, N_Permiso`.
- **`USP_APERTURAR_CAJA(_ID_Caja int, _ID_Usuario int, _Monto_Inicial numeric(12,2), _Numero_Turno varchar(20) DEFAULT NULL, _USUCRE varchar(30) DEFAULT 'SISTEMA', _PCCRE varchar(30) DEFAULT NULL)`** → retorna `ID_AperturaCaja`. Lanza excepción con errcode `51001` si ya existe apertura activa (`Situacion='A'`) para esa caja. Internamente: inserta `APERTURA_CAJA`, marca `CAJA.Aperturada='1'`, y registra movimiento de caja "MONTO INICIAL" (Tipo=INGRESO, Concepto=3, Método=EFECTIVO).
- **`USP_CERRAR_CAJA(_ID_AperturaCaja int, _ID_UsuarioCierre int, _Monto_Declarado numeric(12,2), _Observacion varchar(200) DEFAULT NULL, _USUMOD varchar(30) DEFAULT 'SISTEMA')`** → retorna: `Monto_Inicial, Total_Ingresos, Total_Egresos, Monto_Sistema, Monto_Declarado, Diferencia`. Lanza errcode `51002` si no hay apertura activa. Marca `Situacion='C'`, `F_Cierre`, libera `CAJA.Aperturada='0'`. Cálculo: `Monto_Sistema = inicial + ingresos(excepto concepto 3) − egresos`; `Diferencia = declarado − sistema`.

### 3.5 Datos de caja

- `CAJA`: `ID_Caja, N_Caja, Descripcion, Moneda('PEN'), Monto_Base, Aperturada('0'/'1')`. Seed: `CAJA 01` (id 1, Monto_Base=100.00, efecivo... serie T001).
- `APERTURA_CAJA`: `ID_AperturaCaja, ID_Caja, ID_Usuario (abre), ID_UsuarioCierre, Numero_Turno, F_Apertura, F_Cierre, Monto_Inicial, Total_Ingresos, Total_Egresos, Monto_Sistema, Monto_Declarado, Diferencia, Situacion('A'/'C'), Observacion`.
- `VW_ARQUEO_CAJA`: vista con el detalle de arqueo (usuario apertura/cierre, montos, diferencia).

## 4. Flujo de autenticación y permisos

1. `POST /api/auth/login` con `{ logeo, clave }`.
2. Llamar `USP_LOGIN(logeo)`; si no existe → 401.
3. Comparar `clave` en claro contra la `Clave` hash (BCrypt). Si no coincide → 401.
4. Llamar `USP_PERMISOS_USUARIO(idUsuario)` → lista de permisos/módulos.
5. Guardar en `HttpSession`:
   - `idUsuario`, `logeo`, `nombreCompleto`, `idTipoUsuario`.
   - `modulos` (para construir el menú del sidebar).
   - `permisos` (lista de `Clave`s). En Spring Security: un `GrantedAuthority` por `Clave` (ej. `hasAuthority('CAJ_APERTURAR')`).
6. Los permisos se validan en cada request contra la sesión (sin reconsultar la BD por request).

>[DECISIÓN] Usar Spring Security con `SecurityFilterChain` (recomendado) o validación manual de permisos. Se recomienda Spring Security + `@PreAuthorize`.

## 5. Reglas de negocio de caja (acordadas)

1. **Quién abre**: cualquier usuario con permiso `CAJ_APERTURAR` puede abrir su propio turno (rol CAJERO o ADMINISTRADOR). NO se requiere un superior. Los permisos los valida la APLICACIÓN (las funciones SQL no los validan).
2. **Ciclo de vida del turno**: `Aperturado ('A') → (movimientos) → Cerrado ('C')`. Cuando está `'A'`, la caja está `Aperturada='1'`; al cerrar vuelve a `'0'`.
3. **Cierre**: el usuario debe ingresar `Monto_Declarado` (obligatorio) y `Observación` (opcional, máx 200 chars). `ID_UsuarioCierre` viene de sesión.
4. **Política de cerrado (importante)**: el modelo NO impide cerrar el turno de otro. Regla acordada a aplicar en la capa de aplicación:
   - Rol **CAJERO**: solo ve y puede cerrar SU PROPIO turno abierto.
   - Rol **ADMINISTRADOR**: puede ver todos los turnos y cerrar cualquiera (supervisión).
   - Consulta "Estado de Caja": CAJERO → `WHERE ID_Usuario = $sesion AND Situacion='A'`; ADMIN → todos (activos y cerrados si aplica).
   - La UI ya oculta/muestra el botón "Cerrar" según quién ve qué (a coordinar).
5. **Número de turno**: lo genera el sistema con **fecha+hora/minuto** `YYYYMMDD-HHMM` (ej. `20260924-1045`) para diferenciar turnos el mismo día. Se pasa explícito a `_Numero_Turno` (difiere del default `YYYYMMDD` de la función). La UI ya lo muestra readonly.
6. **[DECISIÓN/Opcional] Reforzar en BD**: modificar `USP_CERRAR_CAJA` para validar que quien cierra sea el dueño del turno o un admin (defense in depth). Por ahora aplica la regla en la app.

## 6. Endpoints propuestos (fase 1)

| Método | Ruta | Permiso | Body / Respuesta |
|---|---|---|---|
| POST | `/api/auth/login` | Sin autenticar | Body `{logeo, clave}` → `{idUsuario, logeo, nombreCompleto, idTipoUsuario, modulos:[{idModulo,nombre,icono,orden}], permisos:[clave,...]}` + cookie sesión |
| POST | `/api/auth/logout` | Autenticado | Invalida sesión → 204 |
| GET | `/api/auth/me` | Autenticado | Sesión actual: usuario + módulos + permisos (para sidebar) |
| GET | `/api/caja/listado` | `CAJ_APERTURAR` (o ver módulo) | Lista de cajas `[{idCaja, nombre, descripcion, moneda, montoBase, aperturada}]` |
| POST | `/api/caja/aperturar` | `CAJ_APERTURAR` | `{idCaja, montoInicial, numeroTurno}` → `{idAperturaCaja, numeroTurno}` |
| POST | `/api/caja/cerrar` | `CAJ_CERRAR` | `{idAperturaCaja, montoDeclarado, observacion}` → `{montoInicial, totalIngresos, totalEgresos, montoSistema, montoDeclarado, diferencia}` + validar política (dueño/admin) |
| GET | `/api/caja/estado` | Ver módulo CAJA | Turnos según rol (CAJERO: su turno activo; ADMIN: todos). Filas `{idAperturaCaja, caja, usuarioApertura, fApertura, montoInicial, situacion}` |
| GET | `/api/caja/arqueo/{idAperturaCaja}` | `CAJ_CERRAR`/admin | Detalle del arqueo (usa `VW_ARQUEO_CAJA`) |

- Manejo de errores: `51001`/`51002` capturados desde Postgres → HTTP 409/400 con mensaje legible en español.
- Todas las respuestas de error: `{ mensaje: "..." }`.

## 7. Estructura sugerida del código Spring Boot

```
com.tiamartha.backend
├── config/
│   ├── SecurityConfig.java            // SecurityFilterChain, BCrypt bean, autorización
│   └── WebConfig.java                 // [DECISIÓN] CORS si frontend separado
├── controller/
│   ├── AuthController.java
│   └── CajaController.java
├── service/
│   ├── AuthService.java               // login: USP_LOGIN + USP_PERMISOS_USUARIO + sesión
│   ├── PermisoService.java            // helpers de validación de permisos
│   └── CajaService.java               // aperturar/cerrar/estado vía funciones
├── repository/ (JPA) o dao/ (JdbcTemplate)
│   └── ...                            // ver sección 8
├── model/ o entity/
│   ├── Usuario.java  Modulo.java  Rol.java  Permiso.java ...
│   └── AperturaCaja.java  Caja.java ...
└── dto/
    ├── LoginRequest.java  LoginResponse.java
    ├── AperturarRequest.java  AperturarResponse.java
    ├── CerrarRequest.java  CerrarResponse.java
    └── TurnoEstadoDto.java  ArqueoDto.java
```

## 8. Acceso a datos ([DECISIÓN] importante)

La BD está modelada con **funciones PL/pgSQL** (`USP_*`) que concentran la lógica transaccional. Dos opciones:

1. **Recomendada**: `JdbcTemplate` (Spring JDBC) para llamar `SELECT * FROM USP_XXX(...)`. Simple, respeta la lógica del SP, evita duplicar transacciones en Java. `DatabaseMetaData` no necesario.
2. Alternativa: `JPA/Hibernate` con `@NamedStoredProcedureQuery`/`@Procedure`, o `@Query(nativeQuery)` para las funciones. Más verbosa para funciones; útil si después se quiere CRUD directo (p.ej. módulo Seguridad).

>Encargo prioritario: **no duplicar** la lógica de apertura/cierre en Java; delegar en `USP_APERTURAR_CAJA`/`USP_CERRAR_CAJA`.

## 9. Dependencias base (`pom.xml`)

- `spring-boot-starter-web`
- `spring-boot-starter-security`
- `spring-boot-starter-data-jpa` (si se usa JPA) o `spring-boot-starter-jdbc` (si `JdbcTemplate`)
- `org.postgresql:postgresql`
- `spring-security-crypto` (incluida en security) para `BCryptPasswordEncoder`
- Configuración en `application.properties`: `datasource.url=jdbc:postgresql://localhost:5432/bd_bodega_tia_martha`, credenciales, `ddl-auto=validate` (jamás crear/esquemas; la BD viene de `bodega.sql`).

## 10. Integración con el frontend existente

- Frontend usa `fetch` a `/api/...` con credenciales (`credentials: 'same-origin'` o `include` si CORS).
- **Módulo Caja** (`caja/caja.html`): ya listos para conectar:
  - Botón "Abrir Caja" → lanza modal `#modalAbrirCaja` (campos: caja select, monto inicial requerido, número de turno readonly auto-`YYYYMMDD-HHMM`). El botón `#btnAperturarCaja` debe hacer `POST /api/caja/aperturar`.
  - Botón "Cerrar" por fila → modal `#modalCerrarCaja` (monto declarado requerido, observación opcional). Botón `#btnCerrarCaja` → `POST /api/caja/cerrar`.
  - Tabla "Estado de Caja" → `GET /api/caja/estado` (render según política rol).
- **Sidebar**: construir con `GET /api/auth/me` (módulos con permiso). Hoy está hardcodeado en cada HTML.
- **Módulo Seguridad** (`seguridad/seguridad.html`): tabs Usuarios/Roles/Permisos/Auditoría; **fuera de alcance** en fase 1 (dejar estático).
- Mantener lo acordado: pestañas (tabs) en Seguridad, sin cambios de diseño; el tema mobile/tablas queda pendiente.

## 11. Consideraciones de seguridad

- No almacenar la clave en claro; bcrypt (`$2a$`).
- **Restablecer hash real del usuario admin** en el seed (el actual es placeholder).
- Sesión HTTP por defecto (en memoria); fine para dev. [DECISIÓN] persistir en BD/Redis a futuro si hay multi-instancia.
- CSRF: si se sirve desde Spring mismo, mantener protección CSRF y enviar token en los fetch; si API separada, decidir (y documentar).
- Validar entrada en DTOs (`@Valid`): `montoInicial >= 0`, `montoDeclarado >= 0`, `observacion <= 200`.
- Errores de códigos `51001`/`51002` mapeados a mensajes claros (caja ya aperturada / apertura inexistente).

## 12. Decisiones que el agente debe resolver aclarar (sumario)

1. ¿Spring Security + `@PreAuthorize` (recomendado) o validación manual?
2. ¿`JdbcTemplate` (recomendado) o JPA para llamar las `USP_*`?
3. ¿Frontend servido por Spring Boot (misma origen) o separado (CORS/CSRF)?
4. ¿Reforzar `USP_CERRAR_CAJA` con validación de dueño/admin (fase 1 u opcional)?
5. ¿Persistencia de sesión en BD/Redis o memoria (dev)?
6. Confirmar con el equipo el hash bcrypt real para el usuario `admin`.
7. Definir contrato exacto JSON de cada endpoint (ejemplos) y OpenAPI/Swagger si se desea.

## 13. Fuera de alcance (fase 1)

- CRUD de Seguridad (Usuarios/Roles/Permisos/Auditoría) y su matriz de permisos.
- Ventas, Compras, Inventario, Créditos, Reportes.
- Movimientos de caja (pestaña "Movimientos", `USP_...`/endpoints) salvo el movimiento interno de apertura.
- Diseño responsive de tablas (aprobado diferir).