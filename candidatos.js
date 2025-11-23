// ========================================
// CANDIDATOS.JS - Sistema de Votación
// ========================================

class SistemaVotacion {
    constructor() {
        this.candidatos = [];
        this.candidatoSeleccionado = null;
        this.votosManager = new VotosManager();
        this.programaActual = 'todos';
        
        this.init();
    }

    async init() {
        await this.cargarCandidatos();
        this.setupEventListeners();
        this.verificarSiYaVoto();
    }

    // Cargar candidatos desde JSON
    async cargarCandidatos() {
        try {
            const response = await fetch('candidatos.json');
            const data = await response.json();
            this.candidatos = data.candidatos;
            this.programasData = data.programas;
            this.renderizarCandidatos();
        } catch (error) {
            console.error('Error cargando candidatos:', error);
            Utils.mostrarAlerta('Error al cargar candidatos', 'danger');
        }
    }

    // Renderizar cards de candidatos
    renderizarCandidatos() {
        const container = document.getElementById('candidatosContainer');
        if (!container) return;

        // Filtrar por programa
        let candidatosFiltrados = this.programaActual === 'todos' 
            ? this.candidatos 
            : this.candidatos.filter(c => c.programa === this.programaActual);

        container.innerHTML = '';

        if (candidatosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-5x text-muted mb-3"></i>
                    <h4 class="text-muted">No hay candidatos para este programa</h4>
                </div>
            `;
            return;
        }

        candidatosFiltrados.forEach(candidato => {
            const card = this.crearCardCandidato(candidato);
            container.innerHTML += card;
        });

        // Agregar eventos a las cards
        this.agregarEventosCards();
    }

    // Crear HTML de card de candidato
    crearCardCandidato(candidato) {
        return `
            <div class="col-md-6 col-lg-4">
                <div class="candidate-card" data-candidato-id="${candidato.id}">
                    <div class="position-relative">
                        <img src="${candidato.foto}" alt="${candidato.nombreCompleto}" class="candidate-img">
                        <div class="candidate-number">${candidato.numeroLista}</div>
                    </div>
                    <div class="p-4">
                        <h5 class="fw-bold text-primary">${candidato.nombreCompleto}</h5>
                        <p class="text-muted mb-2">
                            <i class="fas fa-graduation-cap me-1"></i>${candidato.facultad}
                        </p>
                        <p class="text-muted mb-2">
                            <i class="fas fa-calendar me-1"></i>${candidato.semestre}
                        </p>
                        <div class="alert alert-warning py-2 mb-3">
                            <i class="fas fa-quote-left me-1"></i>
                            <em>${candidato.slogan}</em>
                        </div>
                        <p class="small">${candidato.propuestaResumida}</p>
                        <div class="d-grid gap-2 mt-3">
                            <button class="btn btn-outline-primary btn-ver-propuesta" data-candidato-id="${candidato.id}">
                                <i class="fas fa-info-circle me-2"></i>Ver Propuesta Completa
                            </button>
                        </div>
                        <div class="mt-3 text-center">
                            <span class="badge bg-primary" id="votos-${candidato.id}">
                                <i class="fas fa-poll me-1"></i>
                                ${this.votosManager.getVotos()[candidato.id] || candidato.votosIniciales} votos
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Agregar eventos a las cards
    agregarEventosCards() {
        // Seleccionar candidato al hacer clic en la card
        document.querySelectorAll('.candidate-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // No seleccionar si hizo clic en el botón de propuesta
                if (e.target.closest('.btn-ver-propuesta')) return;
                
                const candidatoId = parseInt(card.dataset.candidatoId);
                this.seleccionarCandidato(candidatoId);
            });
        });

