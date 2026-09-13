// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ObraRegistry — Registro y auditoría de contratos de obras públicas
/// @author ObraClara AI
/// @notice Contrato inteligente para registrar hashes de documentos de obras públicas,
///         detectar alteraciones, congelar obras sospechosas y gestionar aprobaciones.

contract ObraRegistry {

    // =========================================================================
    //                              ENUMERACIONES
    // =========================================================================

    /// @notice Estados posibles de una versión de documento
    /// PENDIENTE = recién reportada, esperando revisión
    /// APROBADA  = el administrador validó el cambio
    /// RECHAZADA = el administrador rechazó el cambio
    enum EstadoVersion {
        PENDIENTE,
        APROBADA,
        RECHAZADA
    }

    // =========================================================================
    //                              ESTRUCTURAS
    // =========================================================================

    /// @notice Representa una versión del documento de una obra
    /// @param hash       Hash SHA-256 del documento PDF
    /// @param timestamp  Marca de tiempo del registro en blockchain
    /// @param estado     Estado de esta versión (PENDIENTE, APROBADA, RECHAZADA)
    /// @param revisor    Dirección del revisor que aprobó/rechazó (address(0) si pendiente)
    struct Version {
        bytes32 hash;
        uint256 timestamp;
        EstadoVersion estado;
        address revisor;
    }

    /// @notice Representa una obra pública registrada
    /// @param id             Identificador único de la obra
    /// @param nombre         Nombre descriptivo de la obra
    /// @param descripcion    Descripción del proyecto
    /// @param congelada      Indica si la obra está congelada por cambio sospechoso
    /// @param administrador  Wallet autorizada para aprobar/rechazar cambios
    struct Obra {
        uint256 id;
        string nombre;
        string descripcion;
        bool congelada;
        address administrador;
    }

    // =========================================================================
    //                          VARIABLES DE ESTADO
    // =========================================================================

    /// @notice Contador total de obras registradas
    uint256 private _contadorObras;

    /// @notice Mapeo de ID de obra a sus datos principales
    mapping(uint256 => Obra) private _obras;

    /// @notice Mapeo de ID de obra a su arreglo de versiones
    mapping(uint256 => Version[]) private _versiones;

    /// @notice Hash pendiente de revisión para una obra congelada
    /// Se almacena aquí para que rechazarCambio pueda registrarlo
    mapping(uint256 => bytes32) private _hashPendiente;

    // =========================================================================
    //                               EVENTOS
    // =========================================================================

    /// @notice Se emite cuando se registra una nueva obra
    event ObraRegistrada(
        uint256 indexed idObra,
        string nombre,
        address indexed administrador,
        bytes32 hashInicial
    );

    /// @notice Se emite cuando se detecta un cambio en el documento (hash diferente)
    event CambioDetectado(
        uint256 indexed idObra,
        bytes32 hashAnterior,
        bytes32 hashNuevo
    );

    /// @notice Se emite cuando el administrador aprueba un cambio
    event CambioAprobado(
        uint256 indexed idObra,
        bytes32 hashNuevo,
        address indexed revisor
    );

    /// @notice Se emite cuando el administrador rechaza un cambio
    event CambioRechazado(
        uint256 indexed idObra,
        bytes32 hashRechazado,
        address indexed revisor
    );

    // =========================================================================
    //                             MODIFICADORES
    // =========================================================================

    /// @notice Verifica que el msg.sender sea el administrador de la obra
    /// @param idObra ID de la obra a verificar
    modifier soloAdministrador(uint256 idObra) {
        require(idObra > 0 && idObra <= _contadorObras, "Obra no existe");
        require(
            msg.sender == _obras[idObra].administrador,
            "Solo el administrador puede ejecutar esta accion"
        );
        _;
    }

    /// @notice Verifica que la obra exista
    /// @param idObra ID de la obra a verificar
    modifier obraExiste(uint256 idObra) {
        require(idObra > 0 && idObra <= _contadorObras, "Obra no existe");
        _;
    }

    // =========================================================================
    //                         FUNCIONES PRINCIPALES
    // =========================================================================

    /// @notice Registra una nueva obra pública con su documento inicial
    /// @dev    Crea la obra, registra la primera versión como APROBADA y emite evento.
    ///         El msg.sender queda como administrador de la obra.
    /// @param nombre       Nombre descriptivo de la obra
    /// @param descripcion  Descripción del proyecto
    /// @param hashInicial  Hash SHA-256 del documento PDF original
    /// @return idObra      ID asignado a la nueva obra
    function registrarObra(
        string calldata nombre,
        string calldata descripcion,
        bytes32 hashInicial
    ) external returns (uint256 idObra) {
        require(bytes(nombre).length > 0, "El nombre no puede estar vacio");
        require(hashInicial != bytes32(0), "El hash no puede ser nulo");

        // Incrementar contador y asignar ID
        _contadorObras++;
        idObra = _contadorObras;

        // Crear la obra
        _obras[idObra] = Obra({
            id: idObra,
            nombre: nombre,
            descripcion: descripcion,
            congelada: false,
            administrador: msg.sender
        });

        // Registrar la versión inicial como APROBADA
        _versiones[idObra].push(Version({
            hash: hashInicial,
            timestamp: block.timestamp,
            estado: EstadoVersion.APROBADA,
            revisor: msg.sender
        }));

        emit ObraRegistrada(idObra, nombre, msg.sender, hashInicial);
    }

    /// @notice Reporta un nuevo hash de documento para una obra existente.
    ///         Si el hash difiere del último aprobado, la obra se CONGELA automáticamente.
    ///         Si el hash es igual al último aprobado, no hace nada (documento sin cambios).
    /// @dev    Cualquier dirección puede reportar un cambio (auditoría abierta).
    /// @param idObra    ID de la obra a verificar
    /// @param hashNuevo Hash SHA-256 del documento re-subido
    function reportarCambio(
        uint256 idObra,
        bytes32 hashNuevo
    ) external obraExiste(idObra) {
        require(hashNuevo != bytes32(0), "El hash no puede ser nulo");
        require(!_obras[idObra].congelada, "La obra ya esta congelada");

        // Obtener el hash de la última versión aprobada
        bytes32 hashActual = _obtenerHashAprobado(idObra);

        // Si los hashes son iguales, el documento no cambió — no hacer nada
        if (hashNuevo == hashActual) {
            return;
        }

        // Los hashes son DIFERENTES: congelar la obra
        _obras[idObra].congelada = true;

        // Almacenar el hash pendiente para que rechazarCambio pueda usarlo
        _hashPendiente[idObra] = hashNuevo;

        // Registrar versión pendiente de revisión
        _versiones[idObra].push(Version({
            hash: hashNuevo,
            timestamp: block.timestamp,
            estado: EstadoVersion.PENDIENTE,
            revisor: address(0)
        }));

        emit CambioDetectado(idObra, hashActual, hashNuevo);
    }

    /// @notice El administrador aprueba un cambio de documento.
    ///         Registra el nuevo hash como versión APROBADA y descongela la obra.
    /// @dev    Solo el administrador de la obra puede ejecutar esta función.
    ///         La obra debe estar congelada (es decir, hay un cambio pendiente).
    /// @param idObra    ID de la obra
    /// @param hashNuevo Hash SHA-256 del nuevo documento aprobado
    function aprobarCambio(
        uint256 idObra,
        bytes32 hashNuevo
    ) external soloAdministrador(idObra) {
        require(_obras[idObra].congelada, "La obra no esta congelada");
        require(hashNuevo != bytes32(0), "El hash no puede ser nulo");

        // Descongelar la obra
        _obras[idObra].congelada = false;

        // Limpiar hash pendiente
        delete _hashPendiente[idObra];

        // Actualizar la última versión PENDIENTE a APROBADA con el hash aprobado
        uint256 ultimoIndice = _versiones[idObra].length - 1;
        _versiones[idObra][ultimoIndice].estado = EstadoVersion.APROBADA;
        _versiones[idObra][ultimoIndice].hash = hashNuevo;
        _versiones[idObra][ultimoIndice].revisor = msg.sender;

        emit CambioAprobado(idObra, hashNuevo, msg.sender);
    }

    /// @notice El administrador rechaza un cambio de documento.
    ///         Marca la versión pendiente como RECHAZADA y mantiene la obra congelada.
    /// @dev    Solo el administrador de la obra puede ejecutar esta función.
    /// @param idObra ID de la obra
    function rechazarCambio(
        uint256 idObra
    ) external soloAdministrador(idObra) {
        require(_obras[idObra].congelada, "La obra no esta congelada");

        // Marcar la versión pendiente como RECHAZADA
        uint256 ultimoIndice = _versiones[idObra].length - 1;
        _versiones[idObra][ultimoIndice].estado = EstadoVersion.RECHAZADA;
        _versiones[idObra][ultimoIndice].revisor = msg.sender;

        // Limpiar hash pendiente
        delete _hashPendiente[idObra];

        bytes32 hashRechazado = _versiones[idObra][ultimoIndice].hash;

        emit CambioRechazado(idObra, hashRechazado, msg.sender);
    }

    // =========================================================================
    //                          FUNCIONES DE LECTURA
    // =========================================================================

    /// @notice Obtiene los datos principales de una obra
    /// @param idObra ID de la obra
    /// @return id             ID de la obra
    /// @return nombre         Nombre de la obra
    /// @return descripcion    Descripción de la obra
    /// @return congelada      Si la obra está congelada
    /// @return administrador  Dirección del administrador
    /// @return totalVersiones Cantidad de versiones registradas
    function obtenerObra(uint256 idObra) 
        external 
        view 
        obraExiste(idObra) 
        returns (
            uint256 id,
            string memory nombre,
            string memory descripcion,
            bool congelada,
            address administrador,
            uint256 totalVersiones
        ) 
    {
        Obra storage obra = _obras[idObra];
        return (
            obra.id,
            obra.nombre,
            obra.descripcion,
            obra.congelada,
            obra.administrador,
            _versiones[idObra].length
        );
    }

    /// @notice Obtiene todas las versiones de una obra
    /// @param idObra ID de la obra
    /// @return Array de estructuras Version
    function obtenerVersiones(uint256 idObra)
        external
        view
        obraExiste(idObra)
        returns (Version[] memory)
    {
        return _versiones[idObra];
    }

    /// @notice Obtiene el hash de la última versión APROBADA de una obra
    /// @param idObra ID de la obra
    /// @return Hash SHA-256 aprobado actual
    function obtenerHashAprobado(uint256 idObra)
        external
        view
        obraExiste(idObra)
        returns (bytes32)
    {
        return _obtenerHashAprobado(idObra);
    }

    /// @notice Devuelve el número total de obras registradas
    /// @return Cantidad total de obras
    function totalObras() external view returns (uint256) {
        return _contadorObras;
    }

    // =========================================================================
    //                         FUNCIONES INTERNAS
    // =========================================================================

    /// @notice Busca el hash de la última versión con estado APROBADA
    /// @dev    Recorre las versiones de atrás hacia adelante
    /// @param idObra ID de la obra
    /// @return hash  Hash de la última versión aprobada
    function _obtenerHashAprobado(uint256 idObra) internal view returns (bytes32) {
        Version[] storage versiones = _versiones[idObra];
        // Recorrer desde la última versión hacia atrás
        for (uint256 i = versiones.length; i > 0; i--) {
            if (versiones[i - 1].estado == EstadoVersion.APROBADA) {
                return versiones[i - 1].hash;
            }
        }
        // No debería llegar aquí si la obra fue creada correctamente
        revert("No hay version aprobada");
    }
}
