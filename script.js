// ========================================
// SISTEMA DE VOTACIÓN CUL - Script Principal
// ========================================

// Configuración global
const CONFIG = {
    API_URL: 'http://localhost:8000/api', // URL del backend FastAPI
    USE_BACKEND: false, // Cambiar a true cuando el backend esté listo
    LOCALSTORAGE_KEYS: {
        THEME: 'cul_theme',
        HAS_VOTED: 'cul_has_voted',
        VOTOS: 'cul_votos'
    }
};

// ========================================
// MODO CLARO/OSCURO
// ========================================
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.init();
    }

    init() {
        // Cargar tema guardado
        const savedTheme = localStorage.getItem(CONFIG.LOCALSTORAGE_KEYS.THEME) || 'light';
        this.setTheme(savedTheme);

        // Event listener para el botón
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(CONFIG.LOCALSTORAGE_KEYS.THEME, theme);
        
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
}

// ========================================
// GESTIÓN DE VOTOS (LocalStorage)
// ========================================
class VotosManager {
    constructor() {
        this.initVotos();
    }

    // Inicializar votos base si no existen
    initVotos() {
        if (!localStorage.getItem(CONFIG.LOCALSTORAGE_KEYS.VOTOS)) {
            // Cargar votos iniciales desde candidatos.json
            fetch('candidatos.json')
                .then(res => res.json())
                .then(data => {
                    const votosIniciales = {};
                    data.candidatos.forEach(candidato => {
                        votosIniciales[candidato.id] = candidato.votosIniciales || 0;
                    });
                    localStorage.setItem(CONFIG.LOCALSTORAGE_KEYS.VOTOS, JSON.stringify(votosIniciales));
                });
        }
    }

    // Obtener todos los votos
    getVotos() {
        const votos = localStorage.getItem(CONFIG.LOCALSTORAGE_KEYS.VOTOS);
        return votos ? JSON.parse(votos) : {};
    }

    // Registrar un voto
    registrarVoto(candidatoId) {
        const votos = this.getVotos();
        votos[candidatoId] = (votos[candidatoId] || 0) + 1;
        localStorage.setItem(CONFIG.LOCALSTORAGE_KEYS.VOTOS, JSON.stringify(votos));
    }

    // Verificar si ya votó
    hasVotado() {
        return localStorage.getItem(CONFIG.LOCALSTORAGE_KEYS.HAS_VOTED) === 'true';
    }

    // Marcar como votado
    marcarVotado() {
        localStorage.setItem(CONFIG.LOCALSTORAGE_KEYS.HAS_VOTED, 'true');
    }

    // Obtener total de votos
    getTotalVotos() {
        const votos = this.getVotos();
        return Object.values(votos).reduce((sum, v) => sum + v, 0);
    }
}

// ========================================
// ESTADÍSTICAS DEL INDEX
// ========================================
class EstadisticasIndex {
    constructor() {
        this.votosManager = new VotosManager();
        this.cargarEstadisticas();
    }

    async cargarEstadisticas() {
        try {
            // Cargar candidatos.json
            const response = await fetch('candidatos.json');
            const data = await response.json();
            
            // Total de candidatos
            const totalCandidatos = data.candidatos.length;
            document.getElementById('totalCandidatos').textContent = totalCandidatos;

            // Total de votos emitidos
            const totalVotos = this.votosManager.getTotalVotos();
            document.getElementById('totalVotos').textContent = totalVotos;

            // Programas activos
            const programasActivos = Object.keys(data.programas).length;
            document.getElementById('programasActivos').textContent = programasActivos;

            // Calcular participación (ejemplo: 3500 estudiantes estimados)
            const electoresEstimados = 3500;
            const participacion = ((totalVotos / electoresEstimados) * 100).toFixed(1);
            document.getElementById('participacion').textContent = `${participacion}%`;

            // Animar números
            this.animarNumeros();
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    animarNumeros() {
        // Animación simple de conteo
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const target = parseInt(stat.textContent.replace('%', ''));
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = stat.textContent.includes('%') ? `${target}%` : target;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 20);
        });
    }
}

// ========================================
// UTILIDADES
// ========================================
const Utils = {
    // Formatear fecha
    formatearFecha(fecha) {
        return new Date(fecha).toLocaleString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Mostrar alerta
    mostrarAlerta(mensaje, tipo = 'success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    },

    // Validar email
    validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar gestor de temas
    new ThemeManager();

    // Si estamos en index.html, cargar estadísticas
    if (document.getElementById('totalCandidatos')) {
        new EstadisticasIndex();
    }

    // Actualizar estadísticas cada 10 segundos
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        setInterval(() => {
            if (document.getElementById('totalCandidatos')) {
                new EstadisticasIndex();
            }
        }, 10000);
    }
});

// Exportar para uso en otros archivos
window.CONFIG = CONFIG;
window.VotosManager = VotosManager;
window.Utils = Utils;