        // Botones de ver propuesta
        document.querySelectorAll('.btn-ver-propuesta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const candidatoId = parseInt(btn.dataset.candidatoId);
                this.mostrarPropuestaCompleta(candidatoId);
            });
        });
    }

    // Seleccionar candidato
    seleccionarCandidato(candidatoId) {
        // Deseleccionar todos
        document.querySelectorAll('.candidate-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Seleccionar el clickeado
        const card = document.querySelector(`[data-candidato-id="${candidatoId}"]`);
        if (card) {
            card.classList.add('selected');
            this.candidatoSeleccionado = this.candidatos.find(c => c.id === candidatoId);
            
            // Mostrar botón de votar
            document.getElementById('votarSection').style.display = 'block';
            
            // Smooth scroll al botón
            document.getElementById('votarSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    // Mostrar propuesta completa en modal
    mostrarPropuestaCompleta(candidatoId) {
        const candidato = this.candidatos.find(c => c.id === candidatoId);
        if (!candidato) return;

        document.getElementById('modalCandidatoNombre').textContent = candidato.nombreCompleto;
        document.getElementById('modalCandidatoImg').src = candidato.foto;
        document.getElementById('modalPropuestaCompleta').textContent = candidato.propuestaCompleta;
        document.getElementById('modalPrograma').textContent = candidato.nombrePrograma;
        document.getElementById('modalFacultad').textContent = candidato.facultad;
        document.getElementById('modalSemestre').textContent = candidato.semestre;

        // Redes sociales
        const redesHTML = `
            <a href="https://facebook.com/${candidato.redes.facebook}" target="_blank" class="btn btn-sm btn-primary me-2">
                <i class="fab fa-facebook"></i> Facebook
            </a>
            <a href="https://instagram.com/${candidato.redes.instagram}" target="_blank" class="btn btn-sm btn-danger me-2">
                <i class="fab fa-instagram"></i> Instagram
            </a>
            <a href="https://twitter.com/${candidato.redes.twitter}" target="_blank" class="btn btn-sm btn-info">
                <i class="fab fa-twitter"></i> Twitter
            </a>
        `;
        document.getElementById('modalRedes').innerHTML = redesHTML;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('propuestaModal'));
        modal.show();
    }

    // Confirmar voto (primer modal)
    mostrarModalConfirmacion() {
        if (!this.candidatoSeleccionado) {
            Utils.mostrarAlerta('Por favor selecciona un candidato', 'warning');
            return;
        }

        const candidato = this.candidatoSeleccionado;
        document.getElementById('confirmCandidatoImg').src = candidato.foto;
        document.getElementById('confirmCandidatoNombre').textContent = candidato.nombreCompleto;
        document.getElementById('confirmPrograma').textContent = candidato.nombrePrograma;

        const modal = new bootstrap.Modal(document.getElementById('confirmarVotoModal'));
        modal.show();
    }

    // Registrar voto final
    registrarVoto() {
        if (!this.candidatoSeleccionado) return;

        // Registrar voto
        this.votosManager.registrarVoto(this.candidatoSeleccionado.id);
        this.votosManager.marcarVotado();

        // Cerrar modal de confirmación
        bootstrap.Modal.getInstance(document.getElementById('confirmarVotoModal')).hide();

        // Mostrar modal de éxito
        const modalExito = new bootstrap.Modal(document.getElementById('exitoModal'));
        modalExito.show();

        // Actualizar contador de votos en la card
        const votosSpan = document.getElementById(`votos-${this.candidatoSeleccionado.id}`);
        if (votosSpan) {
            const nuevoTotal = this.votosManager.getVotos()[this.candidatoSeleccionado.id];
            votosSpan.innerHTML = `<i class="fas fa-poll me-1"></i>${nuevoTotal} votos`;
        }

        // Deshabilitar votación adicional
        this.deshabilitarVotacion();
    }

    // Verificar si ya votó
    verificarSiYaVoto() {
        if (this.votosManager.hasVotado()) {
            this.deshabilitarVotacion();
        }
    }

    // Deshabilitar votación
    deshabilitarVotacion() {
        document.querySelectorAll('.candidate-card').forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.6';
        });

        const votarBtn = document.getElementById('confirmarVotoBtn');
        if (votarBtn) {
            votarBtn.disabled = true;
            votarBtn.innerHTML = '<i class="fas fa-check me-2"></i>Ya has votado';
        }

        // Mostrar mensaje
        const container = document.getElementById('candidatosContainer');
        if (container) {
            const alerta = document.createElement('div');
            alerta.className = 'col-12';
            alerta.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    Ya has emitido tu voto. Puedes consultar los resultados en tiempo real.
                </div>
            `;
            container.prepend(alerta);
        }
    }

    // Event listeners
    setupEventListeners() {
        // Selector de programa
        const programaSelect = document.getElementById('programaSelect');
        if (programaSelect) {
            programaSelect.addEventListener('change', (e) => {
                this.programaActual = e.target.value;
                this.renderizarCandidatos();
                this.candidatoSeleccionado = null;
                document.getElementById('votarSection').style.display = 'none';
            });
        }

        // Botón confirmar voto
        const confirmarBtn = document.getElementById('confirmarVotoBtn');
        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', () => {
                this.mostrarModalConfirmacion();
            });
        }

        // Botón confirmar voto final
        const confirmarFinalBtn = document.getElementById('confirmarVotoFinalBtn');
        if (confirmarFinalBtn) {
            confirmarFinalBtn.addEventListener('click', () => {
                this.registrarVoto();
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new SistemaVotacion();
});